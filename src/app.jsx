/* global React, ReactDOM */

const WHATSAPP_NUMBER = "593979362853";

function App() {
  const [cartOpen, setCartOpen] = React.useState(false);

  return (
    <div className="min-h-screen">
      <Header onCart={()=> setCartOpen(true)} />
      <Hero />
      <Section id="institucional" title="Línea Institucional" subtitle="Acceso solo para miembros verificados (Policía, FF.AA., Tránsito)">
        <Notice>Para ver precios de uniformes institucionales, solicita verificación por WhatsApp.</Notice>
      </Section>
      <Section id="tactica" title="Línea Táctica" subtitle="Ropa y equipamiento para servicio y outdoor">
        <Grid>
          <Card name="Camisa táctica Dry-Fit" price="$29.90" img="https://images.unsplash.com/photo-1604589093750-1d6a8fdc70bc?q=80&w=800&auto=format&fit=crop" />
          <Card name="Mochila táctica 35L" price="$49.90" img="https://images.unsplash.com/photo-1549049950-48d5887197c7?q=80&w=800&auto=format&fit=crop" />
          <Card name="Guantes de servicio" price="$19.90" img="https://images.unsplash.com/photo-1603575449427-833c7d2dbf9c?q=80&w=800&auto=format&fit=crop" />
        </Grid>
      </Section>
      <Section id="accesorios" title="Accesorios & Tecnología" subtitle="Gadgets útiles: linternas, radios, termos, power banks y más">
        <Grid>
          <Card name="Termo acero 1L" price="$16.90" img="https://images.unsplash.com/photo-1558640478-99ac7f734e8d?q=80&w=800&auto=format&fit=crop" />
          <Card name="Radio corto alcance" price="$34.90" img="https://images.unsplash.com/photo-1617038260893-1f7b5fdc5b3c?q=80&w=800&auto=format&fit=crop" />
          <Card name="Power bank reforzado" price="$22.90" img="https://images.unsplash.com/photo-1611259184066-5e5c9cf0a1a3?q=80&w=800&auto=format&fit=crop" />
        </Grid>
      </Section>
      <Section id="faq" title="Preguntas Frecuentes">
        <FAQ q="¿Cómo funciona la verificación?" a="Completa tus datos y te redirigimos a WhatsApp para validar tu identidad (24–48h)." />
        <FAQ q="¿Hacen envíos a todo Ecuador?" a="Sí, cobertura nacional." />
        <FAQ q="¿Puedo pagar con Payphone?" a="Sí, integración disponible (en proceso en esta demo)." />
      </Section>
      <Section id="contacto" title="Contacto">
        <p className="text-white/80 mb-4">¿Dudas o compras al por mayor? Escríbenos.</p>
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" className="inline-block rounded-xl bg-[#25D366] text-[#0B1D3A] font-semibold px-5 py-3">WhatsApp</a>
      </Section>

      {/* Botón flotante WhatsApp */}
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="fixed bottom-5 right-5 rounded-full bg-[#25D366] text-[#0B1D3A] font-bold px-5 py-3 shadow-lg hover:brightness-110">WhatsApp</a>
    </div>
  );
}

function Header({ onCart }) {
  return (
    <header className="sticky top-0 z-40 bg-[#0B1D3A]/90 backdrop-blur border-b border-white/10">
      <div className="w-full bg-[#0E2A58] text-white/90 text-xs md:text-sm px-4 py-2 text-center">🚚 Envío a todo Ecuador | Cambios 7 días</div>
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
        <button onClick={onCart} className="rounded-xl bg-white/10 border border-white/20 px-3 py-2">🛒</button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="inicio" className="relative">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1543269664-56d93c1b41a6?q=80&w=1600&auto=format&fit=crop"
             alt="Fondo táctico" className="w-full h-full object-cover opacity-25" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-24 md:py-36">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Equipamiento exclusivo para quienes <span className="text-[#FFD700]">nos protegen</span>
          </h1>
          <p className="mt-4 text-white/80 md:text-lg">Uniformes (acceso restringido), ropa táctica y tecnología profesional.</p>
        </div>
      </div>
    </section>
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

function Notice({ children }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 p-4">{children}</div>;
}

function Grid({ children }) {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>;
}

function Card({ name, price, img }) {
  return (
    <article className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
      <div className="aspect-[4/3] w-full overflow-hidden">
        <img src={img} alt={name} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2" title={name}>{name}</h3>
        <div className="mt-1 font-bold text-[#FFD700]">{price}</div>
        <button className="mt-3 rounded-xl bg-[#4B5320] px-3 py-2 text-sm font-semibold hover:brightness-110">Agregar</button>
      </div>
    </article>
  );
}

function FAQ({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 mb-3">
      <button className="w-full text-left p-4 font-semibold flex items-center justify-between" onClick={() => setOpen(!open)}>
        <span>{q}</span><span aria-hidden>{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 pb-4 text-white/80">{a}</div>}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
