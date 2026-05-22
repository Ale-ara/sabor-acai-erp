let produtoEditando = null
let produtoExcluindo = null
let produtosCache = []
let categoriasCache = []
let categoriaAtual = 'Todos'
let imagemAtualEditando = ''

const PRODUTOS_BUCKET = 'produtos'
const FOTO_PADRAO = '../assets/logo.png'

/* =========================
   CATEGORIAS
========================= */

async function carregarCategorias(){
    const { data, error } = await supabaseClient
    .from('categorias')
    .select('*')
    .order('nome')

    if(error){
        console.log(error)

        mostrarToast(
            'Categorias',
            'Cadastre categorias na pagina Categorias',
            'warning'
        )

        categoriasCache = []
    }else{
        categoriasCache = data || []
    }

    preencherSelectCategorias('categoria')
    preencherSelectCategorias('edit-categoria')
    renderizarFiltros()
}

function preencherSelectCategorias(selectId, valorSelecionado = ''){
    const select = document.getElementById(selectId)

    if(!select) return

    select.innerHTML = `
        <option value="">
            Selecione uma categoria
        </option>
    `

    categoriasCache.forEach(categoria => {
        select.innerHTML += `
            <option value="${categoria.nome}">
                ${categoria.nome}
            </option>
        `
    })

    select.value = valorSelecionado
}

function renderizarFiltros(){
    const filtrosContainer =
    document.getElementById('filtros-categorias')

    if(!filtrosContainer) return

    const categorias =
    categoriasCache.length > 0
    ? categoriasCache.map(categoria => categoria.nome)
    : [
        ...new Set(
            produtosCache
            .map(produto => produto.categoria)
            .filter(Boolean)
        )
    ]

    filtrosContainer.innerHTML = `
        <button
            class="filtro ${categoriaAtual === 'Todos' ? 'ativo' : ''}"
            onclick="filtrarCategoria('Todos')"
        >
            Todos
        </button>
    `

    categorias.forEach(categoria => {
        const categoriaSegura =
        String(categoria).replace(/'/g, "\\'")

        filtrosContainer.innerHTML += `
            <button
                class="filtro ${categoriaAtual === categoria ? 'ativo' : ''}"
                onclick="filtrarCategoria('${categoriaSegura}')"
            >
                ${categoria}
            </button>
        `
    })
}

/* =========================
   IMAGENS
========================= */

function configurarPreviewImagem(inputId, previewId){
    const input = document.getElementById(inputId)
    const preview = document.getElementById(previewId)

    if(!input || !preview) return

    input.addEventListener('change', () => {
        const file = input.files[0]

        if(!file) return

        const reader = new FileReader()

        reader.onload = event => {
            preview.src = event.target.result
        }

        reader.readAsDataURL(file)
    })
}

async function uploadProdutoImagem(inputId){
    const input = document.getElementById(inputId)

    if(!input || !input.files || input.files.length === 0){
        return null
    }

    const file = input.files[0]
    const extensao = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${extensao}`

    const { error: uploadError } = await supabaseClient
    .storage
    .from(PRODUTOS_BUCKET)
    .upload(fileName, file)

    if(uploadError){
        console.log(uploadError)

        mostrarToast(
            'Erro',
            uploadError.message || 'Erro ao enviar foto do produto',
            'error'
        )

        throw uploadError
    }

    const { data } = supabaseClient
    .storage
    .from(PRODUTOS_BUCKET)
    .getPublicUrl(fileName)

    return data.publicUrl || null
}

function limparFotoCadastro(){
    const input = document.getElementById('produto-foto')
    const preview = document.getElementById('preview-produto-foto')

    if(input) input.value = ''
    if(preview) preview.src = FOTO_PADRAO
}

/* =========================
   POPUP
========================= */

function abrirPopup(icone, titulo, texto){
    const popup = document.getElementById('popup-sucesso')

    if(!popup) return

    popup.querySelector('.popup-icone').innerHTML = icone
    popup.querySelector('h2').innerText = titulo
    popup.querySelector('p').innerText = texto
    popup.classList.add('ativo')
}

function fecharPopup(){
    document
    .getElementById('popup-sucesso')
    .classList.remove('ativo')
}

/* =========================
   HELPERS
========================= */

function limparFormulario(){
    document.getElementById('nome').value = ''
    document.getElementById('preco').value = ''
    document.getElementById('categoria').value = ''
    document.getElementById('estoque').value = ''
    limparFotoCadastro()
}

function obterProdutosFiltrados(){
    const buscaInput = document.getElementById('buscar-produtos')
    const busca = buscaInput ? buscaInput.value.trim().toLowerCase() : ''

    let produtos = produtosCache

    if(categoriaAtual !== 'Todos'){
        produtos = produtos.filter(produto =>
            produto.categoria === categoriaAtual
        )
    }

    if(busca !== ''){
        produtos = produtos.filter(produto =>
            String(produto.nome || '').toLowerCase().includes(busca)
            ||
            String(produto.categoria || '').toLowerCase().includes(busca)
        )
    }

    return produtos
}

function atualizarResumoProdutos(){
    const totalProdutos = document.getElementById('total-produtos')
    const totalEstoque = document.getElementById('total-estoque')
    const totalCriticos = document.getElementById('total-criticos')

    if(!totalProdutos) return

    totalProdutos.innerText = produtosCache.length

    totalEstoque.innerText =
    produtosCache.reduce((total, produto) =>
        total + Number(produto.estoque || 0),
        0
    )

    totalCriticos.innerText =
    produtosCache.filter(produto =>
        Number(produto.estoque || 0) <= 3
    ).length
}

/* =========================
   SALVAR PRODUTO
========================= */

async function salvarProduto(){
    const btn = document.getElementById('btn-salvar')

    btn.disabled = true
    btn.innerText = 'Salvando...'

    const nome = document.getElementById('nome').value.trim()
    const preco = document.getElementById('preco').value
    const categoria = document.getElementById('categoria').value
    const estoque = document.getElementById('estoque').value

    if(nome === '' || preco === '' || categoria === '' || estoque === ''){
        mostrarToast(
            'Campos obrigatorios',
            'Preencha todos os campos',
            'warning'
        )

        btn.disabled = false
        btn.innerText = '+ Salvar Produto'

        return
    }

    let imagem = null

    try{
        imagem = await uploadProdutoImagem('produto-foto')
    }catch(error){
        btn.disabled = false
        btn.innerText = '+ Salvar Produto'

        return
    }

    const payload = {
        nome,
        preco,
        categoria,
        estoque
    }

    if(imagem){
        payload.imagem = imagem
    }

    const { data, error } = await supabaseClient
    .from('produtos')
    .insert([payload])
    .select()

    btn.disabled = false
    btn.innerText = '+ Salvar Produto'

    if(error){
        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao salvar produto',
            'error'
        )

        return
    }

    await registrarAuditoria(
        'Produto criado',
        `Produto ${nome} foi adicionado`
    )

    if(Number(estoque) <= 3){
        await criarNotificacaoEstoque(data[0])
    }

    limparFormulario()

    abrirPopup(
        'OK',
        'Produto cadastrado!',
        'O produto foi salvo com sucesso.'
    )

    listarProdutos()
}

/* =========================
   NOTIFICACAO ESTOQUE
========================= */

async function criarNotificacaoEstoque(produto){
    if(typeof criarNotificacao === 'function'){
        await criarNotificacao(
            'Estoque critico',
            `${produto.nome} esta acabando`,
            'critica',
            `produto-${produto.id}`
        )

        return
    }

    const { data: existente } = await supabaseClient
    .from('notificacoes')
    .select('*')
    .eq('referencia', `produto-${produto.id}`)
    .maybeSingle()

    if(!existente){
        await supabaseClient
        .from('notificacoes')
        .insert([
            {
                titulo: 'Estoque critico',
                texto: `${produto.nome} esta acabando`,
                tipo: 'critica',
                referencia: `produto-${produto.id}`
            }
        ])
    }
}

/* =========================
   LISTAR PRODUTOS
========================= */

async function listarProdutos(){
    const lista = document.getElementById('lista-produtos')

    lista.innerHTML = `
        <div class="produtos-vazio">
            <strong>Carregando produtos...</strong>
            <span>Aguarde um instante.</span>
        </div>
    `

    const { data, error } = await supabaseClient
    .from('produtos')
    .select('*')
    .order('id', {
        ascending:false
    })

    if(error){
        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao carregar produtos',
            'error'
        )

        return
    }

    produtosCache = data || []

    atualizarResumoProdutos()
    renderizarFiltros()
    renderizarProdutos(obterProdutosFiltrados())
}

/* =========================
   RENDERIZAR PRODUTOS
========================= */

function renderizarProdutos(data){
    const lista = document.getElementById('lista-produtos')

    lista.innerHTML = ''

    if(data.length === 0){
        lista.innerHTML = `
            <div class="produtos-vazio">
                <strong>Nenhum produto encontrado</strong>
                <span>Ajuste a busca ou selecione outra categoria.</span>
            </div>
        `

        return
    }

    data.forEach(produto => {
        const estoque = Number(produto.estoque || 0)
        const preco = Number(produto.preco || 0)
        const imagem = produto.imagem || ''

        const statusEstoque =
        estoque <= 0
        ? 'sem-estoque'
        : estoque <= 3
        ? 'critico'
        : 'ok'

        const statusTexto =
        statusEstoque === 'sem-estoque'
        ? 'Sem estoque'
        : statusEstoque === 'critico'
        ? 'Estoque critico'
        : 'Disponivel'

        const inicial =
        produto.nome
        ? produto.nome.trim().charAt(0).toUpperCase()
        : 'P'

        lista.innerHTML += `
            <div class="produto">
                <div class="produto-imagem">
                    ${
                        imagem
                        ? `<img src="${imagem}" alt="${produto.nome}">`
                        : `<span>${inicial}</span>`
                    }
                </div>

                <div class="produto-topo">
                    <div class="produto-identidade">
                        <div>
                            <h3>${produto.nome}</h3>
                            <small>${produto.categoria}</small>
                        </div>
                    </div>

                    <div class="produto-acoes">
                        <button
                            class="edit-btn"
                            type="button"
                            title="Editar produto"
                            onclick="abrirEdicao(${produto.id})"
                        >
                            Editar
                        </button>

                        <button
                            class="edit-btn delete-btn"
                            type="button"
                            title="Excluir produto"
                            onclick="excluirProduto(${produto.id})"
                        >
                            Excluir
                        </button>
                    </div>
                </div>

                <div class="produto-detalhes">
                    <div>
                        <span>Preco</span>
                        <strong>R$ ${preco.toFixed(2)}</strong>
                    </div>

                    <div>
                        <span>Estoque</span>
                        <strong>${estoque}</strong>
                    </div>
                </div>

                <span class="produto-status ${statusEstoque}">
                    ${statusTexto}
                </span>
            </div>
        `
    })
}

/* =========================
   FILTRAR CATEGORIA
========================= */

function filtrarCategoria(categoria){
    categoriaAtual = categoria

    renderizarFiltros()
    renderizarProdutos(obterProdutosFiltrados())
}

/* =========================
   EXCLUIR
========================= */

function excluirProduto(id){
    produtoExcluindo = id

    document
    .getElementById('popup-excluir')
    .classList.add('ativo')
}

function fecharPopupExcluir(){
    document
    .getElementById('popup-excluir')
    .classList.remove('ativo')
}

async function confirmarExclusao(){
    try{
        const { error } = await supabaseClient
        .from('produtos')
        .delete()
        .eq('id', produtoExcluindo)

        if(error){
            console.log(error)

            mostrarToast(
                'Erro',
                'Erro ao excluir produto',
                'error'
            )

            return
        }

        fecharPopupExcluir()

        setTimeout(() => {
            abrirPopup(
                'OK',
                'Produto excluido!',
                'O produto foi removido.'
            )
        }, 250)

        listarProdutos()

    }catch(err){
        console.log(err)

        mostrarToast(
            'Erro',
            'Erro inesperado',
            'error'
        )
    }
}

/* =========================
   EDITAR
========================= */

function abrirEdicao(id){
    const produto =
    produtosCache.find(item =>
        Number(item.id) === Number(id)
    )

    if(!produto){
        mostrarToast(
            'Produto não encontrado',
            'Atualize a lista e tente novamente',
            'warning'
        )

        return
    }

    produtoEditando = id
    imagemAtualEditando = produto.imagem || ''

    preencherSelectCategorias('edit-categoria', produto.categoria)

    document.getElementById('edit-nome').value = produto.nome
    document.getElementById('edit-preco').value = produto.preco
    document.getElementById('edit-estoque').value = produto.estoque
    document.getElementById('edit-foto').value = ''
    document.getElementById('preview-edit-foto').src = produto.imagem || FOTO_PADRAO

    document
    .getElementById('modal-editar')
    .classList.add('active')
}

function fecharEdicao(){
    document
    .getElementById('modal-editar')
    .classList.remove('active')
}

async function salvarEdicao(){
    const nome = document.getElementById('edit-nome').value.trim()
    const preco = document.getElementById('edit-preco').value
    const categoria = document.getElementById('edit-categoria').value
    const estoque = document.getElementById('edit-estoque').value

    if(nome === '' || preco === '' || categoria === '' || estoque === ''){
        mostrarToast(
            'Campos obrigatorios',
            'Preencha todos os campos',
            'warning'
        )

        return
    }

    let novaImagem = null

    try{
        novaImagem = await uploadProdutoImagem('edit-foto')
    }catch(error){
        return
    }

    const payload = {
        nome,
        preco,
        categoria,
        estoque
    }

    if(novaImagem || imagemAtualEditando){
        payload.imagem = novaImagem || imagemAtualEditando
    }

    const { data, error } = await supabaseClient
    .from('produtos')
    .update(payload)
    .eq('id', produtoEditando)
    .select()
    .single()

    if(error){
        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao editar produto',
            'error'
        )

        return
    }

    await registrarAuditoria(
        'Produto editado',
        `Produto ${nome} atualizado`
    )

    if(Number(estoque) <= 3){
        await criarNotificacaoEstoque(data)
    }

    fecharEdicao()

    abrirPopup(
        'OK',
        'Produto atualizado!',
        'Alteracoes salvas.'
    )

    listarProdutos()
}

/* =========================
   INICIAR
========================= */

document.addEventListener(
    'DOMContentLoaded',
    async () => {
        configurarPreviewImagem('produto-foto', 'preview-produto-foto')
        configurarPreviewImagem('edit-foto', 'preview-edit-foto')

        const busca = document.getElementById('buscar-produtos')

        if(busca){
            busca.addEventListener(
                'input',
                () => renderizarProdutos(obterProdutosFiltrados())
            )
        }

        await carregarCategorias()
        listarProdutos()
    }
)
