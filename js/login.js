async function login(){

    const btn =

    document.getElementById(
        'btn-login'
    )

    btn.disabled = true

    btn.innerText =
    'Entrando...'

    /* CAMPOS */

    const usuario =

    document.getElementById(
        'usuario'
    ).value

    const password =

    document.getElementById(
        'password'
    ).value

    /* VALIDAÇÃO */

    if(!usuario || !password){

        mostrarPopup(
            'Campos obrigatórios',
            'Preencha usuário e senha.'
        )

        btn.disabled = false

        btn.innerText =
        'Entrar no sistema'

        return
    }

    /* BUSCA USUÁRIO */

    const {

        data: usuarioData,

        error: usuarioError

    } = await supabaseClient

    .from('usuarios')

    .select('*')

    .ilike(
        'usuario',
        usuario
    )

    .single()

    if(usuarioError || !usuarioData){

        mostrarPopup(
            'Usuário inválido',
            'Usuário não encontrado.'
        )

        btn.disabled = false

        btn.innerText =
        'Entrar no sistema'

        return
    }

    /* LOGIN REAL */

    const {

        data,

        error

    } = await supabaseClient

    .auth

    .signInWithPassword({

        email:
        usuarioData.email,

        password

    })

    btn.disabled = false

    btn.innerText =
    'Entrar no sistema'

    /* ERRO */

    if(error){

        console.log(error)

        mostrarPopup(
            'Senha inválida',
            'Senha incorreta.'
        )

        return
    }

    /* BOAS VINDAS */

    sessionStorage.setItem(
        'acabouDeLogar',
        'true'
    )

    /* REDIRECIONA */

    window.location.href =
    'pages/dashboard.html'
}

/* ========================================= */
/* POPUP */
/* ========================================= */

function mostrarPopup(
    titulo,
    texto
){

    document
    .getElementById(
        'popup-titulo'
    )
    .innerText = titulo

    document
    .getElementById(
        'popup-texto'
    )
    .innerText = texto

    document
    .getElementById(
        'popup-login'
    )
    .classList.add('active')
}

function fecharPopup(){

    document
    .getElementById(
        'popup-login'
    )
    .classList.remove('active')
}