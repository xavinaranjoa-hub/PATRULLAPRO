import React, { useEffect, useMemo, useState } from "react";

/**
 * Patrulla Pro – SPA (React + Tailwind via CDN)
 * Catálogo + filtros, ficha con múltiples fotos, carrito,
 * checkout por WhatsApp o Payphone (placeholder),
 * verificación por WhatsApp y panel admin básico.
 */

// === Config ===
const WHATSAPP_NUMBER = "593979362853"; // tu número
const WEBHOOK_URL = "https://example.com/your-webhook"; // TODO: cambia cuando tengas endpoint
const LS_KEY_VERIF = "pp_verifications";
const LS_KEY_ADMIN = "pp_admin_token";
const LS_KEY_PRODUCTS = "pp_products";
const ADMIN_PASSWORD = "PatrullaPro#2025"; // cámbiala en producción

// === Utils ===
function buildWhatsAppURL({ name, entity }) {
  const message = `Solicitud de verificación – Patrulla Pro

Nombre: ${name}
Entidad: ${entity}

Adjunto credencial para acceso a la Línea Institucional.`;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
function buildWhatsAppOrderURL({ items, total, wantsPayphone }) {
  const lines = [
    `Nuevo pedido – Patrulla Pro`,
    `Items:`,
    ...items.map(i => `• ${i.qty} x ${i.name} (${i.price})`),
    `Total: ${total}`,
    wantsPayphone ? `Preferencia de pago: Payphone` : `Preferencia de pago: WhatsApp`,
    `\nPara finalizar, por favor confirme su identidad (carnet / credencial).`
  ];
  const encoded = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
function currency(num) { return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(num); }
function getPendingLocal() { try { return JSON.parse(localStorage.getItem(LS_KEY_VERIF) || "[]"); } catch { return []; } }
function setPendingLocal(arr) { try { localStorage.setItem(LS_KEY_VERIF, JSON.stringify(arr)); } catch {} }
function appendPendingLocal(payload) { const arr = getPendingLocal(); arr.push(payload); setPendingLocal(arr); }
function buildCSVFrom(rows) {
  const headers = ["timestamp","name","entity","page","ua","source"];
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const out = [headers.join(",")];
  for (const r of rows || []) out.push(headers.map(h => esc(r[h])).join(","));
  return out.join("\n");
}
async function postWebhook(payload) {
  if (!WEBHOOK_URL || WEBHOOK_URL.includes("example.com")) throw new Error("Webhook no configurado");
  const res = await fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}
async function logVerification({ name, entity }) {
  const payload = { name, entity, source: "verification", page: typeof window !== "undefined" ? window.location.href : "", ua: typeof navigator !== "undefined" ? navigator.userAgent : "", timestamp: new Date().toISOString() };
  try { await postWebhook(payload); return { ok: true, via: "webhook", payload }; }
  catch (err) { appendPendingLocal(payload); return { ok: true, via: "local", payload, error: String(err) }; }
}
async function logOrder({ items, total, method }) {
  const payload = { source: "order", items, total, method, page: typeof window !== "undefined" ? window.location.href : "", ua: typeof navigator !== "undefined" ? navigator.userAgent : "", timestamp: new Date().toISOString() };
  try { await postWebhook(payload); return { ok: true, via: "webhook" }; }
  catch { return { ok: true, via: "local" }; }
}
async function retryPending() {
  const arr = getPendingLocal();
  if (!arr.length) return { tried: 0, sent: 0 };
  let sent = 0; const remaining = [];
  for (const item of arr) { try { await postWebhook(item); sent++; } catch { remaining.push(item); } }
  setPendingLocal(remaining);
  return { tried: arr.length, sent };
}

// === Productos demo (editables luego desde Admin) ===
const seed = {
  locked: [
    { id: 11, name: "Camisa reglamentaria PN (ML/MC)", price: "Solo miembros", photos: [
      "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520975922203-b4ea23a3f257?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 12, name: "Pantalón reglamentario", price: "Solo miembros", photos: [
      "https://images.unsplash.com/photo-1556909212-d5c2b51f7f6a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 13, name: "Chaqueta rompeviento policial", price: "Solo miembros", photos: [
      "https://images.unsplash.com/photo-1592329421742-5a6f2e3c0b80?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 14, name: "Chaleco reflectivo tránsito", price: "Solo miembros", photos: [
      "https://images.unsplash.com/photo-1485115905815-74a5c9fda2d6?q=80&w=800&auto=format&fit=crop"
    ] },
  ],
  tactica: [
    { id: 1, name: "Camisa táctica Dry-Fit", price: "$29.90", photos: [
      "https://images.unsplash.com/photo-1604589093750-1d6a8fdc70bc?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520975922203-b4ea23a3f257?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 2, name: "Mochila táctica 35L", price: "$49.90", photos: [
      "https://images.unsplash.com/photo-1549049950-48d5887197c7?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603575449427-833c7d2dbf9c?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 3, name: "Guantes de servicio", price: "$19.90", photos: [
      "https://images.unsplash.com/photo-1603575449427-833c7d2dbf9c?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 4, name: "Linterna LED recargable", price: "$24.90", photos: [
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 5, name: "Gorra personalizada", price: "$14.90", photos: [
      "https://images.unsplash.com/photo-1520975922203-b4ea23a3f257?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 6, name: "Reloj táctico resistente", price: "$39.90", photos: [
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020a?q=80&w=800&auto=format&fit=crop"
    ] },
  ],
  accesorios: [
    { id: 7, name: "Termo acero 1L", price: "$16.90", photos: [
      "https://images.unsplash.com/photo-1558640478-99ac7f734e8d?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 8, name: "Pulsera paracord", price: "$8.90", photos: [
      "https://images.unsplash.com/photo-1520974722070-629c0d11a6b3?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 9, name: "Radio corto alcance", price: "$34.90", photos: [
      "https://images.unsplash.com/photo-1617038260893-1f7b5fdc5b3c?q=80&w=800&auto=format&fit=crop"
    ] },
    { id: 10, name: "Power bank reforzado", price: "$22.90", photos: [
      "https://images.unsplash.com/photo-1611259184066-5e5c9cf0a1a3?q=80&w=800&auto=format&fit=crop"
    ] },
  ],
};

function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY_PRODUCTS) || "null");
    if (saved) return saved;
    localStorage.setItem(LS_KEY_PRODUCTS, JSON.stringify(seed));
    return seed;
  } catch { return seed; }
}
function saveProducts(data) { try { localStorage.setItem(LS_KEY_PRODUCTS, JSON.stringify(data)); } catch {} }

// === Root App ===
export default function PatrullaProApp() {
  const [admin, setAdmin] = useState(() => !!localStorage.getItem(LS_KEY_ADMIN));
  const [cart, setCart] = useState([]); // {id,name,priceNum,price,qty}

  function handleLogout() { localStorage.removeItem(LS_KEY_ADMIN); setAdmin(false); }

  function addToCart(p, qty=1) {
    const priceNum = typeof p.price === 'string' && p.price.startsWith('$') ? parseFloat(p.price.slice(1)) : 0;
    setCart(prev => {
      const idx = prev.findIndex(it => it.id === p.id);
      if (idx>=0) { const next=[...prev]; next[idx] = {...next[idx], qty: next[idx].qty + qty}; return next; }
      return [...prev, { id: p.id, name: p.name, price: p.price, priceNum, qty }];
    });
  }
  function removeFromCart(id) { setCart(prev => prev.filter(i => i.id !== id)); }
  function updateQty(id, qty) { setCart(prev => prev.map(i => i.id===id? {...i, qty: Math.max(1, qty)} : i)); }
  const cartTotal = useMemo(() => currency(cart.reduce((s,i)=> s + i.priceNum * i.qty, 0)), [cart]);

  return (
    <div className="min-h-screen bg-[#0B1D3A] text-white">
      {admin ? (
        <AdminPanel onLogout={handleLogout} />
      ) : (
        <ClientView onAdminLogin={() => setAdmin(true)} onAddCart={addToCart} cart={cart} onRemoveCart={removeFromCart} onUpdateQty={updateQty} cartTotal={cartTotal} />
      )}
      <CookieConsent />
    </div>
  );
}

// === Vista Cliente (tienda) ===
function ClientView({ onAdminLogin, onAddCart, cart, onRemoveCart, onUpdateQty, cartTotal }) {
  const [openVerify, setOpenVerify] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("relevance");
  const [filters, setFilters] = useState({ cats: { locked:true, tactica:true, accesorios:true }, priceMin: '', priceMax: '' });
  const products = useMemo(() => loadProducts(), []);

  const priceToNumber = (price) => {
    if (!price) return Infinity;
    const match = String(price).match(/\$([0-9]+(?:\.[0-9]{1,2})?)/);
    return match ? parseFloat(match[1]) : (price === 'Solo miembros' ? Infinity : Infinity);
  };
  const inPriceRange = (p) => {
    const val = priceToNumber(p.price);
    const min = Number(filters.priceMin) || 0;
    const max = Number(filters.priceMax) || Infinity;
    return val >= min && val <= max;
  };
  const filterList = (list, section) => list
    .filter(p => filters.cats[section])
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .filter(inPriceRange);
  const sortList = (list) => {
    switch (sort) {
      case 'price_asc': return [...list].sort((a,b)=> priceToNumber(a.price) - priceToNumber(b.price));
      case 'price_desc': return [...list].sort((a,b)=> priceToNumber(b.price) - priceToNumber(a.price));
      case 'name_asc': return [...list].sort((a,b)=> a.name.localeCompare(b.name));
      default: return list;
    }
  };
  const filtered = {
    locked: sortList(filterList(products.locked, 'locked')),
    tactica: sortList(filterList(products.tactica, 'tactica')),
    accesorios: sortList(filterList(products.accesorios, 'accesorios')),
  };

  // Tests mini (no interrumpen)
  useEffect(() => {
    const T = [];
    ["#inicio","#institucional","#tactica","#accesorios","#faq","#contacto"].forEach(sel => T.push({ test: sel+" existe", pass: !!document.querySelector(sel) }));
    const url = buildWhatsAppURL({ name: 'Test', entity: 'Policía Nacional' });
    T.push({ test: 'wa.me', pass: url.includes('wa.me') && url.includes('text=') });
    const sample = buildCSVFrom([{ timestamp:'t', name:'n', entity:'e', page:'p', ua:'u', source:'s' }]);
    T.push({ test: 'CSV join newline', pass: sample.split("\n").length === 2 });
    console.table(T);
  }, []);

  async function beginCheckout(method) {
    const items = cart.map(i => ({ name: i.name, qty: i.qty, price: i.price }));
    const total = cartTotal;
    if (method === 'whatsapp') {
      const url = buildWhatsAppOrderURL({ items, total, wantsPayphone:false });
      window.open(url, '_blank') || (window.location.href = url);
    } else if (method === 'payphone') {
      const url = buildWhatsAppOrderURL({ items, total, wantsPayphone:true });
      alert('Simulando Payphone: integración real pendiente');
      window.open(url, '_blank') || (window.location.href = url);
    }
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0B1D3A]/90 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#FFD700]/10 border border-[#FFD700]/40 grid place-content-center"><span className="text-[#FFD700] font-black">PP</span></div>
            <span className="tracking-widest text-xl font-extrabold">PATRULLA PRO</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#inicio" className="hover:text-[#FFD700]">Inicio</a>
            <a href="#institucional" className="hover:text-[#FFD700]">Línea Institucional</a>
            <a href="#tactica" className="hover:text-[#FFD700]">Línea Táctica</a>
            <a href="#accesorios" className="hover:text-[#FFD700]">Accesorios</a>
            <a href="#faq" className="hover:text-[#FFD700]">FAQ</a>
            <a href="#contacto" className="hover:text-[#FFD700]">Contacto</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={()=> setOpenVerify(true)} className="rounded-xl bg-[#FFD700] text-[#0B1D3A] font-semibold px-4 py-2">Acceso Miembros</button>
            <button onClick={()=> setOpenCart(true)} className="rounded-xl bg-white/10 border border-white/20 px-3 py-2">🛒 {cart.reduce((s,i)=> s+i.qty, 0)}</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">Equipamiento exclusivo para quienes <span className="text-[#FFD700]">nos protegen</span></h1>
        <p className="mt-4 text-white/80 md:text-lg">Uniformes restringidos, ropa táctica y tecnología. Envíos en Ecuador.</p>
      </section>

      {/* Institucional */}
      <Section id="institucional" title="Línea Institucional" subtitle="Acceso solo para miembros verificados (Policía, FF.AA., Tránsito)">
        <ProductGrid list={filtered.locked} locked onAdd={onAddCart} onLocked={()=> setOpenVerify(true)} />
        <div className="mt-6 flex justify-center">
          <button onClick={() => setOpenVerify(true)} className="rounded-xl bg-[#FFD700] text-[#0B1D3A] font-semibold px-6 py-3">Solicitar verificación</button>
        </div>
      </Section>

      {/* Táctica */}
      <Section id="tactica" title="Línea Táctica" subtitle="Ropa y equipamiento para servicio y outdoor">
        <ProductGrid list={filtered.tactica} onAdd={onAddCart} />
      </Section>

      {/* Accesorios */}
      <Section id="accesorios" title="Accesorios & Tecnología" subtitle="Gadgets útiles: linternas, radios, termos, power banks y más">
        <ProductGrid list={filtered.accesorios} onAdd={onAddCart} />
      </Section>

      {/* FAQ */}
      <Section id="faq" title="Preguntas Frecuentes" subtitle="Todo lo esencial antes de comprar">
        <div className="grid md:grid-cols-2 gap-6">
          <FAQ q="¿Cómo funciona la verificación para la Línea Institucional?" a="Completa el formulario, sube tu credencial y te contactamos por WhatsApp (24–48 h)." />
          <FAQ q="¿Hacen envíos a todo Ecuador?" a="Sí, a todas las provincias." />
          <FAQ q="¿Puedo pagar con Payphone?" a="Sí, aceptamos Payphone, tarjeta y transferencia." />
          <FAQ q="¿Qué artículos no venden?" a="No ofrecemos equipo de uso restringido ni insignias oficiales sin autorización." />
        </div>
      </Section>

      {/* Contacto */}
      <section id="contacto" className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold">Contacto</h2>
        <p className="text-white/80 mt-1">¿Dudas, cotizaciones o compras al por mayor? Escríbenos.</p>
        <form className="mt-6 grid md:grid-cols-2 gap-4" onSubmit={(e)=> e.preventDefault()}>
          <input aria-label="Nombre y apellido" placeholder="Nombre y apellido" className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FFD700]" />
          <input aria-label="WhatsApp o Email" placeholder="WhatsApp o Email" className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FFD700]" />
          <input aria-label="Asunto" placeholder="Asunto" className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FFD700] md:col-span-2" />
          <textarea aria-label="Mensaje" placeholder="Mensaje" rows={4} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FFD700] md:col-span-2" />
          <button className="rounded-xl bg-[#4B5320] px-6 py-3 font-semibold hover:brightness-110 md:col-span-2">Enviar</button>
        </form>
      </section>

      {/* Botón Admin + Drawer Carrito + Modal Verificación */}
      <div className="mx-auto max-w-7xl px-4 pb-8">
        <button onClick={onAdminLogin} className="text-white/60 underline">Ingreso administrador</button>
      </div>
      {openVerify && <VerifyModal onClose={() => setOpenVerify(false)} />}
      {openCart && (
        <CartDrawer
          items={cart}
          total={cartTotal}
          onClose={()=> setOpenCart(false)}
          onRemove={onRemoveCart}
          onQty={onUpdateQty}
          onCheckoutWhatsApp={()=> beginCheckout('whatsapp')}
          onCheckoutPayphone={()=> beginCheckout('payphone')}
        />
      )}
    </>
  );
}

function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
        {subtitle && <p className="text-white/80 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function ProductGrid({ list=[], locked=false, onAdd, onLocked }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map(p => <Card key={p.id} {...p} locked={locked} onAdd={()=> onAdd(p)} onAction={onLocked} />)}
    </div>
  );
}

function Card({ name, price, photos, locked, onAction, onAdd }) {
  const [open, setOpen] = useState(false);
  const img = photos?.[0];
  return (
    <article className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative">
      <div className="aspect-[4/3] w-full overflow-hidden">
        <img src={img} alt={name} className="h-full w-full object-cover" loading="lazy" />
      </div>
      {locked && (<div className="absolute top-3 left-3 bg-black/60 backdrop-blur rounded-full px-3 py-1 text-xs">🔒 Solo miembros</div>)}
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2" title={name}>{name}</h3>
        <div className={`mt-1 font-bold ${price === 'Solo miembros' ? 'text-white/70' : 'text-[#FFD700]'}`}>{price}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15" onClick={()=> setOpen(true)}>Vista rápida</button>
          <button className="rounded-xl bg-[#4B5320] px-3 py-2 text-sm font-semibold hover:brightness-110" onClick={locked ? onAction : onAdd}>{locked ? 'Solicitar acceso' : 'Agregar'}</button>
        </div>
      </div>
      {open && <ProductModal name={name} price={price} photos={photos} locked={locked} onClose={()=> setOpen(false)} onAdd={onAdd} onAction={onAction} />}
    </article>
  );
}

function ProductModal({ name, price, photos=[], locked, onClose, onAdd, onAction }) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-3xl rounded-2xl bg-white text-[#0B1D3A] p-6 shadow-2xl">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-black/10">
              <img src={photos[idx]} alt={`${name} foto ${idx+1}`} className="w-full h-full object-cover" />
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {photos.map((p,i)=> (
                <button key={i} className={`h-16 w-24 rounded border ${i===idx? 'border-[#0B1D3A]':'border-black/10'}`} onClick={()=> setIdx(i)}>
                  <img src={p} alt={`thumb ${i+1}`} className="w-full h-full object-cover rounded" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xl font-bold">{name}</h4>
            <div className="mt-3 font-bold text-[#0B1D3A]">{price}</div>
            <div className="mt-4 flex gap-2">
              <button className="rounded bg-[#4B5320] text-white px-4 py-2 text-sm" onClick={()=> { if(!locked && onAdd) onAdd(); onClose(); }}>{locked ? 'Solicitar acceso' : 'Añadir al carrito'}</button>
              <button className="rounded border border-[#0B1D3A] px-4 py-2 text-sm" onClick={onClose}>Cerrar</button>
            </div>
            {locked && <p className="text-xs text-black/60 mt-2">Artículo restringido: requiere verificación.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQ({ q, a }) { const [open, setOpen] = useState(false); return (
  <div className="rounded-2xl border border-white/10 bg-white/5">
    <button className="w-full text-left p-4 font-semibold flex items-center justify-between" onClick={() => setOpen(!open)}>
      <span>{q}</span><span aria-hidden>{open ? '−' : '+'}</span>
    </button>
    {open && <div className="px-4 pb-4 text-white/80">{a}</div>}
  </div>
); }

function VerifyModal({ onClose }) {
  const [name, setName] = useState("");
  const [entity, setEntity] = useState("Policía Nacional");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { alert('Por favor ingresa tu nombre.'); return; }
    setSaving(true);
    try { await logVerification({ name: name.trim(), entity }); } catch {}
    const url = buildWhatsAppURL({ name: name.trim(), entity });
    const win = window.open(url, '_blank'); if (!win) window.location.href = url;
    setSaving(false); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-2xl bg-white text-[#0B1D3A] p-6 shadow-2xl">
        <h3 className="text-xl font-bold">Verificación de miembro</h3>
        <p className="mt-2 text-sm text-black/70">Guardaremos tu solicitud y te enviaremos a WhatsApp.</p>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div><label className="text-sm font-medium">Nombre y apellido</label><input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2" placeholder="Ej. Juan Pérez" /></div>
          <div><label className="text-sm font-medium">Entidad</label><select value={entity} onChange={(e) => setEntity(e.target.value)} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2"><option>Policía Nacional</option><option>Fuerzas Armadas</option><option>Agentes de Tránsito</option></select></div>
          <div className="flex items-center gap-3 pt-2"><button className="rounded-xl bg-[#4B5320] text-white px-4 py-2 font-semibold disabled:opacity-60" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Enviar por WhatsApp'}</button><button className="rounded-xl border border-[#0B1D3A] px-4 py-2 font-semibold" type="button" onClick={onClose}>Cancelar</button></div>
        </form>
      </div>
    </div>
  );
}

function CartDrawer({ items, total, onClose, onRemove, onQty, onCheckoutWhatsApp, onCheckoutPayphone }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white text-[#0B1D3A] shadow-2xl grid grid-rows-[auto,1fr,auto]">
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h3 className="text-lg font-bold">Tu carrito</h3>
          <button onClick={onClose} className="px-3 py-1 rounded border border-black/20">Cerrar</button>
        </div>
        <div className="overflow-auto p-4 space-y-3">
          {items.length === 0 && <div className="text-black/60">No hay productos en el carrito.</div>}
          {items.map(it => (
            <div key={it.id} className="border border-black/10 rounded-lg p-3 grid grid-cols-[1fr,auto] gap-2">
              <div>
                <div className="font-semibold">{it.name}</div>
                <div className="text-sm text-black/70">{it.price} · Cantidad: <input type="number" min={1} value={it.qty} onChange={(e)=> onQty(it.id, Number(e.target.value)||1)} className="w-16 ml-1 px-2 py-1 border border-black/20 rounded" /></div>
              </div>
              <div className="flex items-start gap-2">
                <button onClick={()=> onRemove(it.id)} className="text-red-600 text-sm">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-black/10">
          <div className="flex items-center justify-between mb-3"><span>Total</span><strong>{total}</strong></div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onCheckoutWhatsApp} className="rounded bg-[#25D366] text-white px-3 py-2">Continuar por WhatsApp</button>
            <button onClick={onCheckoutPayphone} className="rounded bg-[#4B5320] text-white px-3 py-2">Pagar con Payphone</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function CookieConsent() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('pp_cookie_ok'));
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-black/80 text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <span>Usamos cookies para mejorar tu experiencia y medir el uso del sitio.</span>
        <div className="flex items-center gap-2">
          <button className="rounded bg-white/10 px-3 py-2" onClick={()=> setVisible(false)}>Rechazar</button>
          <button className="rounded bg-[#FFD700] text-[#0B1D3A] px-3 py-2" onClick={()=> { localStorage.setItem('pp_cookie_ok','1'); setVisible(false); }}>Aceptar</button>
        </div>
      </div>
    </div>
  );
}

// === Admin ===
function AdminPanel() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem(LS_KEY_ADMIN));
  const [pass, setPass] = useState("");

  if (!authed) {
    function login(e) {
      e.preventDefault();
      if (pass === ADMIN_PASSWORD) { localStorage.setItem(LS_KEY_ADMIN, "ok"); setAuthed(true); setPass(""); }
      else alert("Password incorrecto");
    }
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl bg-white/5 border border-white/10 p-6">
          <h1 className="text-xl font-bold mb-2">Ingreso Administrador</h1>
          <input type="password" value={pass} onChange={(e)=> setPass(e.target.value)} placeholder="Contraseña" className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 mb-3" />
          <button className="w-full rounded-xl bg-[#FFD700] text-[#0B1D3A] font-semibold px-4 py-2">Entrar</button>
        </form>
      </div>
    );
  }

  return <AdminHome />;
}
function AdminHome() {
  const [tab, setTab] = useState('verificaciones');
  const [syncing, setSyncing] = useState(false);

  function exportCSV() {
    const csv = buildCSVFrom(getPendingLocal());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `verificaciones_${Date.now()}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }
  async function doSync() { setSyncing(true); const res = await retryPending(); setSyncing(false); alert(`Intentadas ${res.tried}, enviadas ${res.sent}`); }

  return (
    <div>
      <div className="sticky top-0 z-40 bg-[#0B1D3A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Panel de Administración – Patrulla Pro</h1>
          <div className="flex items-center gap-2">
            <button onClick={()=> setTab('verificaciones')} className={`px-3 py-1 rounded ${tab==='verificaciones'?'bg-white/10':''}`}>Verificaciones</button>
            <button onClick={()=> setTab('ajustes')} className={`px-3 py-1 rounded ${tab==='ajustes'?'bg-white/10':''}`}>Ajustes</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {tab === 'verificaciones' && (
          <AdminVerificaciones syncing={syncing} onSync={doSync} onExport={exportCSV} />
        )}
        {tab === 'ajustes' && (<AdminAjustes />)}
      </div>
    </div>
  );
}
function AdminVerificaciones({ syncing, onSync, onExport }) {
  const data = getPendingLocal();
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Solicitudes pendientes ({data.length})</h2>
      <div className="flex gap-2 mb-4">
        <button onClick={onSync} className="rounded bg-[#4B5320] px-3 py-2 disabled:opacity-60" disabled={syncing}>{syncing?'Sincronizando…':'↻ Reintentar envío'}</button>
        <button onClick={onExport} className="rounded bg-white/10 border border-white/20 px-3 py-2">⬇ Exportar CSV</button>
      </div>
      <div className="overflow-auto border border-white/10 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-white/5"><tr><th className="p-2 text-left">Fecha</th><th className="p-2 text-left">Nombre</th><th className="p-2 text-left">Entidad</th><th className="p-2 text-left">Origen</th></tr></thead>
          <tbody>
            {data.length === 0 && (<tr><td className="p-3 text-white/60" colSpan={4}>No hay pendientes.</td></tr>)}
            {data.map((r,i)=> (
              <tr key={i} className="odd:bg-white/0 even:bg-white/5">
                <td className="p-2">{new Date(r.timestamp).toLocaleString()}</td>
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.entity}</td>
                <td className="p-2">{r.page?.replace(/^https?:\/\//,'')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/60 mt-2">Configura <code>WEBHOOK_URL</code> para envíos remotos (Sheets/Make/API).</p>
    </div>
  );
}
function AdminAjustes() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Ajustes</h2>
      <ul className="list-disc pl-5 text-white/70 text-sm">
        <li>Dominio: patrullapro.ec</li>
        <li>WhatsApp: {WHATSAPP_NUMBER}</li>
        <li>Webhook: {WEBHOOK_URL.includes('example.com') ? '⚠ No configurado' : 'Configurado'}</li>
      </ul>
      <p className="text-white/70 text-sm">Mueve <code>ADMIN_PASSWORD</code> y <code>WEBHOOK_URL</code> a variables de entorno en producción.</p>
    </div>
  );
}
