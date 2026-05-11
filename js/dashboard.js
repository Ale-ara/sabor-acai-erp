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

async function carregarUsuario(){

    const {

        data: authData

    } = await supabaseClient
    .auth
    .getUser()

    const email =
    authData.user.email

    const {

        data: usuario

    } = await supabaseClient

    .from('usuarios')

    .select('*')

    .eq(
        'email',
        email
    )

    .single()

    if(!usuario){
        return
    }

    /* NOME */

    document.getElementById(
        'user-name'
    ).innerText =
    usuario.nome

    /* CARGO */

    const cargoEl =

    document.getElementById(
        'user-cargo'
    )

    if(cargoEl){

        cargoEl.innerText =
        usuario.cargo
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
/* DASHBOARD */
/* ========================================= */

async function carregarDashboard(){

    /* ========================================= */
    /* SKELETON */
    /* ========================================= */

    const cards =

    document.querySelector(
        '.cards'
    )

    cards.innerHTML = `

        <div class="card skeleton skeleton-card">

        </div>

        <div class="card skeleton skeleton-card">

        </div>

        <div class="card skeleton skeleton-card">

        </div>

        <div class="card skeleton skeleton-card">

        </div>

    `

    /* PEQUENO DELAY VISUAL */

    await new Promise(resolve =>

        setTimeout(resolve, 500)

    )

    /* ========================================= */
    /* PRODUTOS */
    /* ========================================= */

    const {

        data: produtos,

        error

    } = await supabaseClient

    .from('produtos')

    .select('*')

    if(error){

        console.log(error)

        return
    }

    /* ========================================= */
    /* RESTAURA CARDS */
    /* ========================================= */

    cards.innerHTML = `

        <div class="card">

            <h3>
                Total Produtos
            </h3>

            <strong id="total-produtos">
                0
            </strong>

        </div>

        <div class="card">

            <h3>
                Estoque Total
            </h3>

            <strong id="estoque-total">
                0
            </strong>

        </div>

        <div class="card">

            <h3>
                Vendas Hoje
            </h3>

            <strong id="vendas-hoje">
                R$ 0,00
            </strong>

        </div>

        <div class="card">

            <h3>
                Pedidos
            </h3>

            <strong id="pedidos-hoje">
                0
            </strong>

        </div>

    `

    /* TOTAL PRODUTOS */

    document.getElementById(
        'total-produtos'
    ).innerText =
    produtos.length

    /* ESTOQUE TOTAL */

    let estoqueTotal = 0

    produtos.forEach(produto => {

        estoqueTotal +=
        Number(produto.estoque)

    })

    document.getElementById(
        'estoque-total'
    ).innerText =
    estoqueTotal

    /* ========================================= */
    /* VENDAS */
    /* ========================================= */

    const {

        data: vendas

    } = await supabaseClient

    .from('vendas')

    .select('*')

    /* TOTAL HOJE */

    const hoje =
    new Date().toDateString()

    let totalHoje = 0

    vendas.forEach(venda => {

        const dataVenda =

        new Date(
            venda.criado_em
        ).toDateString()

        if(dataVenda === hoje){

            totalHoje +=
            Number(venda.total)
        }
    })

    document.getElementById(
        'vendas-hoje'
    ).innerText =

    `R$ ${totalHoje.toFixed(2)}`

    /* PEDIDOS */

    document.getElementById(
        'pedidos-hoje'
    ).innerText =
    vendas.length

    /* ========================================= */
    /* MOVIMENTAÇÕES */
    /* ========================================= */

    carregarMovimentacoesRecentes()

    /* ========================================= */
    /* GRÁFICO */
    /* ========================================= */

    criarGraficoVendas(
        vendas
    )
}

/* ========================================= */
/* GRÁFICO */
/* ========================================= */

function criarGraficoVendas(
    vendas
){

    const ultimos7Dias = []

    const totais = []

    for(let i = 6; i >= 0; i--){

        const data = new Date()

        data.setDate(
            data.getDate() - i
        )

        const label =

        data.toLocaleDateString(
            'pt-BR',
            {
                day: '2-digit',
                month: '2-digit'
            }
        )

        ultimos7Dias.push(label)

        let totalDia = 0

        vendas.forEach(venda => {

            const dataVenda =
            new Date(venda.criado_em)

            const mesmaData =

            dataVenda.toDateString()
            ===
            data.toDateString()

            if(mesmaData){

                totalDia +=
                Number(venda.total)
            }
        })

        totais.push(totalDia)
    }

    const ctx =

    document.getElementById(
        'grafico-vendas'
    )

    /* EVITA DUPLICAR */

    if(window.graficoVendas){

        window.graficoVendas.destroy()
    }

    window.graficoVendas =

    new Chart(ctx, {

        type: 'line',

        data: {

            labels:
            ultimos7Dias,

            datasets: [

                {

                    label:
                    'Vendas',

                    data:
                    totais,

                    borderColor:
                    '#8E44EC',

                    backgroundColor:
                    'rgba(142,68,236,0.15)',

                    borderWidth: 3,

                    fill: true,

                    tension: 0.4,

                    pointRadius: 5,

                    pointBackgroundColor:
                    '#8E44EC'
                }

            ]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: false
                }
            },

            scales: {

                y: {

                    ticks: {

                        color:
                        'rgba(255,255,255,0.6)'
                    },

                    grid: {

                        color:
                        'rgba(255,255,255,0.05)'
                    }
                },

                x: {

                    ticks: {

                        color:
                        'rgba(255,255,255,0.6)'
                    },

                    grid: {

                        display: false
                    }
                }
            }
        }
    })
}

/* ========================================= */
/* MOVIMENTAÇÕES RECENTES */
/* ========================================= */

async function carregarMovimentacoesRecentes(){

    const {

        data,

        error

    } = await supabaseClient

    .from('movimentacoes_estoque')

    .select('*')

    .order('id', {

        ascending: false

    })

    .limit(5)

    if(error){

        console.log(error)

        return
    }

    const lista =

    document.getElementById(
        'mov-lista'
    )

    if(!lista){
        return
    }

    lista.innerHTML = ''

    data.forEach(mov => {

        let classe = ''
        let emoji = ''

        if(mov.tipo === 'entrada'){

            classe = 'entrada'

            emoji = '🟢'
        }

        else if(mov.tipo === 'saida'){

            classe = 'saida'

            emoji = '🔴'
        }

        else{

            classe = 'editar'

            emoji = '🟡'
        }

        const dataFormatada =

        new Date(mov.created_at)

        .toLocaleString('pt-BR')

        lista.innerHTML += `

            <div class="mov-item">

                <div class="mov-icon ${classe}">
                    ${emoji}
                </div>

                <div class="mov-info">

                    <strong>
                        ${mov.usuario}
                    </strong>

                    <span>
                        ${mov.produto}
                        •
                        ${mov.tipo}
                    </span>

                </div>

                <div class="mov-data">
                    ${dataFormatada}
                </div>

            </div>

        `
    })
}

/* ========================================= */
/* POPUP BOAS VINDAS */
/* ========================================= */

async function mostrarBoasVindas(){

    const acabouDeLogar =

    sessionStorage.getItem(
        'acabouDeLogar'
    )

    if(acabouDeLogar !== 'true'){
        return
    }

    const {

        data: authData

    } = await supabaseClient
    .auth
    .getUser()

    const email =
    authData.user.email

    const {

        data: usuario

    } = await supabaseClient

    .from('usuarios')

    .select('*')

    .eq(
        'email',
        email
    )

    .single()

    if(!usuario){
        return
    }

    document.getElementById(
        'welcome-title'
    ).innerText =

    `Seja bem-vindo, ${usuario.nome}!`

    document

    .getElementById(
        'popup-bemvindo'
    )

    .classList.add('active')

    sessionStorage.removeItem(
        'acabouDeLogar'
    )
}

function fecharBoasVindas(){

    document

    .getElementById(
        'popup-bemvindo'
    )

    .classList.remove('active')
}

/* ========================================= */
/* AUTO REFRESH */
/* ========================================= */

setInterval(() => {

    carregarDashboard()

}, 30000)

/* ========================================= */
/* INICIAR */
/* ========================================= */

checkAuth()

carregarUsuario()

carregarDashboard()

mostrarBoasVindas()