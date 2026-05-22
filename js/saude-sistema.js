const CHECKS_TABELAS = [
    'produtos',
    'categorias',
    'vendas',
    'itens_venda',
    'movimentacoes_estoque',
    'usuarios',
    'configuracoes_loja',
    'certificados_digitais'
]

const CHECKS_BUCKETS = [
    'produtos',
    'certificados-digitais'
]

function renderizarCheck(nome, ok, mensagem){
    return `
        <article class="saude-card ${ok ? 'ok' : 'erro'}">
            <span class="saude-badge">${ok ? 'OK' : 'Atenção'}</span>
            <h3>${nome}</h3>
            <p>${mensagem}</p>
        </article>
    `
}

async function checarTabela(tabela){
    const { error } = await supabaseClient
    .from(tabela)
    .select('*', {
        count: 'exact',
        head: true
    })

    return {
        nome: `Tabela ${tabela}`,
        ok: !error,
        mensagem: error
        ? error.message
        : 'Tabela acessível para o usuário autenticado.'
    }
}

async function checarBucket(bucket){
    const { error } = await supabaseClient
    .storage
    .from(bucket)
    .list('', {
        limit: 1
    })

    return {
        nome: `Bucket ${bucket}`,
        ok: !error,
        mensagem: error
        ? error.message
        : 'Bucket acessível no Supabase Storage.'
    }
}

async function verificarSaudeSistema(){
    const grid = document.getElementById('saude-grid')
    const status = document.getElementById('status-geral')

    status.innerText = 'Verificando...'
    grid.innerHTML = ''

    const resultados = []

    for(const tabela of CHECKS_TABELAS){
        resultados.push(await checarTabela(tabela))
    }

    for(const bucket of CHECKS_BUCKETS){
        resultados.push(await checarBucket(bucket))
    }

    const totalOk =
    resultados.filter(item => item.ok).length

    status.innerText =
    `${totalOk}/${resultados.length} verificações OK`

    grid.innerHTML =
    resultados
    .map(item => renderizarCheck(item.nome, item.ok, item.mensagem))
    .join('')
}

document.addEventListener(
    'DOMContentLoaded',
    verificarSaudeSistema
)
