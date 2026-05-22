let assinaturaAtual = null

function mostrarToast(titulo, mensagem){
    const toast = document.getElementById('toast')

    document.getElementById('toast-title').innerText = titulo
    document.getElementById('toast-message').innerText = mensagem

    toast.classList.add('ativo')

    setTimeout(() => {
        toast.classList.remove('ativo')
    }, 3500)
}

async function logout(){
    await supabaseClient.auth.signOut()
    document.getElementById('dev-shell').hidden = true
    document.getElementById('dev-locked').hidden = true
    document.getElementById('dev-login').hidden = false
}

async function entrarDev(event){
    event.preventDefault()

    const email =
    document.getElementById('dev-login-email').value.trim()

    const password =
    document.getElementById('dev-login-senha').value

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    })

    if(error){
        const mensagem =
        error.message?.includes('Invalid login credentials')
        ? 'E-mail ou senha inválidos. Confirme se esse usuário existe em Authentication > Users.'
        : error.message || 'Confira e-mail e senha'

        mostrarToast(
            'Login não autorizado',
            mensagem
        )

        return
    }

    document.getElementById('dev-login-senha').value = ''

    const acesso = await validarAcessoDev()

    if(acesso){
        await carregarAssinaturaDev()
    }
}

function dataHoje(){
    return new Date().toISOString().slice(0, 10)
}

function somarDias(data, dias){
    const base = new Date(`${data}T00:00:00`)
    base.setDate(base.getDate() + dias)
    return base.toISOString().slice(0, 10)
}

function calcularDiasRestantes(fim){
    if(!fim) return '-'

    const hoje = new Date(`${dataHoje()}T00:00:00`)
    const fimTeste = new Date(`${fim}T00:00:00`)
    const diff = Math.ceil((fimTeste - hoje) / 86400000)

    return diff > 0 ? diff : 0
}

async function validarAcessoDev(){
    const { data: { session } } = await supabaseClient.auth.getSession()

    if(!session){
        document.getElementById('dev-login').hidden = false
        document.getElementById('dev-locked').hidden = true
        document.getElementById('dev-shell').hidden = true
        return false
    }

    const { data, error } = await supabaseClient
    .from('dev_admins')
    .select('email')
    .eq('email', session.user.email)
    .maybeSingle()

    if(error || !data){
        await supabaseClient.auth.signOut()

        document.getElementById('dev-locked').hidden = true
        document.getElementById('dev-shell').hidden = true
        document.getElementById('dev-login').hidden = false

        mostrarToast(
            'Conta sem acesso',
            'Entre com galego.x@hotmail.com para acessar o painel privado.'
        )

        return false
    }

    document.getElementById('dev-locked').hidden = true
    document.getElementById('dev-shell').hidden = false
    document.getElementById('dev-login').hidden = true
    return true
}

async function carregarAssinaturaDev(){
    const { data, error } = await supabaseClient
    .from('app_assinatura')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

    if(error){
        mostrarToast('Erro', error.message || 'Nao foi possivel carregar a cobranca')
        return
    }

    assinaturaAtual = data || {
        id: 1,
        cliente_nome: 'Cliente',
        inicio_teste: dataHoje(),
        fim_teste: somarDias(dataHoje(), 7),
        valor_mensal: 0,
        status: 'teste',
        mensagem_cobranca: 'Seu periodo gratis acabou. Para continuar usando o sistema, regularize o pagamento.',
        link_pagamento: '',
        pix_chave: ''
    }

    preencherFormulario()
}

function preencherFormulario(){
    const assinatura = assinaturaAtual

    document.getElementById('dev-cliente').value = assinatura.cliente_nome || ''
    document.getElementById('dev-status').value = assinatura.status || 'teste'
    document.getElementById('dev-inicio').value = assinatura.inicio_teste || dataHoje()
    document.getElementById('dev-fim').value = assinatura.fim_teste || somarDias(dataHoje(), 7)
    document.getElementById('dev-valor').value = assinatura.valor_mensal || 0
    document.getElementById('dev-link').value = assinatura.link_pagamento || ''
    document.getElementById('dev-pix').value = assinatura.pix_chave || ''
    document.getElementById('dev-mensagem').value = assinatura.mensagem_cobranca || ''

    document.getElementById('dev-status-atual').innerText =
    (assinatura.status || 'teste').toUpperCase()

    document.getElementById('dev-dias-restantes').innerText =
    calcularDiasRestantes(assinatura.fim_teste)
}

function lerFormulario(){
    return {
        id: 1,
        cliente_nome: document.getElementById('dev-cliente').value.trim() || 'Cliente',
        status: document.getElementById('dev-status').value,
        inicio_teste: document.getElementById('dev-inicio').value || dataHoje(),
        fim_teste: document.getElementById('dev-fim').value || somarDias(dataHoje(), 7),
        valor_mensal: Number(document.getElementById('dev-valor').value || 0),
        link_pagamento: document.getElementById('dev-link').value.trim(),
        pix_chave: document.getElementById('dev-pix').value.trim(),
        mensagem_cobranca: document.getElementById('dev-mensagem').value.trim(),
        updated_at: new Date().toISOString()
    }
}

async function salvarAssinaturaDev(event){
    event?.preventDefault()

    const payload = lerFormulario()

    let { data, error } = await supabaseClient
    .from('app_assinatura')
    .update(payload)
    .eq('id', 1)
    .select()

    if(error){
        mostrarToast('Erro ao salvar', error.message || 'Confira as policies do Supabase')
        return
    }

    if(!data || data.length === 0){
        const insert = await supabaseClient
        .from('app_assinatura')
        .insert([payload])
        .select()

        if(insert.error){
            mostrarToast('Erro ao salvar', insert.error.message || 'Confira as policies do Supabase')
            return
        }

        data = insert.data
    }

    assinaturaAtual = Array.isArray(data) ? data[0] : data
    preencherFormulario()
    mostrarToast('Cobrança salva', 'Status atualizado para a cliente')
}

function marcarVencido(){
    document.getElementById('dev-status').value = 'vencido'
    document.getElementById('dev-fim').value = dataHoje()
    salvarAssinaturaDev()
}

function marcarAtivo(){
    document.getElementById('dev-status').value = 'ativo'
    salvarAssinaturaDev()
}

document.addEventListener('DOMContentLoaded', async () => {
    const acesso = await validarAcessoDev()

    if(acesso){
        await carregarAssinaturaDev()
    }
})
