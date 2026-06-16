const CONFIG_KEY = 'configuracoesLoja'

const PRINT_CONFIG_KEY = 'configuracoesImpressaoElectron'

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

    config = {
        ...config,
        ...carregarConfiguracaoImpressaoLocal()
    }

    await carregarImpressorasElectron()
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

function carregarConfiguracaoImpressaoLocal(){
    try{
        return JSON.parse(
            localStorage.getItem(PRINT_CONFIG_KEY) || '{}'
        )
    }catch(error){
        return {}
    }
}

function lerConfiguracaoImpressaoLocal(){
    return {
        impressora_nome: document.getElementById('config-impressora')?.value || '',
        impressao_silenciosa: Boolean(
            document.getElementById('config-impressao-silenciosa')?.checked
        )
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
    document.getElementById('config-impressora').value =
    config.impressora_nome || ''
    document.getElementById('config-impressao-silenciosa').checked =
    Boolean(config.impressao_silenciosa)
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
            <span>Impressora</span>
            <strong>${config.impressora_nome || 'Padrão do sistema'}</strong>
        </div>
        <div class="config-preview-item">
            <span>Impressão automática</span>
            <strong>${config.impressao_silenciosa ? 'Ativada no Electron' : 'Desativada'}</strong>
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
    const printConfig = lerConfiguracaoImpressaoLocal()

    localStorage.setItem(
        CONFIG_KEY,
        JSON.stringify({
            ...config,
            ...printConfig
        })
    )

    localStorage.setItem(
        PRINT_CONFIG_KEY,
        JSON.stringify(printConfig)
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

    renderizarPreview({
        ...config,
        ...printConfig
    })
}

async function carregarImpressorasElectron(mostrarFeedback = false){
    const select =
    document.getElementById('config-impressora')

    if(!select){
        return
    }

    const configLocal =
    carregarConfiguracaoImpressaoLocal()

    select.innerHTML =
    '<option value="">Impressora padrão do sistema</option>'

    if(!window.electronERP?.isElectron){
        select.insertAdjacentHTML(
            'beforeend',
            '<option value="" disabled>Disponível apenas no app Electron</option>'
        )

        if(mostrarFeedback){
            mostrarToast(
                'Electron necessário',
                'A listagem de impressoras aparece no aplicativo desktop.',
                'warning'
            )
        }

        return
    }

    try{
        const impressoras =
        await window.electronERP.listarImpressoras()

        impressoras.forEach(impressora => {
            const option =
            document.createElement('option')

            option.value = impressora.name
            option.textContent =
            `${impressora.displayName || impressora.name}${impressora.isDefault ? ' (padrão)' : ''}`

            select.appendChild(option)
        })

        select.value = configLocal.impressora_nome || ''

        if(mostrarFeedback){
            mostrarToast(
                'Impressoras atualizadas',
                `${impressoras.length} impressora(s) encontrada(s)`
            )
        }
    }catch(error){
        console.log(error)

        mostrarToast(
            'Erro',
            'Não foi possível listar as impressoras.',
            'error'
        )
    }
}

async function testarImpressaoElectron(){
    if(!window.electronERP?.isElectron){
        mostrarToast(
            'Electron necessário',
            'Abra pelo aplicativo desktop para testar impressão silenciosa.',
            'warning'
        )

        return
    }

    const printConfig =
    lerConfiguracaoImpressaoLocal()

    const config =
    lerFormulario()

    localStorage.setItem(
        'ultimaVenda',
        JSON.stringify({
            vendaId: 'TESTE',
            itens: [
                {
                    nome: 'Teste de impressão',
                    preco: 0
                }
            ],
            total: 0,
            pagamento: 'Teste',
            recebido: 0,
            troco: 0,
            data: new Date().toLocaleString('pt-BR')
        })
    )

    try{
        await window.electronERP.imprimirSilencioso({
            page: config.impressao_padrao === 'a4'
            ? 'impressao-a4.html'
            : 'impressao-termica.html',
            deviceName: printConfig.impressora_nome || '',
            data: localStorage.getItem('ultimaVenda') || ''
        })

        mostrarToast(
            'Teste enviado',
            'A impressão de teste foi enviada.'
        )
    }catch(error){
        console.log(error)

        mostrarToast(
            'Falha ao imprimir',
            error.message || 'Confira a impressora configurada.',
            'error'
        )
    }
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
            'pagamento_dividido',
            'forma_pagamento_1',
            'valor_pagamento_1',
            'forma_pagamento_2',
            'valor_pagamento_2',
            'valor_recebido_dinheiro',
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
            venda.pagamento_dividido,
            venda.forma_pagamento_1,
            venda.valor_pagamento_1,
            venda.forma_pagamento_2,
            venda.valor_pagamento_2,
            venda.valor_recebido_dinheiro,
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
