# Gallery Coffee API — Backend

Node.js, Express, Supabase Auth e PostgreSQL. Exclusivo para o projeto escolar.

## Setup
1. Primeiro execute `sql/schema.sql` em um Supabase novo.
2. Execute `sql/upgrade_gallery_coffee.sql` tanto em bases novas quanto em bases existentes.
3. Copie `.env.example` para `.env` **somente localmente**, preencha com as chaves do seu projeto.
4. Instale dependências com `npm ci` e rode `npm run dev`.
5. Para dados iniciais em base vazia, execute `node seed.js` **uma vez**.
6. Configure `FRONTEND_ORIGIN` com o endereço do frontend; para o trabalho escolar use `DEMO_MODE=true`.

## Endpoints
- Público: `GET /api/health`, `/api/collections`, `/api/products`, `/api/products/:id`, `/api/coupons/:code`.
- Auth: `POST /api/auth/register`, `/api/auth/login`, `/api/auth/recover`; `GET /api/me`.
- Cliente: `GET /api/orders`, `POST /api/orders`, `POST /api/orders/:id/simulate-payment`.
- Administração (`role=admin`): `GET /api/admin/products`, `/api/admin/orders`, `/api/admin/customers`, `/api/admin/coupons`; `POST /api/admin/products`, `/api/admin/coupons`; `PATCH /api/admin/products/:id`, `/api/admin/orders/:id`, `/api/admin/coupons/:code`.
- Pagamento real: `POST /api/orders/:id/payment` bloqueado enquanto `DEMO_MODE` for verdadeiro. O webhook `/api/payments/webhook` é intencionalmente **501**.

Os descontos, preços, permissões e totais são validados no backend. A chave de serviço Supabase **nunca** deve aparecer no frontend.

O arquivo principal `../README.md` contém os passos de atualização no GitHub/Render/InfinityFree e os testes de ponta a ponta.
