
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Modo escolar: nenhuma transacao real. Para producao, definir DEMO_MODE=false.
const DEMO_MODE = process.env.DEMO_MODE !== 'false';
const moeda = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// VARIAVEIS DE AMBIENTE
const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const key of required) {
  if (!process.env[key]) {
    throw Error(`Variavel ausente: ${key}`);
  }
}

// CONEXAO COM SUPABASE
const adminDb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const authDb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// CONFIGURACAO DO EXPRESS
const app = express();

app.disable('x-powered-by');

// CORS - INFINITYFREE
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ||
  'http://localhost:5500'
)
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''));

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());

app.use(express.json({ limit: '32kb' }));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

// TRATAMENTO DE ERROS ASSINCRONOS
const wrap = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// AUTENTICACAO
async function user(req, res, next) {
  try {
    const token = (req.headers.authorization || '')
      .replace(/^Bearer /i, '');

    if (!token) {
      return res.status(401).json({
        error: 'Autenticacao necessaria'
      });
    }

    const { data, error } = await authDb.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: 'Token invalido'
      });
    }

    req.user = data.user;
    next();
  } catch (e) {
    next(e);
  }
}

// PERMISSAO DE ADMINISTRADOR
async function admin(req, res, next) {
  try {
    const { data, error } = await adminDb
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || data?.role !== 'admin') {
      return res.status(403).json({
        error: 'Acesso restrito'
      });
    }

    next();
  } catch (e) {
    next(e);
  }
}

// VALIDACAO DO BANCO
function dbCheck(result) {
  if (result.error) throw result.error;
  return result.data;
}

// STATUS DA API
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// COLECOES
app.get('/api/collections', wrap(async (req, res) => {
  const result = await adminDb
    .from('collections')
    .select('*')
    .order('name');

  res.json(dbCheck(result));
}));

// LISTAR PRODUTOS
app.get('/api/products', wrap(async (req, res) => {
  const result = await adminDb
    .from('products')
    .select('*')
    .eq('active', true)
    .order('name');

  res.json(dbCheck(result));
}));

// BUSCAR PRODUTO
app.get('/api/products/:id', wrap(async (req, res) => {
  const { data, error } = await adminDb
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .eq('active', true)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return res.status(404).json({
      error: 'Produto nao encontrado'
    });
  }

  res.json(data);
}));

// CADASTRAR USUARIO
app.post('/api/auth/register', wrap(async (req, res) => {
  const { email, password, name } = req.body;

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    password.length < 8 ||
    typeof name !== 'string' ||
    !name.trim()
  ) {
    return res.status(400).json({
      error: 'Nome, email e senha de pelo menos 8 caracteres obrigatorios'
    });
  }

  const { data, error } = await authDb.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name.trim().slice(0, 120)
      }
    }
  });

  if (error) {
    return res.status(400).json({
      error: error.message
    });
  }

  res.status(201).json({
    user: data.user,
    session: data.session,
    requiresEmailConfirmation: !data.session
  });
}));

// LOGIN
app.post('/api/auth/login', wrap(async (req, res) => {
  const { data, error } = await authDb.auth.signInWithPassword({
    email: req.body.email,
    password: req.body.password
  });

  if (error) {
    return res.status(401).json({
      error: 'Credenciais invalidas'
    });
  }

  res.json({
    user: data.user,
    session: data.session
  });
}));

// RECUPERAR SENHA
app.post('/api/auth/recover', wrap(async (req, res) => {
  if (typeof req.body.email !== 'string') {
    return res.status(400).json({
      error: 'Email obrigatorio'
    });
  }

  await authDb.auth.resetPasswordForEmail(req.body.email);

  res.json({
    message: 'Se o email existir, voce recebera instrucoes'
  });
}));

// PERFIL
app.get('/api/me', user, wrap(async (req, res) => {
  const { data } = await adminDb
    .from('profiles')
    .select('name,role')
    .eq('id', req.user.id)
    .single();

  res.json({
    id: req.user.id,
    email: req.user.email,
    name: data?.name || '',
    role: data?.role || 'customer'
  });
}));

// PEDIDOS DO USUARIO
app.get('/api/orders', user, wrap(async (req, res) => {
  const result = await adminDb
    .from('orders')
    .select('*,order_items(*)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  res.json(dbCheck(result));
}));

// CRIAR PEDIDO
app.post('/api/orders', user, wrap(async (req, res) => {
  const items = req.body.items;
  const address = req.body.address;
  const delivery = req.body.delivery;
  const couponCode = typeof req.body.couponCode === 'string' ? req.body.couponCode.trim().toUpperCase() : '';

  if (
    !Array.isArray(items) ||
    !items.length ||
    items.length > 30 ||
    !address ||
    typeof address !== 'object' ||
    typeof address.cep !== 'string' ||
    typeof address.rua !== 'string' ||
    typeof address.cidade !== 'string' ||
    !['normal', 'expressa'].includes(delivery)
  ) {
    return res.status(400).json({
      error: 'Pedido invalido'
    });
  }

  const ids = items.map(i => i.id);

  if (
    new Set(ids).size !== ids.length ||
    items.some(i =>
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > 50
    )
  ) {
    return res.status(400).json({
      error: 'Itens invalidos'
    });
  }

  const products = dbCheck(
    await adminDb
      .from('products')
      .select('id,name,price,stock')
      .in('id', ids)
      .eq('active', true)
  );

  if (products.length !== ids.length) {
    return res.status(400).json({
      error: 'Produto indisponivel'
    });
  }

  const rows = items.map(i => {
    const p = products.find(x => x.id === i.id);

    if (p.stock < i.quantity) {
      throw Object.assign(
        Error('Estoque insuficiente: ' + p.name),
        { status: 409 }
      );
    }

    return {
      product_id: p.id,
      quantity: i.quantity,
      unit_price: p.price,
      name: p.name
    };
  });

  const subtotal = Math.round(
    rows.reduce(
      (sum, item) =>
        sum + Number(item.unit_price) * item.quantity,
      0
    ) * 100
  ) / 100;

  const shipping = delivery === 'expressa'
    ? 24.9
    : subtotal >= 200 ? 0 : 14.9;

  let desconto = 0;
  if (couponCode) {
    if (!/^[A-Z0-9_-]{3,24}$/.test(couponCode)) {
      return res.status(400).json({ error: 'Cupom invalido' });
    }
    const { data: coupon, error: couponError } = await adminDb
      .from('coupons').select('*').eq('code', couponCode).maybeSingle();
    if (couponError) throw couponError;
    if (!coupon || !coupon.active || (coupon.expires_at && Date.parse(coupon.expires_at) <= Date.now())) {
      return res.status(400).json({ error: 'Cupom invalido ou expirado' });
    }
    desconto = moeda(subtotal * coupon.discount_percent / 100);
  }
  const total = moeda(subtotal - desconto + shipping);

  const order = dbCheck(
    await adminDb
      .from('orders')
      .insert({
        user_id: req.user.id,
        subtotal,
        shipping,
        discount: desconto,
        coupon_code: couponCode || null,
        delivery,
        total,
        address,
        status: 'pending'
      })
      .select()
      .single()
  );

  const { error } = await adminDb
    .from('order_items')
    .insert(
      rows.map(item => ({
        ...item,
        order_id: order.id
      }))
    );

  if (error) {
    await adminDb
      .from('orders')
      .delete()
      .eq('id', order.id);

    throw error;
  }

  res.status(201).json({
    orderId: order.id,
    status: 'pending',
    total,
    discount: desconto,
    demoMode: DEMO_MODE,
    paymentEnabled: !!process.env.MP_ACCESS_TOKEN && !DEMO_MODE
  });
}));

// CONFIRMACAO SIMULADA: sem dados de cartao, PIX ou cobranca financeira.
app.post('/api/orders/:id/simulate-payment', user, wrap(async (req, res) => {
  if (!DEMO_MODE) return res.status(403).json({ error: 'Simulacao desabilitada' });
  const method = req.body.method;
  if (!['pix', 'cartao'].includes(method)) return res.status(400).json({ error: 'Metodo simulado invalido' });
  const { data: order, error } = await adminDb.from('orders')
    .select('id,status,simulated').eq('id', req.params.id).eq('user_id', req.user.id).maybeSingle();
  if (error) throw error;
  if (!order) return res.status(404).json({ error: 'Pedido nao encontrado' });
  if (order.status === 'paid' && order.simulated) return res.json({ status: 'paid', simulated: true });
  if (order.status !== 'pending') return res.status(409).json({ error: 'Pedido nao esta pendente' });
  const updated = await adminDb.from('orders')
    .update({ status: 'paid', simulated: true, payment_method: method })
    .eq('id', order.id).eq('user_id', req.user.id).eq('status', 'pending')
    .select('id,status,simulated').maybeSingle();
  if (updated.error) throw updated.error;
  if (!updated.data) return res.status(409).json({ error: 'Pedido alterado durante a simulacao' });
  res.json({ status: 'paid', simulated: true });
}));

// CUPONS: somente leitura e validacao no navegador; desconto final e sempre recalculado no servidor.
app.get('/api/coupons/:code', wrap(async (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return res.status(404).json({ error: 'Cupom nao encontrado' });
  const { data, error } = await adminDb.from('coupons')
    .select('code,discount_percent,active,expires_at').eq('code', code).maybeSingle();
  if (error) throw error;
  if (!data || !data.active || (data.expires_at && Date.parse(data.expires_at) <= Date.now())) {
    return res.status(404).json({ error: 'Cupom invalido ou expirado' });
  }
  res.json({ code: data.code, discountPercent: data.discount_percent });
}));

// PAGAMENTO MERCADO PAGO
app.post('/api/orders/:id/payment', user, wrap(async (req, res) => {
  if (DEMO_MODE) return res.status(403).json({ error: 'Pagamentos reais desabilitados no projeto escolar' });
  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(503).json({
      error: 'Pagamento ainda nao configurado'
    });
  }

  const { data: order, error } = await adminDb
    .from('orders')
    .select('*,order_items(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error || !order) {
    return res.status(404).json({
      error: 'Pedido nao encontrado'
    });
  }

  if (order.status !== 'pending') {
    return res.status(409).json({
      error: 'Pedido nao esta pendente'
    });
  }

  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
  });

  const items = order.order_items.map(item => ({
    id: item.product_id,
    title: item.name,
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    currency_id: 'BRL'
  }));

  if (order.shipping > 0) {
    items.push({
      id: 'shipping',
      title: 'Frete',
      quantity: 1,
      unit_price: Number(order.shipping),
      currency_id: 'BRL'
    });
  }

  const pref = await new Preference(client).create({
    body: {
      items,
      external_reference: order.id,
      notification_url: process.env.PUBLIC_API_URL
        ? `${process.env.PUBLIC_API_URL}/api/payments/webhook`
        : undefined
    }
  });

  res.json({
    checkoutUrl: pref.init_point,
    sandboxUrl: pref.sandbox_init_point
  });
}));

// WEBHOOK - AINDA NAO IMPLEMENTADO
// Nao habilitar vendas reais antes de validar
// notificacoes e confirmar pagamentos.
app.post('/api/payments/webhook', (req, res) => {
  res.status(501).json({
    error: 'Webhook seguro pendente de implementacao. Nao habilite vendas reais.'
  });
});

// ADMIN - LISTAR PEDIDOS
app.get('/api/admin/orders', user, admin, wrap(async (req, res) => {
  const result = await adminDb
    .from('orders')
    .select('*,order_items(*)')
    .order('created_at', { ascending: false });

  res.json(dbCheck(result));
}));

// ADMIN: produtos de todas as situacoes, incluindo arquivados.
app.get('/api/admin/products', user, admin, wrap(async (req, res) => {
  res.json(dbCheck(await adminDb.from('products').select('*').order('name')));
}));

// ADMIN: clientes reais do Supabase Auth e contagem de pedidos.
app.get('/api/admin/customers', user, admin, wrap(async (req, res) => {
  const profiles = dbCheck(await adminDb.from('profiles').select('id,name,role').order('created_at', { ascending: false }).limit(200));
  const orders = dbCheck(await adminDb.from('orders').select('user_id').limit(2000));
  const counts = new Map();
  orders.forEach(o => counts.set(o.user_id, (counts.get(o.user_id) || 0) + 1));
  const { data: authUsers, error } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const emails = new Map(authUsers.users.map(u => [u.id, u.email]));
  res.json(profiles.map(p => ({ id: p.id, name: p.name, role: p.role,
    email: emails.get(p.id) || '', orders: counts.get(p.id) || 0 })));
}));

// ADMIN: editar o status das compras escolares (nunca confirma um pagamento real).
app.patch('/api/admin/orders/:id', user, admin, wrap(async (req, res) => {
  if (!DEMO_MODE) return res.status(403).json({ error: 'Alteracao manual de status desabilitada' });
  const status = req.body.status;
  if (!['pending', 'paid', 'shipped', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Status invalido' });
  }
  const order = dbCheck(await adminDb.from('orders').select('id,status,simulated')
    .eq('id', req.params.id).maybeSingle());
  if (!order) return res.status(404).json({ error: 'Pedido nao encontrado' });
  if (status === 'shipped' && order.status !== 'paid' && order.status !== 'shipped') {
    return res.status(409).json({ error: 'Somente pedidos pagos/simulados podem ser enviados' });
  }
  if (status === 'paid' && !order.simulated) {
    return res.status(409).json({ error: 'Apenas pedidos com pagamento escolar simulado podem ser marcados como pagos' });
  }
  const result = await adminDb.from('orders').update({ status }).eq('id', order.id).select().single();
  res.json(dbCheck(result));
}));

// ADMIN: gerenciamento de cupons.
app.get('/api/admin/coupons', user, admin, wrap(async (req, res) => {
  res.json(dbCheck(await adminDb.from('coupons').select('*').order('created_at', { ascending: false })));
}));
app.post('/api/admin/coupons', user, admin, wrap(async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const pct = Number(req.body.discount_percent);
  if (!/^[A-Z0-9_-]{3,24}$/.test(code) || !Number.isInteger(pct) || pct < 1 || pct > 70) {
    return res.status(400).json({ error: 'Codigo ou desconto invalido (1 a 70%)' });
  }
  const expires = req.body.expires_at || null;
  if (expires && !Number.isFinite(Date.parse(expires))) return res.status(400).json({ error: 'Validade invalida' });
  const result = await adminDb.from('coupons')
    .insert({ code, discount_percent: pct, expires_at: expires, active: true }).select().single();
  if (result.error?.code === '23505') return res.status(409).json({ error: 'Cupom ja existe' });
  res.status(201).json(dbCheck(result));
}));
app.patch('/api/admin/coupons/:code', user, admin, wrap(async (req, res) => {
  const fields = {};
  if ('active' in req.body) {
    if (typeof req.body.active !== 'boolean') return res.status(400).json({ error: 'Status invalido' });
    fields.active = req.body.active;
  }
  if ('discount_percent' in req.body) {
    if (!Number.isInteger(req.body.discount_percent) || req.body.discount_percent < 1 || req.body.discount_percent > 70) {
      return res.status(400).json({ error: 'Desconto deve ser entre 1% e 70%' });
    }
    fields.discount_percent = req.body.discount_percent;
  }
  if ('expires_at' in req.body) {
    if (req.body.expires_at !== null && !Number.isFinite(Date.parse(req.body.expires_at))) {
      return res.status(400).json({ error: 'Data de validade invalida' });
    }
    fields.expires_at = req.body.expires_at;
  }
  if (!Object.keys(fields).length) return res.status(400).json({ error: 'Nenhuma alteracao enviada' });
  const result = await adminDb.from('coupons').update(fields)
    .eq('code', req.params.code.toUpperCase()).select().maybeSingle();
  const data = dbCheck(result);
  if (!data) return res.status(404).json({ error: 'Cupom nao encontrado' });
  res.json(data);
}));

// ADMIN - CADASTRAR PRODUTO
app.post('/api/admin/products', user, admin, wrap(async (req, res) => {
  const p = req.body;

  if (
    typeof p.id !== 'string' ||
    typeof p.name !== 'string' ||
    !Number.isFinite(p.price) ||
    p.price < 0 ||
    p.id.length > 60 || !/^[a-zA-Z0-9_-]+$/.test(p.id) ||
    !Number.isInteger(p.stock) ||
    p.stock < 0
  ) {
    return res.status(400).json({
      error: 'Dados invalidos'
    });
  }

  const allowed = [
    'id', 'name', 'collection_id', 'price',
    'old_price', 'stock', 'description', 'image',
    'capacity', 'material', 'dimensions', 'care', 'active'
  ];

  const clean = Object.fromEntries(
    Object.entries(p).filter(([key]) => allowed.includes(key))
  );

  const result = await adminDb
    .from('products')
    .insert(clean)
    .select()
    .single();

  res.status(201).json(dbCheck(result));
}));

// ADMIN - EDITAR PRODUTO
app.patch('/api/admin/products/:id', user, admin, wrap(async (req, res) => {
  const allowed = [
    'name', 'collection_id', 'price', 'old_price',
    'stock', 'description', 'image', 'capacity',
    'material', 'dimensions', 'care', 'active'
  ];

  const clean = Object.fromEntries(
    Object.entries(req.body)
      .filter(([key]) => allowed.includes(key))
  );

  if (
    !Object.keys(clean).length ||
    (
      'price' in clean &&
      (!Number.isFinite(clean.price) || clean.price < 0)
    ) ||
    (
      'stock' in clean &&
      (!Number.isInteger(clean.stock) || clean.stock < 0)
    )
  ) {
    return res.status(400).json({
      error: 'Dados invalidos'
    });
  }

  const result = await adminDb
    .from('products')
    .update(clean)
    .eq('id', req.params.id)
    .select()
    .single();

  res.json(dbCheck(result));
}));

// TRATAMENTO GLOBAL DE ERROS
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error: err.status
      ? err.message
      : 'Erro interno no servidor'
  });
});

// INICIAR SERVIDOR
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Gallery Coffee API online na porta ${PORT}`);
});
