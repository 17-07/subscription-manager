const PIN = '2038';
const SUPABASE_URL = 'https://iofdeuwxlrefjjzdzbun.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZmRldXd4bHJlZmpqemR6YnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzA3MDgsImV4cCI6MjA5MTk0NjcwOH0.UO6aQu9LbfNkbg0HxwYV4byzsxDZPEdBf4OZFSwXOYc';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIES = {
  tiendas: { label: 'Tiendas (Shopify)', icon: '🏪' },
  apps: { label: 'Apps de Shopify', icon: '🧩' },
  herramientas: { label: 'Herramientas Externas', icon: '🔧' },
};

let subs = [];
let editingId = null;
let pinValue = '';

// ── PIN ──────────────────────────────────────────────

function renderLogin() {
  document.getElementById('app').innerHTML = `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:40px 36px;width:100%;max-width:360px;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:8px">🔐</div>
      <h2 style="margin:0 0 4px;font-size:1.5rem;font-weight:800;background:linear-gradient(135deg,#a78bfa,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
        Bienvenido, Samu
      </h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 28px">Introduce tu PIN para continuar</p>
      <div style="display:flex;gap:10px;justify-content:center;margin-bottom:20px" id="pin-dots">
        ${[0,1,2,3].map(i => `<div id="dot-${i}" style="width:14px;height:14px;border-radius:50%;border:2px solid #334155;background:transparent;transition:all .2s"></div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px">
        ${[1,2,3,4,5,6,7,8,9].map(n => `
          <button onclick="pinPress('${n}')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;font-size:1.3rem;font-weight:600;padding:18px;border-radius:12px;cursor:pointer">${n}</button>
        `).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        <button onclick="pinClear()" style="background:#1e293b;border:1px solid #334155;color:#94a3b8;font-size:1rem;padding:18px;border-radius:12px;cursor:pointer">⌫</button>
        <button onclick="pinPress('0')" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;font-size:1.3rem;font-weight:600;padding:18px;border-radius:12px;cursor:pointer">0</button>
        <button onclick="pinSubmit()" style="background:linear-gradient(135deg,#7c3aed,#a21caf);border:none;color:white;font-size:1rem;padding:18px;border-radius:12px;cursor:pointer">✓</button>
      </div>
      <div id="pin-error" style="color:#f87171;font-size:13px;margin-top:16px;min-height:20px"></div>
    </div>
  </div>`;
}

function pinPress(n) {
  if (pinValue.length >= 4) return;
  pinValue += n;
  updateDots();
  if (pinValue.length === 4) setTimeout(pinSubmit, 150);
}

function pinClear() {
  pinValue = pinValue.slice(0, -1);
  updateDots();
}

function updateDots() {
  for (var i = 0; i < 4; i++) {
    var dot = document.getElementById('dot-' + i);
    if (!dot) return;
    dot.style.background = i < pinValue.length ? '#a78bfa' : 'transparent';
    dot.style.borderColor = i < pinValue.length ? '#a78bfa' : '#334155';
  }
}

function pinSubmit() {
  if (pinValue === PIN) {
    sessionStorage.setItem('auth', '1');
    loadSubs();
  } else {
    pinValue = '';
    updateDots();
    var err = document.getElementById('pin-error');
    if (err) { err.textContent = 'PIN incorrecto'; setTimeout(function(){ if(err) err.textContent = ''; }, 2000); }
  }
}

// ── DATA ─────────────────────────────────────────────

function daysUntil(dateStr) {
  var today = new Date(); today.setHours(0,0,0,0);
  var target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.ceil((target - today) / 86400000);
}

function statusColor(days) {
  if (days < 7) return { bg: '#450a0a', border: '#dc2626', text: '#f87171' };
  if (days < 15) return { bg: '#451a03', border: '#d97706', text: '#fbbf24' };
  return { bg: '#052e16', border: '#16a34a', text: '#4ade80' };
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
}

function getTiendas() {
  return subs.filter(function(s){ return s.category === 'tiendas'; });
}

async function loadSubs() {
  var result = await db.from('subscriptions').select('*').order('expiry', { ascending: true });
  if (result.error) { console.error(result.error); return; }
  subs = result.data;
  render();
}

async function addSub(sub) {
  var result = await db.from('subscriptions').insert([sub]);
  if (result.error) { alert('Error al guardar: ' + result.error.message); return; }
  await loadSubs();
}

async function updateSub(id, sub) {
  var result = await db.from('subscriptions').update(sub).eq('id', id);
  if (result.error) { alert('Error al actualizar: ' + result.error.message); return; }
  await loadSubs();
}

async function deleteSub(id) {
  if (!confirm('¿Eliminar esta suscripción?')) return;
  var result = await db.from('subscriptions').delete().eq('id', id);
  if (result.error) { alert('Error al eliminar: ' + result.error.message); return; }
  await loadSubs();
}

function exportCSV() {
  var headers = ['Categoría','Nombre','Tienda','Email','Precio','Vencimiento','Días restantes'];
  var rows = subs.map(function(s) {
    return [
      CATEGORIES[s.category] ? CATEGORIES[s.category].label : s.category,
      s.name,
      s.store_name || '',
      s.email || '',
      s.price,
      s.expiry,
      daysUntil(s.expiry)
    ];
  });
  var csv = [headers].concat(rows).map(function(r){ return r.map(function(c){ return '"'+c+'"'; }).join(','); }).join('\n');
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'suscripciones-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

// ── FORM ─────────────────────────────────────────────

function onCategoryChange() {
  var cat = document.getElementById('f-category').value;
  var storeRow = document.getElementById('store-row');
  if (storeRow) storeRow.style.display = cat === 'apps' ? 'block' : 'none';
}

function handleFormSubmit() {
  var name = document.getElementById('f-name').value.trim();
  var price = parseFloat(document.getElementById('f-price').value);
  var expiry = document.getElementById('f-expiry').value;
  var category = document.getElementById('f-category').value;
  var email = document.getElementById('f-email').value.trim();
  var store_name = '';
  if (category === 'apps') {
    var storeEl = document.getElementById('f-store');
    store_name = storeEl ? storeEl.value : '';
  }
  if (!name || !price || !expiry) { alert('Rellena todos los campos'); return; }
  if (category === 'apps' && !store_name) { alert('Selecciona la tienda a la que pertenece esta app'); return; }

  var data = { name: name, price: price, expiry: expiry, category: category, email: email, store_name: store_name };

  if (editingId) {
    updateSub(editingId, data);
    editingId = null;
    document.getElementById('form-btn').textContent = '+ Añadir';
    document.getElementById('cancel-btn').style.display = 'none';
  } else {
    addSub(data);
  }
  document.getElementById('f-name').value = '';
  document.getElementById('f-price').value = '';
  document.getElementById('f-expiry').value = '';
  document.getElementById('f-email').value = '';
}

function startEdit(id) {
  var s = subs.find(function(x){ return x.id === id; });
  if (!s) return;
  editingId = id;
  document.getElementById('f-category').value = s.category;
  onCategoryChange();
  document.getElementById('f-name').value = s.name;
  document.getElementById('f-price').value = s.price;
  document.getElementById('f-expiry').value = s.expiry;
  document.getElementById('f-email').value = s.email || '';
  if (s.category === 'apps' && s.store_name) {
    setTimeout(function(){
      var storeEl = document.getElementById('f-store');
      if (storeEl) storeEl.value = s.store_name;
    }, 50);
  }
  document.getElementById('form-btn').textContent = 'Guardar cambios';
  document.getElementById('cancel-btn').style.display = 'inline-block';
  document.getElementById('f-name').focus();
}

function cancelEdit() {
  editingId = null;
  document.getElementById('f-name').value = '';
  document.getElementById('f-price').value = '';
  document.getElementById('f-expiry').value = '';
  document.getElementById('f-email').value = '';
  document.getElementById('form-btn').textContent = '+ Añadir';
  document.getElementById('cancel-btn').style.display = 'none';
  onCategoryChange();
}

// ── RENDER ───────────────────────────────────────────

function render() {
  var total = subs.reduce(function(s, x){ return s + Number(x.price); }, 0);
  var upcoming = subs
    .map(function(s){ return Object.assign({}, s, { days: daysUntil(s.expiry) }); })
    .filter(function(s){ return s.days >= 0 && s.days <= 30; })
    .sort(function(a, b){ return a.days - b.days; });

  var grouped = { tiendas: [], apps: [], herramientas: [] };
  subs.forEach(function(s){
    if (grouped[s.category]) grouped[s.category].push(Object.assign({}, s, { days: daysUntil(s.expiry) }));
  });

  var tiendas = getTiendas();
  var storeOptions = tiendas.length === 0
    ? '<option value="">— Añade primero una tienda —</option>'
    : '<option value="">Selecciona tienda...</option>' + tiendas.map(function(t){
        return '<option value="'+t.name+'">'+t.name+'</option>';
      }).join('');

  var inputStyle = 'background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:10px;border-radius:8px;font-size:13px;width:100%;box-sizing:border-box;';

  document.getElementById('app').innerHTML = `
  <div style="max-width:1100px;margin:0 auto;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">

    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <div>
        <h1 style="margin:0;font-size:2rem;font-weight:800;background:linear-gradient(135deg,#a78bfa,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
          Gestor de Suscripciones
        </h1>
        <p style="margin:4px 0 0;color:#64748b;font-size:14px">Controla tus gastos recurrentes de ecommerce</p>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="exportCSV()" style="background:#1e293b;border:1px solid #334155;color:#cbd5e1;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:13px">⬇ Exportar CSV</button>
        <button onclick="sessionStorage.removeItem('auth');renderLogin()" style="background:#1e293b;border:1px solid #334155;color:#94a3b8;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:13px">🔒 Salir</button>
      </div>
    </div>


    <!-- NAVEGACIÓN A HERRAMIENTAS -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-bottom:24px">
      <button onclick="openReviewGenerator()"
         style="background:linear-gradient(135deg,#7c3aed,#a21caf);border-radius:16px;padding:20px 24px;text-decoration:none;color:white;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 4px 20px rgba(124,58,237,.25);transition:transform .15s,box-shadow .15s;border:none;cursor:pointer;width:100%;text-align:left"
         onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 28px rgba(124,58,237,.4)'"
         onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 20px rgba(124,58,237,.25)'">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:1.4rem">✍️</div>
          <div>
            <div style="font-weight:700;font-size:1.05rem;line-height:1.2">Generador de Reviews</div>
            <div style="font-size:12px;opacity:.85;margin-top:2px">Abrir herramienta</div>
          </div>
        </div>
        <div style="font-size:1.3rem;opacity:.9">→</div>
      </button>
    </div>

    <!-- POPUP GENERADOR DE REVIEWS -->
    <div id="review-modal" style="display:none;position:fixed;inset:0;z-index:1000;background:rgba(2,6,23,.85);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:16px">
      <div style="background:#0f172a;border:1px solid #334155;border-radius:20px;width:100%;max-width:1200px;max-height:95vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,.6)">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #1e293b;flex-shrink:0">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.3rem">✍️</span>
            <span style="font-weight:700;font-size:1rem">Generador de Reviews</span>
          </div>
          <button onclick="closeReviewGenerator()" style="background:#1e293b;border:1px solid #334155;color:#94a3b8;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center">✕</button>
        </div>
        <div style="flex:1;overflow:hidden;padding:0">
          <iframe src="https://claude.site/public/artifacts/f1333354-222d-4533-b9c9-74667e57a896/embed" title="Review Generator — Dropshipping Pipeline" width="100%" height="100%" frameborder="0" allow="clipboard-write" allowfullscreen style="display:block;width:100%;height:calc(95vh - 65px);border:none"></iframe>
        </div>
      </div>
    </div>



    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:16px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Gasto mensual</div>
        <div style="font-size:1.8rem;font-weight:700;color:#a78bfa;margin-top:4px">${total.toFixed(2)}€</div>
      </div>
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:16px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Suscripciones</div>
        <div style="font-size:1.8rem;font-weight:700;color:#22d3ee;margin-top:4px">${subs.length}</div>
      </div>
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:16px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Próximas a vencer</div>
        <div style="font-size:1.8rem;font-weight:700;color:#fb923c;margin-top:4px">${upcoming.length}</div>
      </div>
    </div>

    ${upcoming.length ? `
    <div style="background:linear-gradient(135deg,#1c1008,#1a0a0a);border:1px solid #92400e44;border-radius:16px;padding:20px;margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <span>⚠️</span><span style="font-weight:600;font-size:15px">Próximas a vencer (30 días)</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
        ${upcoming.map(function(s){
          var c = statusColor(s.days);
          return '<div style="background:'+c.bg+';border:1px solid '+c.border+';border-radius:10px;padding:12px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600;font-size:14px">'+s.name+'</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">'+(CATEGORIES[s.category]?CATEGORIES[s.category].label:'')+'</div></div><div style="text-align:right"><div style="color:'+c.text+';font-weight:700;font-size:1.2rem">'+s.days+'d</div><div style="font-size:12px;color:#94a3b8">'+s.price+'€</div></div></div>';
        }).join('')}
      </div>
    </div>` : ''}

    <!-- FORM -->
    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:20px;margin-bottom:24px">
      <div style="font-weight:600;margin-bottom:16px">${editingId ? '✏️ Editar suscripción' : '+ Añadir suscripción'}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;align-items:start">

        <div>
          <div style="font-size:11px;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em">Categoría</div>
          <select id="f-category" onchange="onCategoryChange()" style="${inputStyle}">
            ${Object.keys(CATEGORIES).map(function(k){ return '<option value="'+k+'">'+CATEGORIES[k].label+'</option>'; }).join('')}
          </select>
        </div>

        <div id="store-row" style="display:none">
          <div style="font-size:11px;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em">Tienda 🏪</div>
          <select id="f-store" style="${inputStyle}">${storeOptions}</select>
        </div>

        <div>
          <div style="font-size:11px;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em">Nombre</div>
          <input id="f-name" type="text" placeholder="Ej: Shopify Basic" onkeydown="if(event.key==='Enter')handleFormSubmit()" style="${inputStyle}"/>
        </div>

        <div>
          <div style="font-size:11px;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em">Precio (€/mes)</div>
          <input id="f-price" type="number" step="0.01" placeholder="29.00" onkeydown="if(event.key==='Enter')handleFormSubmit()" style="${inputStyle}"/>
        </div>

        <div>
          <div style="font-size:11px;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em">Vencimiento</div>
          <input id="f-expiry" type="date" onkeydown="if(event.key==='Enter')handleFormSubmit()" style="${inputStyle}"/>
        </div>

        <div>
          <div style="font-size:11px;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em">Email <span style="color:#475569">(opcional)</span></div>
          <input id="f-email" type="email" placeholder="cuenta@ejemplo.com" style="${inputStyle}"/>
        </div>

        <div style="display:flex;gap:8px;align-items:flex-end;padding-top:18px">
          <button id="form-btn" onclick="handleFormSubmit()"
            style="flex:1;background:linear-gradient(135deg,#7c3aed,#a21caf);color:white;border:none;border-radius:8px;padding:11px;cursor:pointer;font-weight:600;font-size:13px">
            + Añadir
          </button>
          <button id="cancel-btn" onclick="cancelEdit()" style="display:none;background:#1e293b;color:#e2e8f0;border:none;border-radius:8px;padding:11px 14px;cursor:pointer;font-size:13px">✕</button>
        </div>

      </div>
    </div>

    <!-- CATEGORIES -->
    <div style="display:flex;flex-direction:column;gap:12px">
      ${Object.keys(grouped).map(function(key){
        var items = grouped[key];
        var cat = CATEGORIES[key];
        var catTotal = items.reduce(function(s,x){ return s+Number(x.price); }, 0);
        return '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;cursor:pointer" onclick="var b=this.nextElementSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\'">'
          + '<div style="display:flex;align-items:center;gap:12px"><span style="font-size:1.4rem">'+cat.icon+'</span>'
          + '<div><div style="font-weight:600">'+cat.label+'</div><div style="font-size:12px;color:#64748b">'+items.length+' suscripción'+(items.length!==1?'es':'')+'</div></div></div>'
          + '<div style="text-align:right"><div style="font-weight:700;font-size:1.1rem">'+catTotal.toFixed(2)+'€</div><div style="font-size:11px;color:#64748b">/mes</div></div></div>'
          + '<div style="border-top:1px solid #1e293b;padding:16px">'
          + (items.length === 0
            ? '<div style="text-align:center;color:#475569;font-size:13px;padding:20px 0">Sin suscripciones en esta categoría</div>'
            : '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">'
              + items.map(function(s){
                  var c = statusColor(s.days);
                  var emailHtml = s.email
                    ? '<a href="mailto:'+s.email+'" style="display:inline-flex;align-items:center;gap:4px;margin-top:6px;font-size:11px;color:#818cf8;text-decoration:none;background:#1e1b4b;padding:3px 8px;border-radius:20px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📧 '+s.email+'</a>'
                    : '';
                  var storeHtml = s.store_name
                    ? '<div style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;font-size:11px;color:#fbbf24;background:#1c1a08;padding:3px 8px;border-radius:20px">🏪 '+s.store_name+'</div>'
                    : '';
                  return '<div style="background:'+c.bg+';border:1px solid '+c.border+';border-radius:12px;padding:16px;transition:transform .15s" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">'
                    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'
                    + '<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px">'
                    + '<div style="width:8px;height:8px;border-radius:50%;background:'+c.border+';flex-shrink:0"></div>'
                    + '<div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+s.name+'</div></div>'
                    + '<div style="font-size:11px;color:#94a3b8;margin-top:3px">Vence '+formatDate(s.expiry)+'</div>'
                    + storeHtml
                    + emailHtml
                    + '</div>'
                    + '<div style="display:flex;gap:4px;margin-left:8px;flex-shrink:0">'
                    + '<button onclick="startEdit(\''+s.id+'\')" style="background:transparent;border:none;cursor:pointer;padding:4px;border-radius:6px">✏️</button>'
                    + '<button onclick="deleteSub(\''+s.id+'\')" style="background:transparent;border:none;cursor:pointer;padding:4px;border-radius:6px">🗑️</button></div></div>'
                    + '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:8px">'
                    + '<div style="color:'+c.text+';font-weight:700;font-size:1.4rem">'+(s.days<0?'Vencida':s.days+'d')+'</div>'
                    + '<div style="text-align:right"><div style="font-weight:700;font-size:1.1rem">'+s.price+'€</div><div style="font-size:11px;color:#64748b">/mes</div></div></div></div>';
                }).join('')
              + '</div>')
          + '</div></div>';
      }).join('')}
    </div>

    ${subs.length === 0 ? '<div style="text-align:center;color:#475569;font-size:14px;margin-top:40px">Aún no tienes suscripciones. Añade alguna arriba.</div>' : ''}
  </div>`;
}

// ── REVIEW GENERATOR POPUP ───────────────────────────

function openReviewGenerator() {
  var modal = document.getElementById('review-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeReviewGenerator() {
  var modal = document.getElementById('review-modal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeReviewGenerator();
});

// ── INIT ─────────────────────────────────────────────

if (sessionStorage.getItem('auth') === '1') {
  loadSubs();
} else {
  renderLogin();
}
