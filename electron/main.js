const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')

let mainWindow = null

const appIcon =
path.join(__dirname, '..', 'assets', 'icone.ico')

const paginasImpressao = {
    'impressao-termica.html': path.join(__dirname, '..', 'pages', 'impressao-termica.html'),
    'impressao-a4.html': path.join(__dirname, '..', 'pages', 'impressao-a4.html'),
    'impressao-caixa.html': path.join(__dirname, '..', 'pages', 'impressao-caixa.html')
}

function criarJanelaPrincipal(){
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 900,
        minWidth: 1100,
        minHeight: 720,
        show: false,
        title: 'Sabor do Açaí ERP',
        icon: appIcon,
        backgroundColor: '#120817',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    })

    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'))

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if(url.startsWith('file://')){
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 900,
                    height: 760,
                    backgroundColor: '#ffffff',
                    webPreferences: {
                        preload: path.join(__dirname, 'preload.js'),
                        contextIsolation: true,
                        nodeIntegration: false,
                        sandbox: false
                    }
                }
            }
        }

        shell.openExternal(url)
        return { action: 'deny' }
    })
}

async function listarImpressoras(webContents){
    const impressoras =
    await webContents.getPrintersAsync()

    return impressoras.map(impressora => ({
        name: impressora.name,
        displayName: impressora.displayName || impressora.name,
        description: impressora.description || '',
        isDefault: Boolean(impressora.isDefault),
        status: impressora.status
    }))
}

function aguardarCarregamento(webContents){
    return new Promise((resolve, reject) => {
        const timeout =
        setTimeout(() => {
            reject(new Error('Tempo limite ao carregar pagina de impressao.'))
        }, 15000)

        webContents.once('did-finish-load', () => {
            clearTimeout(timeout)
            resolve()
        })

        webContents.once('did-fail-load', (_event, _code, description) => {
            clearTimeout(timeout)
            reject(new Error(description || 'Falha ao carregar pagina de impressao.'))
        })
    })
}

function imprimirWebContents(webContents, options){
    return new Promise((resolve, reject) => {
        webContents.print(options, (success, failureReason) => {
            if(success){
                resolve({ ok: true })
                return
            }

            reject(new Error(failureReason || 'Impressao cancelada ou recusada.'))
        })
    })
}

ipcMain.handle('printers:list', async event => {
    return listarImpressoras(event.sender)
})

ipcMain.handle('print:silent', async (event, options = {}) => {
    const pagina =
    paginasImpressao[options.page]

    if(!pagina){
        throw new Error('Pagina de impressao nao permitida.')
    }

    const janelaImpressao =
    new BrowserWindow({
        width: 420,
        height: 760,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            session: event.sender.session
        }
    })

    try{
        const carregamento =
        aguardarCarregamento(janelaImpressao.webContents)

        await janelaImpressao.loadFile(pagina, {
            query: {
                silent: '1',
                data: options.data || ''
            }
        })

        await carregamento

        await new Promise(resolve => setTimeout(resolve, 300))

        const printOptions = {
            silent: true,
            printBackground: true
        }

        if(options.deviceName){
            printOptions.deviceName = options.deviceName
        }

        await imprimirWebContents(
            janelaImpressao.webContents,
            printOptions
        )

        return { ok: true }
    }finally{
        if(!janelaImpressao.isDestroyed()){
            janelaImpressao.close()
        }
    }
})

app.whenReady().then(() => {
    criarJanelaPrincipal()

    app.on('activate', () => {
        if(BrowserWindow.getAllWindows().length === 0){
            criarJanelaPrincipal()
        }
    })
})

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin'){
        app.quit()
    }
})
