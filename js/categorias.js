let categoriasCache = []
let categoriaEditando = null
let categoriaExcluindo = null

function getCategoriaBusca(){
    const input = document.getElementById('buscar-categoria')

    return input ? input.value.trim().toLowerCase() : ''
}

function limparFormularioCategoria(){
    categoriaEditando = null

    document.getElementById('categoria-nome').value = ''
    document.getElementById('categoria-descricao').value = ''
    document.getElementById('form-categoria-titulo').innerText = 'Nova categoria'
    document.getElementById('btn-salvar-categoria').innerText = 'Salvar categoria'
}

function cancelarEdicaoCategoria(){
    limparFormularioCategoria()
}

function renderizarCategorias(){
    const lista = document.getElementById('categorias-lista')
    const contador = document.getElementById('categorias-contador')
    const busca = getCategoriaBusca()

    let categorias = categoriasCache

    if(busca !== ''){
        categorias = categorias.filter(categoria =>
            String(categoria.nome || '').toLowerCase().includes(busca)
            ||
            String(categoria.descricao || '').toLowerCase().includes(busca)
        )
    }

    contador.innerText =
    `${categoriasCache.length} ${categoriasCache.length === 1 ? 'categoria' : 'categorias'}`

    lista.innerHTML = ''

    if(categorias.length === 0){
        lista.innerHTML = `
            <div class="categorias-vazio">
                <strong>Nenhuma categoria encontrada</strong>
                <span>Cadastre uma categoria para usar em produtos e caixa.</span>
            </div>
        `

        return
    }

    categorias.forEach(categoria => {
        const inicial =
        categoria.nome
        ? categoria.nome.trim().charAt(0).toUpperCase()
        : 'C'

        const idSeguro =
        JSON.stringify(String(categoria.id))

        lista.innerHTML += `
            <div class="categoria-card">
                <div class="categoria-card-top">
                    <div class="categoria-identidade">
                        <span class="categoria-avatar">${inicial}</span>

                        <div>
                            <h3>${categoria.nome}</h3>
                        </div>
                    </div>
                </div>

                <p>${categoria.descricao || 'Sem descricao.'}</p>

                <div class="categoria-actions">
                    <button type="button" onclick="editarCategoria(${idSeguro})">
                        Editar
                    </button>

                    <button type="button" class="delete-btn" onclick="abrirPopupExcluirCategoria(${idSeguro})">
                        Excluir
                    </button>
                </div>
            </div>
        `
    })
}

async function carregarCategorias(){
    const lista = document.getElementById('categorias-lista')

    lista.innerHTML = `
        <div class="categorias-vazio">
            <strong>Carregando categorias...</strong>
            <span>Aguarde um instante.</span>
        </div>
    `

    const { data, error } = await supabaseClient
    .from('categorias')
    .select('*')
    .order('nome')

    if(error){
        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao carregar categorias',
            'error'
        )

        return
    }

    categoriasCache = data || []
    renderizarCategorias()
}

async function salvarCategoria(){
    const nome = document.getElementById('categoria-nome').value.trim()
    const descricao = document.getElementById('categoria-descricao').value.trim()
    const btn = document.getElementById('btn-salvar-categoria')

    if(nome === ''){
        mostrarToast(
            'Nome obrigatorio',
            'Informe o nome da categoria',
            'warning'
        )

        return
    }

    btn.disabled = true
    btn.innerText = 'Salvando...'

    const payload = {
        nome,
        descricao
    }

    const query =
    categoriaEditando
    ? supabaseClient.from('categorias').update(payload).eq('id', categoriaEditando)
    : supabaseClient.from('categorias').insert([payload])

    const { error } = await query

    btn.disabled = false
    btn.innerText = categoriaEditando ? 'Salvar alteracoes' : 'Salvar categoria'

    if(error){
        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao salvar categoria',
            'error'
        )

        return
    }

    await registrarAuditoria(
        categoriaEditando ? 'Categoria editada' : 'Categoria criada',
        `Categoria ${nome}`
    )

    mostrarToast(
        'Categoria salva',
        'Categoria disponivel para produtos e caixa'
    )

    limparFormularioCategoria()
    carregarCategorias()
}

function editarCategoria(id){
    const categoria =
    categoriasCache.find(item =>
        String(item.id) === String(id)
    )

    if(!categoria) return

    categoriaEditando = id

    document.getElementById('categoria-nome').value = categoria.nome || ''
    document.getElementById('categoria-descricao').value = categoria.descricao || ''
    document.getElementById('form-categoria-titulo').innerText = 'Editar categoria'
    document.getElementById('btn-salvar-categoria').innerText = 'Salvar alteracoes'

    document
    .querySelector('.categoria-form-box')
    ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    })
}

function abrirPopupExcluirCategoria(id){
    categoriaExcluindo = id

    document
    .getElementById('popup-excluir-categoria')
    .classList.add('ativo')
}

function fecharPopupExcluirCategoria(){
    document
    .getElementById('popup-excluir-categoria')
    .classList.remove('ativo')
}

async function confirmarExclusaoCategoria(){
    const { error } = await supabaseClient
    .from('categorias')
    .delete()
    .eq('id', categoriaExcluindo)

    if(error){
        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao excluir categoria',
            'error'
        )

        return
    }

    await registrarAuditoria(
        'Categoria excluida',
        `Categoria #${categoriaExcluindo}`
    )

    fecharPopupExcluirCategoria()
    limparFormularioCategoria()

    mostrarToast(
        'Categoria excluida',
        'A categoria foi removida'
    )

    carregarCategorias()
}

document.addEventListener(
    'DOMContentLoaded',
    () => {
        const busca = document.getElementById('buscar-categoria')

        if(busca){
            busca.addEventListener('input', renderizarCategorias)
        }

        carregarCategorias()
    }
)
