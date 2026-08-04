-- ============================================================
-- SCHEMA: SaaS de Gestão para Adegas — Multi-tenant
-- Rode este arquivo inteiro no SQL Editor do Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- EMPRESAS (tenants)
-- ------------------------------------------------------------
create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  status text not null default 'ativo' check (status in ('ativo','suspenso','bloqueado')),
  plano text not null default 'trial' check (plano in ('trial','basico','pro')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PERFIS (liga auth.users -> empresa + papel)
-- ------------------------------------------------------------
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid references empresas(id) on delete cascade,
  nome text not null,
  papel text not null default 'admin' check (papel in ('super_admin','admin','funcionario')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PRODUTOS
-- ------------------------------------------------------------
create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  tipo text default 'Outro',
  safra int,
  regiao text,
  fornecedor text,
  codigo_barras text,
  preco_custo numeric(10,2) default 0,
  preco_venda numeric(10,2) not null default 0,
  estoque int not null default 0,
  estoque_minimo int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_produtos_empresa on produtos(empresa_id);
create index if not exists idx_produtos_codigo_barras on produtos(empresa_id, codigo_barras);

-- ------------------------------------------------------------
-- MOVIMENTOS DE ESTOQUE
-- ------------------------------------------------------------
create table if not exists movimentos_estoque (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  produto_id uuid not null references produtos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','saida')),
  quantidade int not null,
  motivo text,
  created_at timestamptz not null default now()
);
create index if not exists idx_movimentos_empresa on movimentos_estoque(empresa_id);

-- ------------------------------------------------------------
-- CLIENTES
-- ------------------------------------------------------------
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  telefone text,
  observacoes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_clientes_empresa on clientes(empresa_id);

-- ------------------------------------------------------------
-- VENDAS
-- ------------------------------------------------------------
create table if not exists vendas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete set null,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_vendas_empresa on vendas(empresa_id);

create table if not exists itens_venda (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references vendas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete set null,
  nome_produto text not null,
  quantidade int not null,
  preco_unitario numeric(10,2) not null
);
create index if not exists idx_itens_venda on itens_venda(venda_id);

-- ============================================================
-- FUNÇÃO: criar empresa + perfil no cadastro (bootstrap RLS)
-- SECURITY DEFINER: roda com privilégios elevados, ignorando RLS,
-- mas só pode ser chamada por um usuário autenticado (auth.uid()).
-- ============================================================
create or replace function criar_empresa_e_perfil(nome_empresa text, nome_usuario text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nova_empresa_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  insert into empresas (nome, email, status, plano)
  values (nome_empresa, (select email from auth.users where id = auth.uid()), 'ativo', 'trial')
  returning id into nova_empresa_id;

  insert into perfis (id, empresa_id, nome, papel)
  values (auth.uid(), nova_empresa_id, nome_usuario, 'admin');

  return nova_empresa_id;
end;
$$;

-- ============================================================
-- FUNÇÃO: finalizar venda (atômica) — insere venda, itens,
-- baixa o estoque e registra o movimento, tudo ou nada.
-- itens_json: [{ "produto_id": "...", "nome_produto": "...", "quantidade": 2, "preco_unitario": 45.9 }]
-- ============================================================
create or replace function finalizar_venda(cliente_id_param uuid, itens_json jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  empresa_id_atual uuid;
  nova_venda_id uuid;
  item jsonb;
  total_venda numeric(10,2) := 0;
  estoque_atual int;
begin
  empresa_id_atual := minha_empresa_id();
  if empresa_id_atual is null then
    raise exception 'Usuário sem empresa associada';
  end if;

  -- valida estoque de todos os itens antes de gravar qualquer coisa
  for item in select * from jsonb_array_elements(itens_json)
  loop
    select estoque into estoque_atual from produtos
      where id = (item->>'produto_id')::uuid and empresa_id = empresa_id_atual;
    if estoque_atual is null then
      raise exception 'Produto não encontrado';
    end if;
    if estoque_atual < (item->>'quantidade')::int then
      raise exception 'Estoque insuficiente para o produto %', item->>'nome_produto';
    end if;
    total_venda := total_venda + ((item->>'quantidade')::int * (item->>'preco_unitario')::numeric);
  end loop;

  insert into vendas (empresa_id, cliente_id, total)
  values (empresa_id_atual, cliente_id_param, total_venda)
  returning id into nova_venda_id;

  for item in select * from jsonb_array_elements(itens_json)
  loop
    insert into itens_venda (venda_id, produto_id, nome_produto, quantidade, preco_unitario)
    values (
      nova_venda_id,
      (item->>'produto_id')::uuid,
      item->>'nome_produto',
      (item->>'quantidade')::int,
      (item->>'preco_unitario')::numeric
    );

    update produtos set estoque = estoque - (item->>'quantidade')::int
      where id = (item->>'produto_id')::uuid;

    insert into movimentos_estoque (empresa_id, produto_id, tipo, quantidade, motivo)
    values (empresa_id_atual, (item->>'produto_id')::uuid, 'saida', (item->>'quantidade')::int, 'Venda');
  end loop;

  return nova_venda_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table empresas enable row level security;
alter table perfis enable row level security;
alter table produtos enable row level security;
alter table movimentos_estoque enable row level security;
alter table clientes enable row level security;
alter table vendas enable row level security;
alter table itens_venda enable row level security;

-- Helper: empresa_id do usuário logado
create or replace function minha_empresa_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select empresa_id from perfis where id = auth.uid();
$$;

create or replace function meu_papel()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select papel from perfis where id = auth.uid();
$$;

-- PERFIS: cada um vê o próprio perfil
create policy "perfil_proprio_select" on perfis for select
  using (id = auth.uid());
create policy "perfil_proprio_update" on perfis for update
  using (id = auth.uid());

-- EMPRESAS: usuário vê só a própria empresa; super_admin vê todas
create policy "empresa_select" on empresas for select
  using (id = minha_empresa_id() or meu_papel() = 'super_admin');
create policy "empresa_update_admin" on empresas for update
  using (meu_papel() = 'super_admin');

-- PRODUTOS
create policy "produtos_isolamento" on produtos for all
  using (empresa_id = minha_empresa_id())
  with check (empresa_id = minha_empresa_id());

-- MOVIMENTOS
create policy "movimentos_isolamento" on movimentos_estoque for all
  using (empresa_id = minha_empresa_id())
  with check (empresa_id = minha_empresa_id());

-- CLIENTES
create policy "clientes_isolamento" on clientes for all
  using (empresa_id = minha_empresa_id())
  with check (empresa_id = minha_empresa_id());

-- VENDAS
create policy "vendas_isolamento" on vendas for all
  using (empresa_id = minha_empresa_id())
  with check (empresa_id = minha_empresa_id());

-- ITENS_VENDA (isolamento via join com vendas)
create policy "itens_venda_isolamento" on itens_venda for all
  using (venda_id in (select id from vendas where empresa_id = minha_empresa_id()))
  with check (venda_id in (select id from vendas where empresa_id = minha_empresa_id()));

-- ============================================================
-- Primeiro super admin: depois de criar sua conta pelo /cadastro,
-- rode manualmente (trocando o e-mail):
--
--   update perfis set papel = 'super_admin', empresa_id = null
--   where id = (select id from auth.users where email = 'seu-email@exemplo.com');
-- ============================================================
