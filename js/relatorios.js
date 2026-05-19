let relatorioAtual = {
    vendas: [],
    produtosVendidos: []
}

function formatarMoeda(valor){
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

function escaparHtml(valor){
    return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function obterPeriodoRelatorio(){
    const dataInicial = document.getElementById('data-inicial').value
    const dataFinal = document.getElementById('data-final').value

    if(!dataInicial && !dataFinal){
        return 'Hoje'
    }

    const formatarData = data =>
    new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')

    if(dataInicial && dataFinal){
        return `${formatarData(dataInicial)} a ${formatarData(dataFinal)}`
    }

    if(dataInicial){
        return `A partir de ${formatarData(dataInicial)}`
    }

    return `Ate ${formatarData(dataFinal)}`
}

async function filtrarRelatorio(){
    let vendas = []

    const dataInicial =
    document.getElementById('data-inicial').value

    const dataFinal =
    document.getElementById('data-final').value

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

        const { data, error } = await supabaseClient
        .from('vendas')
        .select('*')
        .gte('criado_em', inicioHoje)
        .lt('criado_em', fimHoje)
        .order('id', {
            ascending:false
        })

        if(error){
            console.log(error)
            return
        }

        vendas = (data || []).filter(venda =>
            venda.status !== 'cancelada'
        )
    }else{
        let query = supabaseClient
        .from('vendas')
        .select('*')
        .order('id', {
            ascending:false
        })

        if(dataInicial){
            query = query.gte('criado_em', `${dataInicial}T00:00:00`)
        }

        if(dataFinal){
            query = query.lte('criado_em', `${dataFinal}T23:59:59`)
        }

        const { data, error } = await query

        if(error){
            console.log(error)
            return
        }

        vendas = (data || []).filter(venda =>
            venda.status !== 'cancelada'
        )
    }

    relatorioAtual.vendas = vendas
    relatorioAtual.produtosVendidos = []

    carregarCards(vendas)
    carregarHistorico(vendas)
    await carregarProdutosMaisVendidos(vendas)
}

function carregarCards(vendas){
    const faturamento =
    vendas.reduce((total, venda) =>
        total + Number(venda.total || 0),
        0
    )

    const totalVendas = vendas.length

    const ticketMedio =
    totalVendas > 0
    ? faturamento / totalVendas
    : 0

    document.getElementById('faturamento-total').innerText =
    formatarMoeda(faturamento)

    document.getElementById('total-vendas').innerText =
    totalVendas

    document.getElementById('ticket-medio').innerText =
    formatarMoeda(ticketMedio)
}

function carregarHistorico(vendas){
    const tabela = document.getElementById('historico-vendas')

    tabela.innerHTML = ''

    if(vendas.length === 0){
        tabela.innerHTML = `
            <tr>
                <td colspan="3">Nenhuma venda encontrada</td>
            </tr>
        `

        return
    }

    vendas.forEach(venda => {
        const dataFormatada =
        new Date(venda.criado_em).toLocaleString('pt-BR')

        tabela.innerHTML += `
            <tr>
                <td>#${venda.id}</td>
                <td>${dataFormatada}</td>
                <td>${formatarMoeda(venda.total)}</td>
            </tr>
        `
    })
}

async function carregarProdutosMaisVendidos(vendas){
    const idsVendas =
    vendas.map(venda => venda.id)

    const tabela = document.getElementById('produtos-vendidos')

    tabela.innerHTML = ''

    if(idsVendas.length === 0){
        relatorioAtual.produtosVendidos = []

        tabela.innerHTML = `
            <tr>
                <td colspan="2">Nenhum produto vendido</td>
            </tr>
        `

        return
    }

    const { data, error } = await supabaseClient
    .from('itens_venda')
    .select('*')
    .in('venda_id', idsVendas)

    if(error){
        console.log(error)
        return
    }

    const contador = {}

    ;(data || []).forEach(item => {
        const nome = item.nome_produto || 'Produto sem nome'
        const quantidade = Number(item.quantidade || 1)
        const subtotal =
        Number(item.subtotal || 0)
        || Number(item.preco || 0) * quantidade

        if(!contador[nome]){
            contador[nome] = {
                nome,
                quantidade: 0,
                subtotal: 0
            }
        }

        contador[nome].quantidade += quantidade
        contador[nome].subtotal += subtotal
    })

    const produtos =
    Object.values(contador)
    .sort((a,b) => b.quantidade - a.quantidade)

    relatorioAtual.produtosVendidos = produtos

    if(produtos.length === 0){
        tabela.innerHTML = `
            <tr>
                <td colspan="2">Nenhum produto vendido</td>
            </tr>
        `

        return
    }

    produtos.forEach(produto => {
        tabela.innerHTML += `
            <tr>
                <td>${produto.nome}</td>
                <td>${produto.quantidade}</td>
            </tr>
        `
    })
}

async function logout(){
    await supabaseClient.auth.signOut()

    window.location.href = '../index.html'
}

async function notificarPDFGerado(){
    if(typeof criarNotificacao === 'function'){
        await criarNotificacao(
            'Relatorio exportado',
            'PDF de vendas gerado com sucesso',
            'sistema',
            `pdf-${Date.now()}`
        )

        return
    }

    await supabaseClient
    .from('notificacoes')
    .insert([
        {
            titulo: 'Relatorio exportado',
            texto: 'PDF de vendas gerado com sucesso',
            tipo: 'sistema',
            referencia: `pdf-${Date.now()}`
        }
    ])
}

async function gerarPDF(){
    const vendas = relatorioAtual.vendas || []
    const produtosVendidos = relatorioAtual.produtosVendidos || []

    const faturamento =
    vendas.reduce((total, venda) =>
        total + Number(venda.total || 0),
        0
    )

    const totalVendas = vendas.length

    const ticketMedio =
    totalVendas > 0
    ? faturamento / totalVendas
    : 0

    const periodo = obterPeriodoRelatorio()
    const geradoEm = new Date().toLocaleString('pt-BR')

    const linhasProdutos =
    produtosVendidos.length > 0
    ? produtosVendidos.map((produto, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escaparHtml(produto.nome)}</td>
            <td class="numero">${produto.quantidade}</td>
            <td class="numero">${formatarMoeda(produto.subtotal)}</td>
        </tr>
    `).join('')
    : `
        <tr>
            <td colspan="4" class="vazio">Nenhum produto vendido no periodo.</td>
        </tr>
    `

    const linhasVendas =
    vendas.length > 0
    ? vendas.map(venda => `
        <tr>
            <td>#${escaparHtml(venda.id)}</td>
            <td>${new Date(venda.criado_em).toLocaleString('pt-BR')}</td>
            <td class="numero">${formatarMoeda(venda.total)}</td>
        </tr>
    `).join('')
    : `
        <tr>
            <td colspan="3" class="vazio">Nenhuma venda encontrada no periodo.</td>
        </tr>
    `

    const janela = window.open(
        '',
        '',
        'width=980,height=760'
    )

    if(!janela){
        mostrarToast(
            'Popup bloqueado',
            'Permita popups para gerar o PDF',
            'warning'
        )

        return
    }

    janela.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatorio de Vendas</title>

            <style>
                @page{
                    size:A4;
                    margin:14mm;
                }

                *{
                    box-sizing:border-box;
                }

                body{
                    margin:0;
                    color:#17202A;
                    background:#FFFFFF;
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:12px;
                    line-height:1.45;
                }

                .cabecalho{
                    display:flex;
                    justify-content:space-between;
                    gap:24px;
                    padding-bottom:18px;
                    border-bottom:3px solid #7C3AED;
                    margin-bottom:18px;
                }

                .marca{
                    display:flex;
                    flex-direction:column;
                    gap:6px;
                }

                .marca span{
                    color:#7C3AED;
                    font-size:12px;
                    font-weight:800;
                    letter-spacing:0.08em;
                    text-transform:uppercase;
                }

                h1{
                    margin:0;
                    color:#111827;
                    font-size:28px;
                    line-height:1.08;
                }

                .meta{
                    min-width:220px;
                    padding:12px 14px;
                    border:1px solid #E5E7EB;
                    border-radius:8px;
                    background:#F9FAFB;
                }

                .meta div{
                    display:flex;
                    justify-content:space-between;
                    gap:14px;
                    margin:4px 0;
                }

                .meta span{
                    color:#6B7280;
                }

                .resumo{
                    display:grid;
                    grid-template-columns:repeat(3, 1fr);
                    gap:10px;
                    margin-bottom:18px;
                }

                .resumo-card{
                    min-height:82px;
                    padding:14px;
                    border:1px solid #E5E7EB;
                    border-radius:8px;
                    background:#F9FAFB;
                }

                .resumo-card span{
                    display:block;
                    color:#6B7280;
                    font-size:11px;
                    font-weight:800;
                    text-transform:uppercase;
                    margin-bottom:8px;
                }

                .resumo-card strong{
                    color:#111827;
                    font-size:22px;
                    line-height:1;
                }

                .resumo-card.destaque{
                    border-color:#C4B5FD;
                    background:#F5F3FF;
                }

                .secao{
                    margin-top:18px;
                    break-inside:avoid;
                }

                h2{
                    margin:0 0 10px;
                    color:#111827;
                    font-size:17px;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                    border:1px solid #E5E7EB;
                    border-radius:8px;
                    overflow:hidden;
                }

                th{
                    padding:10px;
                    color:#374151;
                    background:#F3F4F6;
                    border-bottom:1px solid #E5E7EB;
                    font-size:11px;
                    text-align:left;
                    text-transform:uppercase;
                }

                td{
                    padding:9px 10px;
                    border-bottom:1px solid #EEF2F7;
                }

                tbody tr:nth-child(even) td{
                    background:#FAFAFA;
                }

                tbody tr:last-child td{
                    border-bottom:none;
                }

                .numero{
                    text-align:right;
                    white-space:nowrap;
                }

                .vazio{
                    padding:18px;
                    color:#6B7280;
                    text-align:center;
                }

                .rodape{
                    display:flex;
                    justify-content:space-between;
                    margin-top:22px;
                    padding-top:12px;
                    border-top:1px solid #E5E7EB;
                    color:#6B7280;
                    font-size:10px;
                }

                @media print{
                    body{
                        print-color-adjust:exact;
                        -webkit-print-color-adjust:exact;
                    }
                }
            </style>
        </head>

        <body>
            <main>
                <header class="cabecalho">
                    <div class="marca">
                        <span>Sabor do Acai ERP</span>
                        <h1>Relatorio de Vendas</h1>
                    </div>

                    <div class="meta">
                        <div>
                            <span>Periodo</span>
                            <strong>${escaparHtml(periodo)}</strong>
                        </div>

                        <div>
                            <span>Gerado em</span>
                            <strong>${geradoEm}</strong>
                        </div>
                    </div>
                </header>

                <section class="resumo">
                    <div class="resumo-card destaque">
                        <span>Faturamento</span>
                        <strong>${formatarMoeda(faturamento)}</strong>
                    </div>

                    <div class="resumo-card">
                        <span>Total de vendas</span>
                        <strong>${totalVendas}</strong>
                    </div>

                    <div class="resumo-card">
                        <span>Ticket medio</span>
                        <strong>${formatarMoeda(ticketMedio)}</strong>
                    </div>
                </section>

                <section class="secao">
                    <h2>Produtos mais vendidos</h2>

                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Produto</th>
                                <th class="numero">Quantidade</th>
                                <th class="numero">Total</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${linhasProdutos}
                        </tbody>
                    </table>
                </section>

                <section class="secao">
                    <h2>Historico de vendas</h2>

                    <table>
                        <thead>
                            <tr>
                                <th>Venda</th>
                                <th>Data</th>
                                <th class="numero">Total</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${linhasVendas}
                        </tbody>
                    </table>
                </section>

                <footer class="rodape">
                    <span>Sabor do Acai ERP</span>
                    <span>Relatorio gerado automaticamente</span>
                </footer>
            </main>
        </body>
        </html>
    `)

    janela.document.close()
    janela.focus()

    await notificarPDFGerado()

    setTimeout(() => {
        janela.print()
    }, 350)
}

filtrarRelatorio()
