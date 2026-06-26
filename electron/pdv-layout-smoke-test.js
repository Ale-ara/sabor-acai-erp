const { app, BrowserWindow, session } = require('electron')
const fs = require('fs/promises')
const path = require('path')

const viewports = [
    { width: 1366, height: 768, name: 'desktop-baixo' },
    { width: 1280, height: 720, name: 'desktop-compacto' },
    { width: 1100, height: 720, name: 'minimo-electron' }
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

async function testarViewport(viewport){
    const janela = criarJanela(viewport)

    try{
        await janela.loadFile(
            path.join(__dirname, '..', 'pages', 'caixa.html')
        )

        await new Promise(resolve => setTimeout(resolve, 400))

        const resultado =
        await janela.webContents.executeJavaScript(`
        (() => {
            const cart = document.querySelector('.carrinho')
            const header = document.querySelector('.carrinho-header')
            const payment = document.querySelector('.rodape-carrinho')
            const split = document.querySelector('#split-payment-card')
            const summary = document.querySelector('#split-summary')
            const simpleReceived = document.querySelector('#pagamento-simples-recebido')
            const empty = document.querySelector('#itens-carrinho')

            cart?.classList.add('pagamento-dividido-ativo')
            empty?.classList.add('sem-itens')

            if(split){
                split.hidden = false
            }

            if(simpleReceived){
                simpleReceived.hidden = true
                simpleReceived.style.display = 'none'
            }

            const rect = element => {
                const r = element.getBoundingClientRect()
                return {
                    top: r.top,
                    left: r.left,
                    right: r.right,
                    bottom: r.bottom,
                    width: r.width,
                    height: r.height
                }
            }

            const cartRect = rect(cart)
            const headerRect = rect(header)
            const paymentRect = rect(payment)
            const splitRect = rect(split)
            const summaryRect = rect(summary)
            const simpleStyle = getComputedStyle(simpleReceived)

            const dentroDoCarrinho = item =>
                item.left >= cartRect.left - 1 &&
                item.right <= cartRect.right + 1

            return {
                viewport: ${JSON.stringify(viewport)},
                cart: cartRect,
                header: headerRect,
                payment: paymentRect,
                split: splitRect,
                summary: summaryRect,
                simpleReceivedDisplay: simpleStyle.display,
                checks: {
                    paymentBelowHeader: paymentRect.top >= headerRect.bottom + 8,
                    splitInsideCart: dentroDoCarrinho(splitRect),
                    summaryInsideCart: dentroDoCarrinho(summaryRect),
                    simpleReceivedHidden: simpleStyle.display === 'none',
                    cartInsideViewport: cartRect.right <= window.innerWidth + 1,
                    noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1
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
        path.join(outDir, `pdv-layout-${viewport.name}.png`)

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
        console.error('Tempo limite no teste de layout do PDV.')
        app.exit(1)
    }, 45000)

    await app.whenReady()
    bloquearScripts()

    const resultados = []

    for(const viewport of viewports){
        resultados.push(await testarViewport(viewport))
    }

    const falhas =
    resultados.flatMap(resultado =>
        Object.entries(resultado.checks)
        .filter(([, ok]) => !ok)
        .map(([check]) => `${resultado.viewport.name}: ${check}`)
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
