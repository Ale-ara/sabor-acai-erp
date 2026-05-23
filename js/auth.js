async function verificarAuth(){

    const {

        data: { session }

    } = await supabaseClient.auth.getSession()

    /* SEM LOGIN */

    if(!session){

        window.location.href =
        '../index.html'

        return
    }

    /* DADOS USUÁRIO */

    const user = session.user

    /* BUSCA PERFIL */

    const {

        data: usuarioData

    } = await supabaseClient

    .from('usuarios')

    .select('*')

    .eq(
        'id',
        user.id
    )

    .single()

    /* NOME */

    const nomeEl =
    document.getElementById(
        'user-name'
    )

    if(nomeEl){

        nomeEl.innerText =
        usuarioData?.nome || 'Usuário'
    }

    /* CARGO */

    const cargoEl =
    document.getElementById(
        'user-cargo'
    )

    if(cargoEl){

        cargoEl.innerText =
        usuarioData?.cargo || 'Funcionário'
    }
}

/* LOGOUT */

async function logout(){

    await supabaseClient.auth.signOut()

    window.location.href =
    '../index.html'
}

/* INICIAR */

verificarAuth()