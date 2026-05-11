/* ========================================= */
/* CARREGAR VENDAS */
/* ========================================= */

async function carregarVendas(){

    const { data, error } =

    await supabaseClient

    .from('vendas')

    .select('*')

    .order('id', {

        ascending:false
    })

    if(error){

        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao carregar vendas',
            'error'
        )

        return
    }

    const tabela =

    document.getElementById(
        'tabela-vendas'
    )

    tabela.innerHTML = ''

    /* SEM VENDAS */

    if(data.length <= 0){

        tabela.innerHTML = `

            <tr>

                <td colspan="4">

                    Nenhuma venda encontrada

                </td>

            </tr>

        `

        return
    }

    /* LISTA */

    data.forEach(venda => {

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

                <td class="acoes-venda">

                    <button 
                        class="ver-btn"
                        onclick="verItens(${venda.id})"
                    >
                        Ver
                    </button>

                    <button 
                        class="print-btn"
                        onclick="abrirPopupImpressaoVenda(${venda.id})"
                    >
                        🖨️
                    </button>

                </td>

            </tr>

        `
    })
}

/* ========================================= */
/* VER ITENS */
/* ========================================= */

async function verItens(vendaId){

    const { data, error } =

    await supabaseClient

    .from('itens_venda')

    .select('*')

    .eq('venda_id', vendaId)

    if(error){

        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao carregar itens',
            'error'
        )

        return
    }

    const area =

    document.getElementById(
        'itens-venda'
    )

    area.innerHTML = ''

    /* SEM ITENS */

    if(data.length <= 0){

        area.innerHTML = `

            <p>
                Nenhum item encontrado
            </p>

        `
    }

    /* ITENS */

    data.forEach(item => {

        area.innerHTML += `

            <div class="item-venda">

                <h3>
                    ${item.nome_produto}
                </h3>

                <p>
                    R$ ${Number(item.preco).toFixed(2)}
                </p>

            </div>

        `
    })

    document

    .getElementById(
        'modal-venda'
    )

    .classList.add('active')

    /* AUDITORIA */

    await registrarAuditoria(

        'Visualizou venda',

        `Venda #${vendaId} foi aberta`

    )
}

/* ========================================= */
/* FECHAR MODAL */
/* ========================================= */

function fecharModal(){

    document

    .getElementById(
        'modal-venda'
    )

    .classList.remove('active')
}

/* ========================================= */
/* IMPRESSÃO */
/* ========================================= */

let vendaSelecionada = null

async function abrirPopupImpressaoVenda(
    vendaId
){

    vendaSelecionada = vendaId

    document

    .getElementById(
        'popup-impressao'
    )

    .classList.add('active')
}

/* ========================================= */
/* FECHAR POPUP */
/* ========================================= */

function fecharPopupImpressao(){

    document

    .getElementById(
        'popup-impressao'
    )

    .classList.remove('active')
}

/* ========================================= */
/* IMPRESSÃO A4 */
/* ========================================= */

async function imprimirA4(){

    await prepararVendaImpressao()

    window.open(
        'impressao-a4.html',
        '_blank'
    )

    fecharPopupImpressao()
}

/* ========================================= */
/* IMPRESSÃO TÉRMICA */
/* ========================================= */

async function imprimirTermica(){

    await prepararVendaImpressao()

    window.open(
        'impressao-termica.html',
        '_blank'
    )

    fecharPopupImpressao()
}

/* ========================================= */
/* PREPARAR IMPRESSÃO */
/* ========================================= */

async function prepararVendaImpressao(){

    /* VENDA */

    const {

        data: venda,

        error: erroVenda

    } = await supabaseClient

    .from('vendas')

    .select('*')

    .eq('id', vendaSelecionada)

    .single()

    if(erroVenda){

        console.log(erroVenda)

        mostrarToast(
            'Erro',
            'Erro ao carregar venda',
            'error'
        )

        return
    }

    /* ITENS */

    const {

        data: itens,

        error: erroItens

    } = await supabaseClient

    .from('itens_venda')

    .select('*')

    .eq('venda_id', vendaSelecionada)

    if(erroItens){

        console.log(erroItens)

        mostrarToast(
            'Erro',
            'Erro ao carregar itens',
            'error'
        )

        return
    }

    /* SALVA */

    localStorage.setItem(

        'ultimaVenda',

        JSON.stringify({

            vendaId: venda.id,

            itens: itens.map(item => ({

                nome: item.nome_produto,

                preco: item.preco

            })),

            total: venda.total,

            pagamento: 'Sistema',

            recebido: venda.total,

            troco: 0,

            data: new Date(
                venda.criado_em
            ).toLocaleString('pt-BR')

        })
    )

    /* AUDITORIA */

    await registrarAuditoria(

        'Imprimiu venda',

        `Venda #${venda.id} foi impressa`

    )
}

/* ========================================= */
/* LOGOUT */
/* ========================================= */

async function logout(){

    await supabaseClient
    .auth
    .signOut()

    window.location.href =
    '../index.html'
}

/* ========================================= */
/* INICIAR */
/* ========================================= */

carregarVendas()