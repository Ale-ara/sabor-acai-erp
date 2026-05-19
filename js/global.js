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
/* SIDEBAR UPGRADE */
/* ========================================= */

function aprimorarSidebar(){

    const sidebar =

    document.querySelector(
        '.sidebar'
    )

    if(!sidebar || sidebar.dataset.upgraded === 'true'){
        return
    }

    sidebar.dataset.upgraded = 'true'

    sidebar.classList.add(
        'sidebar-upgraded'
    )

    document.body.classList.add(
        'sidebar-pro-active'
    )

    const menu =

    sidebar.querySelector(
        '.menu'
    )

    const paginaAtual =

    window.location.pathname
    .split('/')
    .pop()

    const itens = {
        'dashboard.html': ['Dashboard', 'DB', 'Visão geral'],
        'caixa.html': ['Caixa', 'CX', 'PDV'],
        'produtos.html': ['Produtos', 'PR', 'Catálogo'],
        'categorias.html': ['Categorias', 'CT', 'Organização'],
        'estoque.html': ['Estoque', 'ES', 'Inventario'],
        'movimentacoes.html': ['Movimentações', 'MV', 'Entradas e saídas'],
        'vendas.html': ['Vendas', 'VD', 'Histórico'],
        'relatorios.html': ['Relatórios', 'RL', 'Análises'],
        'usuarios.html': ['Usuário', 'US', 'Acesso'],
        'certificados.html': ['Certificados digitais', 'CD', 'A1 e A3'],
        'saude-sistema.html': ['Saúde do sistema', 'SS', 'Diagnóstico'],
        'configuracoes.html': ['Configurações', 'CF', 'Loja'],
        'tutorial.html': ['Tutorial', 'TU', 'Guia do sistema']
    }

    if(menu){

        if(!menu.querySelector('a[href="tutorial.html"]')){
            menu.insertAdjacentHTML(
                'beforeend',
                '<a href="tutorial.html">Tutorial</a>'
            )
        }

        if(!menu.querySelector('a[href="configuracoes.html"]')){
            menu.insertAdjacentHTML(
                'beforeend',
                '<a href="configuracoes.html">Configurações</a>'
            )
        }

        if(!menu.querySelector('a[href="certificados.html"]')){
            menu.insertAdjacentHTML(
                'beforeend',
                '<a href="certificados.html">Certificados digitais</a>'
            )
        }

        if(!menu.querySelector('a[href="saude-sistema.html"]')){
            menu.insertAdjacentHTML(
                'beforeend',
                '<a href="saude-sistema.html">Saúde do sistema</a>'
            )
        }

        menu
        .querySelectorAll('a')
        .forEach(link => {

            const href =
            link.getAttribute('href') || ''

            const arquivo =
            href.split('/').pop()

            const item =
            itens[arquivo]

            if(!item){
                return
            }

            link.classList.toggle(
                'active',
                arquivo === paginaAtual
            )

            link.innerHTML = `
                <span class="nav-icon">${item[1]}</span>
                <span class="nav-copy">
                    <span>${item[0]}</span>
                    <small>${item[2]}</small>
                </span>
                <span class="nav-indicator"></span>
            `
        })

        montarDropdownAdministracaoSidebar(
            menu,
            paginaAtual
        )

        montarDropdownProdutosSidebar(
            menu,
            paginaAtual
        )

        montarDropdownAjudaSidebar(
            menu,
            paginaAtual
        )
    }

    const logout =

    sidebar.querySelector(
        '.logout-btn'
    )

    if(logout && !sidebar.querySelector('.sidebar-status')){

        const status =
        document.createElement('div')

        status.className = 'sidebar-status'

        status.innerHTML = `
            <span class="status-dot"></span>
            <div>
                <strong>Caixa Principal</strong>
                <small>Sistema online</small>
            </div>
        `

        logout.parentNode.insertBefore(
            status,
            logout
        )
    }
}

function montarDropdownAjudaSidebar(
    menu,
    paginaAtual
){
    montarDropdownSidebar(
        menu,
        paginaAtual,
        {
            grupo: 'ajuda',
            titulo: 'Ajuda',
            descricao: 'Tutorial e suporte',
            sigla: 'AJ',
            links: [
                {
                    href: 'tutorial.html',
                    nome: 'Tutorial',
                    descricao: 'Como usar o ERP',
                    sigla: 'TU'
                }
            ]
        }
    )
}

function montarDropdownProdutosSidebar(
    menu,
    paginaAtual
){
    montarDropdownSidebar(
        menu,
        paginaAtual,
        {
            grupo: 'produtos',
            titulo: 'Produtos',
            descricao: 'Catálogo e estoque',
            sigla: 'PR',
            links: [
                {
                    href: 'produtos.html',
                    nome: 'Produtos',
                    descricao: 'Itens e preços',
                    sigla: 'PR'
                },
                {
                    href: 'categorias.html',
                    nome: 'Categorias',
                    descricao: 'Organização',
                    sigla: 'CT'
                },
                {
                    href: 'estoque.html',
                    nome: 'Estoque',
                    descricao: 'Inventario',
                    sigla: 'ES'
                }
            ]
        }
    )
}

function montarDropdownAdministracaoSidebar(
    menu,
    paginaAtual
){
    montarDropdownSidebar(
        menu,
        paginaAtual,
        {
            grupo: 'admin',
            titulo: 'Administração',
            descricao: 'Usuários e ajustes',
            sigla: 'AD',
            links: [
                {
                    href: 'usuarios.html',
                    nome: 'Usuários',
                    descricao: 'Equipe e permissões',
                    sigla: 'US'
                },
                {
                    href: 'certificados.html',
                    nome: 'Certificados digitais',
                    descricao: 'A1 e A3',
                    sigla: 'CD'
                },
                {
                    href: 'saude-sistema.html',
                    nome: 'Saúde do sistema',
                    descricao: 'Diagnóstico',
                    sigla: 'SS'
                },
                {
                    href: 'configuracoes.html',
                    nome: 'Configurações',
                    descricao: 'Dados da loja',
                    sigla: 'CF'
                }
            ]
        }
    )
}

function montarDropdownSidebar(
    menu,
    paginaAtual,
    config
){
    if(menu.querySelector(`.sidebar-dropdown[data-group="${config.grupo}"]`)){
        return
    }

    const linksExistentes =
    config.links
    .map(item => {
        const link =
        menu.querySelector(`a[href="${item.href}"]`)

        if(!link){
            return null
        }

        link.classList.add('sidebar-sub-link')
        link.dataset.moduleHref = item.href
        link.innerHTML = `
            <span class="nav-icon">${item.sigla}</span>
            <span class="nav-copy">
                <span>${item.nome}</span>
                <small>${item.descricao}</small>
            </span>
            <span class="nav-indicator"></span>
        `

        return link
    })
    .filter(Boolean)

    if(linksExistentes.length === 0){
        return
    }

    const dropdown =
    document.createElement('div')

    dropdown.className = 'sidebar-dropdown'
    dropdown.dataset.group = config.grupo

    const ativo =
    linksExistentes.some(link => {
        const href =
        link.getAttribute('href')

        return href === paginaAtual
    })

    if(ativo){
        dropdown.classList.add('active')
    }

    dropdown.innerHTML = `
        <button
            class="sidebar-dropdown-toggle"
            type="button"
            aria-expanded="${ativo ? 'true' : 'false'}"
        >
            <span class="nav-icon">${config.sigla}</span>
            <span class="nav-copy">
                <span>${config.titulo}</span>
                <small>${config.descricao}</small>
            </span>
            <span class="dropdown-chevron">v</span>
        </button>

        <div class="sidebar-submenu"></div>
    `

    const primeiroLink =
    linksExistentes[0]

    menu.insertBefore(
        dropdown,
        primeiroLink
    )

    const submenu =
    dropdown.querySelector('.sidebar-submenu')

    linksExistentes.forEach(link => {
        submenu.appendChild(link)
    })

    const toggle =
    dropdown.querySelector('.sidebar-dropdown-toggle')

    toggle.addEventListener('click', () => {
        const aberto =
        dropdown.classList.toggle('active')

        toggle.setAttribute(
            'aria-expanded',
            String(aberto)
        )
    })
}

document.addEventListener(
    'DOMContentLoaded',
    aprimorarSidebar
)

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

    if(sidebar){

        sidebar.classList.toggle(
            'active'
        )
    }

    if(overlay){

        overlay.classList.toggle(
            'active'
        )
    }
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

    if(sidebar){

        sidebar.classList.remove(
            'active'
        )
    }

    if(overlay){

        overlay.classList.remove(
            'active'
        )
    }
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

                Nenhuma notificação

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

        let emoji = 'ðŸš€'

        if(n.tipo === 'critica'){

            emoji = '!ï¸'
        }

        else if(
            n.tipo === 'venda'
        ){

            emoji = 'ðŸ’°'
        }

        else if(
            n.tipo === 'sistema'
        ){

            emoji = 'ðŸ“„'
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
/* NOTIFICACOES PRO */
/* ========================================= */

function montarNotificacoesGlobais(){
    const wrappers =
    document.querySelectorAll('.notification-wrapper')

    wrappers.forEach((wrapper, index) => {
        wrapper.innerHTML = `
            <button
                class="notification-btn"
                type="button"
                onclick="toggleNotifications(event)"
                aria-label="Abrir notificações"
            >
                <span class="notification-symbol">!</span>
                <span class="notification-badge" style="display:none">0</span>
            </button>

            <div
                class="notification-dropdown"
                id="${index === 0 ? 'notification-dropdown' : `notification-dropdown-${index}`}"
            >
                <div class="notification-header">
                    <div>
                        <h3>Notificações</h3>
                        <span id="${index === 0 ? 'notification-count' : `notification-count-${index}`}">0 novas</span>
                    </div>

                    <button
                        class="notification-read-all"
                        type="button"
                        onclick="marcarTodasNotificacoesLidas(event)"
                    >
                        Marcar lidas
                    </button>
                </div>

                <div
                    class="notification-list"
                    id="${index === 0 ? 'notification-list' : `notification-list-${index}`}"
                ></div>
            </div>
        `
    })
}

async function criarNotificacao(
    titulo,
    texto,
    tipo = 'sistema',
    referencia = null,
    extras = {}
){
    if(!titulo || !texto){
        return null
    }

    if(referencia){
        const existente =
        await buscarNotificacaoPorReferencia(referencia)

        if(existente){
            return existente
        }
    }

    const payload = {
        titulo,
        texto,
        tipo,
        visualizada: false,
        referencia,
        ...extras
    }

    let { data, error } = await supabaseClient
    .from('notificacoes')
    .insert([payload])
    .select()

    if(error){
        const payloadBasico = {
            titulo,
            texto,
            tipo,
            visualizada: false
        }

        const fallback = await supabaseClient
        .from('notificacoes')
        .insert([payloadBasico])
        .select()

        data = fallback.data
        error = fallback.error
    }

    if(error){
        console.log(error)
        return null
    }

    await carregarNotificacoes()

    return data?.[0] || null
}

async function buscarNotificacaoPorReferencia(referencia){
    const { data, error } = await supabaseClient
    .from('notificacoes')
    .select('*')
    .eq('referencia', referencia)
    .maybeSingle()

    if(error){
        return null
    }

    return data
}

async function carregarNotificacoes(){
    montarNotificacoesGlobais()

    const { data, error } = await supabaseClient
    .from('notificacoes')
    .select('*')
    .order('created_at', {
        ascending: false
    })
    .limit(20)

    if(error){
        console.log(error)
        renderizarNotificacoes([])
        return
    }

    renderizarNotificacoes(data || [])
}

function renderizarNotificacoes(lista){
    const containers =
    document.querySelectorAll('.notification-list')

    const badges =
    document.querySelectorAll('.notification-badge')

    const contadores =
    document.querySelectorAll('[id^="notification-count"]')

    if(containers.length === 0){
        return
    }

    const naoLidas =
    lista.filter(item => !item.visualizada)

    badges.forEach(badge => {
        badge.style.display =
        naoLidas.length > 0 ? 'flex' : 'none'

        badge.innerText =
        naoLidas.length
    })

    contadores.forEach(contador => {
        contador.innerText =
        `${naoLidas.length} ${naoLidas.length === 1 ? 'nova' : 'novas'}`
    })

    containers.forEach(container => {
        container.innerHTML = ''

        if(lista.length <= 0){
            container.innerHTML = `
                <div class="notification-empty">
                    Nenhuma notificação por enquanto.
                </div>
            `

            return
        }

        lista.forEach(n => {
            const icone =
            obterIconeNotificacao(n.tipo)

            const data =
            new Date(n.created_at || Date.now())

            const hora =
            data.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })

            container.innerHTML += `
                <button
                    class="notification-item ${n.tipo || 'sistema'} ${n.visualizada ? 'lida' : 'nao-lida'}"
                    type="button"
                    onclick="marcarNotificacaoLida(${n.id})"
                >
                    <span class="notification-icon">${icone}</span>

                    <span class="notification-content">
                        <strong>${n.titulo || 'Notificação'}</strong>
                        <p>${n.texto || ''}</p>
                        <small>${hora}</small>
                    </span>
                </button>
            `
        })
    })
}

function obterIconeNotificacao(tipo){
    if(tipo === 'critica') return '!'
    if(tipo === 'venda') return '$'
    if(tipo === 'estoque') return 'E'
    if(tipo === 'caixa') return 'C'
    if(tipo === 'info') return 'i'

    return 'S'
}

function toggleNotifications(event){
    event?.stopPropagation()

    document
    .querySelectorAll('.notification-dropdown')
    .forEach(dropdown => {
        dropdown.classList.toggle('active')
    })
}

async function marcarNotificacaoLida(id){
    let { error } = await supabaseClient
    .from('notificacoes')
    .update({
        visualizada: true,
        lida_em: new Date().toISOString()
    })
    .eq('id', id)

    if(error){
        await supabaseClient
        .from('notificacoes')
        .update({
            visualizada: true
        })
        .eq('id', id)
    }

    carregarNotificacoes()
}

async function marcarTodasNotificacoesLidas(event){
    event?.stopPropagation()

    let { error } = await supabaseClient
    .from('notificacoes')
    .update({
        visualizada: true,
        lida_em: new Date().toISOString()
    })
    .eq('visualizada', false)

    if(error){
        await supabaseClient
        .from('notificacoes')
        .update({
            visualizada: true
        })
        .eq('visualizada', false)
    }

    carregarNotificacoes()
}

function tocarSomNotificacao(){
    try{
        const audio = new Audio(
            'https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3'
        )

        audio.volume = 0.25

        audio.play().catch(() => {})
    }catch(error){
        console.log(error)
    }
}

function animarSino(){
    document
    .querySelectorAll('.notification-btn')
    .forEach(sino => {
        sino.classList.add('shake')

        setTimeout(() => {
            sino.classList.remove('shake')
        }, 700)
    })
}

document.addEventListener(
    'DOMContentLoaded',
    montarNotificacoesGlobais
)

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

        icon.innerHTML = '×'
    }

    else if(tipo === 'warning'){

        toast.classList.add('warning')

        icon.innerHTML = '!'
    }

    else{

        icon.innerHTML = 'OK'
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
    detalhes,
    tabela = null,
    registroId = null,
    metadata = {}
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

    const rpc =
    await supabaseClient
    .rpc('registrar_auditoria_app', {
        p_acao: acao,
        p_detalhes: detalhes,
        p_tabela: tabela,
        p_registro_id: registroId,
        p_metadata: metadata
    })

    if(!rpc.error){
        return
    }

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

/* A inicialização global fica no fim do arquivo para carregar permissões antes de consultar o usuário. */

/* ========================================= */
/* PERMISSOES E MENU DO USUARIO */
/* ========================================= */

const APP_MODULOS = {
    'dashboard.html': {
        chave: 'dashboard',
        nome: 'Dashboard'
    },
    'caixa.html': {
        chave: 'caixa',
        nome: 'Caixa'
    },
    'produtos.html': {
        chave: 'produtos',
        nome: 'Produtos'
    },
    'categorias.html': {
        chave: 'categorias',
        nome: 'Categorias'
    },
    'estoque.html': {
        chave: 'estoque',
        nome: 'Estoque'
    },
    'movimentacoes.html': {
        chave: 'movimentacoes',
        nome: 'Movimentações'
    },
    'vendas.html': {
        chave: 'vendas',
        nome: 'Vendas'
    },
    'relatorios.html': {
        chave: 'relatorios',
        nome: 'Relatórios'
    },
    'usuarios.html': {
        chave: 'usuarios',
        nome: 'Usuários'
    },
    'certificados.html': {
        chave: 'certificados',
        nome: 'Certificados digitais'
    },
    'saude-sistema.html': {
        chave: 'configuracoes',
        nome: 'Saúde do sistema'
    },
    'configuracoes.html': {
        chave: 'configuracoes',
        nome: 'Configurações'
    },
    'tutorial.html': {
        chave: 'tutorial',
        nome: 'Tutorial'
    }
}

function normalizarTextoGlobal(valor){
    return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function usuarioGlobalEhAdmin(usuario){
    const cargo =
    normalizarTextoGlobal(usuario?.cargo)

    return cargo === 'administrador' ||
    cargo === 'admin' ||
    usuario?.admin === true ||
    usuario?.is_admin === true
}

function usuarioPodeAcessar(usuario, chave){
    if(!chave || usuarioGlobalEhAdmin(usuario)){
        return true
    }

    const permissoes =
    usuario?.permissoes || {}

    return permissoes[chave] !== false
}

function aplicarPermissoesGlobais(usuario){
    const paginaAtual =
    window.location.pathname
    .split('/')
    .pop()

    const moduloAtual =
    APP_MODULOS[paginaAtual]

    if(
        moduloAtual &&
        !usuarioPodeAcessar(usuario, moduloAtual.chave)
    ){
        mostrarToast?.(
            'Acesso bloqueado',
            `Seu usuário não tem permissão para ${moduloAtual.nome}.`,
            'error'
        )

        setTimeout(() => {
            window.location.href = 'dashboard.html'
        }, 900)

        return
    }

    document
    .querySelectorAll('.menu a')
    .forEach(link => {
        const href =
        link.getAttribute('href') || ''

        const arquivo =
        href.split('/').pop()

        const modulo =
        APP_MODULOS[arquivo]

        if(
            modulo &&
            !usuarioPodeAcessar(usuario, modulo.chave)
        ){
            link.hidden = true
            link.setAttribute('aria-hidden', 'true')
        }
    })

    atualizarDropdownsSidebar()
}

function atualizarDropdownsSidebar(){
    document
    .querySelectorAll('.sidebar-dropdown')
    .forEach(dropdown => {
        const links =
        Array.from(
            dropdown.querySelectorAll('a')
        )

        const linksVisiveis =
        links.filter(link => !link.hidden)

        dropdown.hidden =
        linksVisiveis.length === 0

        if(linksVisiveis.some(link => link.classList.contains('active'))){
            dropdown.classList.add('active')

            dropdown
            .querySelector('.sidebar-dropdown-toggle')
            ?.setAttribute('aria-expanded', 'true')
        }
    })
}

function montarMenuUsuarioGlobal(){
    document
    .querySelectorAll('.user-profile, .user-box')
    .forEach(box => {
        if(box.dataset.menuUsuario === 'true'){
            return
        }

        box.dataset.menuUsuario = 'true'
        box.setAttribute('tabindex', '0')
        box.setAttribute('role', 'button')
        box.setAttribute('aria-haspopup', 'menu')

        if(!box.closest('.user-menu-wrap')){
            const wrap =
            document.createElement('div')

            wrap.className = 'user-menu-wrap'

            box.parentNode.insertBefore(wrap, box)
            wrap.appendChild(box)
        }

        const wrap =
        box.closest('.user-menu-wrap')

        if(!wrap.querySelector('.user-menu-dropdown')){
            wrap.insertAdjacentHTML(
                'beforeend',
                `
                    <div class="user-menu-dropdown" role="menu">
                        <a href="configuracoes.html" role="menuitem">
                            Configurações
                        </a>

                        <button type="button" onclick="logout()" role="menuitem">
                            Sair
                        </button>
                    </div>
                `
            )
        }

        box.addEventListener('click', toggleUserMenu)

        box.addEventListener('keydown', (event) => {
            if(event.key === 'Enter' || event.key === ' '){
                event.preventDefault()
                toggleUserMenu(event)
            }
        })
    })
}

function toggleUserMenu(event){
    event?.stopPropagation()

    const wrap =
    event?.currentTarget?.closest('.user-menu-wrap') ||
    document.querySelector('.user-menu-wrap')

    if(!wrap){
        return
    }

    document
    .querySelectorAll('.user-menu-wrap.active')
    .forEach(item => {
        if(item !== wrap){
            item.classList.remove('active')
        }
    })

    wrap.classList.toggle('active')
}

document.addEventListener('click', () => {
    document
    .querySelectorAll('.user-menu-wrap.active')
    .forEach(item => item.classList.remove('active'))
})

async function carregarUsuario(){
    const { data: authData } =
    await supabaseClient.auth.getUser()

    if(!authData.user){
        return
    }

    const email =
    authData.user.email

    const { data: usuario } =
    await supabaseClient
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single()

    if(!usuario){
        return
    }

    if(usuario.ativo === false){
        await logout()
        return
    }

    const nome =
    document.getElementById('user-name')

    if(nome){
        nome.innerText = usuario.nome || 'Usuário'
    }

    const cargo =
    document.getElementById('user-cargo')

    if(cargo){
        cargo.innerText = usuario.cargo || 'Funcionário'
    }

    const avatarTopo =
    document.getElementById('top-user-avatar')

    if(avatarTopo && usuario.avatar){
        avatarTopo.src = usuario.avatar
    }

    const avatarPerfil =
    document.getElementById('preview-avatar')

    if(avatarPerfil && usuario.avatar){
        avatarPerfil.src = usuario.avatar
    }

    aplicarPermissoesGlobais(usuario)
    montarMenuUsuarioGlobal()
}

document.addEventListener('DOMContentLoaded', montarMenuUsuarioGlobal)

checkAuth()
carregarUsuario()
carregarNotificacoes()





