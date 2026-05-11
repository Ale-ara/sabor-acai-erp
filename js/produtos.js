let produtoEditando = null

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

    /* LIMPA */

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

    document

    .getElementById(
        'popup-sucesso'
    )

    .classList.add('active')

    mostrarToast(
        'Sucesso',
        'Produto salvo com sucesso'
    )

    listarProdutos()
}

/* =========================
   LISTAR
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
   POPUP
========================= */

function fecharPopup(){

    document

    .getElementById(
        'popup-sucesso'
    )

    .classList.remove('active')
}

/* =========================
   EDITAR
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

    mostrarToast(
        'Sucesso',
        'Produto atualizado'
    )

    listarProdutos()
}

/* =========================
   INICIAR
========================= */

listarProdutos()