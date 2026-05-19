const CERTIFICADOS_KEY = 'certificadosDigitais'
const CERTIFICADOS_BUCKET = 'certificados-digitais'

let arquivoA1Selecionado = null
let certificadosCache = {}
let certificadosModoBanco = false

function obterCertificados(){
    if(Object.keys(certificadosCache).length > 0){
        return certificadosCache
    }

    try{
        return JSON.parse(localStorage.getItem(CERTIFICADOS_KEY) || '{}')
    }catch(error){
        return {}
    }
}

function salvarCertificados(dados){
    certificadosCache = dados
    localStorage.setItem(CERTIFICADOS_KEY, JSON.stringify(dados))
}

function dataArquivo(){
    return new Date().toISOString().slice(0, 10)
}

function formatarTamanho(bytes){
    if(!bytes) return '-'

    if(bytes < 1024 * 1024){
        return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function baixarArquivo(nome, conteudo, tipo){
    const blob = new Blob([conteudo], {
        type: tipo
    })

    baixarBlob(nome, blob)
}

function baixarBlob(nome, blob){
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = nome
    link.click()

    URL.revokeObjectURL(url)
}

function baixarBase64(nome, base64, tipo){
    const binario = atob(base64)
    const bytes = new Uint8Array(binario.length)

    for(let i = 0; i < binario.length; i++){
        bytes[i] = binario.charCodeAt(i)
    }

    baixarBlob(nome, new Blob([bytes], {
        type: tipo
    }))
}

function arquivoParaBase64(file){
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => {
            const resultado = String(reader.result || '')
            resolve(resultado.split(',')[1] || '')
        }

        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

async function carregarCertificadosBanco(){
    const { data, error } = await supabaseClient
    .from('certificados_digitais')
    .select('*')

    if(error){
        certificadosModoBanco = false
        return null
    }

    certificadosModoBanco = true

    const dados = {}

    ;(data || []).forEach(item => {
        if(item.tipo === 'a1'){
            dados.a1 = {
                nome: item.nome,
                vencimento: item.vencimento,
                arquivoNome: item.arquivo_nome,
                tamanho: item.tamanho,
                tipo: item.mime_type,
                storagePath: item.storage_path,
                atualizadoEm: item.updated_at
            }
        }

        if(item.tipo === 'a3'){
            dados.a3 = {
                ...(item.configuracao || {}),
                nome: item.nome,
                vencimento: item.vencimento,
                atualizadoEm: item.updated_at
            }
        }
    })

    return dados
}

async function carregarCertificados(){
    const dadosBanco = await carregarCertificadosBanco()

    if(dadosBanco){
        salvarCertificados(dadosBanco)
        return
    }

    certificadosCache = obterCertificados()
}

function preencherTela(){
    const dados = obterCertificados()
    const a1 = dados.a1
    const a3 = dados.a3

    document.getElementById('cert-a1-nome').value = a1?.nome || ''
    document.getElementById('cert-a1-vencimento').value = a1?.vencimento || ''
    document.getElementById('cert-a3-nome').value = a3?.nome || ''
    document.getElementById('cert-a3-tipo').value = a3?.tipo || 'token-usb'
    document.getElementById('cert-a3-fornecedor').value = a3?.fornecedor || ''
    document.getElementById('cert-a3-vencimento').value = a3?.vencimento || ''

    renderizarStatus()
}

function renderizarStatus(){
    const dados = obterCertificados()
    const a1 = dados.a1
    const a3 = dados.a3
    const statusA1 = document.getElementById('a1-status-text')
    const statusA3 = document.getElementById('a3-status-text')
    const metaA1 = document.getElementById('a1-meta')

    statusA1.innerText = a1
    ? `Certificado A1 valido ate ${a1.vencimento || 'data nao informada'}`
    : 'Nenhum certificado A1 importado.'

    metaA1.innerText = a1
    ? `${a1.arquivoNome || 'Arquivo salvo'} | ${formatarTamanho(a1.tamanho)} | Vence em ${a1.vencimento || '-'}`
    : 'Importe um arquivo A1 para conseguir exportar com um clique depois.'

    statusA3.innerText = a3
    ? `Certificado A3 registrado: ${a3.nome || 'sem apelido'}`
    : 'Certificado A3 configurado pelo dispositivo fisico.'
}

function selecionarTipoCertificado(tipo){
    document.getElementById('cert-choice-a1').classList.toggle('active', tipo === 'a1')
    document.getElementById('cert-choice-a3').classList.toggle('active', tipo === 'a3')
    document.getElementById('painel-a1').classList.toggle('hidden', tipo !== 'a1')
    document.getElementById('painel-a3').classList.toggle('hidden', tipo !== 'a3')
}

function configurarArquivoA1(){
    const input = document.getElementById('cert-a1-arquivo')
    const meta = document.getElementById('a1-meta')

    input.addEventListener('change', () => {
        const file = input.files[0]

        if(!file) return

        const extensao = file.name.split('.').pop().toLowerCase()

        if(!['pfx', 'p12'].includes(extensao)){
            mostrarToast('Arquivo invalido', 'Selecione um certificado .pfx ou .p12', 'warning')
            input.value = ''
            arquivoA1Selecionado = null
            return
        }

        arquivoA1Selecionado = file
        meta.innerText = `${file.name} | ${formatarTamanho(file.size)}`
    })
}

async function salvarCertificadoA1(){
    const dados = obterCertificados()
    const existente = dados.a1

    if(!arquivoA1Selecionado && !existente){
        mostrarToast('Selecione o arquivo', 'Importe um certificado A1 .pfx ou .p12', 'warning')
        return
    }

    let arquivoNome = existente?.arquivoNome || ''
    let tamanho = existente?.tamanho || 0
    let tipo = existente?.tipo || 'application/x-pkcs12'
    let storagePath = existente?.storagePath || ''
    let arquivoBase64 = existente?.arquivoBase64 || ''

    if(arquivoA1Selecionado){
        arquivoNome = arquivoA1Selecionado.name
        tamanho = arquivoA1Selecionado.size
        tipo = arquivoA1Selecionado.type || 'application/x-pkcs12'

        if(certificadosModoBanco){
            storagePath = `a1/${Date.now()}-${arquivoNome.replace(/[^a-zA-Z0-9._-]/g, '-')}`

            const { error: uploadError } = await supabaseClient
            .storage
            .from(CERTIFICADOS_BUCKET)
            .upload(storagePath, arquivoA1Selecionado, {
                upsert: true,
                contentType: tipo
            })

            if(uploadError){
                mostrarToast('Erro no upload', uploadError.message || 'Nao foi possivel salvar no Supabase', 'error')
                return
            }

            if(existente?.storagePath && existente.storagePath !== storagePath){
                await supabaseClient.storage.from(CERTIFICADOS_BUCKET).remove([existente.storagePath])
            }
        }else{
            arquivoBase64 = await arquivoParaBase64(arquivoA1Selecionado)
        }
    }

    dados.a1 = {
        nome: document.getElementById('cert-a1-nome').value.trim() || 'Certificado A1',
        vencimento: document.getElementById('cert-a1-vencimento').value,
        arquivoNome,
        tamanho,
        tipo,
        storagePath,
        arquivoBase64,
        atualizadoEm: new Date().toISOString()
    }

    if(certificadosModoBanco){
        const { error } = await supabaseClient
        .from('certificados_digitais')
        .upsert([
            {
                id: 'a1',
                tipo: 'a1',
                nome: dados.a1.nome,
                vencimento: dados.a1.vencimento || null,
                arquivo_nome: arquivoNome,
                tamanho,
                mime_type: tipo,
                storage_path: storagePath,
                configuracao: {},
                updated_at: dados.a1.atualizadoEm
            }
        ], {
            onConflict: 'id'
        })

        if(error){
            mostrarToast('Erro ao salvar', error.message || 'Nao foi possivel registrar o A1', 'error')
            return
        }
    }

    salvarCertificados(dados)
    arquivoA1Selecionado = null
    document.getElementById('cert-a1-arquivo').value = ''
    renderizarStatus()

    await registrarAuditoria?.('Certificado A1 salvo', `Certificado ${dados.a1.nome} foi registrado`)
    mostrarToast('A1 salvo', certificadosModoBanco ? 'Certificado salvo no Supabase' : 'Certificado salvo neste navegador')
}

function exportarCertificadoA1(){
    exportarCertificadoA1Async()
}

async function exportarCertificadoA1Async(){
    const a1 = obterCertificados().a1

    if(!a1?.arquivoBase64 && !a1?.storagePath){
        mostrarToast('A1 nao importado', 'Salve um certificado A1 antes de exportar', 'warning')
        return
    }

    if(a1.storagePath){
        const { data, error } = await supabaseClient
        .storage
        .from(CERTIFICADOS_BUCKET)
        .download(a1.storagePath)

        if(error){
            mostrarToast('Erro ao exportar', error.message || 'Nao foi possivel baixar o A1', 'error')
            return
        }

        baixarBlob(a1.arquivoNome || `certificado-a1-${dataArquivo()}.pfx`, data)
        mostrarToast('A1 exportado', 'Arquivo do certificado baixado')
        return
    }

    baixarBase64(
        a1.arquivoNome || `certificado-a1-${dataArquivo()}.pfx`,
        a1.arquivoBase64,
        a1.tipo || 'application/x-pkcs12'
    )

    mostrarToast('A1 exportado', 'Arquivo do certificado baixado')
}

async function removerCertificadoA1(){
    const dados = obterCertificados()
    const a1 = dados.a1

    if(certificadosModoBanco){
        if(a1?.storagePath){
            await supabaseClient.storage.from(CERTIFICADOS_BUCKET).remove([a1.storagePath])
        }

        await supabaseClient.from('certificados_digitais').delete().eq('id', 'a1')
    }

    delete dados.a1
    salvarCertificados(dados)
    document.getElementById('cert-a1-nome').value = ''
    document.getElementById('cert-a1-vencimento').value = ''
    document.getElementById('cert-a1-arquivo').value = ''
    arquivoA1Selecionado = null
    renderizarStatus()

    mostrarToast('A1 removido', 'Certificado removido')
}

async function salvarConfiguracaoA3(){
    const dados = obterCertificados()

    dados.a3 = {
        nome: document.getElementById('cert-a3-nome').value.trim() || 'Certificado A3',
        tipo: document.getElementById('cert-a3-tipo').value,
        fornecedor: document.getElementById('cert-a3-fornecedor').value.trim(),
        vencimento: document.getElementById('cert-a3-vencimento').value,
        observacao: 'A chave privada do A3 fica protegida no token/cartao/nuvem e nao e exportavel pelo navegador.',
        atualizadoEm: new Date().toISOString()
    }

    if(certificadosModoBanco){
        const { error } = await supabaseClient
        .from('certificados_digitais')
        .upsert([
            {
                id: 'a3',
                tipo: 'a3',
                nome: dados.a3.nome,
                vencimento: dados.a3.vencimento || null,
                configuracao: dados.a3,
                updated_at: dados.a3.atualizadoEm
            }
        ], {
            onConflict: 'id'
        })

        if(error){
            mostrarToast('Erro ao salvar', error.message || 'Nao foi possivel registrar o A3', 'error')
            return
        }
    }

    salvarCertificados(dados)
    renderizarStatus()

    await registrarAuditoria?.('Configuracao A3 salva', `Configuracao ${dados.a3.nome} foi atualizada`)
    mostrarToast('A3 salvo', certificadosModoBanco ? 'Configuracao salva no Supabase' : 'Configuracao salva neste navegador')
}

function exportarConfiguracaoA3(){
    const a3 = obterCertificados().a3

    if(!a3){
        mostrarToast('A3 nao cadastrado', 'Salve os dados do certificado A3 antes de exportar', 'warning')
        return
    }

    baixarArquivo(
        `configuracao-a3-${dataArquivo()}.json`,
        JSON.stringify(a3, null, 2),
        'application/json;charset=utf-8'
    )

    mostrarToast('Configuracao exportada', 'Arquivo JSON do A3 foi gerado')
}

document.addEventListener('DOMContentLoaded', async () => {
    configurarArquivoA1()
    await carregarCertificados()
    preencherTela()
})
