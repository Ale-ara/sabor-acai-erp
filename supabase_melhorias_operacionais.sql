-- Melhorias operacionais do ERP Sabor do Acai.
-- Rode este script no SQL Editor do Supabase antes de usar os novos campos.

alter table public.produtos
add column if not exists codigo text,
add column if not exists custo numeric default 0,
add column if not exists estoque_minimo int default 3,
add column if not exists unidade text default 'un',
add column if not exists variacoes text,
add column if not exists ativo boolean default true;

alter table public.vendas
add column if not exists pagamento_dividido boolean default false,
add column if not exists forma_pagamento_1 text,
add column if not exists valor_pagamento_1 numeric default 0,
add column if not exists forma_pagamento_2 text,
add column if not exists valor_pagamento_2 numeric default 0,
add column if not exists valor_recebido_dinheiro numeric default 0;

update public.produtos
set ativo = true
where ativo is null;

update public.produtos
set estoque_minimo = 3
where estoque_minimo is null;

update public.produtos
set custo = 0
where custo is null;
