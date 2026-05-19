const CONFIG_KEY = 'configuracoesLoja'

const CONFIG_PADRAO = {
    nome: 'Sabor do Açaí',
    cnpj: '31.259.610/0001-38',
    telefone: '(21) 96673-8735',
    endereco: 'R. Joaquim Pecanha, 80',
    bairro: 'Parque Lafaiete',
    cidade: 'Duque de Caxias/RJ',
    logo_url: '',
    cor_principal: '#B82566',
    impressao_padrao: 'termica',
    estoque_minimo_padrao: 3,
    meta_diaria: 500,
    ticket_medio_meta: 25
}

async function carregarConfiguracoes(){
    let config = await buscarConfiguracoesBanco()

    if(!config){
        config = JSON.parse(
            localStorage.getItem(CONFIG_KEY) || 'null'
        ) || CONFIG_PADRAO
    }

    preencherFormulario(config)
    renderizarPreview(config)
}

async function buscarConfiguracoesBanco(){
    const { data, error } = await supabaseClient
    .from('configuracoes_loja')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

    if(error){
        return null
    }

    return data
}

function lerFormulario(){
    return {
        id: 1,
        nome: document.getElementById('config-nome').value.trim(),
        cnpj: document.getElementById('config-cnpj').value.trim(),
        telefone: document.getElementById('config-telefone').value.trim(),
        endereco: document.getElementById('config-endereco').value.trim(),
        bairro: document.getElementById('config-bairro').value.trim(),
        cidade: document.getElementById('config-cidade').value.trim(),
        logo_url: document.getElementById('config-logo-url').value.trim(),
        cor_principal: document.getElementById('config-cor-principal').value,
        impressao_padrao: document.getElementById('config-impressao').value,
        estoque_minimo_padrao: Number(
            document.getElementById('config-estoque-minimo').value || 3
        ),
        meta_diaria: Number(
            document.getElementById('config-meta-diaria').value || 0
        ),
        ticket_medio_meta: Number(
            document.getElementById('config-ticket-medio').value || 0
        ),
        updated_at: new Date().toISOString()
    }
}

function preencherFormulario(config){
    document.getElementById('config-nome').value = config.nome || ''
    document.getElementById('config-cnpj').value = config.cnpj || ''
    document.getElementById('config-telefone').value = config.telefone || ''
    document.getElementById('config-endereco').value = config.endereco || ''
    document.getElementById('config-bairro').value = config.bairro || ''
    document.getElementById('config-cidade').value = config.cidade || ''
    document.getElementById('config-logo-url').value = config.logo_url || ''
    document.getElementById('config-cor-principal').value =
    config.cor_principal || '#B82566'
    document.getElementById('config-impressao').value =
    config.impressao_padrao || 'termica'
    document.getElementById('config-estoque-minimo').value =
    config.estoque_minimo_padrao || 3
    document.getElementById('config-meta-diaria').value =
    config.meta_diaria || 0
    document.getElementById('config-ticket-medio').value =
    config.ticket_medio_meta || 0
}

function renderizarPreview(config){
    document.getElementById('config-preview').innerHTML = `
        <div class="config-preview-item">
            <span>Loja</span>
            <strong>${config.nome || '-'}</strong>
        </div>
        <div class="config-preview-item">
            <span>CNPJ</span>
            <strong>${config.cnpj || '-'}</strong>
        </div>
        <div class="config-preview-item">
            <span>Endereço</span>
            <strong>${config.endereco || '-'} - ${config.bairro || '-'}</strong>
        </div>
        <div class="config-preview-item">
            <span>Cidade</span>
            <strong>${config.cidade || '-'}</strong>
        </div>
        <div class="config-preview-item">
            <span>Impressão</span>
            <strong>${config.impressao_padrao || 'térmica'}</strong>
        </div>
        <div class="config-preview-item">
            <span>Estoque mínimo</span>
            <strong>${config.estoque_minimo_padrao || 3}</strong>
        </div>
        <div class="config-preview-item">
            <span>Meta diária</span>
            <strong>R$ ${Number(config.meta_diaria || 0).toFixed(2)}</strong>
        </div>
        <div class="config-preview-item">
            <span>Ticket médio meta</span>
            <strong>R$ ${Number(config.ticket_medio_meta || 0).toFixed(2)}</strong>
        </div>
    `
}

async function salvarConfiguracoes(event){
    event.preventDefault()

    const config = lerFormulario()

    localStorage.setItem(
        CONFIG_KEY,
        JSON.stringify(config)
    )

    const { error } = await supabaseClient
    .from('configuracoes_loja')
    .upsert([config], {
        onConflict: 'id'
    })

    if(error){
        mostrarToast(
            'Salvo localmente',
            'Rode o SQL de upgrade para salvar também no Supabase',
            'warning'
        )
    }else{
        mostrarToast(
            'Configurações salvas',
            'Dados da loja atualizados'
        )

        await registrarAuditoria(
            'Configurações atualizadas',
            'Dados da loja foram atualizados'
        )
    }

    renderizarPreview(config)
}

async function exportarDadosSistema(){
    const tabelas = [
        'produtos',
        'categorias',
        'vendas',
        'itens_venda',
        'movimentacoes_estoque',
        'usuarios',
        'configuracoes_loja'
    ]

    const backup = {
        gerado_em: new Date().toISOString(),
        tabelas: {}
    }

    for(const tabela of tabelas){
        const { data, error } = await supabaseClient
        .from(tabela)
        .select('*')

        backup.tabelas[tabela] =
        error ? {
            erro: error.message
        } : data || []
    }

    baixarArquivo(
        `backup-sabor-erp-${dataArquivo()}.json`,
        JSON.stringify(backup, null, 2),
        'application/json'
    )

    await registrarAuditoria(
        'Backup exportado',
        'Backup JSON do sistema foi gerado'
    )

    mostrarToast(
        'Backup gerado',
        'Arquivo JSON exportado com sucesso'
    )
}

async function exportarVendasCSV(){
    const { data, error } = await supabaseClient
    .from('vendas')
    .select('*')
    .order('criado_em', {
        ascending: false
    })

    if(error){
        mostrarToast(
            'Erro',
            'Não foi possível exportar vendas',
            'error'
        )

        return
    }

    const linhas = [
        [
            'id',
            'total',
            'status',
            'forma_pagamento',
            'valor_recebido',
            'troco',
            'desconto',
            'usuario',
            'criado_em'
        ]
    ]

    ;(data || []).forEach(venda => {
        linhas.push([
            venda.id,
            venda.total,
            venda.status,
            venda.forma_pagamento,
            venda.valor_recebido,
            venda.troco,
            venda.desconto,
            venda.usuario,
            venda.criado_em
        ])
    })

    const csv =
    linhas
    .map(linha => linha.map(campo => `"${String(campo ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

    baixarArquivo(
        `vendas-${dataArquivo()}.csv`,
        csv,
        'text/csv;charset=utf-8'
    )

    await registrarAuditoria(
        'Vendas exportadas',
        'CSV de vendas foi gerado'
    )

    mostrarToast(
        'CSV gerado',
        'Vendas exportadas com sucesso'
    )
}

function baixarArquivo(nome, conteudo, tipo){
    const blob =
    new Blob([conteudo], {
        type: tipo
    })

    const url =
    URL.createObjectURL(blob)

    const link =
    document.createElement('a')

    link.href = url
    link.download = nome
    link.click()

    URL.revokeObjectURL(url)
}

function dataArquivo(){
    return new Date()
    .toISOString()
    .slice(0, 10)
}

document.addEventListener(
    'DOMContentLoaded',
    carregarConfiguracoes
)
