let produtoEditando = null
let produtoExcluindo = null

/* =========================
   NOTIFICAÇÃO ESTOQUE
========================= */

async function criarNotificacaoEstoque(produto){

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
   POPUP
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

    await registrarAuditoria(

        'Produto criado',

        `Produto ${nome} foi adicionado`

    )

    if(Number(estoque) <= 3){

        await criarNotificacaoEstoque(
            data[0]
        )
    }

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

    /* FILTROS */

    const filtrosContainer =

    document.getElementById(
        'filtros-categorias'
    )

    if(filtrosContainer){

        const categoriasUnicas = [

            ...new Set(

                data.map(

                    produto => produto.categoria
                )
            )
        ]

        filtrosContainer.innerHTML = `

            <button
                class="filtro ativo"
                onclick="filtrarCategoria('Todos')"
            >
                Todos
            </button>

        `

        categoriasUnicas.forEach(categoria => {

            filtrosContainer.innerHTML += `

                <button
                    class="filtro"
                    onclick="filtrarCategoria('${categoria}')"
                >
                    ${categoria}
                </button>

            `
        })
    }

    renderizarProdutos(data)
}

/* =========================
   RENDERIZAR PRODUTOS
========================= */

function renderizarProdutos(data){

    const lista =

    document.getElementById(
        'lista-produtos'
    )

    lista.innerHTML = ''

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
                    R$ ${Number(produto.preco)
                    .toFixed(2)}
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
   FILTRAR CATEGORIA
========================= */

async function filtrarCategoria(categoria){

    document

    .querySelectorAll('.filtro')

    .forEach(btn => {

        btn.classList.remove('ativo')

        if(

            btn.innerText.trim() === categoria
        ){

            btn.classList.add('ativo')
        }
    })

    let query = supabaseClient

    .from('produtos')

    .select('*')

    .order('id', {

        ascending:false
    })

    if(categoria !== 'Todos'){

        query = query.eq(
            'categoria',
            categoria
        )
    }

    const {

        data,

        error

    } = await query

    if(error){

        console.log(error)

        return
    }

    renderizarProdutos(data)
}

/* =========================
   EXCLUIR
========================= */

function excluirProduto(id){

    produtoExcluindo = id

    document

    .getElementById(
        'popup-excluir'
    )

    .classList.add('ativo')
}

function fecharPopupExcluir(){

    document

    .getElementById(
        'popup-excluir'
    )

    .classList.remove('ativo')
}

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

        fecharPopupExcluir()

        setTimeout(() => {

            abrirPopup(
                '🗑️',
                'Produto excluído!',
                'O produto foi removido.'
            )

        }, 250)

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

    await registrarAuditoria(

        'Produto editado',

        `Produto ${nome} atualizado`
    )

    if(Number(estoque) <= 3){

        await criarNotificacaoEstoque(
            data
        )
    }

    fecharEdicao()

    abrirPopup(
        '✏️',
        'Produto atualizado!',
        'Alterações salvas.'
    )

    listarProdutos()
}

/* =========================
   INICIAR
========================= */

listarProdutos()