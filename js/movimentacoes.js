/* ========================================= */
/* CARREGAR MOVIMENTAÇÕES */
/* ========================================= */

async function carregarMovimentacoes(){

    const {

        data,

        error

    } = await supabaseClient

    .from('movimentacoes_estoque')

    .select('*')

    .order('id', {

        ascending: false
    })

    if(error){

        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao carregar movimentações',
            'error'
        )

        return
    }

    const tabela =

    document.getElementById(
        'tabela-movimentacoes'
    )

    tabela.innerHTML = ''

    /* CONTADORES */

    let entradas = 0
    let saidas = 0
    let ajustes = 0

    /* SEM MOVIMENTAÇÃO */

    if(data.length <= 0){

        tabela.innerHTML = `

            <tr>

                <td colspan="6">

                    Nenhuma movimentação encontrada

                </td>

            </tr>

        `

        return
    }

    /* LISTA */

    data.forEach(mov => {

        let classe = ''
        let texto = ''

        /* ENTRADA */

        if(mov.tipo === 'entrada'){

            classe = 'entrada'

            texto = 'Entrada'

            entradas++
        }

        /* SAÍDA */

        else if(mov.tipo === 'saida'){

            classe = 'saida'

            texto = 'Saída'

            saidas++
        }

        /* EDITAR */

        else{

            classe = 'editar'

            texto = 'Ajuste'

            ajustes++
        }

        const dataFormatada =

        new Date(mov.created_at)

        .toLocaleString('pt-BR')

        tabela.innerHTML += `

            <tr>

                <td>
                    ${mov.produto}
                </td>

                <td>

                    <span class="tipo ${classe}">
                        ${texto}
                    </span>

                </td>

                <td>
                    ${mov.quantidade}
                </td>

                <td>
                    ${mov.estoque_final}
                </td>

                <td>
                    ${mov.usuario}
                </td>

                <td>
                    ${dataFormatada}
                </td>

            </tr>

        `
    })

    /* CARDS */

    document.getElementById(
        'total-entradas'
    ).innerText = entradas

    document.getElementById(
        'total-saidas'
    ).innerText = saidas

    document.getElementById(
        'total-ajustes'
    ).innerText = ajustes
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

carregarMovimentacoes()