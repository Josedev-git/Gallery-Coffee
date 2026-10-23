# Gallery Coffee — Backend (primeira versão)

## Instalação
1. Crie um projeto no Supabase e abra **SQL Editor**. Execute `sql/schema.sql`.
2. Em **Project Settings > API**, copie URL, chave anon/publishable e service_role (secreta).
3. No terminal: `cd backend`, `npm install`, copie `.env.example` para `.env` e preencha as variáveis.
4. Execute `node seed.js` para importar as 7 coleções e os 7 produtos.
5. Rode `npm run dev`. Teste `http://localhost:3000/api/health`.
6. Abra o frontend via Live Server na origem `http://localhost:5500` (ajuste FRONTEND_ORIGIN se diferente). Em `js/api.js` configure a URL pública da API ao publicar.
7. Em Supabase Auth configure a confirmação de e-mail e URLs de redirecionamento. Cadastre uma conta pelo site.
8. Para torná-la administradora, execute no SQL Editor, substituindo o e-mail: `update public.profiles set role='admin' where id=(select id from auth.users where email='SEU_EMAIL');`.

## Rotas
- `GET /api/health`, `/api/collections`, `/api/products`, `/api/products/:id`
- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/recover`
- `GET /api/me`, `GET /api/orders`, `POST /api/orders`, `POST /api/orders/:id/payment`
- `GET /api/admin/orders`, `POST /api/admin/products`, `PATCH /api/admin/products/:id`

## Estado real da integração
- Login/cadastro e envio de pedidos do checkout chamam a API. Pedidos são criados **pendentes**, com preços recalculados no servidor.
- Catálogo, favoritos, histórico e painel administrativo do frontend ainda usam dados/localStorage e **não estão sincronizados** com a API; precisam de migração antes do lançamento.
- O carrinho e a revisão do checkout ainda exibem descontos locais, mas **cupons não são aplicados pelo servidor**; o total autoritativo é o retornado pela API.
- O backend consegue criar uma preferência Mercado Pago se `MP_ACCESS_TOKEN` estiver definido, mas **o webhook de confirmação não está implementado**. NÃO aceite pagamentos reais nem publique o checkout para clientes antes de implementar validação de assinatura, verificação do pagamento com o Mercado Pago, idempotência, baixa atômica de estoque e conciliação de valores.
- Não há contas de teste pré-criadas. Crie usuários pelo cadastro. Não use os dados de login antigos.
- A API usa chave service_role somente no servidor; NUNCA coloque essa chave em HTML/JS ou no GitHub.
- Para produção: HTTPS, domínio/CORS correto, gestão de segredos, SMTP, backups, testes de concorrência e políticas de privacidade/LGPD.
