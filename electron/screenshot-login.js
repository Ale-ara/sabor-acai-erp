const { app, BrowserWindow } = require('electron')
const fs = require('fs/promises')
const path = require('path')

async function main(){
    await app.whenReady()

    const janela =
    new BrowserWindow({
        width: 1672,
        height: 941,
        show: false,
        backgroundColor: '#070E1D',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    })

    await janela.loadFile(path.join(__dirname, '..', 'index.html'))
    await new Promise(resolve => setTimeout(resolve, 1400))

    const image =
    await janela.webContents.capturePage()

    const outDir =
    path.join(__dirname, '..', 'artifacts')

    await fs.mkdir(outDir, {
        recursive: true
    })

    const outFile =
    path.join(outDir, 'login-preview.png')

    await fs.writeFile(outFile, image.toPNG())
    console.log(outFile)

    janela.close()
    app.quit()
}

main().catch(error => {
    console.error(error)
    app.exit(1)
})
