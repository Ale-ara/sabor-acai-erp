const { app, BrowserWindow } = require('electron')
const path = require('path')

function imprimir(webContents, options){
    return new Promise((resolve, reject) => {
        webContents.print(options, (success, failureReason) => {
            if(success){
                resolve()
                return
            }

            reject(new Error(failureReason || 'Impressao recusada pelo sistema.'))
        })
    })
}

async function main(){
    await app.whenReady()

    const janela =
    new BrowserWindow({
        width: 420,
        height: 760,
        show: false
    })

    const printers =
    await janela.webContents.getPrintersAsync()

    console.log('Impressoras encontradas:')
    printers.forEach(printer => {
        console.log(`- ${printer.name}${printer.isDefault ? ' (padrao)' : ''}`)
    })

    if(printers.length === 0){
        throw new Error('Nenhuma impressora encontrada no Windows.')
    }

    const vendaTeste = {
        vendaId: 'TESTE-ELECTRON',
        itens: [
            {
                nome: 'Teste de impressao silenciosa',
                preco: 0
            }
        ],
        total: 0,
        pagamento: 'Teste',
        recebido: 0,
        troco: 0,
        data: new Date().toLocaleString('pt-BR')
    }

    await janela.loadFile(
        path.join(__dirname, '..', 'pages', 'impressao-termica.html'),
        {
            query: {
                silent: '1',
                data: JSON.stringify(vendaTeste)
            }
        }
    )

    await new Promise(resolve => {
        janela.webContents.once('did-finish-load', resolve)
        setTimeout(resolve, 1000)
    })

    const deviceName =
    process.env.PRINTER_NAME || ''

    await imprimir(
        janela.webContents,
        {
            silent: true,
            printBackground: true,
            ...(deviceName ? { deviceName } : {})
        }
    )

    console.log(
        deviceName
        ? `Teste enviado para: ${deviceName}`
        : 'Teste enviado para a impressora padrao do Windows.'
    )

    janela.close()
    app.quit()
}

main().catch(error => {
    console.error(error.message)
    app.exit(1)
})
