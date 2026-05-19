let carrinho = []

let categoriaAtual = 'todos'

let produtos = []

let categoriasCaixa = []

let caixaAtual = null

const CAIXA_ATUAL_KEY = 'caixaAtual'

const CAIXA_HISTORICO_KEY = 'historicoCaixas'

const CAIXA_RELATORIO_IMPRESSAO_KEY = 'ultimoRelatorioCaixa'

/* =========================
   CONTROLE DE CAIXA
========================= */

function formatarMoeda(valor){
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

function obterTotalCarrinho(){
    return carrinho.reduce((total, item) =>
        total + Number(item.preco || 0), 0
    )
}

function carregarCaixaAtual(){
    const caixaSalvo = localStorage.getItem(CAIXA_ATUAL_KEY)

    try{
        caixaAtual = caixaSalvo ? JSON.parse(caixaSalvo) : null
    }catch(error){
        caixaAtual = null
        localStorage.removeItem(CAIXA_ATUAL_KEY)
    }

    if(caixaAtual && !caixaAtual.totais){
        caixaAtual.totais = {
            dinheiro: 0,
            pix: 0,
            cartao: 0,
            total: 0
        }
    }

    if(caixaAtual && !Array.isArray(caixaAtual.vendas)){
        caixaAtual.vendas = []
    }
}

function salvarCaixaAtual(){
    if(!caixaAtual) return

    localStorage.setItem(
        CAIXA_ATUAL_KEY,
        JSON.stringify(caixaAtual)
    )
}

function caixaEstaAberto(){
    return caixaAtual && caixaAtual.status === 'aberto'
}

function obterDinheiroEsperado(){
    if(!caixaEstaAberto()) return 0

    return Number(caixaAtual.saldoInicial || 0)
    + Number(caixaAtual.totais.dinheiro || 0)
}

function renderizarCaixa(){
    const status = document.getElementById('caixa-status')
    const titulo = document.getElementById('caixa-titulo')
    const detalhes = document.getElementById('caixa-detalhes')
    const saldoInicial = document.getElementById('caixa-saldo-inicial')
    const totalVendas = document.getElementById('caixa-total-vendas')
    const dinheiroEsperado = document.getElementById('caixa-dinheiro-esperado')
    const btnAbrir = document.getElementById('btn-abrir-caixa')
    const btnFechar = document.getElementById('btn-fechar-caixa')

    if(!status) return

    if(!caixaEstaAberto()){
        document.body.classList.remove('caixa-aberto')
        document.body.classList.add('caixa-fechado')

        status.innerText = 'Caixa fechado'
        status.classList.remove('aberto')
        status.classList.add('fechado')

        titulo.innerText = 'Abra o caixa para iniciar as vendas'
        detalhes.innerText = 'Nenhum turno ativo no momento.'

        saldoInicial.innerText = formatarMoeda(0)
        totalVendas.innerText = formatarMoeda(0)
        dinheiroEsperado.innerText = formatarMoeda(0)

        btnAbrir.disabled = false
        btnFechar.disabled = true

        return
    }

    const abertura = new Date(caixaAtual.abertoEm)

    document.body.classList.remove('caixa-fechado')
    document.body.classList.add('caixa-aberto')

    status.innerText = 'Caixa aberto'
    status.classList.remove('fechado')
    status.classList.add('aberto')

    titulo.innerText =
    `Turno iniciado as ${abertura.toLocaleTimeString('pt-BR')}`

    detalhes.innerText =
    `${caixaAtual.vendas.length} venda(s) registradas neste caixa.`

    saldoInicial.innerText = formatarMoeda(caixaAtual.saldoInicial)
    totalVendas.innerText = formatarMoeda(caixaAtual.totais.total)
    dinheiroEsperado.innerText = formatarMoeda(obterDinheiroEsperado())

    btnAbrir.disabled = true
    btnFechar.disabled = false
}

function abrirModalAberturaCaixa(){
    if(caixaEstaAberto()) return

    document.getElementById('saldo-inicial-caixa').value = ''

    document
    .getElementById('modal-abertura-caixa')
    .classList.add('ativo')
}

function fecharModalAberturaCaixa(){
    document
    .getElementById('modal-abertura-caixa')
    .classList.remove('ativo')
}

function confirmarAberturaCaixa(){
    const saldoInicial = Number(
        document.getElementById('saldo-inicial-caixa').value || 0
    )

    if(saldoInicial < 0){
        mostrarToast(
            'Saldo invalido',
            'Informe um valor maior ou igual a zero',
            'warning'
        )

        return
    }

    caixaAtual = {
        id: `caixa-${Date.now()}`,
        status: 'aberto',
        abertoEm: new Date().toISOString(),
        saldoInicial,
        vendas: [],
        totais: {
            dinheiro: 0,
            pix: 0,
            cartao: 0,
            total: 0
        }
    }

    salvarCaixaAtual()
    renderizarCaixa()
    fecharModalAberturaCaixa()
    salvarRelatorioCaixaImpressao('abertura', caixaAtual)

    mostrarToast(
        'Caixa aberto',
        `Saldo inicial ${formatarMoeda(saldoInicial)}`
    )

    abrirPopupImpressaoCaixa('abertura')
}

function abrirModalFechamentoCaixa(){
    if(!caixaEstaAberto()) return

    const dinheiroEsperado = obterDinheiroEsperado()

    document.getElementById('dinheiro-contado-caixa').value =
    dinheiroEsperado.toFixed(2)

    document.getElementById('observacao-fechamento-caixa').value = ''

    document.getElementById('resumo-fechamento-caixa').innerText =
    `Total vendido: ${formatarMoeda(caixaAtual.totais.total)} | ` +
    `Dinheiro: ${formatarMoeda(caixaAtual.totais.dinheiro)} | ` +
    `Pix: ${formatarMoeda(caixaAtual.totais.pix)} | ` +
    `Cartao: ${formatarMoeda(caixaAtual.totais.cartao)}`

    atualizarDiferencaFechamento()

    document
    .getElementById('modal-fechamento-caixa')
    .classList.add('ativo')
}

function fecharModalFechamentoCaixa(){
    document
    .getElementById('modal-fechamento-caixa')
    .classList.remove('ativo')
}

function atualizarDiferencaFechamento(){
    if(!caixaEstaAberto()) return

    const dinheiroContado = Number(
        document.getElementById('dinheiro-contado-caixa').value || 0
    )

    const diferenca = dinheiroContado - obterDinheiroEsperado()

    document.getElementById('diferenca-fechamento-caixa').innerText =
    formatarMoeda(diferenca)
}

function confirmarFechamentoCaixa(){
    if(!caixaEstaAberto()) return

    const dinheiroContado = Number(
        document.getElementById('dinheiro-contado-caixa').value || 0
    )

    if(dinheiroContado < 0){
        mostrarToast(
            'Valor invalido',
            'Informe um valor maior ou igual a zero',
            'warning'
        )

        return
    }

    const caixaFechado = {
        ...caixaAtual,
        status: 'fechado',
        fechadoEm: new Date().toISOString(),
        dinheiroEsperado: obterDinheiroEsperado(),
        dinheiroContado,
        diferenca: dinheiroContado - obterDinheiroEsperado(),
        observacao:
        document.getElementById('observacao-fechamento-caixa').value.trim()
    }

    const historico = JSON.parse(
        localStorage.getItem(CAIXA_HISTORICO_KEY) || '[]'
    )

    historico.unshift(caixaFechado)

    localStorage.setItem(
        CAIXA_HISTORICO_KEY,
        JSON.stringify(historico)
    )

    salvarRelatorioCaixaImpressao('fechamento', caixaFechado)

    localStorage.removeItem(CAIXA_ATUAL_KEY)
    caixaAtual = null

    fecharModalFechamentoCaixa()
    renderizarCaixa()

    mostrarToast(
        'Caixa fechado',
        `Diferenca ${formatarMoeda(caixaFechado.diferenca)}`
    )

    abrirPopupImpressaoCaixa('fechamento')
}

function registrarVendaNoCaixa(
    vendaId,
    total,
    formaPagamento,
    valorRecebido
){
    if(!caixaEstaAberto()) return

    const pagamento = formaPagamento.toLowerCase()

    const chavePagamento =
    pagamento.includes('pix')
    ? 'pix'
    : pagamento.includes('cart')
    ? 'cartao'
    : 'dinheiro'

    caixaAtual.vendas.push({
        vendaId,
        total,
        formaPagamento,
        valorRecebido,
        itens: carrinho.map(item => ({
            id: item.id,
            nome: item.nome,
            preco: item.preco
        })),
        data: new Date().toISOString()
    })

    caixaAtual.totais[chavePagamento] += total
    caixaAtual.totais.total += total

    salvarCaixaAtual()
    renderizarCaixa()
}

function salvarRelatorioCaixaImpressao(tipo, caixa){
    if(!caixa) return

    localStorage.setItem(
        CAIXA_RELATORIO_IMPRESSAO_KEY,
        JSON.stringify({
            tipo,
            caixa,
            geradoEm: new Date().toISOString()
        })
    )
}

function abrirPopupImpressaoCaixa(tipo){
    const popup = document.getElementById('popup-impressao-caixa')
    const titulo = document.getElementById('popup-impressao-caixa-titulo')
    const texto = document.getElementById('popup-impressao-caixa-texto')

    if(!popup) return

    if(tipo === 'fechamento'){
        titulo.innerText = 'Imprimir fechamento do caixa?'
        texto.innerText =
        'Deseja imprimir o resumo com os valores e tudo vendido no turno?'
    }else{
        titulo.innerText = 'Imprimir abertura do caixa?'
        texto.innerText = 'Deseja imprimir o comprovante de abertura do caixa?'
    }

    popup.classList.add('ativo')
}

function fecharPopupImpressaoCaixa(){
    document
    .getElementById('popup-impressao-caixa')
    .classList.remove('ativo')
}

function imprimirRelatorioCaixa(){
    window.open(
        'impressao-caixa.html',
        '_blank'
    )

    fecharPopupImpressaoCaixa()
}

/* =========================
   NOTIFICAÇÃO
========================= */

async function criarNotificacaoVenda(
    total
){

    if(typeof criarNotificacao === 'function'){

        await criarNotificacao(
            'Nova venda',
            `Pedido de ${formatarMoeda(total)}`,
            'venda',
            `venda-${Date.now()}`
        )

        return
    }

    await supabaseClient
    .from('notificacoes')
    .insert([
        {
            titulo: 'Nova venda',
            texto: `Pedido de R$ ${total.toFixed(2)}`,
            tipo: 'venda',
            visualizada: false
        }
    ])
}

function agruparCarrinhoPorProduto(){
    return carrinho.reduce((itens, item) => {
        const chave = item.id

        if(!itens[chave]){
            itens[chave] = {
                id: item.id,
                nome: item.nome,
                preco: Number(item.preco || 0),
                quantidade: 0,
                subtotal: 0
            }
        }

        itens[chave].quantidade += 1
        itens[chave].subtotal += Number(item.preco || 0)

        return itens
    }, {})
}

async function obterNomeUsuarioAtual(){
    const {
        data: { session }
    } = await supabaseClient
    .auth
    .getSession()

    if(!session){
        return 'Usuario'
    }

    const { data: usuario } = await supabaseClient
    .from('usuarios')
    .select('nome')
    .eq('id', session.user.id)
    .maybeSingle()

    return usuario?.nome || session.user.email || 'Usuario'
}

async function registrarItensVenda(vendaId){
    const itensAgrupados =
    Object.values(agruparCarrinhoPorProduto())

    const itensPayload =
    itensAgrupados.map(item => ({
        venda_id: vendaId,
        produto_id: item.id,
        nome_produto: item.nome,
        preco: item.preco,
        quantidade: item.quantidade,
        subtotal: item.subtotal
    }))

    let { error } = await supabaseClient
    .from('itens_venda')
    .insert(itensPayload)

    if(error){
        const payloadBasico =
        carrinho.map(item => ({
            venda_id: vendaId,
            produto_id: item.id,
            nome_produto: item.nome,
            preco: item.preco
        }))

        const fallback = await supabaseClient
        .from('itens_venda')
        .insert(payloadBasico)

        error = fallback.error
    }

    if(error){
        throw error
    }
}

async function baixarEstoqueVenda(vendaId){
    const itensAgrupados =
    Object.values(agruparCarrinhoPorProduto())

    const usuario =
    await obterNomeUsuarioAtual()

    for(const item of itensAgrupados){
        const produtoAtual =
        produtos.find(produto => String(produto.id) === String(item.id))

        if(!produtoAtual){
            continue
        }

        const estoqueAnterior =
        Number(produtoAtual.estoque || 0)

        const estoqueFinal =
        Math.max(estoqueAnterior - item.quantidade, 0)

        const { error } = await supabaseClient
        .from('produtos')
        .update({
            estoque: estoqueFinal
        })
        .eq('id', item.id)

        if(error){
            throw error
        }

        let movimento = await supabaseClient
        .from('movimentacoes_estoque')
        .insert([
            {
                produto: item.nome,
                produto_id: item.id,
                venda_id: vendaId,
                tipo: 'saida',
                quantidade: item.quantidade,
                estoque_anterior: estoqueAnterior,
                estoque_final: estoqueFinal,
                motivo: 'Venda realizada',
                usuario,
                referencia: `venda-${vendaId}-produto-${item.id}`
            }
        ])

        if(movimento.error){
            await supabaseClient
            .from('movimentacoes_estoque')
            .insert([
                {
                    produto: item.nome,
                    tipo: 'saida',
                    quantidade: item.quantidade,
                    estoque_final: estoqueFinal,
                    motivo: 'Venda realizada',
                    usuario
                }
            ])
        }

        if(estoqueFinal <= Number(produtoAtual.estoque_minimo || 3)){
            await criarNotificacao(
                'Estoque critico',
                `${item.nome} ficou com ${estoqueFinal} unidade(s)`,
                'critica',
                `estoque-${item.id}-${estoqueFinal}`
            )
        }
    }
}

/* =========================
   IMPRESSÃO
========================= */

function salvarUltimaVenda(
    vendaId,
    total,
    formaPagamento,
    valorRecebido
){

    localStorage.setItem(

        'ultimaVenda',

        JSON.stringify({

            vendaId,

            itens: carrinho,

            total,

            pagamento: formaPagamento,

            recebido: valorRecebido,

            troco: valorRecebido - total,

            data: new Date().toLocaleString()

        })
    )
}

/* =========================
   POPUP IMPRESSÃO
========================= */

function abrirPopupImpressao(){

    document

    .getElementById(
        'popup-impressao'
    )

    .classList.add('ativo')
}

function fecharPopupImpressao(){

    document

    .getElementById(
        'popup-impressao'
    )

    .classList.remove('ativo')
}

/* =========================
   OPÇÕES IMPRESSÃO
========================= */

function mostrarOpcoesImpressao(){

    fecharPopupImpressao()

    document

    .getElementById(
        'popup-opcoes-impressao'
    )

    .classList.add('ativo')
}

function fecharOpcoesImpressao(){

    document

    .getElementById(
        'popup-opcoes-impressao'
    )

    .classList.remove('ativo')
}

/* =========================
   ABRIR IMPRESSÕES
========================= */

function abrirImpressaoA4(){

    window.open(
        'impressao-a4.html',
        '_blank'
    )

    fecharOpcoesImpressao()
}

function abrirImpressaoTermica(){

    window.open(
        'impressao-termica.html',
        '_blank'
    )

    fecharOpcoesImpressao()
}

/* =========================
   FILTRO CATEGORIA
========================= */

function filtrarCategoria(categoria){

    categoriaAtual = categoria.toLowerCase()

    document

    .querySelectorAll('.filtro-btn')

    .forEach(btn => {

        btn.classList.remove('ativo')

        if(btn.dataset.categoria.toLowerCase() === categoriaAtual){

            btn.classList.add('ativo')
        }
    })

    renderizarProdutos()
}

async function carregarCategoriasCaixa(){

    const { data, error } = await supabaseClient
    .from('categorias')
    .select('*')
    .order('nome')

    if(error){
        console.log(error)

        categoriasCaixa = [
            ...new Set(
                produtos
                .map(produto => produto.categoria)
                .filter(Boolean)
            )
        ]
    }else{
        categoriasCaixa =
        (data || []).map(categoria => categoria.nome)
    }

    renderizarCategoriasCaixa()
}

function renderizarCategoriasCaixa(){

    const container =
    document.querySelector('.filtros-categorias')

    if(!container) return

    container.innerHTML = `
        <button
            onclick="filtrarCategoria('todos')"
            data-categoria="todos"
            class="filtro-btn ${categoriaAtual === 'todos' ? 'ativo' : ''}"
        >
            Todos
        </button>
    `

    categoriasCaixa.forEach(categoria => {

        const categoriaSegura =
        String(categoria).replace(/'/g, "\\'")

        container.innerHTML += `
            <button
                onclick="filtrarCategoria('${categoriaSegura}')"
                data-categoria="${categoria}"
                class="filtro-btn ${categoriaAtual === String(categoria).toLowerCase() ? 'ativo' : ''}"
            >
                ${categoria}
            </button>
        `
    })
}

/* =========================
   FILTRAR PRODUTOS
========================= */

function filtrarProdutos(){

    renderizarProdutos()
}

/* =========================
   RENDERIZAR PRODUTOS
========================= */

function renderizarProdutos(){

    const grid =

    document.getElementById(
        'produtos-grid'
    )

    grid.innerHTML = ''

    const busca =

    document

    .getElementById(
        'buscar-produto'
    )

    .value

    .toLowerCase()

    let filtrados = produtos

    /* FILTRO CATEGORIA */

    if(categoriaAtual !== 'todos'){

        filtrados = filtrados.filter(produto =>

            produto.categoria
            .toLowerCase()

            === categoriaAtual
        )
    }

    /* FILTRO BUSCA */

    if(busca !== ''){

        filtrados = filtrados.filter(produto =>

            produto.nome

            .toLowerCase()

            .includes(busca)
        )
    }

    if(filtrados.length === 0){

        grid.innerHTML = `

            <div class="produtos-vazio">

                <strong>
                    Nenhum produto encontrado
                </strong>

                <span>
                    Ajuste a busca ou selecione outra categoria.
                </span>

            </div>

        `

        return
    }

    /* RENDERIZA */

    filtrados.forEach(produto => {

        const estoque =
        Number(produto.estoque || 0)

        const inicial =
        produto.nome
        ? produto.nome.trim().charAt(0).toUpperCase()
        : 'P'

        const idSeguro =
        JSON.stringify(String(produto.id))

        const nomeSeguro =
        JSON.stringify(String(produto.nome || ''))

        const imagem =
        produto.imagem || ''

        grid.innerHTML += `

            <div class="produto">

                <div class="produto-topo">

                    <span class="produto-icone">
                        ${
                            imagem
                            ? `<img src="${imagem}" alt="${produto.nome}">`
                            : inicial
                        }
                    </span>

                    <span class="produto-estoque ${
                        estoque <= 0
                        ? 'sem-estoque'
                        : ''
                    }">
                        ${estoque} un.
                    </span>

                </div>

                <h3>
                    ${produto.nome}
                </h3>

                <p class="produto-categoria">
                    ${produto.categoria}
                </p>

                <strong class="produto-preco">
                    R$ ${Number(produto.preco)
                    .toFixed(2)}
                </strong>

                <button
                    ${estoque <= 0 ? 'disabled' : ''}
                    onclick="adicionarCarrinho(
                    ${idSeguro},
                    ${nomeSeguro},
                    ${Number(produto.preco)}
                )">

                    ${estoque <= 0 ? 'Sem estoque' : 'Adicionar'}

                </button>

            </div>

        `
    })
}

/* =========================
   CARREGAR PRODUTOS
========================= */

async function carregarProdutos(){

    const {

        data,

        error

    } = await supabaseClient

    .from('produtos')

    .select('*')

    .order('nome')

    if(error){

        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao carregar produtos',
            'error'
        )

        return
    }

    produtos = data

    await carregarCategoriasCaixa()

    renderizarProdutos()
}

/* =========================
   BUSCA INPUT
========================= */

document

.addEventListener(

    'DOMContentLoaded',

    () => {

        const busca =

        document.getElementById(
            'buscar-produto'
        )

        if(busca){

            busca.addEventListener(
                'input',
                filtrarProdutos
            )
        }
    }
)

/* =========================
   CARRINHO
========================= */

function adicionarCarrinho(
    id,
    nome,
    preco
){

    if(!caixaEstaAberto()){

        mostrarToast(
            'Caixa fechado',
            'Abra o caixa antes de vender',
            'warning'
        )

        return
    }

    carrinho.push({

        id,
        nome,
        preco

    })

    renderizarCarrinho()

    mostrarToast(
        'Carrinho',
        `${nome} adicionado`
    )
}

function renderizarCarrinho(){

    const area =

    document.getElementById(
        'itens-carrinho'
    )

    const contador =
    document.getElementById(
        'contador-itens'
    )

    area.innerHTML = ''

    let total = 0

    if(contador){
        contador.innerText =
        `${carrinho.length} ${carrinho.length === 1 ? 'item' : 'itens'}`
    }

    if(carrinho.length === 0){

        area.innerHTML = `

            <div class="carrinho-vazio">

                <strong>
                    Pedido vazio
                </strong>

                <span>
                    Toque em um produto para adicionar ao pedido.
                </span>

            </div>

        `
    }

    carrinho.forEach((item, index) => {

        total += item.preco

        area.innerHTML += `

            <div class="item">

                <div class="item-topo">

                    <h4>
                        ${item.nome}
                    </h4>

                    <button 
                        class="remove-btn"
                        onclick="removerItem(${index})"
                    >
                        ×
                    </button>

                </div>

                <p>
                    R$ ${item.preco.toFixed(2)}
                </p>

            </div>

        `
    })

    document.getElementById(
        'total'
    ).innerText =

    `R$ ${total.toFixed(2)}`

    calcularTroco()
}

function removerItem(index){

    carrinho.splice(index, 1)

    renderizarCarrinho()
}

/* =========================
   TROCO
========================= */

function calcularTroco(){

    const valorRecebido =

    Number(

        document.getElementById(
            'valor-recebido'
        ).value
    )

    const totalTexto =

    document.getElementById(
        'total'
    ).innerText

    const total =

    Number(

        totalTexto

        .replace('R$', '')

        .replace(',', '.')
    )

    const troco =

    valorRecebido - total

    document.getElementById(
        'troco'
    ).innerText =

    troco >= 0

    ? `R$ ${troco.toFixed(2)}`

    : 'Valor insuficiente'
}

/* =========================
   FINALIZAR VENDA
========================= */

async function finalizarVenda(){

    if(carrinho.length === 0){

        mostrarToast(
            'Carrinho vazio',
            'Adicione produtos',
            'warning'
        )

        return
    }

    if(!caixaEstaAberto()){

        mostrarToast(
            'Caixa fechado',
            'Abra o caixa antes de finalizar vendas',
            'warning'
        )

        return
    }

    let total = obterTotalCarrinho()

    const formaPagamento =

    document.getElementById(
        'forma-pagamento'
    ).value

    const valorRecebido =

    Number(

        document.getElementById(
            'valor-recebido'
        ).value
    )

    if(

        formaPagamento === 'Dinheiro'

        &&

        valorRecebido < total
    ){

        mostrarToast(
            'Valor insuficiente',
            'Confira o valor recebido',
            'warning'
        )

        return
    }

    const {

        data: venda,

        error: erroVenda

    } = await supabaseClient

    .from('vendas')

    .insert([

        {
            total: total,
            status: 'ativa'
        }

    ])

    .select()

    if(erroVenda){

        console.log(erroVenda)

        mostrarToast(
            'Erro',
            'Erro ao finalizar venda',
            'error'
        )

        return
    }

    const vendaId = venda[0].id

    try{

        await registrarItensVenda(
            vendaId
        )

        await baixarEstoqueVenda(
            vendaId
        )

        await registrarAuditoria(
            'Venda realizada',
            `Venda #${vendaId} finalizada em ${formatarMoeda(total)}`
        )

    }catch(error){

        console.log(error)

        await supabaseClient
        .from('vendas')
        .update({
            status: 'cancelada',
            motivo_cancelamento: 'Falha ao registrar itens ou estoque'
        })
        .eq('id', vendaId)

        mostrarToast(
            'Erro ao finalizar',
            'A venda foi cancelada porque os itens ou estoque nao foram salvos',
            'error'
        )

        return
    }

    salvarUltimaVenda(
        vendaId,
        total,
        formaPagamento,
        valorRecebido
    )

    registrarVendaNoCaixa(
        vendaId,
        total,
        formaPagamento,
        valorRecebido
    )

    await criarNotificacaoVenda(
        total
    )

    carregarProdutos()

    document

    .getElementById(
        'popup-sucesso'
    )

    .classList.add('ativo')

    mostrarToast(
        'Venda finalizada',
        `Pedido R$ ${total.toFixed(2)}`
    )

    carrinho = []

    renderizarCarrinho()

    document.getElementById(
        'valor-recebido'
    ).value = ''

    document.getElementById(
        'troco'
    ).innerText = 'R$ 0,00'

    setTimeout(() => {

        abrirPopupImpressao()

    }, 500)
}

/* =========================
   POPUP
========================= */

function fecharPopup(){

    document

    .getElementById(
        'popup-sucesso'
    )

    .classList.remove('ativo')
}

/* =========================
   USUÁRIO
========================= */

async function carregarUsuario(){

    const { data: authData } =

    await supabaseClient
    .auth
    .getUser()

    const email =

    authData.user.email

    const { data: usuario } =

    await supabaseClient

    .from('usuarios')

    .select('*')

    .eq('email', email)

    .single()

    document.getElementById(
        'user-name'
    ).innerText =

    usuario.nome

    document.getElementById(
        'user-cargo'
    ).innerText =

    usuario.cargo
}

/* =========================
   LOGOUT
========================= */

async function logout(){

    await supabaseClient
    .auth
    .signOut()

    window.location.href =
    '../index.html'
}

/* =========================
   INICIAR
========================= */

carregarCaixaAtual()

renderizarCaixa()

carregarProdutos()

carregarUsuario()
