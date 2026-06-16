let carrinho = []

let categoriaAtual = 'todos'

let produtos = []

let categoriasCaixa = []

let caixaAtual = null

let vendaEmAndamento = false

const CAIXA_ATUAL_KEY = 'caixaAtual'

const CAIXA_HISTORICO_KEY = 'historicoCaixas'

const CAIXA_RELATORIO_IMPRESSAO_KEY = 'ultimoRelatorioCaixa'

const CONFIG_LOJA_KEY = 'configuracoesLoja'

const PRINT_CONFIG_KEY = 'configuracoesImpressaoElectron'

/* =========================
   CONTROLE DE CAIXA
========================= */

function formatarMoeda(valor){
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

function carregarJsonLocal(chave){
    try{
        return JSON.parse(localStorage.getItem(chave) || '{}')
    }catch(error){
        return {}
    }
}

function escaparHtml(valor){
    return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function obterTotalCarrinho(){
    return carrinho.reduce((total, item) =>
        total + Number(item.preco || 0), 0
    )
}

function valorCampo(id){
    return Number(document.getElementById(id)?.value || 0)
}

function estaPagamentoDividido(){
    return Boolean(document.getElementById('dividir-pagamento')?.checked)
}

function obterDadosPagamento(){
    const total =
    obterTotalCarrinho()

    if(!estaPagamentoDividido()){
        const formaPagamento =
        document.getElementById('forma-pagamento')?.value || 'Dinheiro'

        const valorRecebidoInput =
        valorCampo('valor-recebido')

        const valorRecebido =
        formaPagamento === 'Dinheiro'
        ? valorRecebidoInput
        : total

        const totalPago =
        formaPagamento === 'Dinheiro'
        ? Math.min(valorRecebido, total)
        : total

        const troco =
        formaPagamento === 'Dinheiro'
        ? Math.max(valorRecebido - total, 0)
        : 0

        return {
            dividido: false,
            total,
            formaPagamento,
            formaPagamento1: formaPagamento,
            valor1: total,
            formaPagamento2: '',
            valor2: 0,
            valorRecebidoDinheiro: formaPagamento === 'Dinheiro' ? valorRecebido : 0,
            valorRecebido,
            totalPago,
            falta: Math.max(total - totalPago, 0),
            troco,
            quitado: total > 0 && totalPago >= total && (
                formaPagamento !== 'Dinheiro' || valorRecebido >= total
            )
        }
    }

    const formaPagamento1 =
    document.getElementById('split-forma-1')?.value || 'Pix'

    const formaPagamento2 =
    document.getElementById('split-forma-2')?.value || 'Dinheiro'

    const valor1 =
    Math.min(
        Math.max(valorCampo('split-valor-1'), 0),
        total
    )

    const valor2 =
    Math.max(total - valor1, 0)

    const dinheiroNaSegunda =
    formaPagamento2 === 'Dinheiro'

    const recebidoDinheiro =
    dinheiroNaSegunda
    ? valorCampo('split-dinheiro-recebido')
    : 0

    const valor2Quitado =
    dinheiroNaSegunda
    ? recebidoDinheiro >= valor2
    : true

    const troco =
    dinheiroNaSegunda
    ? Math.max(recebidoDinheiro - valor2, 0)
    : 0

    const totalPago =
    valor1 + (valor2Quitado ? valor2 : Math.max(recebidoDinheiro, 0))

    return {
        dividido: true,
        total,
        formaPagamento: `${formaPagamento1} + ${formaPagamento2}`,
        formaPagamento1,
        valor1,
        formaPagamento2,
        valor2,
        valorRecebidoDinheiro: recebidoDinheiro,
        valorRecebido: valor1 + (dinheiroNaSegunda ? recebidoDinheiro : valor2),
        totalPago,
        falta: Math.max(total - Math.min(totalPago, total), 0),
        troco,
        quitado: total > 0 && valor1 >= 0 && valor2Quitado && valor1 + valor2 >= total
    }
}

function obterBotaoFinalizarVenda(){
    return document.getElementById('btn-finalizar-venda')
}

function obterChavePagamentoCaixa(formaPagamento){
    const texto =
    String(formaPagamento || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

    if(texto.includes('pix')){
        return 'pix'
    }

    if(
        texto.includes('cart') ||
        texto.includes('credito') ||
        texto.includes('debito')
    ){
        return 'cartao'
    }

    return 'dinheiro'
}

function definirVendaEmAndamento(ativo){
    vendaEmAndamento = ativo

    const botao =
    obterBotaoFinalizarVenda()

    if(!botao){
        return
    }

    if(ativo){
        botao.disabled = true
    }else{
        const pagamento =
        obterDadosPagamento()

        botao.disabled =
        carrinho.length === 0 ||
        !caixaEstaAberto() ||
        !pagamento.quitado
    }

    botao.innerText = ativo ? 'Finalizando...' : 'Finalizar Venda'
}

async function garantirSessaoVenda(){
    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession()

    if(error || !session){
        mostrarToast(
            'Sessão expirada',
            'Entre novamente para finalizar a venda.',
            'warning'
        )

        setTimeout(() => {
            window.location.href = '../index.html'
        }, 1200)

        return null
    }

    return session
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
    valorRecebido,
    pagamento = null
){
    if(!caixaEstaAberto()) return

    const pagamentoTexto = formaPagamento.toLowerCase()

    const chavePagamento =
    pagamentoTexto.includes('pix')
    ? 'pix'
    : pagamentoTexto.includes('cart') ||
    pagamentoTexto.includes('crédito') ||
    pagamentoTexto.includes('débito') ||
    pagamentoTexto.includes('credito') ||
    pagamentoTexto.includes('debito')
    ? 'cartao'
    : 'dinheiro'

    caixaAtual.vendas.push({
        vendaId,
        total,
        formaPagamento,
        valorRecebido,
        pagamentoDetalhado: pagamento,
        itens: carrinho.map(item => ({
            id: item.id,
            nome: item.nome,
            preco: item.preco
        })),
        data: new Date().toISOString()
    })

    if(pagamento?.dividido){
        const chavePagamento1 =
        obterChavePagamentoCaixa(pagamento.formaPagamento1)

        const chavePagamento2 =
        obterChavePagamentoCaixa(pagamento.formaPagamento2)

        caixaAtual.totais[chavePagamento1] +=
        Number(pagamento.valor1 || 0)

        caixaAtual.totais[chavePagamento2] +=
        Number(pagamento.valor2 || 0)
    }else{
        caixaAtual.totais[chavePagamento] += total
    }

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
    try{

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
    }catch(error){
        console.log('Notificacao da venda nao foi criada', error)
    }
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

    const produtosAtuais = {}

    for(const item of itensAgrupados){
        const {
            data: produtoAtual,
            error: erroProduto
        } = await supabaseClient
        .from('produtos')
        .select('*')
        .eq('id', item.id)
        .single()

        if(erroProduto || !produtoAtual){
            throw new Error(`${item.nome} nao foi encontrado no estoque.`)
        }

        const estoqueAnterior =
        Number(produtoAtual.estoque || 0)

        const estoqueFinal =
        estoqueAnterior - item.quantidade

        if(estoqueFinal < 0){
            throw new Error(`${item.nome} nao possui estoque suficiente.`)
        }

        produtosAtuais[item.id] = produtoAtual
    }

    for(const item of itensAgrupados){
        const produtoAtual =
        produtosAtuais[item.id]

        const estoqueAnterior =
        Number(produtoAtual.estoque || 0)

        const estoqueFinal =
        estoqueAnterior - item.quantidade

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
            try{
                await criarNotificacao(
                    'Estoque critico',
                    `${item.nome} ficou com ${estoqueFinal} unidade(s)`,
                    'critica',
                    `estoque-${item.id}-${estoqueFinal}`
                )
            }catch(error){
                console.log('Notificacao de estoque nao foi criada', error)
            }
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
    valorRecebido,
    pagamento = null
){

    localStorage.setItem(

        'ultimaVenda',

        JSON.stringify({

            vendaId,

            itens: carrinho,

            total,

            pagamento: formaPagamento,
            pagamentoDetalhado: pagamento,

            recebido: valorRecebido,

            troco: pagamento?.troco ?? valorRecebido - total,

            data: new Date().toLocaleString()

        })
    )
}

/* =========================
   POPUP IMPRESSÃO
========================= */

async function imprimirVendaSilenciosaElectron(){
    if(!window.electronERP?.isElectron){
        return false
    }

    const printConfig =
    carregarJsonLocal(PRINT_CONFIG_KEY)

    if(!printConfig.impressao_silenciosa){
        return false
    }

    const configLoja =
    carregarJsonLocal(CONFIG_LOJA_KEY)

    const page =
    configLoja.impressao_padrao === 'a4'
    ? 'impressao-a4.html'
    : 'impressao-termica.html'

    try{
        await window.electronERP.imprimirSilencioso({
            page,
            deviceName: printConfig.impressora_nome || '',
            data: localStorage.getItem('ultimaVenda') || ''
        })

        mostrarToast(
            'Impresso',
            'Comprovante enviado para a impressora.'
        )

        return true
    }catch(error){
        console.log(error)

        mostrarToast(
            'Falha ao imprimir',
            error.message || 'Confira a impressora configurada.',
            'error'
        )

        return false
    }
}

async function abrirPopupImpressao(){

    const impressoSilencioso =
    await imprimirVendaSilenciosaElectron()

    if(impressoSilencioso){
        return
    }

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

function configurarAcoesProdutosCaixa(){
    const grid =
    document.getElementById('produtos-grid')

    if(!grid) return

    grid.addEventListener('click', event => {
        const botao =
        event.target.closest('.adicionar-produto-btn')

        if(!botao || botao.disabled) return

        const id =
        botao.dataset.produtoId

        const produto =
        produtos.find(item =>
            String(item.id) === String(id)
        )

        if(!produto){
            mostrarToast(
                'Produto nao encontrado',
                'Atualize a pagina e tente novamente',
                'warning'
            )

            return
        }

        adicionarCarrinho(
            String(produto.id),
            produto.nome,
            Number(produto.preco || 0)
        )
    })
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
        escaparHtml(produto.id)

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
                    type="button"
                    class="adicionar-produto-btn"
                    data-produto-id="${idSeguro}"
                    ${estoque <= 0 ? 'disabled' : ''}
                >

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

        configurarAcoesProdutosCaixa()
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

    atualizarPagamento()
}

function removerItem(index){

    carrinho.splice(index, 1)

    renderizarCarrinho()
}

/* =========================
   TROCO
========================= */

function calcularTroco(){
    atualizarPagamento()
}

function atualizarTexto(id, valor){
    const elemento =
    document.getElementById(id)

    if(elemento){
        elemento.innerText = valor
    }
}

function atualizarValorInput(id, valor){
    const elemento =
    document.getElementById(id)

    if(elemento){
        elemento.value = Number(valor || 0).toFixed(2)
    }
}

function atualizarPagamento(){
    const dados =
    obterDadosPagamento()

    const dividido =
    dados.dividido

    const recebidoSimples =
    document.getElementById('pagamento-simples-recebido')

    if(recebidoSimples){
        recebidoSimples.hidden =
        dividido || dados.formaPagamento !== 'Dinheiro'
    }

    const dinheiroSegundaBox =
    document.getElementById('split-dinheiro-recebido-box')

    if(dinheiroSegundaBox){
        dinheiroSegundaBox.hidden =
        !(dividido && dados.formaPagamento2 === 'Dinheiro')
    }

    if(dividido){
        const valor1Input =
        document.getElementById('split-valor-1')

        if(valor1Input && valorCampo('split-valor-1') > dados.total){
            valor1Input.value = dados.total.toFixed(2)
        }

        atualizarValorInput('split-valor-2', dados.valor2)
    }

    atualizarTexto(
        'split-restante',
        formatarMoeda(dados.valor2 || dados.falta)
    )

    atualizarTexto('summary-total', formatarMoeda(dados.total))
    atualizarTexto('summary-pago-1', formatarMoeda(dados.dividido ? dados.valor1 : dados.totalPago))
    atualizarTexto('summary-pago-2', formatarMoeda(dados.dividido ? dados.valor2 : 0))
    atualizarTexto('summary-total-pago', formatarMoeda(Math.min(dados.totalPago, dados.total)))
    atualizarTexto('summary-falta', formatarMoeda(dados.falta))
    atualizarTexto('summary-troco', formatarMoeda(dados.troco))

    atualizarTexto(
        'troco',
        dados.falta > 0
        ? 'Valor insuficiente'
        : formatarMoeda(dados.troco)
    )

    const botao =
    obterBotaoFinalizarVenda()

    if(botao && !vendaEmAndamento){
        botao.disabled =
        carrinho.length === 0 || !caixaEstaAberto() || !dados.quitado
    }
}

function alternarPagamentoDividido(){
    const card =
    document.getElementById('split-payment-card')

    if(card){
        card.hidden = !estaPagamentoDividido()
    }

    atualizarPagamento()
}

/* =========================
   FINALIZAR VENDA
========================= */

async function finalizarVenda(){

    if(vendaEmAndamento){
        return
    }

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

    const session =
    await garantirSessaoVenda()

    if(!session){
        return
    }

    definirVendaEmAndamento(true)

    let total = obterTotalCarrinho()

    const pagamento =
    obterDadosPagamento()

    if(!pagamento.quitado){

        mostrarToast(
            'Valor insuficiente',
            'Confira os valores do pagamento',
            'warning'
        )

        definirVendaEmAndamento(false)

        return
    }

    const vendaPayload = {
        total: total,
        status: 'ativa',
        forma_pagamento: pagamento.formaPagamento,
        valor_recebido: pagamento.valorRecebido || total,
        troco: pagamento.troco,
        pagamento_dividido: pagamento.dividido,
        forma_pagamento_1: pagamento.formaPagamento1,
        valor_pagamento_1: pagamento.valor1,
        forma_pagamento_2: pagamento.formaPagamento2 || null,
        valor_pagamento_2: pagamento.valor2 || 0,
        valor_recebido_dinheiro: pagamento.valorRecebidoDinheiro || 0,
        usuario: session.user.email
    }

    let {
        data: venda,
        error: erroVenda
    } = await supabaseClient
    .from('vendas')
    .insert([vendaPayload])
    .select()

    if(erroVenda){
        const fallback =
        await supabaseClient
        .from('vendas')
        .insert([
            {
                total: total,
                status: 'ativa'
            }
        ])
        .select()

        venda = fallback.data
        erroVenda = fallback.error
    }

    if(erroVenda){

        console.log(erroVenda)

        mostrarToast(
            'Erro',
            'Erro ao finalizar venda',
            'error'
        )

        definirVendaEmAndamento(false)

        return
    }

    const vendaId = venda?.[0]?.id

    if(!vendaId){
        mostrarToast(
            'Erro',
            'A venda foi criada, mas o retorno veio incompleto. Atualize a tela.',
            'error'
        )

        definirVendaEmAndamento(false)

        return
    }

    try{

        await registrarItensVenda(
            vendaId
        )

        await baixarEstoqueVenda(
            vendaId
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
            error.message || 'A venda foi cancelada porque os itens ou estoque nao foram salvos',
            'error'
        )

        definirVendaEmAndamento(false)

        return
    }

    try{
        await registrarAuditoria(
            'Venda realizada',
            `Venda #${vendaId} finalizada em ${formatarMoeda(total)}`
        )
    }catch(error){
        console.log('Auditoria da venda nao foi registrada', error)
    }

    salvarUltimaVenda(
        vendaId,
        total,
        pagamento.formaPagamento,
        pagamento.valorRecebido,
        pagamento
    )

    registrarVendaNoCaixa(
        vendaId,
        total,
        pagamento.formaPagamento,
        pagamento.valorRecebido,
        pagamento
    )

    criarNotificacaoVenda(
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

    document.getElementById('split-valor-1').value = ''
    document.getElementById('split-dinheiro-recebido').value = ''

    document.getElementById(
        'troco'
    ).innerText = 'R$ 0,00'

    atualizarPagamento()

    setTimeout(() => {

        abrirPopupImpressao()

    }, 500)

    definirVendaEmAndamento(false)
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

    const { data: authData, error: erroAuth } =

    await supabaseClient
    .auth
    .getUser()

    if(erroAuth || !authData.user){
        return
    }

    const email =

    authData.user.email

    const { data: usuario, error: erroUsuario } =

    await supabaseClient

    .from('usuarios')

    .select('*')

    .eq('email', email)

    .maybeSingle()

    if(erroUsuario || !usuario){
        return
    }

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
