const MODULOS_PERMISSAO = [
    {
        chave: 'dashboard',
        nome: 'Dashboard',
        descricao: 'Resumo da loja'
    },
    {
        chave: 'caixa',
        nome: 'Caixa',
        descricao: 'PDV e fechamento'
    },
    {
        chave: 'produtos',
        nome: 'Produtos',
        descricao: 'Catálogo e preços'
    },
    {
        chave: 'categorias',
        nome: 'Categorias',
        descricao: 'Organização do cardapio'
    },
    {
        chave: 'estoque',
        nome: 'Estoque',
        descricao: 'Saldos e mínimos'
    },
    {
        chave: 'movimentacoes',
        nome: 'Movimentações',
        descricao: 'Entradas e saídas'
    },
    {
        chave: 'vendas',
        nome: 'Vendas',
        descricao: 'Histórico de pedidos'
    },
    {
        chave: 'relatorios',
        nome: 'Relatórios',
        descricao: 'Análises e indicadores'
    },
    {
        chave: 'usuarios',
        nome: 'Usuários',
        descricao: 'Perfis e acessos'
    },
    {
        chave: 'configuracoes',
        nome: 'Configurações',
        descricao: 'Dados da loja'
    },
    {
        chave: 'tutorial',
        nome: 'Tutorial',
        descricao: 'Guia do sistema'
    }
]

let usuarioAtual = null
let usuariosCadastrados = []
let usuarioEditandoId = null

function normalizarTexto(valor){
    return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function ehAdministrador(usuario){
    const cargo =
    normalizarTexto(usuario?.cargo)

    return cargo === 'administrador' ||
    cargo === 'admin' ||
    usuario?.admin === true ||
    usuario?.is_admin === true
}

function permissoesPadrao(valor = true){
    return MODULOS_PERMISSAO.reduce((acc, modulo) => {
        acc[modulo.chave] = valor
        return acc
    }, {})
}

function permissoesDoFormulario(){
    return MODULOS_PERMISSAO.reduce((acc, modulo) => {
        const input =
        document.getElementById(`perm-${modulo.chave}`)

        acc[modulo.chave] =
        Boolean(input?.checked)

        return acc
    }, {})
}

function aplicarPermissoesNoFormulario(permissoes = {}){
    MODULOS_PERMISSAO.forEach(modulo => {
        const input =
        document.getElementById(`perm-${modulo.chave}`)

        if(input){
            input.checked =
            permissoes[modulo.chave] !== false
        }
    })
}

function montarPermissoes(){
    const grid =
    document.getElementById('permissions-grid')

    if(!grid){
        return
    }

    grid.innerHTML =
    MODULOS_PERMISSAO.map(modulo => `
        <label class="permission-card">
            <input type="checkbox" id="perm-${modulo.chave}" checked>
            <span>
                <strong>${modulo.nome}</strong>
                <small>${modulo.descricao}</small>
            </span>
        </label>
    `).join('')
}

async function carregarUsuario(){
    const { data: authData } =
    await supabaseClient.auth.getUser()

    if(!authData.user){
        window.location.href = '../index.html'
        return
    }

    const { data: usuario, error } =
    await supabaseClient
    .from('usuarios')
    .select('*')
    .eq('email', authData.user.email)
    .single()

    if(error || !usuario){
        console.log(error)
        mostrarToast('Perfil não encontrado', 'Não foi possível carregar seu usuário.', 'error')
        return
    }

    if(usuario.ativo === false){
        await logout()
        return
    }

    usuarioAtual = usuario

    preencherPerfil(usuario)
    configurarAreaAdministrativa()
}

function preencherPerfil(usuario){
    const campos = {
        'user-name': usuario.nome || 'Usuário',
        'user-cargo': usuario.cargo || 'Funcionário',
        nome: usuario.nome || '',
        usuario: usuario.usuario || '',
        email: usuario.email || ''
    }

    Object.entries(campos).forEach(([id, valor]) => {
        const el =
        document.getElementById(id)

        if(el){
            if('value' in el){
                el.value = valor
            }else{
                el.innerText = valor
            }
        }
    })

    if(usuario.avatar){
        const preview =
        document.getElementById('preview-avatar')

        const topo =
        document.getElementById('top-user-avatar')

        if(preview) preview.src = usuario.avatar
        if(topo) topo.src = usuario.avatar
    }
}

async function configurarAreaAdministrativa(){
    const adminPanel =
    document.getElementById('admin-panel')

    const adminLocked =
    document.getElementById('admin-locked')

    const admin =
    ehAdministrador(usuarioAtual)

    if(adminPanel){
        adminPanel.hidden = !admin
    }

    if(adminLocked){
        adminLocked.hidden = admin
    }

    if(admin){
        montarPermissoes()
        aplicarPermissoesNoFormulario(permissoesPadrao(true))
        await carregarUsuarios()
    }
}

async function salvarPerfil(){
    if(!usuarioAtual){
        return
    }

    const payload = {
        nome: document.getElementById('nome').value.trim(),
        usuario: document.getElementById('usuario').value.trim(),
        email: document.getElementById('email').value.trim()
    }

    if(!payload.nome || !payload.usuario || !payload.email){
        mostrarToast('Campos obrigatórios', 'Preencha nome, usuário e e-mail.', 'warning')
        return
    }

    const { error } =
    await supabaseClient
    .from('usuarios')
    .update(payload)
    .eq('id', usuarioAtual.id)

    if(error){
        console.log(error)
        mostrarToast('Erro', 'Erro ao salvar perfil.', 'error')
        return
    }

    usuarioAtual = {
        ...usuarioAtual,
        ...payload
    }

    preencherPerfil(usuarioAtual)
    mostrarToast('Perfil atualizado', 'Dados salvos com sucesso.')
}

async function alterarSenha(){
    const senha =
    document.getElementById('nova-senha').value

    const confirmar =
    document.getElementById('confirmar-senha').value

    if(!senha || !confirmar){
        mostrarToast('Campos vazios', 'Digite a nova senha.', 'warning')
        return
    }

    if(senha !== confirmar){
        mostrarToast('Senhas diferentes', 'Confirme a senha corretamente.', 'warning')
        return
    }

    if(senha.length < 6){
        mostrarToast('Senha fraca', 'Use no mínimo 6 caracteres.', 'warning')
        return
    }

    const { error } =
    await supabaseClient.auth.updateUser({
        password: senha
    })

    if(error){
        console.log(error)
        mostrarToast('Erro', 'Erro ao atualizar senha.', 'error')
        return
    }

    document.getElementById('nova-senha').value = ''
    document.getElementById('confirmar-senha').value = ''

    mostrarToast('Senha alterada', 'Senha atualizada com sucesso.')
}

async function carregarUsuarios(){
    const { data, error } =
    await supabaseClient
    .from('usuarios')
    .select('*')
    .order('nome', {
        ascending: true
    })

    if(error){
        console.log(error)
        mostrarToast('Erro', 'Não foi possível carregar a equipe.', 'error')
        return
    }

    usuariosCadastrados = data || []
    renderizarUsuarios()
}

function renderizarUsuarios(){
    const lista =
    document.getElementById('usuarios-lista')

    const contador =
    document.getElementById('usuarios-count')

    if(!lista){
        return
    }

    const busca =
    normalizarTexto(document.getElementById('buscar-usuario')?.value)

    const filtrados =
    usuariosCadastrados.filter(usuario => {
        const texto =
        normalizarTexto(`${usuario.nome} ${usuario.usuario} ${usuario.email} ${usuario.cargo}`)

        return texto.includes(busca)
    })

    if(contador){
        contador.innerText =
        `${filtrados.length} ${filtrados.length === 1 ? 'usuário' : 'usuários'}`
    }

    if(filtrados.length === 0){
        lista.innerHTML = `
            <div class="empty-state">
                Nenhum usuário encontrado.
            </div>
        `
        return
    }

    lista.innerHTML =
    filtrados.map(usuario => {
        const admin =
        ehAdministrador(usuario)

        const permissoes =
        usuario.permissoes || {}

        const modulos =
        admin
        ? 'Todos os modulos'
        : MODULOS_PERMISSAO
            .filter(modulo => permissoes[modulo.chave] !== false)
            .map(modulo => modulo.nome)
            .join(', ')

        return `
            <article class="usuario-row">
                <div class="usuario-row-main">
                    <img src="${usuario.avatar || '../assets/logo.png'}" alt="${usuario.nome || 'Usuário'}">

                    <div>
                        <strong>${usuario.nome || 'Sem nome'}</strong>
                        <span>${usuario.usuario || 'sem-usuario'} - ${usuario.email || 'sem email'}</span>
                        <small>${modulos || 'Sem permissões liberadas'}</small>
                    </div>
                </div>

                <div class="usuario-row-side">
                    <span class="role-pill ${admin ? 'admin' : ''}">
                        ${usuario.cargo || 'Funcionário'}
                    </span>

                    <span class="status-pill ${usuario.ativo === false ? 'off' : 'on'}">
                        ${usuario.ativo === false ? 'Inativo' : 'Ativo'}
                    </span>

                    <button type="button" onclick="editarUsuario('${usuario.id}')">
                        Editar
                    </button>

                    <button class="danger-btn" type="button" onclick="excluirUsuario('${usuario.id}')">
                        Excluir
                    </button>
                </div>
            </article>
        `
    }).join('')
}

function editarUsuario(id){
    const usuario =
    usuariosCadastrados.find(item => String(item.id) === String(id))

    if(!usuario){
        return
    }

    usuarioEditandoId = usuario.id

    document.getElementById('form-title').innerText = 'Editar usuário'
    document.getElementById('admin-nome').value = usuario.nome || ''
    document.getElementById('admin-usuario').value = usuario.usuario || ''
    document.getElementById('admin-email').value = usuario.email || ''
    document.getElementById('admin-cargo').value = usuario.cargo || 'Funcionario'
    document.getElementById('admin-senha').value = ''
    document.getElementById('admin-senha').placeholder = 'Preencha apenas para trocar'
    document.getElementById('admin-ativo').checked = usuario.ativo !== false

    aplicarPermissoesNoFormulario(
        ehAdministrador(usuario)
        ? permissoesPadrao(true)
        : usuario.permissoes || permissoesPadrao(true)
    )

    document
    .querySelector('.usuario-editor')
    ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    })
}

function limparFormularioUsuario(){
    usuarioEditandoId = null

    document.getElementById('form-title').innerText = 'Novo usuário'
    document.getElementById('admin-nome').value = ''
    document.getElementById('admin-usuario').value = ''
    document.getElementById('admin-email').value = ''
    document.getElementById('admin-cargo').value = 'Funcionario'
    document.getElementById('admin-senha').value = ''
    document.getElementById('admin-senha').placeholder = 'Obrigatoria ao criar'
    document.getElementById('admin-ativo').checked = true

    aplicarPermissoesNoFormulario(permissoesPadrao(true))
}

async function salvarUsuarioAdmin(){
    if(!ehAdministrador(usuarioAtual)){
        mostrarToast('Sem permissão', 'Apenas administradores podem salvar usuários.', 'error')
        return
    }

    const payload = {
        id: usuarioEditandoId,
        nome: document.getElementById('admin-nome').value.trim(),
        usuario: document.getElementById('admin-usuario').value.trim(),
        email: document.getElementById('admin-email').value.trim(),
        cargo: document.getElementById('admin-cargo').value,
        senha: document.getElementById('admin-senha').value,
        ativo: document.getElementById('admin-ativo').checked,
        permissoes: permissoesDoFormulario()
    }

    if(!payload.nome || !payload.usuario || !payload.email){
        mostrarToast('Campos obrigatórios', 'Preencha nome, usuário e e-mail.', 'warning')
        return
    }

    if(!usuarioEditandoId && payload.senha.length < 6){
        mostrarToast('Senha obrigatoria', 'A senha inicial precisa ter no mínimo 6 caracteres.', 'warning')
        return
    }

    const admin =
    normalizarTexto(payload.cargo) === 'administrador'

    if(admin){
        payload.permissoes = permissoesPadrao(true)
    }

    const { error } =
    await supabaseClient.rpc('admin_salvar_usuario_app', {
        usuario_payload: payload
    })

    if(error){
        console.log(error)
        mostrarToast(
            'SQL de usuários pendente',
            'Rode o script sql/supabase_upgrade_pro.sql no Supabase para habilitar criacao e edicao de logins.',
            'error'
        )
        return
    }

    mostrarToast('Usuário salvo', 'A equipe foi atualizada com sucesso.')
    limparFormularioUsuario()
    await carregarUsuarios()
}

async function excluirUsuario(id){
    if(!ehAdministrador(usuarioAtual)){
        mostrarToast('Sem permissão', 'Apenas administradores podem excluir usuários.', 'error')
        return
    }

    if(String(id) === String(usuarioAtual.id)){
        mostrarToast('Ação bloqueada', 'Você não pode excluir sua própria conta logada.', 'warning')
        return
    }

    const usuario =
    usuariosCadastrados.find(item => String(item.id) === String(id))

    const confirmar =
    window.confirm(`Excluir ${usuario?.nome || 'este usuário'}? Esta ação remove o acesso de login.`)

    if(!confirmar){
        return
    }

    const { error } =
    await supabaseClient.rpc('admin_excluir_usuario_app', {
        usuario_id: id
    })

    if(error){
        console.log(error)
        mostrarToast(
            'SQL de usuários pendente',
            'Rode o script sql/supabase_upgrade_pro.sql no Supabase para habilitar exclusao de logins.',
            'error'
        )
        return
    }

    mostrarToast('Usuário excluido', 'O acesso foi removido.')

    if(String(usuarioEditandoId) === String(id)){
        limparFormularioUsuario()
    }

    await carregarUsuarios()
}

const avatarInput =
document.getElementById('avatar-input')

if(avatarInput){
    avatarInput.addEventListener('change', async (event) => {
        const file =
        event.target.files[0]

        if(!file || !usuarioAtual){
            return
        }

        const reader =
        new FileReader()

        reader.onload = (ev) => {
            const preview =
            document.getElementById('preview-avatar')

            const topo =
            document.getElementById('top-user-avatar')

            if(preview) preview.src = ev.target.result
            if(topo) topo.src = ev.target.result
        }

        reader.readAsDataURL(file)

        const fileName =
        `${Date.now()}-${file.name}`

        const { error: uploadError } =
        await supabaseClient
        .storage
        .from('avatars')
        .upload(fileName, file)

        if(uploadError){
            console.log(uploadError)
            mostrarToast('Erro', 'Erro ao enviar foto.', 'error')
            return
        }

        const { data } =
        supabaseClient
        .storage
        .from('avatars')
        .getPublicUrl(fileName)

        const avatar =
        data.publicUrl

        const { error } =
        await supabaseClient
        .from('usuarios')
        .update({
            avatar
        })
        .eq('id', usuarioAtual.id)

        if(error){
            console.log(error)
            mostrarToast('Erro', 'Erro ao salvar foto.', 'error')
            return
        }

        usuarioAtual.avatar = avatar
        mostrarToast('Foto atualizada', 'Avatar salvo com sucesso.')
    })
}

carregarUsuario()




