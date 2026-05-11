async function filtrarRelatorio(){

    let vendas = []

    const dataInicial =
    document.getElementById(
        'data-inicial'
    ).value

    const dataFinal =
    document.getElementById(
        'data-final'
    ).value

    // SE NÃO TIVER FILTRO
    // MOSTRA APENAS VENDAS DE HOJE

    if(!dataInicial && !dataFinal){

        const hoje = new Date()

        const inicioHoje =
        new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate()
        ).toISOString()

        const fimHoje =
        new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate() + 1
        ).toISOString()

        const { data, error } =
        await supabaseClient
        .from('vendas')
        .select('*')
        .gte(
            'criado_em',
            inicioHoje
        )
        .lt(
            'criado_em',
            fimHoje
        )
        .order('id', {
            ascending:false
        })

        if(error){

            console.log(error)
            return
        }

        vendas = data

    }else{

        // FILTRO PERSONALIZADO

        let query =
        supabaseClient
        .from('vendas')
        .select('*')
        .order('id', {
            ascending:false
        })

        if(dataInicial){

            query = query.gte(
                'criado_em',
                dataInicial + 'T00:00:00'
            )
        }

        if(dataFinal){

            query = query.lte(
                'criado_em',
                dataFinal + 'T23:59:59'
            )
        }

        const { data, error } =
        await query

        if(error){

            console.log(error)
            return
        }

        vendas = data
    }

    carregarCards(vendas)

    carregarHistorico(vendas)

    carregarProdutosMaisVendidos(vendas)
}

function carregarCards(vendas){

    let faturamento = 0

    vendas.forEach(venda => {

        faturamento += Number(venda.total)

    })

    const totalVendas =
    vendas.length

    const ticketMedio =
    totalVendas > 0
    ? faturamento / totalVendas
    : 0

    document.getElementById(
        'faturamento-total'
    ).innerText =
    `R$ ${faturamento.toFixed(2)}`

    document.getElementById(
        'total-vendas'
    ).innerText =
    totalVendas

    document.getElementById(
        'ticket-medio'
    ).innerText =
    `R$ ${ticketMedio.toFixed(2)}`
}

function carregarHistorico(vendas){

    const tabela =
    document.getElementById(
        'historico-vendas'
    )

    tabela.innerHTML = ''

    if(vendas.length === 0){

        tabela.innerHTML = `

            <tr>

                <td colspan="3">

                    Nenhuma venda encontrada

                </td>

            </tr>

        `

        return
    }

    vendas.forEach(venda => {

        const dataFormatada =
        new Date(venda.criado_em)
        .toLocaleString('pt-BR')

        tabela.innerHTML += `

            <tr>

                <td>
                    #${venda.id}
                </td>

                <td>
                    ${dataFormatada}
                </td>

                <td>
                    R$ ${Number(venda.total).toFixed(2)}
                </td>

            </tr>

        `
    })
}

async function carregarProdutosMaisVendidos(vendas){

    // PEGA IDS DAS VENDAS FILTRADAS

    const idsVendas =
    vendas.map(venda => venda.id)

    const tabela =
    document.getElementById(
        'produtos-vendidos'
    )

    tabela.innerHTML = ''

    if(idsVendas.length === 0){

        tabela.innerHTML = `

            <tr>

                <td colspan="2">

                    Nenhum produto vendido

                </td>

            </tr>

        `

        return
    }

    const { data, error } =
    await supabaseClient
    .from('itens_venda')
    .select('*')
    .in('venda_id', idsVendas)

    if(error){

        console.log(error)
        return
    }

    const contador = {}

    data.forEach(item => {

        if(contador[item.nome_produto]){

            contador[item.nome_produto]++

        }else{

            contador[item.nome_produto] = 1
        }
    })

    Object.entries(contador)
    .sort((a,b) => b[1] - a[1])
    .forEach(produto => {

        tabela.innerHTML += `

            <tr>

                <td>
                    ${produto[0]}
                </td>

                <td>
                    ${produto[1]}
                </td>

            </tr>

        `
    })
}

async function logout(){

    await supabaseClient.auth.signOut()

    window.location.href =
    '../index.html'
}

// CARREGA RELATÓRIO

filtrarRelatorio()

async function gerarPDF(){

    const faturamento =
    document.getElementById(
        'faturamento-total'
    ).innerText

    const totalVendas =
    document.getElementById(
        'total-vendas'
    ).innerText

    const ticketMedio =
    document.getElementById(
        'ticket-medio'
    ).innerText

    const tabela =
    document.getElementById(
        'historico-vendas'
    )

    let conteudoTabela = ''

    tabela.querySelectorAll('tr')
    .forEach(linha => {

        conteudoTabela += linha.innerText + '\n'

    })

    const janela = window.open(
        '',
        '',
        'width=900,height=700'
    )

    janela.document.write(`

        <html>

        <head>

            <title>
                Relatório de Vendas
            </title>

            <style>

                body{

                    font-family: Arial;
                    padding:40px;
                }

                h1{

                    color:#6d28d9;
                }

                .card{

                    margin-bottom:20px;
                    padding:20px;
                    border:1px solid #ccc;
                    border-radius:10px;
                }

                pre{

                    background:#f4f4f4;
                    padding:20px;
                    border-radius:10px;
                }

            </style>

        </head>

        <body>

            <h1>
                Relatório de Vendas
            </h1>

            <p>
                Gerado em:
                ${new Date().toLocaleString('pt-BR')}
            </p>

            <div class="card">

                <h3>
                    Faturamento Total:
                    ${faturamento}
                </h3>

                <h3>
                    Total de Vendas:
                    ${totalVendas}
                </h3>

                <h3>
                    Ticket Médio:
                    ${ticketMedio}
                </h3>

            </div>

            <h2>
                Histórico de Vendas
            </h2>

            <pre>
${conteudoTabela}
            </pre>

        </body>

        </html>

    `)

    janela.document.close()

    await supabaseClient

.from('notificacoes')

.insert([

    {
        titulo: 'Relatório exportado',

        texto:
        'PDF de vendas gerado com sucesso',

        tipo: 'sistema',

        referencia:
        `pdf-${Date.now()}`
    }

])

    janela.print()
}