async function login(){

    const btn =
    document.getElementById('btn-login')

    btn.disabled = true
    btn.innerText = 'Entrando...'

    const usuario =
    document.getElementById('usuario').value.trim()

    const password =
    document.getElementById('password').value

    if(!usuario || !password){
        mostrarPopup(
            'Campos obrigatórios',
            'Preencha usuário e senha.'
        )

        resetarBotaoLogin(btn)
        return
    }

    const usuarioData =
    await buscarUsuarioLogin(usuario)

    if(!usuarioData){
        mostrarPopup(
            'Usuário inválido',
            'Usuário não encontrado.'
        )

        resetarBotaoLogin(btn)
        return
    }

    if(usuarioData.ativo === false){
        mostrarPopup(
            'Usuário inativo',
            'Seu acesso está bloqueado. Fale com o administrador.'
        )

        resetarBotaoLogin(btn)
        return
    }

    const { error } =
    await supabaseClient
    .auth
    .signInWithPassword({
        email: usuarioData.email,
        password
    })

    resetarBotaoLogin(btn)

    if(error){
        console.log(error)

        mostrarPopup(
            'Login bloqueado',
            'Senha incorreta ou conta sem acesso no Auth.'
        )

        return
    }

    sessionStorage.setItem(
        'acabouDeLogar',
        'true'
    )

    window.location.href =
    'pages/dashboard.html'
}

async function buscarUsuarioLogin(valor){
    const login =
    valor.trim()

    const loginNormalizado =
    normalizarLogin(login)

    const loginsPrincipais = {
        leticia: 'leticia@saborerp.com',
        'leticia@saborerp.com': 'leticia@saborerp.com',
        admin: 'admin@saborerp.com',
        alessandro: 'admin@saborerp.com',
        'admin@saborerp.com': 'admin@saborerp.com'
    }

    if(loginsPrincipais[loginNormalizado]){
        return {
            email: loginsPrincipais[loginNormalizado],
            ativo: true
        }
    }

    const { data: usuarioRpc } =
    await supabaseClient
    .rpc('buscar_login_usuario_app', {
        login_texto: login
    })

    if(usuarioRpc?.email){
        return usuarioRpc
    }

    if(login.includes('@')){
        const { data } =
        await supabaseClient
        .from('usuarios')
        .select('*')
        .ilike('email', login)
        .maybeSingle()

        if(data){
            return data
        }
    }

    const { data: porUsuario } =
    await supabaseClient
    .from('usuarios')
    .select('*')
    .ilike('usuario', login)
    .maybeSingle()

    if(porUsuario){
        return porUsuario
    }

    const { data: porEmail } =
    await supabaseClient
    .from('usuarios')
    .select('*')
    .ilike('email', login)
    .maybeSingle()

    return porEmail || null
}

function normalizarLogin(valor){
    return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function resetarBotaoLogin(btn){
    btn.disabled = false
    btn.innerText = 'Entrar no sistema'
}

function mostrarPopup(
    titulo,
    texto
){
    document
    .getElementById('popup-titulo')
    .innerText = titulo

    document
    .getElementById('popup-texto')
    .innerText = texto

    document
    .getElementById('popup-login')
    .classList.add('active')
}

function fecharPopup(){
    document
    .getElementById('popup-login')
    .classList.remove('active')
}

