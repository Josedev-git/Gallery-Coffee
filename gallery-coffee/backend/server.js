import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference } from 'mercadopago';
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) if (!process.env[key]) throw Error(`Variavel ausente: ${key}`);
const adminDb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const authDb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const app = express(); app.disable('x-powered-by'); app.use(helmet());
app.use(cors({ origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5500').split(',') }));
app.use(express.json({ limit: '32kb' })); app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 150, standardHeaders: 'draft-7', legacyHeaders: false }));
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
async function user(req, res, next) { try { const token = (req.headers.authorization || '').replace(/^Bearer /i, ''); if (!token) return res.status(401).json({ error: 'Autenticacao necessaria' }); const { data, error } = await authDb.auth.getUser(token); if (error || !data.user) return res.status(401).json({ error: 'Token invalido' }); req.user = data.user; next() } catch (e) { next(e) } }
async function admin(req, res, next) { try { const { data, error } = await adminDb.from('profiles').select('role').eq('id', req.user.id).single(); if (error || data?.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito' }); next() } catch (e) { next(e) } }
function dbCheck(result) { if (result.error) throw result.error; return result.data }
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/collections', wrap(async (req, res) => res.json(dbCheck(await adminDb.from('collections').select('*').order('name')))));
app.get('/api/products', wrap(async (req, res) => res.json(dbCheck(await adminDb.from('products').select('*').eq('active', true).order('name')))));
app.get('/api/products/:id', wrap(async (req, res) => { const { data, error } = await adminDb.from('products').select('*').eq('id', req.params.id).eq('active', true).maybeSingle(); if (error) throw error; if (!data) return res.status(404).json({ error: 'Produto nao encontrado' }); res.json(data) }));
app.post('/api/auth/register', wrap(async (req, res) => { const { email, password, name } = req.body; if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8 || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Nome, email e senha de pelo menos 8 caracteres obrigatorios' }); const { data, error } = await authDb.auth.signUp({ email, password, options: { data: { name: name.trim().slice(0, 120) } } }); if (error) return res.status(400).json({ error: error.message }); res.status(201).json({ user: data.user, session: data.session, requiresEmailConfirmation: !data.session }) }));
app.post('/api/auth/login', wrap(async (req, res) => { const { data, error } = await authDb.auth.signInWithPassword({ email: req.body.email, password: req.body.password }); if (error) return res.status(401).json({ error: 'Credenciais invalidas' }); res.json({ user: data.user, session: data.session }) }));
app.post('/api/auth/recover', wrap(async (req, res) => { if (typeof req.body.email !== 'string') return res.status(400).json({ error: 'Email obrigatorio' }); await authDb.auth.resetPasswordForEmail(req.body.email); res.json({ message: 'Se o email existir, voce recebera instrucoes' }) }));
app.get('/api/me', user, wrap(async (req, res) => { const { data } = await adminDb.from('profiles').select('name,role').eq('id', req.user.id).single(); res.json({ id: req.user.id, email: req.user.email, name: data?.name || '', role: data?.role || 'customer' }) }));
app.get('/api/orders', user, wrap(async (req, res) => res.json(dbCheck(await adminDb.from('orders').select('*,order_items(*)').eq('user_id', req.user.id).order('created_at', { ascending: false })))));
app.post('/api/orders', user, wrap(async (req, res) => {
    const items = req.body.items, address = req.body.address, delivery = req.body.delivery;
    if (!Array.isArray(items) || !items.length || items.length > 30 || !address || typeof address !== 'object' || typeof address.cep !== 'string' || typeof address.rua !== 'string' || typeof address.cidade !== 'string' || !['normal', 'expressa'].includes(delivery)) return res.status(400).json({ error: 'Pedido invalido' });
    const ids = items.map(i => i.id); if (new Set(ids).size !== ids.length || items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 50)) return res.status(400).json({ error: 'Itens invalidos' });
    const products = dbCheck(await adminDb.from('products').select('id,name,price,stock').in('id', ids).eq('active', true));
    if (products.length !== ids.length) return res.status(400).json({ error: 'Produto indisponivel' });
    const rows = items.map(i => { const p = products.find(x => x.id === i.id); if (p.stock < i.quantity) throw Object.assign(Error('Estoque insuficiente: ' + p.name), { status: 409 }); return { product_id: p.id, quantity: i.quantity, unit_price: p.price, name: p.name } });
    const subtotal = Math.round(rows.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0) * 100) / 100;
    const shipping = delivery === 'expressa' ? 24.9 : (subtotal >= 200 ? 0 : 14.9); const total = Math.round((subtotal + shipping) * 100) / 100;
    const order = dbCheck(await adminDb.from('orders').insert({ user_id: req.user.id, subtotal, shipping, total, address, status: 'pending' }).select().single());
    const { error } = await adminDb.from('order_items').insert(rows.map(r => ({ ...r, order_id: order.id })));
    if (error) { await adminDb.from('orders').delete().eq('id', order.id); throw error }
    res.status(201).json({ orderId: order.id, status: 'pending', total, paymentEnabled: !!process.env.MP_ACCESS_TOKEN });
}));
app.post('/api/orders/:id/payment', user, wrap(async (req, res) => {
    if (!process.env.MP_ACCESS_TOKEN) return res.status(503).json({ error: 'Pagamento ainda nao configurado' });
    const { data: order, error } = await adminDb.from('orders').select('*,order_items(*)').eq('id', req.params.id).eq('user_id', req.user.id).single(); if (error || !order) return res.status(404).json({ error: 'Pedido nao encontrado' });
    if (order.status !== 'pending') return res.status(409).json({ error: 'Pedido nao esta pendente' });
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const pref = await new Preference(client).create({ body: { items: order.order_items.map(i => ({ id: i.product_id, title: i.name, quantity: i.quantity, unit_price: Number(i.unit_price), currency_id: 'BRL' })).concat(order.shipping > 0 ? [{ id: 'shipping', title: 'Frete', quantity: 1, unit_price: Number(order.shipping), currency_id: 'BRL' }] : []), external_reference: order.id, notification_url: process.env.PUBLIC_API_URL ? `${process.env.PUBLIC_API_URL}/api/payments/webhook` : undefined } });
    res.json({ checkoutUrl: pref.init_point, sandboxUrl: pref.sandbox_init_point });
}));
// Webhook de pagamento deliberadamente NAO marca pedidos como pagos sem validacao de assinatura e consulta ao provedor.
app.post('/api/payments/webhook', (req, res) => res.status(501).json({ error: 'Webhook seguro pendente de implementacao. Nao habilite vendas reais.' }));
app.get('/api/admin/orders', user, admin, wrap(async (req, res) => res.json(dbCheck(await adminDb.from('orders').select('*,order_items(*)').order('created_at', { ascending: false })))));
app.post('/api/admin/products', user, admin, wrap(async (req, res) => { const p = req.body; if (typeof p.id !== 'string' || typeof p.name !== 'string' || !Number.isFinite(p.price) || p.price < 0 || !Number.isInteger(p.stock) || p.stock < 0) return res.status(400).json({ error: 'Dados invalidos' }); const allowed = ['id', 'name', 'collection_id', 'price', 'old_price', 'stock', 'description', 'image', 'capacity', 'material', 'dimensions', 'care', 'active']; const clean = Object.fromEntries(Object.entries(p).filter(([k]) => allowed.includes(k))); res.status(201).json(dbCheck(await adminDb.from('products').insert(clean).select().single())) }));
app.patch('/api/admin/products/:id', user, admin, wrap(async (req, res) => { const allowed = ['name', 'collection_id', 'price', 'old_price', 'stock', 'description', 'image', 'capacity', 'material', 'dimensions', 'care', 'active']; const clean = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k))); if (!Object.keys(clean).length || ('price' in clean && (!Number.isFinite(clean.price) || clean.price < 0)) || ('stock' in clean && (!Number.isInteger(clean.stock) || clean.stock < 0))) return res.status(400).json({ error: 'Dados invalidos' }); res.json(dbCheck(await adminDb.from('products').update(clean).eq('id', req.params.id).select().single())) }));
app.use((err, req, res, next) => { console.error(err); res.status(err.status || 500).json({ error: err.status ? err.message : 'Erro interno no servidor' }) });
app.listen(Number(process.env.PORT) || 3000, () => console.log('Gallery Coffee API online'));
