# Gallery Coffee — Projeto semestral

E-commerce demonstrativo com **HTML, CSS e JavaScript**, backend **Node.js / Express** e banco de dados **Supabase (PostgreSQL)**. Frontend estático no **InfinityFree**, API no **Render**.

> **Uso escolar:** os pagamentos são **simulados**, não geram transações financeiras, e não existe entrega física. O status "Pago" em compras simuladas é identificado pelo campo `simulated=true`. Não utilizar este projeto para vendas reais.

## O que foi implementado nesta versão
- Catálogo e detalhes dos produtos carregados da API, inclusive alterações do administrador.
- Cadastro, confirmação por e-mail e login no Supabase Auth.
- Carrinho temporário por aba (sessionStorage), removido ao encerrar a aba ou sair da conta; cálculo de preços e cupom validado no backend; checkout em 5 etapas.
- Pedido persistido em `orders` e `order_items`; simulação de pagamento sem inserir dados bancários.
- Página `pedido-sucesso.html` com detalhes consultados do banco e link para histórico.
- Histórico em `perfil.html` consultando **somente pedidos do usuário autenticado**.
- Administração protegida por `role='admin'` na API: dashboard, catálogo, clientes, pedidos e cupons.
- Rodapé em todas as páginas e retirada de credenciais de teste do login.

## ATUALIZAÇÃO DO SITE JÁ EXISTENTE (ordem obrigatória)

### 1. Supabase — migration (não apaga dados)
1. Supabase -> **SQL Editor**.
2. Abra `backend/sql/upgrade_gallery_coffee.sql`, copie o conteúdo e execute.
3. Verifique que agora existem a tabela `coupons` e as colunas `discount`, `coupon_code`, `delivery`, `payment_method` e `simulated` em `orders`.
4. **NÃO execute novamente `seed.js` em uma base já editada**, pois ele pode sobrescrever alterações de produtos.
5. Para um banco vazio, execute `backend/sql/schema.sql`, depois `backend/sql/upgrade_gallery_coffee.sql` e então `seed.js` (somente uma vez).

### 2. GitHub + Render — backend
1. Substitua os arquivos da pasta `backend` no repositório GitHub (principalmente `server.js` e SQL).
2. Faça um commit e push. O Render deve implantar esse novo commit (verifique o log **Deploy succeeded**).
3. No painel do Render, mantenha as chaves configuradas em **Environment**, com `FRONTEND_ORIGIN=https://gallery-coffee.infinityfree.me`.
4. Adicione **`DEMO_MODE=true`** no Render. Esta versão já assume `true` se a variável não estiver definida, mas definir explicitamente evita confusões.
5. Para o trabalho escolar, **não defina `MP_ACCESS_TOKEN`**. O webhook para pagamentos reais não foi implementado.
6. Confira `https://gallery-coffee.onrender.com/api/health` -> `{"ok":true}`.

### 3. InfinityFree — frontend
1. Entre no File Manager, pasta **`htdocs`**.
2. Envie os arquivos HTML do ZIP (`index.html`, `login.html`, `checkout.html`, `pedido-sucesso.html` etc.) e `style.css` para a **raiz do `htdocs`**.
3. Envie **todos** os arquivos de `js/` para **`htdocs/js/`**. Não deixe cópias antigas.
4. Envie `assets/` para **`htdocs/assets/`**.
5. Não envie a pasta `backend`, as chaves privadas nem `node_modules` para o InfinityFree.
6. Abra o site e pressione `Ctrl + Shift + R` para renovar arquivos no cache.
7. O `js/api.js` aponta para `https://gallery-coffee.onrender.com/api`.

### 4. Criar uma conta separada e exclusiva para o painel administrativo
A conta administrativa deve ser **diferente da conta pessoal de cliente**. Nunca escreva uma senha de administrador em HTML, JS do navegador, GitHub ou no README.

1. No Supabase, abra **Authentication -> Users -> Add user -> Create new user**.
2. Escolha o **e-mail do administrador** e uma **senha forte e exclusiva**. Marque **Auto confirm user**, se essa opção aparecer, para não depender dos 2 e-mails/hora do projeto. Guarde a senha em local privado, sem compartilhar no chat.
3. Abra o **SQL Editor**, copie `backend/sql/configurar_admin_unico.sql` e substitua `EMAIL_DO_ADMIN_AQUI` pelo **mesmo e-mail criado no passo anterior**.
4. Execute todo o arquivo. Ele deixa **somente essa conta** com `role='admin'`, remove a permissão de possíveis administradores anteriores e instala um índice único para impedir mais de um admin.
5. No site, clique **Sair** da conta atual e faça login com a conta administrativa. O login abre `admin.html` automaticamente. Entre com conta de cliente para confirmar que não tem acesso ao painel.

O login verifica o papel real em `public.profiles` a cada requisição administrativa (`/api/admin/*`), independentemente de valores manipulados no navegador. **Criar a conta no Auth sem executar o SQL não libera o painel.** O SQL não cria a conta por si só: é necessário defini-la no painel de Auth porque nenhum e-mail/senha de administrador veio com este ZIP.

## Roteiro de testes
1. Login com conta confirmada.
2. Produtos e preços vêm da API (edite um preço no painel, atualize o catálogo).
3. Adicione dois itens no carrinho, aplique `ARTE10` ou crie um cupom pelo painel admin.
4. Revise o total e finalize a **compra simulada**.
5. Confira a página `pedido-sucesso.html?id=...` e `perfil.html?aba=pedidos`.
6. Confira no Supabase as tabelas `orders` e `order_items`.
7. Entre com a conta **administrativa exclusiva**, visualize o pedido, mude seu status e cadastre/arquive um produto. Entre com um cliente para conferir que o painel está bloqueado.
8. No DevTools -> Network, confirme `POST /api/orders` = **201** e `POST /api/orders/{id}/simulate-payment` = **200**.

## Limitações importantes
- Não existe pagamento real, geração de QR Pix, cobrança de cartão nem entrega física.
- O backend escolar não debita estoque automaticamente após uma simulação. Estoque pode ser ajustado no admin.
- A listagem de clientes está limitada aos primeiros 200 perfis e a contagem usa até 2000 pedidos; adequada para demonstração pequena, não para produção.
- Carrinho, cupom aplicado, token e dados visuais da conta ficam em **sessionStorage**: persistem durante navegação/atualizações na mesma aba e normalmente desaparecem ao fechar a aba. O botão **Sair** limpa todos esses dados. Os carrinhos antigos em localStorage são descartados na primeira visita após atualização. Favoritos e endereço salvo continuam locais no navegador; catálogo, pedidos, usuários e cupons são da API/Supabase. Navegadores podem restaurar a sessão de uma aba fechada ao usar a função de restaurar abas; não tratar sessionStorage como revogação imediata do JWT.
- O Supabase padrão tem limite baixo para e-mails de confirmação. Crie e confirme as contas antes da apresentação.
- A segurança e conciliação necessárias para cobranças reais não estão implementadas. A rota webhook Mercado Pago continua com status 501.
- Não existe fluxo de refresh automático do token Supabase: pode ser necessário entrar de novo quando a sessão expirar.
- Nenhuma funcionalidade foi implantada automaticamente por este arquivo; siga a ordem de publicação acima.

## Segredos e boas práticas
**Nunca envie** o arquivo `backend/.env`, credenciais ou tokens JWT ao GitHub, ao InfinityFree ou a colegas. O `.env.example` fornecido contém apenas marcadores. Se alguma chave real estava no ZIP original ou foi compartilhada, **rotacione-a no Supabase e atualize o Render**.
