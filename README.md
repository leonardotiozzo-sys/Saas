# Adega SaaS

Sistema de gestão para adegas — multi-tenant (vários comerciantes, cada um com seus próprios dados isolados) + painel de super admin.

Stack: **Next.js 14** (App Router) + **Supabase** (banco de dados, autenticação, Row Level Security) + **Tailwind CSS**.

## O que está incluso

- Login e cadastro de comerciantes (cada cadastro cria uma "empresa" nova)
- Isolamento de dados por empresa via Row Level Security (RLS) no Postgres — um comerciante nunca vê dados de outro
- Cadastro de produtos com **leitura de código de barras pela câmera** (celular, notebook ou webcam), usando a Barcode Detection API nativa do navegador
- Controle de estoque (entradas/saídas com histórico de movimentações e alerta de estoque baixo)
- PDV simples (carrinho, busca por nome ou código de barras, leitura por câmera, finalização de venda)
- Cadastro de clientes
- Relatórios com gráfico de receita por dia, ranking de produtos e alerta de estoque baixo
- Painel Super Admin: lista todas as empresas, ativa/suspende contas, vê faturamento agregado

## O que NÃO está incluso (próximas fases)

- Cobrança de assinatura (Stripe / Mercado Pago)
- Módulo financeiro completo (contas a pagar/receber)
- Fornecedores e compras
- Emissão de nota fiscal
- Permissões granulares (gerente/caixa/funcionário) — hoje só existe "admin" da empresa
- PWA / modo offline
- Reconhecimento automático de nome/marca do produto ao ler o código (preenche só o código; os demais campos você preenche)

---

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No painel do projeto, vá em **SQL Editor**, cole todo o conteúdo do arquivo `supabase/schema.sql` deste projeto e rode (**Run**)
3. Vá em **Project Settings > API** e copie:
   - `Project URL`
   - `anon public key`
   - `service_role key` (fica em "Project API keys" — **nunca** exponha essa chave no navegador)

## 2. Configurar o projeto localmente

```bash
npm install
cp .env.local.example .env.local
```

Abra `.env.local` e preencha com as chaves que você copiou do Supabase.

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## 3. Criar sua conta e virar Super Admin

1. Acesse `/cadastro` e crie sua primeira empresa/conta normalmente
2. No **SQL Editor** do Supabase, rode (trocando pelo seu e-mail):

```sql
update perfis set papel = 'super_admin', empresa_id = null
where id = (select id from auth.users where email = 'seu-email@exemplo.com');
```

3. Faça login de novo — você será redirecionado automaticamente para `/admin`

Qualquer outra pessoa que se cadastrar depois disso vira um comerciante normal, com sua própria empresa isolada.

## 4. Colocar no ar (deploy)

A forma mais simples é com a [Vercel](https://vercel.com):

1. Suba este projeto para um repositório no GitHub
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório
3. Em **Environment Variables**, adicione as mesmas 3 variáveis do `.env.local`
4. Clique em **Deploy**

Depois disso o sistema já estará acessível por uma URL pública (`seu-projeto.vercel.app`), e você pode configurar um domínio próprio nas configurações do projeto na Vercel.

## Observação sobre o leitor de código de barras

A leitura automática usa a `BarcodeDetector` API nativa, disponível hoje em **Chrome, Edge e outros navegadores baseados em Chromium** (desktop e Android). No Safari/iOS ela ainda não é suportada nativamente — nesses casos o campo de código de barras continua disponível para digitação manual. Se isso for essencial no iPhone, a solução é trocar por uma biblioteca em JavaScript (ex: `@zxing/browser`), que é um passo relativamente simples de adicionar depois.

## Estrutura do projeto

```
app/
  login/            → tela de login
  cadastro/         → tela de cadastro (cria empresa)
  dashboard/        → painel do comerciante (produtos, estoque, vendas, clientes, relatórios)
  admin/            → painel super admin
  api/admin/        → rotas de servidor que usam a service_role key
components/         → componentes reutilizáveis (scanner, modais, sidebar)
lib/                → clientes Supabase e funções utilitárias
supabase/schema.sql → schema completo do banco (tabelas + RLS + funções)
```
