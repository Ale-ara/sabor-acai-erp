/* ========================================= */
/* AUTH */
/* ========================================= */

async function checkAuth(){

    const { data } =

    await supabaseClient
    .auth
    .getUser()

    if(!data.user){

        window.location.href =
        '../index.html'

        return
    }
}

/* ========================================= */
/* USUÁRIO */
/* ========================================= */

let usuarioAtual = null

async function carregarUsuario(){

    const {

        data: authData

    } = await supabaseClient

    .auth

    .getUser()

    const email =
    authData.user.email

    const {

        data: usuario,

        error

    } = await supabaseClient

    .from('usuarios')

    .select('*')

    .eq('email', email)

    .single()

    if(error){

        console.log(error)

        return
    }

    usuarioAtual = usuario

    /* TOPO */

    document.getElementById(
        'user-name'
    ).innerText =
    usuario.nome

    document.getElementById(
        'user-cargo'
    ).innerText =
    usuario.cargo

    /* INPUTS */

    document.getElementById(
        'nome'
    ).value =
    usuario.nome || ''

    document.getElementById(
        'usuario'
    ).value =
    usuario.usuario || ''

    document.getElementById(
        'email'
    ).value =
    usuario.email || ''

    /* FOTO */

    if(usuario.avatar){

        document.getElementById(
            'preview-avatar'
        ).src =
        usuario.avatar

        document.getElementById(
            'top-user-avatar'
        ).src =
        usuario.avatar
    }
}

/* ========================================= */
/* SALVAR PERFIL */
/* ========================================= */

async function salvarPerfil(){

    const nome =

    document.getElementById(
        'nome'
    ).value

    const usuario =

    document.getElementById(
        'usuario'
    ).value

    const email =

    document.getElementById(
        'email'
    ).value

    const {

        error

    } = await supabaseClient

    .from('usuarios')

    .update({

        nome,
        usuario,
        email

    })

    .eq(
        'id',
        usuarioAtual.id
    )

    if(error){

        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao salvar perfil',
            'error'
        )

        return
    }

    mostrarToast(
        'Perfil atualizado',
        'Dados salvos com sucesso'
    )

    carregarUsuario()
}

/* ========================================= */
/* ALTERAR SENHA */
/* ========================================= */

async function alterarSenha(){

    const senha =

    document.getElementById(
        'nova-senha'
    ).value

    const confirmar =

    document.getElementById(
        'confirmar-senha'
    ).value

    if(

        senha === '' ||

        confirmar === ''
    ){

        mostrarToast(
            'Campos vazios',
            'Digite a nova senha',
            'warning'
        )

        return
    }

    if(senha !== confirmar){

        mostrarToast(
            'Senhas diferentes',
            'Confirme corretamente',
            'warning'
        )

        return
    }

    if(senha.length < 6){

        mostrarToast(
            'Senha fraca',
            'Mínimo 6 caracteres',
            'warning'
        )

        return
    }

    const {

        error

    } = await supabaseClient

    .auth

    .updateUser({

        password: senha

    })

    if(error){

        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao atualizar senha',
            'error'
        )

        return
    }

    document.getElementById(
        'nova-senha'
    ).value = ''

    document.getElementById(
        'confirmar-senha'
    ).value = ''

    mostrarToast(
        'Senha alterada',
        'Senha atualizada com sucesso'
    )
}

/* ========================================= */
/* UPLOAD FOTO */
/* ========================================= */

document

.getElementById(
    'avatar-input'
)

.addEventListener(

    'change',

    async function(e){

        const file =
        e.target.files[0]

        if(!file){
            return
        }

        /* PREVIEW */

        const reader =
        new FileReader()

        reader.onload = function(ev){

            document.getElementById(
                'preview-avatar'
            ).src =
            ev.target.result

            document.getElementById(
                'top-user-avatar'
            ).src =
            ev.target.result
        }

        reader.readAsDataURL(file)

        /* NOME */

        const fileName =

        `${Date.now()}-${file.name}`

        /* UPLOAD */

        const {

            error: uploadError

        } = await supabaseClient

        .storage

        .from('avatars')

        .upload(
            fileName,
            file
        )

        if(uploadError){

            console.log(uploadError)

            mostrarToast(
                'Erro',
                'Erro ao enviar foto',
                'error'
            )

            return
        }

        /* URL */

        const {

            data

        } = supabaseClient

        .storage

        .from('avatars')

        .getPublicUrl(fileName)

        const avatarUrl =
        data.publicUrl

        /* SALVA */

        const {

            error

        } = await supabaseClient

        .from('usuarios')

        .update({

            avatar:
            avatarUrl

        })

        .eq(
            'id',
            usuarioAtual.id
        )

        if(error){

            console.log(error)

            mostrarToast(
                'Erro',
                'Erro ao salvar foto',
                'error'
            )

            return
        }

        mostrarToast(
            'Foto atualizada',
            'Avatar salvo com sucesso'
        )
    }
)

/* ========================================= */
/* MENU USUÁRIO */
/* ========================================= */

function abrirMenuUsuario(){

    mostrarToast(
        'Perfil',
        'Configurações do usuário'
    )
}

/* ========================================= */
/* LOGOUT */
/* ========================================= */

async function logout(){

    await supabaseClient
    .auth
    .signOut()

    localStorage.clear()

    sessionStorage.clear()

    window.location.href =
    '../index.html'
}

/* ========================================= */
/* INICIAR */
/* ========================================= */

checkAuth()

carregarUsuario()