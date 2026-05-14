let carrinho = []

let categoriaAtual = 'todos'

let produtos = []

/* =========================
   NOTIFICAÇÃO
========================= */

async function criarNotificacaoVenda(
    total
){

    await supabaseClient

    .from('notificacoes')

    .insert([

        {
            titulo: 'Nova venda',

            texto:
            `Pedido de R$ ${total.toFixed(2)}`,

            tipo: 'venda',

            referencia:
            `venda-${Date.now()}`,

            visualizada: false
        }

    ])
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
    })

    event.target.classList.add('ativo')

    renderizarProdutos()
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

    /* RENDERIZA */

    filtrados.forEach(produto => {

        grid.innerHTML += `

            <div class="produto">

                <h3>
                    ${produto.nome}
                </h3>

                <p>
                    Categoria:
                    ${produto.categoria}
                </p>

                <p>
                    Estoque:
                    ${produto.estoque}
                </p>

                <strong>
                    R$ ${Number(produto.preco)
                    .toFixed(2)}
                </strong>

                <button onclick="adicionarCarrinho(
                    ${produto.id},
                    '${produto.nome}',
                    ${Number(produto.preco)}
                )">

                    Adicionar

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

    area.innerHTML = ''

    let total = 0

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

    let total = 0

    carrinho.forEach(item => {

        total += item.preco

    })

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

        valorRecebido > 0

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
            total: total
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

    salvarUltimaVenda(
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

carregarProdutos()

carregarUsuario()