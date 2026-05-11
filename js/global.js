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
    }
}

/* ========================================= */
/* USUÁRIO GLOBAL */
/* ========================================= */

async function carregarUsuario(){

    const {

        data: authData

    } = await supabaseClient

    .auth

    .getUser()

    if(!authData.user){
        return
    }

    const email =
    authData.user.email

    const {

        data: usuario

    } = await supabaseClient

    .from('usuarios')

    .select('*')

    .eq('email', email)

    .single()

    if(!usuario){
        return
    }

    /* NOME */

    const nome =

    document.getElementById(
        'user-name'
    )

    if(nome){

        nome.innerText =
        usuario.nome
    }

    /* CARGO */

    const cargo =

    document.getElementById(
        'user-cargo'
    )

    if(cargo){

        cargo.innerText =
        usuario.cargo
    }

    /* AVATAR TOPO */

    const avatarTopo =

    document.getElementById(
        'top-user-avatar'
    )

    if(

        avatarTopo &&

        usuario.avatar

    ){

        avatarTopo.src =
        usuario.avatar
    }

    /* AVATAR PERFIL */

    const avatarPerfil =

    document.getElementById(
        'preview-avatar'
    )

    if(

        avatarPerfil &&

        usuario.avatar

    ){

        avatarPerfil.src =
        usuario.avatar
    }
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
/* SIDEBAR MOBILE */
/* ========================================= */

function toggleSidebar(){

    const sidebar =

    document.querySelector(
        '.sidebar'
    )

    const overlay =

    document.getElementById(
        'sidebar-overlay'
    )

    sidebar.classList.toggle(
        'active'
    )

    overlay.classList.toggle(
        'active'
    )
}

function fecharSidebar(){

    const sidebar =

    document.querySelector(
        '.sidebar'
    )

    const overlay =

    document.getElementById(
        'sidebar-overlay'
    )

    sidebar.classList.remove(
        'active'
    )

    overlay.classList.remove(
        'active'
    )
}

/* ========================================= */
/* TRANSIÇÃO PÁGINAS */
/* ========================================= */

document

.querySelectorAll('.menu a')

.forEach(link => {

    link.addEventListener(
        'click',
        function(e){

        const href =

        this.getAttribute(
            'href'
        )

        if(!href){
            return
        }

        e.preventDefault()

        const transition =

        document.getElementById(
            'page-transition'
        )

        if(transition){

            transition.classList.add(
                'active'
            )
        }

        setTimeout(() => {

            window.location.href =
            href

        }, 250)
    })
})

window.addEventListener(
    'load',
    () => {

    const transition =

    document.getElementById(
        'page-transition'
    )

    if(transition){

        transition.classList.remove(
            'active'
        )
    }
})

/* ========================================= */
/* NOTIFICAÇÕES */
/* ========================================= */

async function criarNotificacao(
    titulo,
    texto,
    tipo = 'sistema',
    referencia = null
){

    if(referencia){

        const {

            data: existente

        } = await supabaseClient

        .from('notificacoes')

        .select('*')

        .eq(
            'referencia',
            referencia
        )

        .maybeSingle()

        if(existente){
            return
        }
    }

    await supabaseClient

    .from('notificacoes')

    .insert([

        {
            titulo,
            texto,
            tipo,
            referencia
        }

    ])
}

async function carregarNotificacoes(){

    const {

        data,

        error

    } = await supabaseClient

    .from('notificacoes')

    .select('*')

    .eq(
        'visualizada',
        false
    )

    .order(
        'created_at',
        {
            ascending: false
        }
    )

    if(error){

        console.log(error)

        return
    }

    renderizarNotificacoes(
        data
    )
}

/* ========================================= */
/* RENDER NOTIFICAÇÕES */
/* ========================================= */

function renderizarNotificacoes(
    lista
){

    const container =

    document.getElementById(
        'notification-list'
    )

    const badge =

    document.querySelector(
        '.notification-badge'
    )

    const contador =

    document.getElementById(
        'notification-count'
    )

    if(
        !container ||
        !badge ||
        !contador
    ){
        return
    }

    container.innerHTML = ''

    if(lista.length <= 0){

        container.innerHTML = `

            <div class="notification-empty">

                ✅ Nenhuma notificação

            </div>

        `

        badge.style.display =
        'none'

        contador.innerText =
        '0 novas'

        return
    }

    badge.style.display =
    'flex'

    badge.innerText =
    lista.length

    contador.innerText =
    `${lista.length} novas`

    lista.forEach((n) => {

        let emoji = '🚀'

        if(n.tipo === 'critica'){

            emoji = '⚠️'
        }

        else if(
            n.tipo === 'venda'
        ){

            emoji = '💰'
        }

        else if(
            n.tipo === 'sistema'
        ){

            emoji = '📄'
        }

        const data =

        new Date(
            n.created_at
        )

        const hora =

        data.toLocaleTimeString(
            'pt-BR',
            {
                hour: '2-digit',
                minute: '2-digit'
            }
        )

        container.innerHTML += `

            <div class="notification-item ${n.tipo}">

                <div class="notification-icon">

                    ${emoji}

                </div>

                <div class="notification-content">

                    <strong>
                        ${n.titulo}
                    </strong>

                    <p>
                        ${n.texto}
                    </p>

                    <small>
                        ${hora}
                    </small>

                </div>

            </div>

        `
    })
}

/* ========================================= */
/* TOGGLE NOTIFICAÇÕES */
/* ========================================= */

async function toggleNotifications(){

    const dropdown =

    document.getElementById(
        'notification-dropdown'
    )

    if(!dropdown){
        return
    }

    dropdown.classList.toggle(
        'active'
    )

    if(

        dropdown.classList.contains(
            'active'
        )

    ){

        await supabaseClient

        .from('notificacoes')

        .update({

            visualizada: true

        })

        .eq(
            'visualizada',
            false
        )

        carregarNotificacoes()
    }
}

/* ========================================= */
/* FECHAR FORA */
/* ========================================= */

document.addEventListener(
    'click',
    (e) => {

    const wrapper =

    document.querySelector(
        '.notification-wrapper'
    )

    const dropdown =

    document.getElementById(
        'notification-dropdown'
    )

    if(

        wrapper &&

        !wrapper.contains(
            e.target
        )

    ){

        dropdown?.classList.remove(
            'active'
        )
    }
})

/* ========================================= */
/* REALTIME */
/* ========================================= */

supabaseClient

.channel(
    'notificacoes-realtime'
)

.on(

    'postgres_changes',

    {

        event: '*',

        schema: 'public',

        table: 'notificacoes'
    },

    () => {

        carregarNotificacoes()

        tocarSomNotificacao()

        animarSino()
    }

)

.subscribe()

/* ========================================= */
/* SOM */
/* ========================================= */

function tocarSomNotificacao(){

    const audio = new Audio(

        'https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3'

    )

    audio.volume = 0.3

    audio.play()
}

/* ========================================= */
/* ANIMAÇÃO SINO */
/* ========================================= */

function animarSino(){

    const sino =

    document.querySelector(
        '.notification-btn'
    )

    if(!sino){
        return
    }

    sino.classList.add(
        'shake'
    )

    setTimeout(() => {

        sino.classList.remove(
            'shake'
        )

    }, 700)
}

/* ========================================= */
/* TOAST */
/* ========================================= */

function mostrarToast(
    titulo,
    mensagem,
    tipo = 'success'
){

    const toast =
    document.getElementById('toast')

    if(!toast){
        return
    }

    const title =
    document.getElementById('toast-title')

    const text =
    document.getElementById('toast-message')

    const icon =
    document.getElementById('toast-icon')

    title.innerText = titulo

    text.innerText = mensagem

    toast.className = 'toast'

    if(tipo === 'error'){

        toast.classList.add('error')

        icon.innerHTML = '✖'
    }

    else if(tipo === 'warning'){

        toast.classList.add('warning')

        icon.innerHTML = '⚠'
    }

    else{

        icon.innerHTML = '✔'
    }

    toast.classList.add('active')

    setTimeout(() => {

        toast.classList.remove('active')

    }, 3500)
}

/* ========================================= */
/* AUDITORIA */
/* ========================================= */

async function registrarAuditoria(
    acao,
    detalhes
){

    const {

        data: { session }

    } = await supabaseClient
    .auth
    .getSession()

    if(!session){
        return
    }

    const {

        data: usuarioData

    } = await supabaseClient

    .from('usuarios')

    .select('*')

    .eq(
        'id',
        session.user.id
    )

    .single()

    await supabaseClient

    .from('auditoria')

    .insert([

        {
            usuario:
            usuarioData?.nome || 'Usuário',

            acao,

            detalhes
        }

    ])
}

/* ========================================= */
/* PAGE TRANSITION */
/* ========================================= */

function iniciarTransicaoPagina(){

    const overlay =
    document.createElement('div')

    overlay.className =
    'page-transition'

    overlay.innerHTML = `

        <div class="transition-spinner"></div>

        <div class="transition-text">
            Carregando...
        </div>

    `

    document.body.appendChild(
        overlay
    )

    const links =

    document.querySelectorAll(
        'a'
    )

    links.forEach(link => {

        link.addEventListener(
            'click',

            function(e){

                const href =
                this.getAttribute('href')

                if(

                    !href ||

                    href.startsWith('#') ||

                    href.startsWith('javascript')

                ){
                    return
                }

                e.preventDefault()

                overlay.classList.add(
                    'active'
                )

                setTimeout(() => {

                    window.location.href =
                    href

                }, 350)
            }
        )
    })
}

document.addEventListener(

    'DOMContentLoaded',

    iniciarTransicaoPagina
)

/* ========================================= */
/* INICIAR */
/* ========================================= */

checkAuth()

carregarUsuario()

carregarNotificacoes()