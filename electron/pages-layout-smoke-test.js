const { app, BrowserWindow, session } = require('electron')
const fs = require('fs/promises')
const path = require('path')

const pages = [
    'dashboard.html',
    'caixa.html',
    'produtos.html',
    'estoque.html',
    'relatorios.html',
    'configuracoes.html'
]

const viewports = [
    { width: 1366, height: 768, name: 'desktop-baixo' },
    { width: 1280, height: 720, name: 'desktop-compacto' },
    { width: 1100, height: 720, name: 'minimo-electron' },
    { width: 390, height: 844, name: 'mobile' }
]

function criarJanela(viewport){
    return new BrowserWindow({
        width: viewport.width,
        height: viewport.height,
        show: false,
        backgroundColor: '#120817',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    })
}

function bloquearScripts(){
    session.defaultSession.webRequest.onBeforeRequest(
        {
            urls: [
                '*://cdn.jsdelivr.net/*',
                'file://*/js/*.js'
            ]
        },
        (_details, callback) => {
            callback({ cancel: true })
        }
    )
}

async function testarPagina(page, viewport){
    const janela = criarJanela(viewport)

    try{
        await janela.loadFile(
            path.join(__dirname, '..', 'pages', page)
        )

        await new Promise(resolve => setTimeout(resolve, 250))

        const resultado =
        await janela.webContents.executeJavaScript(`
        (() => {
            const body = document.body
            const doc = document.documentElement
            const overflowX = Math.max(body.scrollWidth, doc.scrollWidth) - window.innerWidth
            const visibleText = (body.innerText || '').trim().slice(0, 120)

            return {
                page: ${JSON.stringify(page)},
                viewport: ${JSON.stringify(viewport)},
                scrollWidth: Math.max(body.scrollWidth, doc.scrollWidth),
                innerWidth: window.innerWidth,
                overflowX,
                visibleText,
                checks: {
                    noHorizontalOverflow: overflowX <= 2,
                    hasContent: visibleText.length > 0
                }
            }
        })()
    `)

        const image =
        await janela.webContents.capturePage()

        const outDir =
        path.join(__dirname, '..', 'artifacts')

        await fs.mkdir(outDir, { recursive: true })

        const screenshot =
        path.join(outDir, `layout-${page.replace('.html', '')}-${viewport.name}.png`)

        await fs.writeFile(screenshot, image.toPNG())

        return {
            ...resultado,
            screenshot
        }
    }finally{
        if(!janela.isDestroyed()){
            janela.close()
        }
    }
}

async function main(){
    const timeout =
    setTimeout(() => {
        console.error('Tempo limite no teste de layout das paginas.')
        app.exit(1)
    }, 90000)

    await app.whenReady()
    bloquearScripts()

    const resultados = []

    for(const page of pages){
        for(const viewport of viewports){
            resultados.push(await testarPagina(page, viewport))
        }
    }

    const falhas =
    resultados.flatMap(resultado =>
        Object.entries(resultado.checks)
        .filter(([, ok]) => !ok)
        .map(([check]) => `${resultado.page}/${resultado.viewport.name}: ${check}`)
    )

    console.log(JSON.stringify(resultados, null, 2))

    if(falhas.length > 0){
        throw new Error(`Falhas de layout: ${falhas.join(', ')}`)
    }

    clearTimeout(timeout)
    app.quit()
}

main().catch(error => {
    console.error(error.message)
    app.exit(1)
})
