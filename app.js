const SUPABASE_URL = 'https://iofdeuwxlrefjjzdzbun.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZmRldXd4bHJlZmpqemR6YnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzA3MDgsImV4cCI6MjA5MTk0NjcwOH0.UO6aQu9LbfNkbg0HxwYV4byzsxDZPEdBf4OZFSwXOYc';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIES = {
  tiendas: { label: 'Tiendas (Shopify)', icon: '🏪', color: '#7c3aed' },
  apps: { label: 'Apps de Shopify', icon: '🧩', color: '#0891b2' },
  herramientas: { label: 'Herramientas Externas', icon: '🔧', color: '#d97706' },
};

let subs = [];
let editingId = null;

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
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

async function loadSubs() {
  const { data, error } = await db.from('subscriptions').select('*').order('expiry', { ascending: true });
  if (error) { console.error(error); return; }
  subs = data;
  render();
}

async function addSub(sub) {
  const { error } = await db.from('subscriptions').insert([sub]);
  if (error) { alert('Error al guardar: ' + error.message); return; }
  await loadSubs();
}

async function updateSub(id, sub) {
  const { error } = await db.from('subscriptions').update(sub).eq('id', id);
  if (error) { alert('Error al actualizar: ' + error.message); return; }
  await loadSubs();
}

async function deleteSub(id) {
  if (!confirm('¿Eliminar esta suscripción?')) return;
  const { error } = await db.from('subscriptions').delete().eq('id', id);
  if (error) { alert('Error al eliminar: ' + error.message); return; }
  await loadSubs();
}

function exportCSV() {
  const headers = ['Categoría','Nombre','Precio','Vencimiento','Días restantes'];
  const rows = subs.map(s => [
    CATEGORIES[s.category]?.label || s.category,
    s.name, s.price, s.expiry, daysUntil(s.expiry)
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `suscripciones-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

function handleFormSubmit() {
  const name = document.getElementById('f-name').value.trim();
  const price = parseFloat(document.getElementById('f-price').value);
  const expiry = document.getElementById('f-expiry').value;
  const category = document.getElementById('f-category').value;
  if (!name || !price || !expiry) { alert('Rellena todos los campos'); return; }
  if (editingId) {
    updateSub(editingId, { name, price, expiry, category });
    editingId = null;
    document.getElementById('form-btn').textContent = '+ Añadir';
    document.getElementById('cancel-btn').style.display = 'none';
  } else {
    addSub({ name, price, expiry, category });
  }
  document.getElementById('f-name').value = '';
  document.getElementById('f-price').value = '';
  document.getElementById('f-expiry').value = '';
}

function startEdit(id) {
  const s = subs.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  document.getElementById('f-category').value = s.category;
  document.getElementById('f-name').value = s.name;
  document.getElementById('f-price').value = s.price;
  document.getElementById('f-expiry').value = s.expiry;
  document.getElementById('form-btn').textContent = 'Guardar cambios';
  document.getElementById('cancel-btn').style.display = 'inline-block';
  document.getElementById('f-name').focus();
}

function cancelEdit() {
  editingId = null;
  document.getElementById('f-name').value = '';
  document.getElementById('f-price').value = '';
  document.getElementById('f-expiry').value = '';
  document.getElementById('form-btn').textContent = '+ Añadir';
  document.getElementById('cancel-btn').style.display = 'none';
}

function render() {
  const total = subs.reduce((s, x) => s + Number(x.price), 0);
  const upcoming = subs
    .map(s => ({ ...s, days: daysUntil(s.expiry) }))
    .filter(s => s.days >= 0 && s.days <= 30)
    .sort((a, b) => a.days - b.days);

  const grouped = { tiendas: [], apps: [], herramientas: [] };
  subs.forEach(s => grouped[s.category]?.push({ ...s, days: daysUntil(s.expiry) }));

  document.getElementById('app').innerHTML = `
  <div style="max-width:1100px;margin:0 auto;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">

    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <div>
        <h1 style="margin:0;font-size:2rem;font-weight:800;background:linear-gradient(135deg,#a78bfa,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
          Gestor de Suscripciones
        </h1>
        <p style="margin:4px 0 0;color:#64748b;font-size:14px">Controla tus gastos recurrentes de ecommerce</p>
      </div>
      <button onclick="exportCSV()" style="background:#1e293b;border:1px solid #334155;color:#cbd5e1;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:13px">
        ⬇ Exportar CSV
      </button>
    </div>

    <!-- Stats -->
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

    <!-- Upcoming panel -->
    ${upcoming.length ? `
    <div style="background:linear-gradient(135deg,#1c1008,#1a0a0a);border:1px solid #92400e44;border-radius:16px;padding:20px;margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <span>⚠️</span>
        <span style="font-weight:600;font-size:15px">Próximas a vencer (30 días)</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
        ${upcoming.map(s => {
          const c = statusColor(s.days);
          return `<div style="background:${c.bg};border:1px solid ${c.border};border-radius:10px;padding:12px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600;font-size:14px">${s.name}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px">${CATEGORIES[s.category]?.label}</div>
            </div>
            <div style="text-align:right">
              <div style="color:${c.text};font-weight:700;font-size:1.2rem">${s.days}d</div>
              <div style="font-size:12px;color:#94a3b8">${s.price}€</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- Form -->
    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:20px;margin-bottom:24px">
      <div style="font-weight:600;margin-bottom:14px">+ ${editingId ? 'Editar suscripción' : 'Añadir suscripción'}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;align-items:end">
        <select id="f-category" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:10px;border-radius:8px;font-size:13px">
          ${Object.entries(CATEGORIES).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
        </select>
        <input id="f-name" type="text" placeholder="Nombre" onkeydown="if(event.key==='Enter')handleFormSubmit()"
          style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:10px;border-radius:8px;font-size:13px"/>
        <input id="f-price" type="number" step="0.01" placeholder="Precio (€)" onkeydown="if(event.key==='Enter')handleFormSubmit()"
          style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:10px;border-radius:8px;font-size:13px"/>
        <input id="f-expiry" type="date" onkeydown="if(event.key==='Enter')handleFormSubmit()"
          style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:10px;border-radius:8px;font-size:13px"/>
        <div style="display:flex;gap:8px">
          <button id="form-btn" onclick="handleFormSubmit()"
            style="flex:1;background:linear-gradient(135deg,#7c3aed,#a21caf);color:white;border:none;border-radius:8px;padding:11px;cursor:pointer;font-weight:600;font-size:13px">
            + Añadir
          </button>
          <button id="cancel-btn" onclick="cancelEdit()" style="display:none;background:#1e293b;color:#e2e8f0;border:none;border-radius:8px;padding:11px 14px;cursor:pointer;font-size:13px">
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Tree categories -->
    <div style="display:flex;flex-direction:column;gap:12px">
      ${Object.entries(grouped).map(([key, items]) => {
        const cat = CATEGORIES[key];
        const catTotal = items.reduce((s, x) => s + Number(x.price), 0);
        return `
        <div style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;cursor:pointer"
            onclick="const b=this.nextElementSibling;b.style.display=b.style.display==='none'?'block':'none'">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:1.4rem">${cat.icon}</span>
              <div>
                <div style="font-weight:600">${cat.label}</div>
                <div style="font-size:12px;color:#64748b">${items.length} suscripción${items.length !== 1 ? 'es' : ''}</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;font-size:1.1rem">${catTotal.toFixed(2)}€</div>
              <div style="font-size:11px;color:#64748b">/mes</div>
            </div>
          </div>
          <div style="border-top:1px solid #1e293b;padding:16px">
            ${items.length === 0
              ? `<div style="text-align:center;color:#475569;font-size:13px;padding:20px 0">Sin suscripciones en esta categoría</div>`
              : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
                  ${items.map(s => {
                    const c = statusColor(s.days);
                    return `
                    <div style="background:${c.bg};border:1px solid ${c.border};border-radius:12px;padding:16px;transition:transform .15s"
                      onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                        <div style="flex:1;min-width:0">
                          <div style="display:flex;align-items:center;gap:6px">
                            <div style="width:8px;height:8px;border-radius:50%;background:${c.border};flex-shrink:0"></div>
                            <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
                          </div>
                          <div style="font-size:11px;color:#94a3b8;margin-top:3px">Vence ${formatDate(s.expiry)}</div>
                        </div>
                        <div style="display:flex;gap:4px;margin-left:8px;flex-shrink:0">
                          <button onclick="startEdit('${s.id}')" style="background:transparent;border:none;cursor:pointer;padding:4px;border-radius:6px" title="Editar">✏️</button>
                          <button onclick="deleteSub('${s.id}')" style="background:transparent;border:none;cursor:pointer;padding:4px;border-radius:6px" title="Eliminar">🗑️</button>
                        </div>
                      </div>
                      <div style="display:flex;justify-content:space-between;align-items:flex-end">
                        <div style="color:${c.text};font-weight:700;font-size:1.4rem">${s.days < 0 ? 'Vencida' : s.days + 'd'}</div>
                        <div style="text-align:right">
                          <div style="font-weight:700;font-size:1.1rem">${s.price}€</div>
                          <div style="font-size:11px;color:#64748b">/mes</div>
                        </div>
                      </div>
                    </div>`;
                  }).join('')}
                </div>`
            }
          </div>
        </div>`;
      }).join('')}
    </div>

    ${subs.length === 0 ? `<div style="text-align:center;color:#475569;font-size:14px;margin-top:40px">Aún no tienes suscripciones. Añade alguna arriba.</div>` : ''}
  </div>`;
}

loadSubs();
