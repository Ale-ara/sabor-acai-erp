let produtoSelecionado = null
let produtosEstoqueCache = []

/* ========================================= */
/* CRIAR NOTIFICAÇÃO */
/* ========================================= */

async function criarNotificacaoEstoque(
    produto
){

    if(produto.estoque > 3){

        return
    }

    if(typeof criarNotificacao === 'function'){

        await criarNotificacao(
            'Estoque critico',
            `${produto.nome} esta acabando`,
            'critica',
            `produto-${produto.id}`
        )

        return
    }

    const {
        data: existente
    } = await supabaseClient

    .from('notificacoes')

    .select('*')

    .eq(
        'referencia',
        `produto-${produto.id}`
    )

    .maybeSingle()

    if(!existente){

        await supabaseClient

        .from('notificacoes')

        .insert([

            {
                titulo: 'Estoque crítico',

                texto:
                `${produto.nome} está acabando`,

                tipo: 'critica',

                referencia:
                `produto-${produto.id}`,

                visualizada: false
            }

        ])
    }
}

/* ========================================= */
/* CARREGAR ESTOQUE */
/* ========================================= */

async function carregarEstoque(){

    const { data, error } =

    await supabaseClient

    .from('produtos')

    .select('*')

    .order('id', {
        ascending: false
    })

    if(error){

        console.log(error)

        return
    }

    produtosEstoqueCache = data || []

    const tabela =

    document.getElementById(
        'tabela-estoque'
    )

    tabela.innerHTML = ''

    let baixo = 0
    let critico = 0
    let semEstoque = 0

    document.getElementById(
        'total-produtos'
    ).innerText = data.length

    for(const produto of produtosEstoqueCache){

        let status = ''
        let classe = ''

        /* SEM ESTOQUE */

        if(produto.estoque <= 0){

            status = 'Sem estoque'

            classe = 'status-critico'

            semEstoque++

            critico++

            await criarNotificacaoEstoque(
                produto
            )
        }

        /* CRÍTICO */

        else if(produto.estoque <= 3){

            status = 'Crítico'

            classe = 'status-critico'

            critico++

            await criarNotificacaoEstoque(
                produto
            )
        }

        /* BAIXO */

        else if(produto.estoque <= 10){

            status = 'Baixo'

            classe = 'status-baixo'

            baixo++
        }

        /* NORMAL */

        else{

            status = 'Normal'

            classe = 'status-normal'
        }

        tabela.innerHTML += `

            <tr>

                <td>
                    ${produto.nome}
                </td>

                <td>
                    ${produto.categoria}
                </td>

                <td>
                    ${produto.estoque}
                </td>

                <td>

                    <span class="${classe}">
                        ${status}
                    </span>

                </td>

                <td>

                    <button
                        class="acao-btn"
                        onclick="abrirModalEstoque(
                            ${produto.id},
                            '${produto.nome}',
                            ${produto.estoque}
                        )"
                    >
                        ✏️ Editar
                    </button>

                </td>

            </tr>

        `
    }

    document.getElementById(
        'estoque-baixo'
    ).innerText = baixo

    document.getElementById(
        'sem-estoque'
    ).innerText = semEstoque
}

function localizarProdutoEstoque(identificador){
    const termo =
    String(identificador || '').trim().toLowerCase()

    return produtosEstoqueCache.find(produto =>
        String(produto.id).toLowerCase() === termo ||
        String(produto.codigo || '').toLowerCase() === termo ||
        String(produto.nome || '').trim().toLowerCase() === termo
    )
}

async function aplicarEntradaLote(){
    const campo =
    document.getElementById('entrada-lote')

    const linhas =
    campo.value
    .split(/\r?\n/)
    .map(linha => linha.trim())
    .filter(Boolean)

    if(linhas.length === 0){
        mostrarToast(
            'Entrada em lote',
            'Informe pelo menos um produto.',
            'warning'
        )

        return
    }

    const erros = []
    const movimentos = []

    for(const [index, linha] of linhas.entries()){
        const partes =
        linha.split(';').map(parte => parte.trim())

        const produto =
        localizarProdutoEstoque(partes[0])

        const quantidade =
        Number(String(partes[1] || '').replace(',', '.'))

        if(!produto || !quantidade || quantidade <= 0){
            erros.push(`Linha ${index + 1}: produto ou quantidade inválida.`)
            continue
        }

        movimentos.push({
            produto,
            quantidade,
            motivo: partes[2] || 'Entrada em lote'
        })
    }

    if(erros.length > 0){
        mostrarToast(
            'Entrada em lote',
            erros.slice(0, 2).join(' '),
            'warning'
        )

        return
    }

    for(const movimento of movimentos){
        const estoqueAnterior =
        Number(movimento.produto.estoque || 0)

        const estoqueFinal =
        estoqueAnterior + movimento.quantidade

        const { error } = await supabaseClient
        .from('produtos')
        .update({
            estoque: estoqueFinal
        })
        .eq('id', movimento.produto.id)

        if(error){
            mostrarToast(
                'Erro',
                `Falha ao atualizar ${movimento.produto.nome}`,
                'error'
            )

            return
        }

        await supabaseClient
        .from('movimentacoes_estoque')
        .insert([{
            produto: movimento.produto.nome,
            produto_id: movimento.produto.id,
            tipo: 'entrada',
            quantidade: movimento.quantidade,
            estoque_anterior: estoqueAnterior,
            estoque_final: estoqueFinal,
            motivo: movimento.motivo,
            usuario: 'Sistema'
        }])
    }

    campo.value = ''

    mostrarToast(
        'Entrada em lote',
        `${movimentos.length} produto(s) atualizado(s).`
    )

    carregarEstoque()
}

/* ========================================= */
/* ABRIR MODAL */
/* ========================================= */

function abrirModalEstoque(
    id,
    nome,
    estoque
){

    produtoSelecionado = {
        id,
        nome,
        estoque
    }

    document
    .getElementById('modal-produto')
    .value = nome

    document
    .getElementById('modal-quantidade')
    .value = ''

    document
    .getElementById('modal-motivo')
    .value = ''

    document
    .getElementById('modal-tipo')
    .value = 'entrada'

    document
    .getElementById('modal-estoque')
    .classList.add('active')
}

/* ========================================= */
/* FECHAR MODAL */
/* ========================================= */

function fecharModalEstoque(){

    document
    .getElementById('modal-estoque')
    .classList.remove('active')
}

/* ========================================= */
/* SALVAR MOVIMENTAÇÃO */
/* ========================================= */

async function salvarMovimentacao(){

    const tipo =

    document
    .getElementById('modal-tipo')
    .value

    const quantidade =

    Number(

        document
        .getElementById('modal-quantidade')
        .value
    )

    const motivo =

    document
    .getElementById('modal-motivo')
    .value

    if(!quantidade){

        mostrarToast(
            'Campo obrigatório',
            'Digite uma quantidade',
            'warning'
        )

        return
    }

    let novoEstoque =
    produtoSelecionado.estoque

    /* ENTRADA */

    if(tipo === 'entrada'){

        novoEstoque += quantidade
    }

    /* SAÍDA */

    if(tipo === 'saida'){

        novoEstoque -= quantidade
    }

    /* EDITAR */

    if(tipo === 'editar'){

        novoEstoque = quantidade
    }

    /* EVITA NEGATIVO */

    if(novoEstoque < 0){

        novoEstoque = 0
    }

    /* ATUALIZA PRODUTO */

    const { error } =

    await supabaseClient

    .from('produtos')

    .update({

        estoque: novoEstoque

    })

    .eq(
        'id',
        produtoSelecionado.id
    )

    if(error){

        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao atualizar estoque',
            'error'
        )

        return
    }

    /* ========================================= */
    /* USUÁRIO LOGADO */
    /* ========================================= */

    const {

        data: { session }

    } = await supabaseClient
    .auth
    .getSession()

    let nomeUsuario = 'Usuário'

    if(session){

        const {

            data: usuarioData

        } = await supabaseClient

        .from('usuarios')

        .select('*')

        .eq(
            'id',
            session.user.id
        )

        .single()

        if(usuarioData){

            nomeUsuario =
            usuarioData.nome
        }
    }

    /* ========================================= */
    /* HISTÓRICO MOVIMENTAÇÃO */
    /* ========================================= */

    await supabaseClient

    .from('movimentacoes_estoque')

    .insert([

        {
            produto:
            produtoSelecionado.nome,

            tipo,

            quantidade,

            estoque_final:
            novoEstoque,

            motivo:
            motivo || tipo,

            usuario:
            nomeUsuario
        }

    ])

    /* ========================================= */
    /* AUDITORIA */
    /* ========================================= */

    await registrarAuditoria(

        'Movimentação estoque',

        `${produtoSelecionado.nome} teve estoque alterado para ${novoEstoque}`

    )

    /* ========================================= */
    /* NOTIFICAÇÃO */
    /* ========================================= */

    if(typeof criarNotificacao === 'function'){

        await criarNotificacao(
            'Movimentacao de estoque',
            `${produtoSelecionado.nome} foi atualizado`,
            'info',
            `mov-${produtoSelecionado.id}-${Date.now()}`
        )

    }else{

    await supabaseClient

    .from('notificacoes')

    .insert([

        {
            titulo: 'Movimentação de estoque',

            texto:
            `${produtoSelecionado.nome} foi atualizado`,

            tipo: 'info',

            referencia:
            `mov-${produtoSelecionado.id}`,

            visualizada: false
        }

    ])

    }

    fecharModalEstoque()

    mostrarToast(
        'Sucesso',
        'Estoque atualizado com sucesso'
    )

    carregarEstoque()

    if(typeof carregarNotificacoes === 'function'){

        carregarNotificacoes()
    }
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

carregarEstoque()
