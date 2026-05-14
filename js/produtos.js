let produtoEditando = null
let produtoExcluindo = null

/* =========================
   NOTIFICAÇÃO ESTOQUE
========================= */

async function criarNotificacaoEstoque(
    produto
){

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
                `produto-${produto.id}`
            }

        ])
    }
}

/* =========================
   POPUP DINÂMICO
========================= */

function abrirPopup(
    icone,
    titulo,
    texto
){

    document.querySelector(
        '#popup-sucesso .popup-icone'
    ).innerHTML = icone

    document.querySelector(
        '#popup-sucesso h2'
    ).innerText = titulo

    document.querySelector(
        '#popup-sucesso p'
    ).innerText = texto

    document

    .getElementById(
        'popup-sucesso'
    )

    .classList.add('ativo')
}

/* =========================
   FECHAR POPUP SUCESSO
========================= */

function fecharPopup(){

    document

    .getElementById(
        'popup-sucesso'
    )

    .classList.remove('ativo')
}

/* =========================
   SALVAR PRODUTO
========================= */

async function salvarProduto(){

    const btn =

    document.getElementById(
        'btn-salvar'
    )

    btn.disabled = true

    btn.innerText = 'Salvando...'

    const nome =

    document.getElementById(
        'nome'
    ).value

    const preco =

    document.getElementById(
        'preco'
    ).value

    const categoria =

    document.getElementById(
        'categoria'
    ).value

    const estoque =

    document.getElementById(
        'estoque'
    ).value

    /* VALIDAÇÃO */

    if(

        nome === '' ||

        preco === '' ||

        categoria === '' ||

        estoque === ''

    ){

        mostrarToast(
            'Campos obrigatórios',
            'Preencha todos os campos',
            'warning'
        )

        btn.disabled = false

        btn.innerText =
        '+ Salvar Produto'

        return
    }

    /* SALVA */

    const {

        data,

        error

    } = await supabaseClient

    .from('produtos')

    .insert([

        {
            nome,
            preco,
            categoria,
            estoque
        }

    ])

    .select()

    btn.disabled = false

    btn.innerText =
    '+ Salvar Produto'

    if(error){

        console.log(error)

        mostrarToast(
            'Erro',
            'Erro ao salvar produto',
            'error'
        )

        return
    }

    /* AUDITORIA */

    await registrarAuditoria(

        'Produto criado',

        `Produto ${nome} foi adicionado`

    )

    /* ESTOQUE CRÍTICO */

    if(Number(estoque) <= 3){

        await criarNotificacaoEstoque(
            data[0]
        )
    }

    /* LIMPAR */

    document.getElementById(
        'nome'
    ).value = ''

    document.getElementById(
        'preco'
    ).value = ''

    document.getElementById(
        'categoria'
    ).value = ''

    document.getElementById(
        'estoque'
    ).value = ''

    /* POPUP */

    abrirPopup(
        '✔',
        'Produto cadastrado!',
        'O produto foi salvo com sucesso.'
    )

    listarProdutos()
}

/* =========================
   LISTAR PRODUTOS
========================= */

async function listarProdutos(){

    const lista =

    document.getElementById(
        'lista-produtos'
    )

    lista.innerHTML = ''

    const {

        data,

        error

    } = await supabaseClient

    .from('produtos')

    .select('*')

    .order('id', {

        ascending:false
    })

    if(error){

        console.log(error)

        return
    }

    data.forEach(produto => {

        lista.innerHTML += `

            <div class="produto">

                <div class="produto-topo">

                    <h3>
                        ${produto.nome}
                    </h3>

                    <div
                        style="
                            display:flex;
                            gap:8px;
                        "
                    >

                        <!-- EDITAR -->

                        <button 
                            class="edit-btn"
                            onclick="abrirEdicao(
                                ${produto.id},
                                '${produto.nome}',
                                '${produto.preco}',
                                '${produto.categoria}',
                                '${produto.estoque}'
                            )"
                        >
                            ✏️
                        </button>

                        <!-- EXCLUIR -->

                        <button
                            class="edit-btn"
                            style="
                                background:#dc2626;
                                color:white;
                            "
                            onclick="excluirProduto(${produto.id})"
                        >
                            🗑️
                        </button>

                    </div>

                </div>

                <p>
                    Preço:
                    R$ ${Number(produto.preco).toFixed(2)}
                </p>

                <p>
                    Categoria:
                    ${produto.categoria}
                </p>

                <p>
                    Estoque:
                    ${produto.estoque}
                </p>

            </div>

        `
    })
}

/* =========================
   ABRIR POPUP EXCLUIR
========================= */

function excluirProduto(id){

    produtoExcluindo = id

    document

    .getElementById(
        'popup-excluir'
    )

    .classList.add('ativo')
}

/* =========================
   FECHAR POPUP EXCLUIR
========================= */

function fecharPopupExcluir(){

    document

    .getElementById(
        'popup-excluir'
    )

    .classList.remove('ativo')
}

/* =========================
   CONFIRMAR EXCLUSÃO
========================= */

async function confirmarExclusao(){

    try{

        const {

            error

        } = await supabaseClient

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

        /* FECHA POPUP EXCLUIR */

        document

        .getElementById(
            'popup-excluir'
        )

        .classList.remove('ativo')

        /* ESPERA ANIMAÇÃO */

        setTimeout(() => {

            abrirPopup(
                '🗑️',
                'Produto excluído!',
                'O produto foi removido com sucesso.'
            )

        }, 250)

        /* AUDITORIA */

        await registrarAuditoria(

            'Produto excluído',

            `Produto ID ${produtoExcluindo} foi removido`

        )

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
   ABRIR EDIÇÃO
========================= */

function abrirEdicao(
    id,
    nome,
    preco,
    categoria,
    estoque
){

    produtoEditando = id

    document

    .getElementById(
        'edit-nome'
    )

    .value = nome

    document

    .getElementById(
        'edit-preco'
    )

    .value = preco

    document

    .getElementById(
        'edit-categoria'
    )

    .value = categoria

    document

    .getElementById(
        'edit-estoque'
    )

    .value = estoque

    document

    .getElementById(
        'modal-editar'
    )

    .classList.add('active')
}

/* =========================
   FECHAR EDIÇÃO
========================= */

function fecharEdicao(){

    document

    .getElementById(
        'modal-editar'
    )

    .classList.remove('active')
}

/* =========================
   SALVAR EDIÇÃO
========================= */

async function salvarEdicao(){

    const nome =

    document

    .getElementById(
        'edit-nome'
    )

    .value

    const preco =

    document

    .getElementById(
        'edit-preco'
    )

    .value

    const categoria =

    document

    .getElementById(
        'edit-categoria'
    )

    .value

    const estoque =

    document

    .getElementById(
        'edit-estoque'
    )

    .value

    const {

        data,

        error

    } = await supabaseClient

    .from('produtos')

    .update({

        nome,
        preco,
        categoria,
        estoque

    })

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

    /* AUDITORIA */

    await registrarAuditoria(

        'Produto editado',

        `Produto ${nome} foi atualizado`

    )

    /* ESTOQUE CRÍTICO */

    if(Number(estoque) <= 3){

        await criarNotificacaoEstoque(
            data
        )
    }

    fecharEdicao()

    abrirPopup(
        '✏️',
        'Produto atualizado!',
        'As informações foram salvas.'
    )

    listarProdutos()
}

/* =========================
   INICIAR
========================= */

listarProdutos()