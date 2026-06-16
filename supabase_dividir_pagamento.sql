-- Upgrade para salvar pagamento dividido no PDV.
-- Rode no Supabase SQL Editor.

alter table public.vendas
add column if not exists pagamento_dividido boolean not null default false,
add column if not exists forma_pagamento_1 text,
add column if not exists valor_pagamento_1 numeric default 0,
add column if not exists forma_pagamento_2 text,
add column if not exists valor_pagamento_2 numeric default 0,
add column if not exists valor_recebido_dinheiro numeric default 0;

comment on column public.vendas.pagamento_dividido is
'Indica se a venda foi paga com duas formas de pagamento.';

comment on column public.vendas.forma_pagamento_1 is
'Primeira forma usada no pagamento da venda.';

comment on column public.vendas.valor_pagamento_1 is
'Valor pago na primeira forma.';

comment on column public.vendas.forma_pagamento_2 is
'Segunda forma usada no pagamento da venda, quando houver.';

comment on column public.vendas.valor_pagamento_2 is
'Valor pago na segunda forma, quando houver.';

comment on column public.vendas.valor_recebido_dinheiro is
'Valor recebido em dinheiro para calculo de troco, especialmente no pagamento dividido.';
