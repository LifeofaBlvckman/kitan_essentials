/* Kitan Essentials — admin panel */
(function () {
  'use strict';

  const API = window.KitanAPI;
  const J = window.Jogger;
  const G = window.gsap;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = Boolean(G) && !reduce;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const naira = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');
  const nairaShort = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return '₦' + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return '₦' + Math.round(n / 1e3) + 'k';
    return '₦' + n;
  };
  const dateKey = (d) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
  const fmtDate = (d, opts) => new Date(d).toLocaleDateString('en-NG', opts || { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (d) => new Date(d).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
  const ago = (d) => {
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 604800) return Math.floor(s / 86400) + 'd ago';
    return fmtDate(d, { day: 'numeric', month: 'short' });
  };
  const waNumber = (p) => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '234' + d.slice(1); return d; };
  const ICON = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.6L3 21Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
    alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
    upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>',
    money: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    trend: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 17 6-6 4 4 8-8M15 7h6v6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6l2-8Z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    db: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  };
  const FLOW = ['pending', 'confirmed', 'paid', 'shipped', 'delivered'];

  const cache = { products: null, orders: null, inquiries: null, reviews: null, settings: null };
  const ui = { orderFilter: 'todo', orderQuery: '', productCat: 'All', productQuery: '', msgFilter: 'all', custQuery: '', range: 30 };
  const view = $('#view');

  /* ============================================================ toasts */
  function toast(msg, type = 'ok') {
    const t = document.createElement('div');
    t.className = 'toast toast--' + type;
    t.innerHTML = (type === 'ok' ? ICON.check : ICON.alert) + `<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(t);
    if (anim) G.from(t, { y: 20, opacity: 0, duration: 0.45, ease: 'expo.out' });
    setTimeout(() => {
      if (anim) G.to(t, { x: 40, opacity: 0, duration: 0.3, onComplete: () => t.remove() });
      else t.remove();
    }, 3200);
  }
  async function busy(btn, fn) {
    btn && btn.classList.add('is-busy');
    try { return await fn(); }
    catch (err) { toast(err.message || 'Something went wrong', 'err'); throw err; }
    finally { btn && btn.classList.remove('is-busy'); }
  }

  /* ===================================================== overlays */
  let lastFocus = null;
  function trap(e, root) {
    if (e.key !== 'Tab') return;
    const f = $$('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', root).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const a = f[0], b = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
    else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
  }
  function openDrawer(html, quiet) {
    const d = $('#drawer');
    if (!quiet) lastFocus = document.activeElement;
    $('#drawerBody').innerHTML = html;
    d.hidden = false;
    if (anim && !quiet) {
      G.fromTo($('.scrim', d), { opacity: 0 }, { opacity: 1, duration: 0.3 });
      G.fromTo($('.drawer__panel', d), { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: 'expo.out' });
      G.from($$('.d-body > *', d), { y: 16, opacity: 0, stagger: 0.04, duration: 0.5, ease: 'expo.out', delay: 0.15 });
    }
    setTimeout(() => { const c = $('[data-close].icon-btn', d); c && c.focus(); }, 50);
  }
  function closeDrawer() {
    const d = $('#drawer');
    if (d.hidden) return;
    const done = () => { d.hidden = true; lastFocus && lastFocus.focus && lastFocus.focus(); };
    if (anim) { G.to($('.scrim', d), { opacity: 0, duration: 0.25 }); G.to($('.drawer__panel', d), { xPercent: 100, duration: 0.35, ease: 'expo.in', onComplete: done }); }
    else done();
  }
  function openModal(html, small) {
    lastFocus = document.activeElement;
    const m = $('#modal');
    const p = $('#modalBody');
    p.className = 'modal__panel' + (small ? ' is-sm' : '');
    p.innerHTML = html;
    m.hidden = false;
    if (anim) {
      G.fromTo($('.scrim', m), { opacity: 0 }, { opacity: 1, duration: 0.3 });
      G.fromTo(p, { y: 30, scale: 0.97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'expo.out' });
    }
    setTimeout(() => { const f = $('[data-autofocus]', m) || $('input, button', p); f && f.focus(); }, 60);
  }
  function closeModal() {
    const m = $('#modal');
    if (m.hidden) return;
    const done = () => { m.hidden = true; lastFocus && lastFocus.focus && lastFocus.focus(); };
    if (anim) { G.to($('.scrim', m), { opacity: 0, duration: 0.2 }); G.to('#modalBody', { y: 20, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: done }); }
    else done();
  }
  $('#drawer').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDrawer(); });
  $('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  $('#drawer').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); trap(e, $('#drawer')); });
  $('#modal').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); trap(e, $('#modal')); });

  function confirmBox(title, text, okLabel = 'Delete', danger = true) {
    return new Promise((resolve) => {
      openModal(`<div class="m-body"><h2 id="modalTitle" style="font-family:var(--font-display);font-size:28px;margin:0 0 8px">${esc(title)}</h2><p class="muted" style="margin:0">${esc(text)}</p></div>
        <div class="m-foot"><button class="btn" data-no>Cancel</button><button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-yes data-autofocus>${esc(okLabel)}</button></div>`, true);
      const m = $('#modal');
      const handler = (e) => {
        if (e.target.closest('[data-yes]')) { finish(true); }
        else if (e.target.closest('[data-no], [data-close]')) { finish(false); }
      };
      const finish = (v) => { m.removeEventListener('click', handler, true); closeModal(); resolve(v); };
      m.addEventListener('click', handler, true);
    });
  }

  /* ============================================================ data */
  async function load(key, force) {
    if (cache[key] && !force) return cache[key];
    const fn = { products: 'listProducts', orders: 'listOrders', inquiries: 'listInquiries', reviews: 'listReviews', settings: 'getSettings' }[key];
    cache[key] = await API[fn]();
    return cache[key];
  }
  function refreshBadges() {
    const pend = (cache.orders || []).filter((o) => o.status === 'pending').length;
    const unread = (cache.inquiries || []).filter((i) => !i.read).length;
    const p = $('#navPending'), u = $('#navUnread');
    p.textContent = pend; p.hidden = !pend;
    u.textContent = unread; u.hidden = !unread;
  }
  function productById(id) { return (cache.products || []).find((p) => p.id === id); }
  function thumb(item, cls) {
    const p = productById(item.productId);
    const hex = item.colorHex || (p && p.colors[0] && p.colors[0].hex) || '#1b1a1c';
    if (p && p.images && p.images[0]) return `<div class="${cls}" style="--tint:${J.tint(hex)}"><img src="${esc(p.images[0])}" alt="" loading="lazy" /></div>`;
    return `<div class="${cls}" style="--tint:${J.tint(hex)}">${J.svg(hex, p ? p.cut : 'cuffed', { label: '' })}</div>`;
  }
  const statusPill = (s) => `<span class="status status--${s}">${s}</span>`;

  /* =========================================================== router */
  const ROUTES = {
    dashboard: { title: 'Today', crumb: 'Kitan Essentials', render: renderDashboard },
    orders: { title: 'Orders', crumb: 'Sales', render: renderOrders },
    products: { title: 'Products', crumb: 'Catalogue', render: renderProducts },
    storefront: { title: 'Storefront', crumb: 'Photos & reviews', render: renderStorefront },
    messages: { title: 'Messages', crumb: 'Inbox', render: renderMessages },
    customers: { title: 'Customers', crumb: 'People', render: renderCustomers },
    reviews: { title: 'Reviews', crumb: 'Storefront', render: renderReviews },
    settings: { title: 'Settings', crumb: 'Store', render: renderSettings },
  };
  async function route() {
    const [name, q] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?');
    const r = ROUTES[name] || ROUTES.dashboard;
    if (q) { const params = new URLSearchParams(q); if (params.get('q')) ui.orderQuery = params.get('q'); }
    $$('.side__nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.route === (ROUTES[name] ? name : 'dashboard')));
    $('#pageTitle').textContent = r.title;
    $('#crumb').textContent = r.crumb;
    document.title = `${r.title} · Kitan Admin`;
    $('#app').classList.remove('nav-open');
    view.innerHTML = '<div class="tiles">' + '<div class="card sk" style="height:120px"></div>'.repeat(3) + '</div><div class="card sk" style="height:300px"></div>';
    try {
      await r.render();
    } catch (err) {
      console.error(err);
      view.innerHTML = `<div class="card empty-state">${ICON.alert}<strong>Couldn’t load this page</strong><p>${esc(err.message)}</p><button class="btn" onclick="location.reload()">Try again</button></div>`;
    }
    refreshBadges();
    if (anim) G.from(view.children, { y: 14, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'expo.out', clearProps: 'transform,opacity' });
    view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ======================================================== dashboard */
  function summarize(orders, products, days) {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
    const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - days);
    const series = [];
    for (let i = 0; i < days; i++) { const d = new Date(start); d.setDate(d.getDate() + i); series.push({ date: dateKey(d), revenue: 0, orders: 0 }); }
    const byDate = new Map(series.map((s) => [s.date, s]));
    const inRange = [], prev = [];
    for (const o of orders) {
      const t = new Date(o.createdAt);
      if (t >= start) inRange.push(o); else if (t >= prevStart) prev.push(o);
    }
    const live = inRange.filter((o) => o.status !== 'cancelled');
    const prevLive = prev.filter((o) => o.status !== 'cancelled');
    for (const o of live) { const b = byDate.get(dateKey(o.createdAt)); if (b) { b.revenue += o.total; b.orders++; } }
    const revenue = live.reduce((s, o) => s + o.total, 0);
    const prevRevenue = prevLive.reduce((s, o) => s + o.total, 0);
    const statusCounts = {};
    for (const o of inRange) statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    const tops = new Map();
    let wsRev = 0, allRev = 0;
    for (const o of live) for (const it of o.items) {
      const r = tops.get(it.productId) || { productId: it.productId, name: it.name, colorHex: it.colorHex, units: 0, revenue: 0 };
      r.units += it.qty; r.revenue += it.lineTotal; tops.set(it.productId, r);
      allRev += it.lineTotal; if (it.wholesale) wsRev += it.lineTotal;
    }
    return {
      series, revenue, prevRevenue, orders: live.length, prevOrders: prevLive.length,
      aov: live.length ? revenue / live.length : 0, prevAov: prevLive.length ? prevRevenue / prevLive.length : 0,
      toFulfil: orders.filter((o) => ['pending', 'confirmed', 'paid'].includes(o.status)).length,
      pending: orders.filter((o) => o.status === 'pending').length,
      statusCounts, inRangeCount: inRange.length,
      topProducts: [...tops.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      wholesaleShare: allRev ? wsRev / allRev : 0,
      localShare: live.length ? live.filter((o) => o.delivery === 'ibadan' || o.delivery === 'lagos').length / live.length : 0,
      lagosCount: live.filter((o) => o.delivery === 'lagos').length,
      ibadanCount: live.filter((o) => o.delivery === 'ibadan').length,
      lowStock: products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock),
    };
  }
  function delta(cur, prev) {
    if (!prev) return cur ? '<span class="delta delta--up">New</span>' : '<span class="delta delta--flat">—</span>';
    const pct = ((cur - prev) / prev) * 100;
    const cls = Math.abs(pct) < 0.5 ? 'flat' : pct > 0 ? 'up' : 'down';
    return `<span class="delta delta--${cls}">${pct > 0 ? '▲' : pct < 0 ? '▼' : ''} ${Math.abs(pct).toFixed(0)}%</span>`;
  }

  async function renderDashboard() {
    const [orders, products, inquiries] = await Promise.all([load('orders'), load('products'), load('inquiries')]);
    const d = summarize(orders, products, 30);
    const hasDemo = orders.some((o) => o.demo) || inquiries.some((i) => i.demo);
    const toConfirm = orders.filter((o) => o.status === 'pending');
    const toShip = orders.filter((o) => o.status === 'confirmed' || o.status === 'paid');
    const unread = inquiries.filter((i) => !i.read);
    const low = products.filter((p) => p.active && p.stock <= 5);
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const todo = [
      ...toConfirm.slice(0, 5).map((o) => `<div class="todo">
        <span class="todo__dot todo__dot--new" aria-hidden="true"></span>
        <button class="todo__main" data-order="${o.id}"><strong>${esc(o.customer.name)}</strong><span>${esc(o.number)} · ${naira(o.total)} · ${ago(o.createdAt)}</span></button>
        <button class="btn btn--sm btn--primary" data-confirm="${o.id}">Confirm</button>
      </div>`),
      ...(toShip.length ? [`<a class="todo" href="#/orders"><span class="todo__dot" aria-hidden="true"></span><span class="todo__main"><strong>${toShip.length} order${toShip.length > 1 ? 's' : ''} ready to send out</strong><span>Mark them shipped once they leave</span></span><span class="todo__go">${ICON.chev}</span></a>`] : []),
      ...(unread.length ? [`<a class="todo" href="#/messages"><span class="todo__dot" aria-hidden="true"></span><span class="todo__main"><strong>${unread.length} new message${unread.length > 1 ? 's' : ''}</strong><span>Wholesale requests & questions</span></span><span class="todo__go">${ICON.chev}</span></a>`] : []),
      ...low.map((p) => `<a class="todo" href="#/products"><span class="todo__dot todo__dot--warn" aria-hidden="true"></span><span class="todo__main"><strong>${esc(p.name)}</strong><span>${p.stock === 0 ? 'Sold out — restock or hide it' : `Only ${p.stock} left`}</span></span><span class="todo__go">${ICON.chev}</span></a>`),
    ];
    view.innerHTML = `
      ${hasDemo ? `<div class="banner">${ICON.alert}<p>You’re looking at <strong>sample orders</strong>. Clear them in Settings once real orders arrive.</p></div>` : ''}
      <section class="hello">
        <p>${fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h2>${greet}, Kitan<span aria-hidden="true">✦</span></h2>
      </section>
      <section class="tiles">
        <div class="card tile tile--rose"><span class="tile__label">Sales this month</span><strong class="tile__value" data-count="${d.revenue}" data-fmt="naira">${naira(d.revenue)}</strong><span class="tile__foot">${d.orders} order${d.orders === 1 ? '' : 's'}</span></div>
        <a class="card tile" href="#/orders"><span class="tile__label">To confirm</span><strong class="tile__value" data-count="${toConfirm.length}">${toConfirm.length}</strong><span class="tile__foot">new orders</span></a>
        <a class="card tile" href="#/messages"><span class="tile__label">Messages</span><strong class="tile__value" data-count="${unread.length}">${unread.length}</strong><span class="tile__foot">unread</span></a>
      </section>
      <section class="dash">
        <div class="card">
          <div class="card__head"><h2 class="card__title">Needs your attention</h2></div>
          ${todo.length ? `<div class="todos">${todo.join('')}</div>` : `<div class="empty-state">${ICON.check}<strong>All caught up</strong>Nothing needs you right now.</div>`}
        </div>
        <div class="card">
          <div class="card__head"><div><h2 class="card__title">Sales</h2><p class="card__sub">Last 30 days</p></div></div>
          <div class="chart" id="revChart" tabindex="0" role="img" aria-label="Sales per day over the last 30 days. Total ${naira(d.revenue)}. Use left and right arrow keys to read each day."></div>
        </div>
      </section>`;
    bindOrderRows(view);
    $$('[data-confirm]').forEach((b) => b.addEventListener('click', () => busy(b, async () => {
      const o = cache.orders.find((x) => x.id === b.dataset.confirm);
      Object.assign(o, await API.setOrderStatus(o.id, 'confirmed'));
      toast(`${o.number} confirmed — message ${o.customer.name.split(' ')[0]} on WhatsApp next`);
      renderDashboard();
      refreshBadges();
    }).catch(() => {})));
    areaChart($('#revChart'), d.series);
    if (anim) {
      $$('[data-count]').forEach((el) => {
        const o = { v: 0 };
        G.to(o, { v: +el.dataset.count, duration: 1.3, ease: 'power3.out', onUpdate: () => { el.textContent = el.dataset.fmt === 'naira' ? naira(o.v) : Math.round(o.v); } });
      });
    }
  }

  function areaChart(el, series) {
    const W = Math.max(320, el.clientWidth || 600), H = 280;
    const m = { t: 16, r: 12, b: 28, l: 56 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const max = Math.max(...series.map((s) => s.revenue), 1);
    const step = niceStep(max / 4);
    const top = Math.ceil(max / step) * step;
    const x = (i) => m.l + (series.length === 1 ? iw / 2 : (i / (series.length - 1)) * iw);
    const y = (v) => m.t + ih - (v / top) * ih;
    const pts = series.map((s, i) => [x(i), y(s.revenue)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    const area = line + `L${x(series.length - 1)},${m.t + ih}L${x(0)},${m.t + ih}Z`;
    let grid = '', yl = '';
    for (let v = 0; v <= top + 1; v += step) {
      grid += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>`;
      yl += `<text x="${m.l - 10}" y="${y(v) + 4}" text-anchor="end">${nairaShort(v)}</text>`;
    }
    const every = Math.ceil(series.length / Math.max(2, Math.floor(iw / 90)));
    let xl = '';
    series.forEach((s, i) => {
      if (i % every === 0 || i === series.length - 1) {
        if (i !== series.length - 1 && series.length - 1 - i < every * 0.6) return;
        xl += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${fmtDate(s.date + 'T00:00', { day: 'numeric', month: 'short' })}</text>`;
      }
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--chart)" stop-opacity=".28"/><stop offset="1" stop-color="var(--chart)" stop-opacity="0"/></linearGradient></defs>
      <g class="grid">${grid}</g><g class="axis">${yl}${xl}</g>
      <path class="area" d="${area}"/><path class="line" d="${line}"/>
      <line class="xhair" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" opacity="0"/>
      <circle class="dot" r="5" cx="0" cy="0" opacity="0"/>
      <rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent" class="hit"/>
    </svg><div class="tip" role="presentation"></div>`;
    const svg = $('svg', el), tip = $('.tip', el), xh = $('.xhair', el), dot = $('.dot', el);
    let idx = -1;
    function show(i) {
      idx = Math.max(0, Math.min(series.length - 1, i));
      const [px, py] = pts[idx];
      const s = series[idx];
      xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.setAttribute('opacity', 1);
      dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.setAttribute('opacity', 1);
      const scale = el.clientWidth / W;
      tip.style.left = Math.min(el.clientWidth - 70, Math.max(70, px * scale)) + 'px';
      tip.style.top = py * (el.clientHeight / H) + 'px';
      tip.innerHTML = `<span class="muted">${fmtDate(s.date + 'T00:00', { weekday: 'short', day: 'numeric', month: 'short' })}</span><strong>${naira(s.revenue)}</strong>${s.orders} order${s.orders === 1 ? '' : 's'}`;
      tip.classList.add('is-on');
    }
    function hide() { tip.classList.remove('is-on'); xh.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); }
    svg.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      show(Math.round(((px - m.l) / iw) * (series.length - 1)));
    });
    svg.addEventListener('pointerleave', hide);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(idx < 0 ? series.length - 1 : idx + (e.key === 'ArrowRight' ? 1 : -1)); }
      if (e.key === 'Escape') hide();
    });
    el.addEventListener('blur', hide);
    if (anim) {
      const path = $('.line', el);
      const L = path.getTotalLength();
      G.fromTo(path, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', clearProps: 'strokeDasharray' });
      G.from($('.area', el), { opacity: 0, duration: 1.2, delay: 0.6 });
    }
    let rt;
    const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (document.body.contains(el) && Math.abs(el.clientWidth - W) > 20) areaChart(el, series); }, 150); });
    ro.observe(el);
  }
  function niceStep(raw) {
    if (raw <= 0) return 1000;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  /* ============================================================ orders */
  const ORDER_TABS = [
    ['todo', 'To do', (o) => ['pending', 'confirmed', 'paid'].includes(o.status)],
    ['shipped', 'On the way', (o) => o.status === 'shipped'],
    ['delivered', 'Delivered', (o) => o.status === 'delivered'],
    ['cancelled', 'Cancelled', (o) => o.status === 'cancelled'],
    ['all', 'All', () => true],
  ];
  function ordersTable(list) {
    if (!list.length) return `<div class="empty-state">${ICON.bag}<strong>No orders here</strong>New orders from the store will appear here.</div>`;
    return `<div class="olist">${list.map((o) => `<button class="orow" data-order="${o.id}">
        <span class="orow__who"><strong>${esc(o.customer.name)}</strong><span>${esc(o.number)} · ${fmtDate(o.createdAt, { day: 'numeric', month: 'short' })} · ${esc(o.customer.city || o.customer.state || '')}${o.demo ? ' · demo' : ''}</span></span>
        <span class="orow__total">${naira(o.total)}<span>${((n) => n + (n === 1 ? ' pc' : ' pcs'))(o.items.reduce((s, i) => s + i.qty, 0))}</span></span>
        ${statusPill(o.status)}
      </button>`).join('')}</div>`;
  }
  function bindOrderRows(root) {
    $$('[data-order]', root).forEach((el) => el.addEventListener('click', () => openOrder(el.dataset.order)));
  }

  async function renderOrders() {
    const orders = await load('orders');
    await load('products');
    if (!ORDER_TABS.some(([k]) => k === ui.orderFilter)) ui.orderFilter = 'todo';
    view.innerHTML = `
      <div class="toolbar">
        <div class="seg seg--scroll" role="group" aria-label="Show orders">
          ${ORDER_TABS.map(([k, label, fn]) => `<button data-f="${k}" aria-pressed="${ui.orderFilter === k}">${label} <span class="n">${orders.filter(fn).length}</span></button>`).join('')}
        </div>
        <div class="toolbar__grow"></div>
        <label class="search field" style="margin:0"><span class="sr-only">Search orders</span>${ICON.search}<input type="search" id="oq" placeholder="Search name, phone or order no." value="${esc(ui.orderQuery)}" /></label>
      </div>
      <div class="card card--flush" id="ordersCard"></div>
      <div class="foot-links"><a href="#/customers">See customers</a><button type="button" id="exportCsv">${ICON.download}Download orders (CSV)</button></div>`;
    const draw = () => {
      const q = ui.orderQuery.trim().toLowerCase();
      const digits = q.replace(/\D/g, '');
      const tab = ORDER_TABS.find(([k]) => k === ui.orderFilter)[2];
      const list = orders.filter((o) => tab(o) && (!q
        || o.number.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q)
        || (digits.length >= 4 && o.customer.phone.replace(/\D/g, '').includes(digits))));
      $('#ordersCard').innerHTML = ordersTable(list);
      bindOrderRows($('#ordersCard'));
      return list;
    };
    let current = draw();
    $$('[data-f]').forEach((b) => b.addEventListener('click', () => {
      ui.orderFilter = b.dataset.f;
      $$('[data-f]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      current = draw();
      if (anim) G.from('#ordersCard .orow', { opacity: 0, y: 6, stagger: 0.015, duration: 0.3 });
    }));
    let t;
    $('#oq').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { ui.orderQuery = e.target.value; current = draw(); }, 160); });
    $('#exportCsv').addEventListener('click', () => exportCsv(current));
  }

  function exportCsv(list) {
    const rows = [['Order', 'Date', 'Status', 'Customer', 'Phone', 'Email', 'Address', 'City', 'State', 'Delivery', 'Items', 'Subtotal', 'Delivery fee', 'Total', 'Note']];
    for (const o of list) {
      rows.push([o.number, new Date(o.createdAt).toISOString(), o.status, o.customer.name, o.customer.phone, o.customer.email, o.customer.address, o.customer.city, o.customer.state,
        o.delivery, o.items.map((i) => `${i.name} (${i.color}, ${i.size}) x${i.qty}`).join('; '), o.subtotal, o.deliveryFee, o.total, o.note]);
    }
    const csv = rows.map((r) => r.map((c) => {
      let v = String(c == null ? '' : c);
      if (/^[=+\-@]/.test(v)) v = "'" + v; // avoid spreadsheet formula injection
      return '"' + v.replace(/"/g, '""') + '"';
    }).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = `kitan-orders-${dateKey(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Exported ${list.length} orders`);
  }

  function openOrder(id, quiet) {
    const o = (cache.orders || []).find((x) => x.id === id);
    if (!o) return;
    const s = cache.settings || API.DEFAULT_SETTINGS;
    const first = o.customer.name.split(' ')[0];
    const waMsg = `Hello ${first}, this is ${s.storeName || 'Kitan Essentials'} about your order ${o.number} (${naira(o.total)}). `;
    const idx = FLOW.indexOf(o.status);
    openDrawer(`
      <div class="d-head">
        <div><h2 id="drawerTitle">${esc(o.number)}</h2><p>${fmtDate(o.createdAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${fmtTime(o.createdAt)}${o.demo ? ' · demo' : ''}</p></div>
        <div style="display:flex;gap:8px;align-items:center">${statusPill(o.status)}<button class="icon-btn" data-close aria-label="Close">${ICON.close}</button></div>
      </div>
      <div class="d-body">
        ${o.status !== 'cancelled' && idx < FLOW.length - 1 ? `<button class="btn btn--primary btn--block no-print" data-status="${FLOW[idx + 1]}">${{ confirmed: 'Mark as confirmed', paid: 'Mark as paid', shipped: 'Mark as shipped', delivered: 'Mark as delivered' }[FLOW[idx + 1]]}</button>` : ''}
        <div class="d-section no-print">
          <h3>Progress</h3>
          <div class="stepper">${FLOW.map((st, i) => `<button data-status="${st}" class="${o.status !== 'cancelled' && i < idx ? 'done' : ''} ${st === o.status ? 'current' : ''}"><i>${o.status !== 'cancelled' && i < idx ? '✓' : i + 1}</i>${st}</button>`).join('')}</div>
          <div class="actions-row" style="margin-top:10px">
            ${o.status === 'cancelled' ? '<button class="btn btn--sm" data-status="pending">Restore order</button>' : '<button class="btn btn--sm btn--danger" data-status="cancelled">Cancel order</button>'}
            <span class="muted" style="font-size:12px;align-self:center">Cancelling returns items to stock.</span>
          </div>
        </div>
        <div class="card d-section">
          <h3>Customer</h3>
          <dl class="kv">
            <dt>Name</dt><dd>${esc(o.customer.name)}</dd>
            <dt>Phone</dt><dd><a href="tel:${esc(o.customer.phone.replace(/\s/g, ''))}">${esc(o.customer.phone)}</a></dd>
            ${o.customer.email ? `<dt>Email</dt><dd><a href="mailto:${esc(o.customer.email)}">${esc(o.customer.email)}</a></dd>` : ''}
            <dt>Address</dt><dd>${esc(o.customer.address)}<br>${esc(o.customer.city)}, ${esc(o.customer.state)}</dd>
            <dt>Delivery</dt><dd>${esc(API.DELIVERY[o.delivery] || 'Nationwide')}</dd>
          </dl>
          <div class="actions-row no-print" style="margin-top:14px">
            <a class="btn btn--sm" href="tel:${esc(o.customer.phone.replace(/\s/g, ''))}">${ICON.phone}Call</a>
            <a class="btn btn--sm" href="https://wa.me/${waNumber(o.customer.phone)}?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener">${ICON.wa}WhatsApp</a>
            ${o.customer.email ? `<a class="btn btn--sm" href="mailto:${esc(o.customer.email)}?subject=${encodeURIComponent('Your order ' + o.number)}">${ICON.mail}Email</a>` : ''}
          </div>
        </div>
        <div class="card d-section">
          <h3>Items</h3>
          <div class="line-items">${o.items.map((it) => `<div class="li">${thumb(it, 'li__img')}<div><strong>${esc(it.name)}</strong><div class="sub"><span class="dot-sw" style="background:${esc(it.colorHex || '#000')}"></span>${esc(it.color)} · ${esc(it.size)} · ${it.qty} × ${naira(it.unitPrice)}${it.wholesale ? ' <span class="type-badge">wholesale</span>' : ''}</div></div><strong>${naira(it.lineTotal)}</strong></div>`).join('')}</div>
          <div class="totals"><div><span class="muted">Subtotal</span><span>${naira(o.subtotal)}</span></div><div><span class="muted">Delivery</span><span>${o.deliveryFee ? naira(o.deliveryFee) : 'Free'}</span></div><div class="grand"><span>Total</span><span>${naira(o.total)}</span></div></div>
        </div>
        ${o.note ? `<div class="card d-section"><h3>Customer note</h3><p style="margin:0;white-space:pre-wrap">${esc(o.note)}</p></div>` : ''}
        <div class="d-section no-print">
          <div class="field"><label for="adminNotes">Private notes</label><textarea id="adminNotes" placeholder="Payment reference, rider details, follow-ups…">${esc(o.adminNotes || '')}</textarea></div>
          <div class="actions-row">
            <button class="btn btn--primary btn--sm" id="saveNotes">Save notes</button>
            <button class="btn btn--sm" onclick="window.print()">${ICON.print}Packing slip</button>
            <div style="flex:1"></div>
            <button class="btn btn--sm btn--danger" id="delOrder">${ICON.trash}Delete</button>
          </div>
        </div>
      </div>`, quiet);
    const body = $('#drawerBody');
    $$('[data-status]', body).forEach((b) => b.addEventListener('click', async () => {
      const st = b.dataset.status;
      if (st === o.status) return;
      await busy(b, async () => {
        const updated = await API.setOrderStatus(o.id, st);
        Object.assign(o, updated);
        await load('products', true);
        toast(`Order ${o.number} marked ${st}`);
        refreshBadges();
        openOrder(o.id, true);
        const cur = $(`[data-status="${st}"]`, $('#drawerBody'));
        if (cur) cur.focus();
        rerenderIf(['orders', 'dashboard', 'customers']);
      });
    }));
    $('#saveNotes').addEventListener('click', (e) => busy(e.currentTarget, async () => {
      const updated = await API.updateOrderNotes(o.id, $('#adminNotes').value);
      Object.assign(o, updated);
      toast('Notes saved');
    }));
    $('#delOrder').addEventListener('click', async () => {
      if (!(await confirmBox(`Delete ${o.number}?`, 'This permanently removes the order. Items are returned to stock. This can’t be undone.'))) return;
      await API.deleteOrder(o.id);
      cache.orders = cache.orders.filter((x) => x.id !== o.id);
      await load('products', true);
      closeDrawer();
      toast('Order deleted');
      rerenderIf(['orders', 'dashboard', 'customers']);
    });
  }
  function currentRoute() { return (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?')[0]; }
  function rerenderIf(names) { if (names.includes(currentRoute())) ROUTES[currentRoute()].render().then(refreshBadges); }

  /* ==================================================== photo manager */
  // Drag & drop uploader with reordering. `list` is mutated in place.
  function photoManager(root, list, opts) {
    const max = opts.max || 8;
    root.innerHTML = `
      <label class="drop">${ICON.upload}<strong>Click to upload</strong> or drag photos here<br><span class="hint">${esc(opts.hint || 'JPG, PNG or WebP. Photos are compressed automatically.')} · up to ${max}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic" multiple hidden /></label>
      <div class="upl-progress" hidden><i></i><span></span></div>
      <div class="thumbs"></div>`;
    const drop = $('.drop', root), input = $('input', root), thumbs = $('.thumbs', root), prog = $('.upl-progress', root);
    function draw() {
      thumbs.innerHTML = list.map((u, i) => `<div class="thumb" data-i="${i}">
        <img src="${esc(u)}" alt="Photo ${i + 1}" loading="lazy" />
        ${i === 0 && opts.cover !== false ? '<span class="cover">Cover</span>' : ''}
        <div class="thumb__bar">
          <button type="button" data-mv="-1" aria-label="Move photo ${i + 1} left" ${i === 0 ? 'disabled' : ''}>‹</button>
          <button type="button" data-rm aria-label="Remove photo ${i + 1}">×</button>
          <button type="button" data-mv="1" aria-label="Move photo ${i + 1} right" ${i === list.length - 1 ? 'disabled' : ''}>›</button>
        </div>
      </div>`).join('');
      drop.hidden = list.length >= max;
      opts.onChange && opts.onChange();
    }
    async function add(files) {
      files = Array.from(files).filter((x) => /^image\//.test(x.type) || /\.(heic|jpe?g|png|webp|avif)$/i.test(x.name));
      const tooBig = files.filter((x) => x.size > 15 * 1024 * 1024);
      if (tooBig.length) toast(`${tooBig.length} photo(s) over 15 MB were skipped`, 'err');
      files = files.filter((x) => x.size <= 15 * 1024 * 1024).slice(0, max - list.length);
      if (!files.length) return;
      prog.hidden = false;
      let done = 0;
      try {
        for (const f of files) {
          $('span', prog).textContent = `Uploading ${done + 1} of ${files.length}…`;
          $('i', prog).style.width = (done / files.length) * 100 + '%';
          const [url] = await API.uploadImages([f], opts.folder || 'products');
          list.push(url);
          done++;
          draw();
          const t = thumbs.lastElementChild;
          if (anim && t) G.from(t, { scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
        }
        toast(`${done} photo${done > 1 ? 's' : ''} uploaded`);
      } catch (err) { toast(err.message, 'err'); }
      finally { prog.hidden = true; }
    }
    input.addEventListener('change', () => { add(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', (e) => add(e.dataTransfer.files));
    thumbs.addEventListener('click', (e) => {
      const t = e.target.closest('.thumb');
      if (!t) return;
      const i = +t.dataset.i;
      const mv = e.target.closest('[data-mv]');
      if (e.target.closest('[data-rm]')) list.splice(i, 1);
      else if (mv) { const j = i + +mv.dataset.mv; [list[i], list[j]] = [list[j], list[i]]; }
      else return;
      draw();
    });
    draw();
  }

  /* ======================================================= storefront */
  async function renderStorefront() {
    const s = await load('settings', true);
    const hero = [...(s.heroImages || [])];
    const look = [...(s.lookbook || [])];
    view.innerHTML = `
      <div class="seg tabs" role="tablist" aria-label="Storefront">
        <button role="tab" aria-selected="${ui.sfTab !== 'reviews'}" data-sft="photos">Photos</button>
        <button role="tab" aria-selected="${ui.sfTab === 'reviews'}" data-sft="reviews">Reviews</button>
      </div>
      <div id="sfReviews" ${ui.sfTab === 'reviews' ? '' : 'hidden'}></div>
      <div id="sfPhotos" ${ui.sfTab === 'reviews' ? 'hidden' : ''}>
      <p class="hint-line">Portrait photos of people wearing Kitan look best. Product photos go on each product in <a href="#/products">Products</a>.</p>
      <div class="sf-grid">
        <section class="card">
          <div class="card__head"><div><h2 class="card__title">Hero photos</h2><p class="card__sub">The big opening section of the store. They crossfade like a slideshow. Leave empty to show the animated product illustration.</p></div></div>
          <div id="heroPm"></div>
        </section>
        <section class="card">
          <div class="card__head"><div><h2 class="card__title">Lookbook</h2><p class="card__sub">A swipeable gallery on the store, linked to your Instagram.</p></div></div>
          <div class="field"><label for="lbTitle">Lookbook title</label><input id="lbTitle" value="${esc(s.lookbookTitle || '')}" maxlength="60" placeholder="The new collection" /></div>
          <div id="lookPm"></div>
        </section>
      </div>
      <div class="save-bar"><span class="muted" id="sfState">All changes saved</span><div class="actions-row"><a class="btn" href="../" target="_blank" rel="noopener">Preview store</a><button class="btn btn--primary" id="sfSave">Save photos</button></div></div>
      </div>`;
    $$('[data-sft]').forEach((b) => b.addEventListener('click', () => {
      ui.sfTab = b.dataset.sft;
      $$('[data-sft]').forEach((x) => x.setAttribute('aria-selected', x === b));
      $('#sfPhotos').hidden = ui.sfTab === 'reviews';
      $('#sfReviews').hidden = ui.sfTab !== 'reviews';
      if (ui.sfTab === 'reviews' && !$('#sfReviews').childElementCount) renderReviews($('#sfReviews'));
    }));
    if (ui.sfTab === 'reviews') renderReviews($('#sfReviews'));
    const dirty = () => { $('#sfState').textContent = 'Unsaved changes'; };
    let ready = false;
    photoManager($('#heroPm'), hero, { max: 6, folder: 'store', cover: false, hint: 'Portrait (tall) photos work best', onChange: () => ready && dirty() });
    photoManager($('#lookPm'), look, { max: 16, folder: 'store', cover: false, onChange: () => ready && dirty() });
    ready = true;
    $('#lbTitle').addEventListener('input', dirty);
    $('#sfSave').addEventListener('click', (e) => busy(e.currentTarget, async () => {
      cache.settings = await API.saveSettings({ ...cache.settings, heroImages: hero, lookbook: look, lookbookTitle: $('#lbTitle').value.trim() });
      $('#sfState').textContent = 'All changes saved';
      toast('Storefront updated — it’s live on your store');
    }).catch(() => {}));
  }

  /* ========================================================= products */
  async function renderProducts() {
    const products = await load('products');
    const cats = ['All', ...new Set(products.map((p) => p.category))];
    view.innerHTML = `
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Filter by category">${cats.map((c) => `<button data-cat="${esc(c)}" aria-pressed="${ui.productCat === c}">${esc(c)}</button>`).join('')}</div>
        <div class="toolbar__grow"></div>
        <label class="search field" style="margin:0"><span class="sr-only">Search products</span>${ICON.search}<input type="search" id="pq" placeholder="Search products" value="${esc(ui.productQuery)}" /></label>
        <button class="btn btn--primary" id="newProduct">${ICON.plus}New product</button>
      </div>
      <div class="pgrid" id="pgrid"></div>`;
    const draw = () => {
      const q = ui.productQuery.toLowerCase();
      const list = products.filter((p) => (ui.productCat === 'All' || p.category === ui.productCat) && (!q || p.name.toLowerCase().includes(q)));
      $('#pgrid').innerHTML = list.length ? list.map((p) => {
        const c = p.colors[0] || { hex: '#1b1a1c' };
        return `<article class="card pcard" data-id="${p.id}">
          <div class="pcard__media" style="--tint:${J.tint(c.hex)}" data-edit>
            ${p.images[0] ? `<img src="${esc(p.images[0])}" alt="" loading="lazy" />` : J.svg(c.hex, p.cut, { label: '' })}
            <div class="pcard__tags">${p.featured ? '<span class="tag tag--gold">Featured</span>' : ''}${!p.active ? '<span class="tag tag--off">Hidden</span>' : ''}${p.stock === 0 ? '<span class="tag tag--warn">Sold out</span>' : p.stock <= 10 ? '<span class="tag tag--warn">Low stock</span>' : ''}</div>
          </div>
          <div class="pcard__body">
            <h3 class="pcard__name">${esc(p.name)}</h3>
            <div class="pcard__row"><span><strong>${naira(p.price)}</strong> retail</span><span>${naira(p.wholesalePrice)} ws</span></div>
            <div class="pcard__row"><span class="${p.stock === 0 ? 'stock-out' : p.stock <= 10 ? 'stock-low' : ''}">${p.stock} in stock</span><span>${p.colors.map((x) => `<span class="dot-sw" style="background:${x.hex}" title="${esc(x.name)}"></span>`).join('')}</span></div>
            <div class="pcard__actions">
              <button class="btn btn--sm" data-edit>Edit</button>
              <label class="check btn btn--sm" style="gap:8px" title="Show on store"><span class="switch"><input type="checkbox" data-active ${p.active ? 'checked' : ''} aria-label="Visible on store" /><span></span></span>Live</label>
            </div>
          </div>
        </article>`;
      }).join('') : `<div class="card empty-state" style="grid-column:1/-1">${ICON.box}<strong>No products found</strong><button class="btn btn--primary" style="margin-top:12px" id="emptyNew">${ICON.plus}Add a product</button></div>`;
      if (anim) G.from('.pcard', { opacity: 0, y: 16, scale: 0.98, stagger: 0.04, duration: 0.5, ease: 'expo.out', clearProps: 'all' });
      const en = $('#emptyNew'); en && en.addEventListener('click', () => editProduct(null));
    };
    draw();
    $$('[data-cat]').forEach((b) => b.addEventListener('click', () => { ui.productCat = b.dataset.cat; $$('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); }));
    $('#pq').addEventListener('input', (e) => { ui.productQuery = e.target.value; draw(); });
    $('#newProduct').addEventListener('click', () => editProduct(null));
    $('#pgrid').addEventListener('click', (e) => {
      const card = e.target.closest('.pcard');
      if (card && e.target.closest('[data-edit]')) editProduct(card.dataset.id);
    });
    $('#pgrid').addEventListener('change', async (e) => {
      if (!e.target.matches('[data-active]')) return;
      const card = e.target.closest('.pcard');
      const p = products.find((x) => x.id === card.dataset.id);
      try {
        const saved = await API.saveProduct({ ...p, active: e.target.checked });
        Object.assign(p, saved);
        toast(`${p.name} is now ${p.active ? 'live on the store' : 'hidden from the store'}`);
        draw();
      } catch (err) { e.target.checked = !e.target.checked; toast(err.message, 'err'); }
    });
  }

  const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One size', '2–4Y', '5–7Y', '8–10Y', '11–13Y'];
  function editProduct(id) {
    const existing = id ? (cache.products || []).find((p) => p.id === id) : null;
    const p = existing ? JSON.parse(JSON.stringify(existing)) : {
      name: '', category: 'Classic', cut: 'cuffed', description: '', price: 12000, wholesalePrice: 9000, wholesaleMin: 6, stock: 50,
      featured: false, active: true, colors: [{ name: 'Jet Black', hex: '#1b1a1c' }], sizes: ['S', 'M', 'L', 'XL', 'XXL'], images: [],
    };
    const cats = [...new Set([...(cache.products || []).map((x) => x.category), 'Classic', 'Lounge', 'Utility', 'Pants & Shorts', 'Tops', 'Sunglasses', 'Kids'])];
    openModal(`
      <form id="pForm" novalidate>
        <div class="d-head"><div><h2 id="modalTitle">${existing ? 'Edit product' : 'New product'}</h2><p>${existing ? 'Changes go live on the store as soon as you save.' : 'Add a new style to your collection.'}</p></div><button type="button" class="icon-btn" data-close aria-label="Close">${ICON.close}</button></div>
        <div class="m-body pform">
          <section class="pform__sec">
            <h3>Photos</h3>
            <div id="pPhotos"></div>
            <p class="hint">The first photo is the cover. No photos yet? The store shows a matching drawing.</p>
          </section>
          <section class="pform__sec">
            <h3>Name &amp; price</h3>
            <div class="field"><label for="fName">Product name</label><input id="fName" name="name" value="${esc(p.name)}" placeholder="e.g. The Signature Jogger" data-autofocus required /><small class="field__err"></small></div>
            <div class="grid-2">
              <div class="field"><label for="fPrice">Price (₦)</label><input id="fPrice" name="price" type="number" min="0" step="50" inputmode="numeric" value="${p.price}" /></div>
              <div class="field"><label for="fWs">Wholesale price (₦)</label><input id="fWs" name="wholesalePrice" type="number" min="0" step="50" inputmode="numeric" value="${p.wholesalePrice}" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label for="fStock">How many in stock</label><input id="fStock" name="stock" type="number" min="0" inputmode="numeric" value="${p.stock}" /></div>
              <label class="check" style="margin-top:22px"><span class="switch"><input type="checkbox" name="active" ${p.active ? 'checked' : ''} /><span></span></span>Show on store</label>
            </div>
          </section>
          <section class="pform__sec">
            <h3>Colours &amp; sizes</h3>
            <div class="colors-edit" id="colorsEdit"></div><button type="button" class="btn btn--sm" id="addColor" style="margin:8px 0 14px">${ICON.plus}Add colour</button>
            <div class="sizes-edit" id="sizesEdit"></div>
          </section>
          <section class="pform__sec">
            <h3>Description</h3>
            <div class="field"><label for="fDesc" class="sr-only">Description</label><textarea id="fDesc" name="description" rows="3" placeholder="Fabric, fit, how to style it…">${esc(p.description)}</textarea></div>
            <details class="more">
              <summary>More options</summary>
              <div class="grid-2">
                <div class="field"><label for="fCat">Category</label><input id="fCat" name="category" list="catList" value="${esc(p.category)}" /><datalist id="catList">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
                <div class="field"><label for="fWsMin">Wholesale price from (pcs)</label><input id="fWsMin" name="wholesaleMin" type="number" min="1" inputmode="numeric" value="${p.wholesaleMin}" /></div>
              </div>
              <div class="grid-2">
                <div class="field"><label for="fCut">Drawing style (when no photos)</label><select id="fCut" name="cut">${J.STYLES.map(([v, l]) => `<option value="${v}" ${p.cut === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
                <label class="check" style="margin-top:22px"><span class="switch"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''} /><span></span></span>Show in Bestsellers</label>
              </div>
            </details>
          </section>
        </div>
        <div class="m-foot">
          ${existing ? `<button type="button" class="btn btn--danger" id="delProduct" style="margin-right:auto">${ICON.trash}Delete</button>` : ''}
          <button type="button" class="btn" data-close>Cancel</button>
          <button type="submit" class="btn btn--primary">${existing ? 'Save changes' : 'Create product'}</button>
        </div>
      </form>`);

    const f = $('#pForm');
    function preview() {
      const c = p.colors[0] || { hex: '#1b1a1c' };
      const m = $('#pvMedia');
      if (!m) return;
      m.style.setProperty('--tint', J.tint(c.hex));
      m.innerHTML = p.images[0] ? `<img src="${esc(p.images[0])}" alt="" />` : J.svg(c.hex, f.cut.value, { label: '' });
      $('#pvName').textContent = f.name.value || 'Product name';
      $('#pvPrice').textContent = `${naira(f.price.value)} · ws ${naira(f.wholesalePrice.value)}`;
    }
    function drawColors() {
      $('#colorsEdit').innerHTML = p.colors.map((c, i) => `<div class="color-row" data-i="${i}">
        <input type="color" value="${esc(c.hex)}" aria-label="Colour ${i + 1} swatch" data-hex />
        <input class="input" value="${esc(c.name)}" placeholder="Colour name" aria-label="Colour ${i + 1} name" data-name />
        <button type="button" class="icon-btn" aria-label="Remove colour" data-rm ${p.colors.length < 2 ? 'disabled' : ''}>${ICON.close}</button>
      </div>`).join('');
    }
    function drawSizes() {
      const all = [...new Set([...SIZE_PRESETS, ...p.sizes])];
      $('#sizesEdit').innerHTML = all.map((s) => `<button type="button" class="size-tog" aria-pressed="${p.sizes.includes(s)}">${esc(s)}</button>`).join('')
        + '<input class="input" id="customSize" placeholder="+ custom" style="width:110px;min-height:36px" aria-label="Add a custom size" />';
    }
    drawColors(); drawSizes();
    photoManager($('#pPhotos'), p.images, { max: 8, folder: 'products', onChange: () => preview() });
    preview();

    f.addEventListener('input', (e) => {
      const row = e.target.closest('.color-row');
      if (row) {
        const c = p.colors[+row.dataset.i];
        if (e.target.matches('[data-hex]')) c.hex = e.target.value;
        if (e.target.matches('[data-name]')) c.name = e.target.value;
      }
      preview();
    });
    $('#addColor').addEventListener('click', () => { p.colors.push({ name: '', hex: '#6b4f3f' }); drawColors(); $('#colorsEdit .color-row:last-child [data-name]').focus(); });
    $('#colorsEdit').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]');
      if (!b || p.colors.length < 2) return;
      p.colors.splice(+b.closest('.color-row').dataset.i, 1);
      drawColors(); preview();
    });
    $('#sizesEdit').addEventListener('click', (e) => {
      const b = e.target.closest('.size-tog');
      if (!b) return;
      const s = b.textContent;
      p.sizes = p.sizes.includes(s) ? p.sizes.filter((x) => x !== s) : [...p.sizes, s];
      b.setAttribute('aria-pressed', p.sizes.includes(s));
    });
    $('#sizesEdit').addEventListener('keydown', (e) => {
      if (e.target.id !== 'customSize' || e.key !== 'Enter') return;
      e.preventDefault();
      const v = e.target.value.trim().slice(0, 12);
      if (v && !p.sizes.includes(v)) { p.sizes.push(v); drawSizes(); $('#customSize').focus(); }
    });
    const del = $('#delProduct');
    if (del) del.addEventListener('click', async () => {
      if (!(await confirmBox(`Delete ${p.name}?`, 'It will be removed from the store. Past orders keep their details. Tip: you can switch “Visible on store” off instead to hide it temporarily.'))) return;
      try {
        await API.deleteProduct(p.id);
        cache.products = cache.products.filter((x) => x.id !== p.id);
        toast('Product deleted');
        rerenderIf(['products', 'dashboard']);
      } catch (err) { toast(err.message, 'err'); }
    });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameField = f.name.closest('.field');
      nameField.classList.toggle('has-error', !f.name.value.trim());
      $('.field__err', nameField).textContent = f.name.value.trim() ? '' : 'Give your product a name.';
      if (!f.name.value.trim()) { f.name.focus(); return; }
      if (!p.sizes.length) { toast('Choose at least one size', 'err'); return; }
      p.colors = p.colors.filter((c) => c.name.trim());
      if (!p.colors.length) { toast('Add at least one colour with a name', 'err'); drawColors(); return; }
      const data = {
        ...p, name: f.name.value, category: f.category.value || 'Classic', cut: f.cut.value, description: f.description.value,
        price: f.price.value, wholesalePrice: f.wholesalePrice.value, wholesaleMin: f.wholesaleMin.value, stock: f.stock.value,
        featured: f.featured.checked, active: f.active.checked,
      };
      if (+data.wholesalePrice > +data.price) toast('Heads up: wholesale price is higher than retail', 'err');
      const btn = $('button[type="submit"]', f);
      await busy(btn, async () => {
        const saved = await API.saveProduct(data);
        const i = cache.products.findIndex((x) => x.id === saved.id);
        if (i >= 0) cache.products[i] = saved; else cache.products.push(saved);
        closeModal();
        toast(existing ? 'Product updated' : 'Product created');
        rerenderIf(['products', 'dashboard']);
      }).catch(() => {});
    });
  }

  /* ========================================================= messages */
  async function renderMessages() {
    const list = await load('inquiries');
    const counts = { all: list.length, unread: list.filter((i) => !i.read).length, wholesale: list.filter((i) => i.type === 'wholesale').length, contact: list.filter((i) => i.type === 'contact').length };
    view.innerHTML = `
      <div class="toolbar"><div class="seg" role="group" aria-label="Filter messages">${['all', 'unread', 'wholesale', 'contact'].map((f) => `<button data-mf="${f}" aria-pressed="${ui.msgFilter === f}" style="text-transform:capitalize">${f} <span class="n">${counts[f]}</span></button>`).join('')}</div></div>
      <div class="msgs" id="msgs"></div>`;
    const draw = () => {
      const items = list.filter((i) => ui.msgFilter === 'all' || (ui.msgFilter === 'unread' ? !i.read : i.type === ui.msgFilter));
      $('#msgs').innerHTML = items.length ? items.map((m) => `<article class="card msg ${m.read ? '' : 'is-unread'}" data-id="${m.id}">
        <span class="msg__dot" aria-hidden="true"></span>
        <div>
          <div class="msg__head"><strong>${esc(m.name)}</strong><span class="type-badge ${m.type === 'contact' ? 'type-badge--contact' : ''}">${m.type === 'wholesale' ? 'Wholesale quote' : 'Message'}</span>${m.read ? '' : '<span class="sr-only">Unread</span>'}<span class="msg__meta">${ago(m.createdAt)}</span></div>
          <div class="msg__info">${m.business ? `<span>🏷 ${esc(m.business)}</span>` : ''}${m.quantity ? `<span><strong>${m.quantity}</strong> pcs</span>` : ''}${m.phone ? `<span>${esc(m.phone)}</span>` : ''}${m.email ? `<span>${esc(m.email)}</span>` : ''}</div>
          ${m.message ? `<p class="msg__text">${esc(m.message)}</p>` : ''}
        </div>
        <div class="msg__actions">
          ${m.phone ? `<a class="btn btn--sm" href="https://wa.me/${waNumber(m.phone)}?text=${encodeURIComponent(`Hello ${m.name.split(' ')[0]}, thank you for contacting Kitan Essentials. `)}" target="_blank" rel="noopener">${ICON.wa}WhatsApp</a><a class="btn btn--sm" href="tel:${esc(m.phone.replace(/\s/g, ''))}">${ICON.phone}Call</a>` : ''}
          ${m.email ? `<a class="btn btn--sm" href="mailto:${esc(m.email)}?subject=${encodeURIComponent(m.type === 'wholesale' ? 'Your wholesale quote — Kitan Essentials' : 'Re: your message to Kitan Essentials')}">${ICON.mail}Email</a>` : ''}
          <button class="btn btn--sm" data-read>${m.read ? 'Mark unread' : 'Mark read'}</button>
          <button class="icon-btn" data-del aria-label="Delete message">${ICON.trash}</button>
        </div>
      </article>`).join('') : `<div class="card empty-state">${ICON.inbox}<strong>Inbox zero</strong>Wholesale requests and messages from the store appear here.</div>`;
    };
    draw();
    $$('[data-mf]').forEach((b) => b.addEventListener('click', () => { ui.msgFilter = b.dataset.mf; $$('[data-mf]').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); if (anim) G.from('.msg', { opacity: 0, y: 8, stagger: 0.03, duration: 0.35 }); }));
    $('#msgs').addEventListener('click', async (e) => {
      const card = e.target.closest('.msg');
      if (!card) return;
      const m = list.find((x) => x.id === card.dataset.id);
      if (e.target.closest('[data-read]')) {
        await API.markInquiry(m.id, !m.read); m.read = !m.read; draw(); refreshBadges();
      } else if (e.target.closest('[data-del]')) {
        if (!(await confirmBox('Delete this message?', 'This can’t be undone.'))) return;
        await API.deleteInquiry(m.id);
        cache.inquiries = list.splice(list.indexOf(m), 1) && list;
        draw(); refreshBadges(); toast('Message deleted');
      } else if (e.target.closest('a') && !m.read) {
        await API.markInquiry(m.id, true); m.read = true; draw(); refreshBadges();
      }
    });
  }

  /* ======================================================== customers */
  async function renderCustomers() {
    const orders = await load('orders');
    const map = new Map();
    for (const o of orders) {
      const key = o.customer.phone.replace(/\D/g, '').slice(-10) || o.customer.name.toLowerCase();
      const c = map.get(key) || { name: o.customer.name, phone: o.customer.phone, email: o.customer.email, city: o.customer.city, state: o.customer.state, orders: 0, spent: 0, last: o.createdAt, wholesale: false };
      c.orders++;
      if (o.status !== 'cancelled') c.spent += o.total;
      if (o.items.some((i) => i.wholesale)) c.wholesale = true;
      if (o.createdAt > c.last) { c.last = o.createdAt; c.name = o.customer.name; c.city = o.customer.city; c.state = o.customer.state; }
      if (!c.email && o.customer.email) c.email = o.customer.email;
      map.set(key, c);
    }
    const all = [...map.values()].sort((a, b) => b.spent - a.spent);
    view.innerHTML = `
      <div class="toolbar"><span class="muted">${all.length} customers · ${all.filter((c) => c.orders > 1).length} repeat buyers · ${all.filter((c) => c.wholesale).length} wholesale buyers</span><div class="toolbar__grow"></div>
      <label class="search field" style="margin:0"><span class="sr-only">Search customers</span>${ICON.search}<input type="search" id="cq" placeholder="Search name, phone or state" value="${esc(ui.custQuery)}" /></label></div>
      <div class="card" id="custCard"></div>`;
    const draw = () => {
      const q = ui.custQuery.toLowerCase();
      const list = all.filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.state || '').toLowerCase().includes(q));
      $('#custCard').innerHTML = list.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Customer</th><th class="hide-sm">Location</th><th class="num">Orders</th><th class="num">Spent</th><th class="hide-sm">Last order</th><th></th></tr></thead><tbody>
        ${list.map((c) => `<tr class="is-click" data-phone="${esc(c.phone)}" tabindex="0"><td><span class="strong">${esc(c.name)}</span>${c.wholesale ? ' <span class="type-badge">WS</span>' : ''}<span class="sub">${esc(c.phone)}</span></td><td class="hide-sm">${esc(c.city || '')}${c.state ? ', ' + esc(c.state) : ''}</td><td class="num">${c.orders}</td><td class="num strong">${naira(c.spent)}</td><td class="hide-sm">${ago(c.last)}</td>
        <td class="num"><a class="icon-btn" style="display:inline-grid" href="https://wa.me/${waNumber(c.phone)}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(c.name)}" data-stop>${ICON.wa}</a></td></tr>`).join('')}
        </tbody></table></div>` : `<div class="empty-state">${ICON.search}<strong>No customers yet</strong>Customers are created automatically from orders.</div>`;
      $$('[data-phone]').forEach((tr) => {
        const go = (e) => { if (e.target.closest('[data-stop]')) return; ui.orderFilter = 'all'; ui.orderQuery = tr.dataset.phone; location.hash = '#/orders'; };
        tr.addEventListener('click', go);
        tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(e); });
      });
    };
    draw();
    $('#cq').addEventListener('input', (e) => { ui.custQuery = e.target.value; draw(); });
  }

  /* ========================================================== reviews */
  async function renderReviews(target = view) {
    const list = await load('reviews');
    let editing = null;
    target.innerHTML = `
      <div class="reviews-layout">
        <div>
          <p class="muted" style="margin:0 0 14px">Add genuine reviews from your customers (WhatsApp messages, Instagram comments…). The reviews section on the store only appears once you add at least one visible review.</p>
          <div class="msgs" id="revList"></div>
        </div>
        <form class="card" id="revForm" novalidate>
          <h2 class="card__title" id="revFormTitle" style="margin-bottom:14px">Add a review</h2>
          <div class="field"><label for="rName">Customer name</label><input id="rName" name="name" maxlength="60" required /></div>
          <div class="field"><label for="rLoc">Location <span class="hint">(optional)</span></label><input id="rLoc" name="location" maxlength="60" placeholder="e.g. Bodija, Ibadan" /></div>
          <div class="field"><span class="label">Rating</span><div class="rating-pick" id="ratingPick" role="radiogroup" aria-label="Rating"></div></div>
          <div class="field"><label for="rText">Review</label><textarea id="rText" name="text" maxlength="500" required></textarea></div>
          <label class="check"><span class="switch"><input type="checkbox" name="visible" checked /><span></span></span>Show on store</label>
          <div class="actions-row" style="margin-top:14px"><button class="btn btn--primary" type="submit">Save review</button><button class="btn" type="reset" id="revCancel">Clear</button></div>
        </form>
      </div>`;
    let rating = 5;
    const drawStars = () => { $('#ratingPick').innerHTML = [1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="${n === rating}" aria-label="${n} star${n > 1 ? 's' : ''}" class="${n <= rating ? 'on' : ''}" data-r="${n}">★</button>`).join(''); };
    drawStars();
    $('#ratingPick').addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { rating = +b.dataset.r; drawStars(); } });
    const draw = () => {
      $('#revList').innerHTML = list.length ? list.map((r) => `<article class="card rev" data-id="${r.id}">
        <div class="msg__head"><strong>${esc(r.name)}</strong>${r.location ? `<span class="msg__meta">${esc(r.location)}</span>` : ''}<span class="stars" aria-label="${r.rating} stars">${'★'.repeat(r.rating)}</span>${r.visible ? '' : '<span class="type-badge type-badge--contact">Hidden</span>'}</div>
        <p class="msg__text" style="margin:0">“${esc(r.text)}”</p>
        <div class="actions-row"><button class="btn btn--sm" data-edit>Edit</button><button class="btn btn--sm btn--danger" data-del>Delete</button></div>
      </article>`).join('') : `<div class="card empty-state">${ICON.check.replace('m5 12', 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z M5 12')}<strong>No reviews yet</strong>Add your first customer review using the form.</div>`;
    };
    draw();
    const f = $('#revForm');
    $('#revList').addEventListener('click', async (e) => {
      const card = e.target.closest('.rev');
      if (!card) return;
      const r = list.find((x) => x.id === card.dataset.id);
      if (e.target.closest('[data-edit]')) {
        editing = r; rating = r.rating; drawStars();
        f.name.value = r.name; f.location.value = r.location || ''; f.text.value = r.text; f.visible.checked = r.visible;
        $('#revFormTitle').textContent = 'Edit review';
        f.name.focus();
      }
      if (e.target.closest('[data-del]')) {
        if (!(await confirmBox('Delete this review?', 'It will be removed from the store.'))) return;
        await API.deleteReview(r.id);
        list.splice(list.indexOf(r), 1); draw(); toast('Review deleted');
      }
    });
    f.addEventListener('reset', () => { editing = null; rating = 5; setTimeout(drawStars); $('#revFormTitle').textContent = 'Add a review'; });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!f.name.value.trim() || !f.text.value.trim()) { toast('Name and review text are required', 'err'); return; }
      await busy($('button[type="submit"]', f), async () => {
        const saved = await API.saveReview({ id: editing && editing.id, name: f.name.value.trim(), location: f.location.value.trim(), text: f.text.value.trim(), rating, visible: f.visible.checked });
        if (editing) Object.assign(editing, saved); else list.unshift(saved);
        f.reset(); draw(); toast('Review saved');
      }).catch(() => {});
    });
  }

  /* ========================================================= settings */
  async function renderSettings() {
    const s = await load('settings', true);
    const live = API.mode === 'live';
    const field = (name, label, opts = {}) => `<div class="field"><label for="s_${name}">${label}${opts.hint ? ` <span class="hint">${opts.hint}</span>` : ''}</label><input id="s_${name}" name="${name}" type="${opts.type || 'text'}" ${opts.type === 'number' ? 'min="0" step="100" inputmode="numeric"' : ''} value="${esc(s[name])}" placeholder="${esc(opts.ph || '')}" /></div>`;
    const tab = ui.setTab || 'shop';
    view.innerHTML = `
      <div class="seg tabs" role="tablist" aria-label="Settings">
        <button role="tab" data-st="shop" aria-selected="${tab === 'shop'}">Shop</button>
        <button role="tab" data-st="delivery" aria-selected="${tab === 'delivery'}">Delivery &amp; payment</button>
        <button role="tab" data-st="account" aria-selected="${tab === 'account'}">Account</button>
      </div>
      <form id="settingsForm" novalidate class="stack-gap">
        <section class="card" data-pane="shop" ${tab === 'shop' ? '' : 'hidden'}>
          ${field('storeName', 'Shop name')}
          ${field('tagline', 'Short description')}
          ${field('announcement', 'Top banner message', { hint: '(leave empty to hide)' })}
          <div class="grid-2">${field('whatsapp', 'WhatsApp number', { type: 'tel', ph: '0803 123 4567' })}${field('instagram', 'Instagram', { ph: 'kitan_essentials0' })}</div>
          <div class="grid-2">${field('phone', 'Phone', { type: 'tel' })}${field('email', 'Email', { type: 'email' })}</div>
          ${field('location', 'Location')}
        </section>
        <section class="card" data-pane="delivery" ${tab === 'delivery' ? '' : 'hidden'}>
          <h2 class="card__title">Delivery fees</h2>
          <div class="grid-3">${field('lagosFee', 'Lagos (₦)', { type: 'number' })}${field('ibadanFee', 'Ibadan (₦)', { type: 'number' })}${field('nationwideFee', 'Other states (₦)', { type: 'number' })}</div>
          ${field('freeDeliveryOver', 'Free delivery for orders over (₦)', { type: 'number', hint: '0 = never' })}
          <h2 class="card__title" style="margin-top:10px">Bank transfer</h2>
          <p class="card__sub" style="margin:0 0 12px">Customers see this right after they order.</p>
          <div class="grid-3">${field('bankName', 'Bank', { ph: 'e.g. GTBank' })}${field('accountName', 'Account name')}${field('accountNumber', 'Account number', { ph: '0123456789' })}</div>
        </section>
        <div class="save-bar" data-pane-save ${tab === 'account' ? 'hidden' : ''}><span class="muted" id="saveState">All changes saved</span><button class="btn btn--primary" type="submit">Save</button></div>
      </form>
      <div data-pane="account" class="stack-gap" ${tab === 'account' ? '' : 'hidden'}>
        <section class="card">
          <h2 class="card__title">Password</h2>
          <p class="card__sub" style="margin:0 0 12px">Signed in as ${esc(cache.session && cache.session.email)}</p>
          <form id="pwForm" class="grid-2" novalidate style="align-items:end">
            <div class="field"><label for="pwNew">New password</label><input id="pwNew" type="password" autocomplete="new-password" minlength="8" /></div>
            <div class="field"><label for="pwNew2">Type it again</label><input id="pwNew2" type="password" autocomplete="new-password" /></div>
            <div><button class="btn" type="submit">Change password</button></div>
          </form>
        </section>
        <section class="card">
          <div class="conn conn--${live ? 'live' : 'demo'}">
            <div class="conn__icon">${ICON.db}</div>
            <div>
              <h2 class="card__title">${live ? 'Your shop is live' : 'Demo mode'}</h2>
              <p>${live ? 'Orders, products and messages are saved safely online.' : 'Changes are saved in this browser only until the database is connected.'}</p>
            </div>
          </div>
          ${!live ? `<div class="actions-row" style="margin-top:16px"><button class="btn" id="clearDemo">${ICON.trash}Clear sample orders</button><button class="btn btn--danger" id="resetDemo">Reset demo</button></div>` : ''}
        </section>
      </div>`;
    $$('[data-st]').forEach((b) => b.addEventListener('click', () => {
      ui.setTab = b.dataset.st;
      $$('[data-st]').forEach((x) => x.setAttribute('aria-selected', x === b));
      $$('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== ui.setTab; });
      $('[data-pane-save]').hidden = ui.setTab === 'account';
      if (anim) G.from($$('[data-pane]:not([hidden])'), { y: 10, opacity: 0, duration: 0.4, ease: 'expo.out' });
    }));
    const f = $('#settingsForm');
    f.addEventListener('input', () => { $('#saveState').textContent = 'Unsaved changes'; });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = { ...s };
      for (const el of f.elements) if (el.name) data[el.name] = el.type === 'number' ? Math.max(0, Math.round(+el.value || 0)) : el.value.trim();
      data.instagram = (data.instagram || '').replace(/^@/, '');
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { toast('Please enter a valid email', 'err'); return; }
      await busy($('button[type="submit"]', f), async () => {
        cache.settings = await API.saveSettings(data);
        $('#saveState').textContent = 'All changes saved';
        toast('Settings saved');
      }).catch(() => {});
    });
    $('#pwForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const a = $('#pwNew').value, b = $('#pwNew2').value;
      if (a.length < 8) { toast('Use at least 8 characters', 'err'); return; }
      if (a !== b) { toast('Passwords don’t match', 'err'); return; }
      await busy($('button', e.target), async () => { await API.changePassword(a); e.target.reset(); toast('Password updated'); }).catch(() => {});
    });
    const cd = $('#clearDemo');
    if (cd) cd.addEventListener('click', async () => {
      if (!(await confirmBox('Clear demo data?', 'Removes all sample orders and messages. Your products and settings stay.', 'Clear demo data'))) return;
      const n = await API.clearDemo();
      cache.orders = null; cache.inquiries = null;
      await Promise.all([load('orders'), load('inquiries')]);
      refreshBadges();
      toast(`Removed ${n} demo records`);
    });
    const rd = $('#resetDemo');
    if (rd) rd.addEventListener('click', async () => {
      if (!(await confirmBox('Reset everything?', 'Restores the original demo products, orders and settings in this browser.', 'Reset'))) return;
      API.resetDemo();
      Object.keys(cache).forEach((k) => { if (k !== 'session') cache[k] = null; });
      toast('Demo data reset');
      route();
    });
  }

  /* ============================================================ shell */
  $('#menuToggle').addEventListener('click', () => $('#app').classList.add('nav-open'));
  $('#sideScrim').addEventListener('click', () => $('#app').classList.remove('nav-open'));
  $('#signOut').addEventListener('click', async () => {
    await API.signOut();
    Object.keys(cache).forEach((k) => { cache[k] = null; });
    showLogin();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#app').classList.remove('nav-open'); });

  /* ============================================================ login */
  function showLogin() {
    $('#app').hidden = true;
    $('#login').hidden = false;
    $('#demoHint').hidden = API.mode !== 'demo';
    $('#lEmail').value = API.mode === 'demo' ? 'musaolaitan5@gmail.com' : '';
    $('#loginJogger').innerHTML = J.svg('#1b1a1c', 'cuffed', { label: '' });
    if (anim) {
      G.from('.login__form > *', { y: 20, opacity: 0, stagger: 0.05, duration: 0.7, ease: 'expo.out', clearProps: 'all' });
      G.fromTo('#loginJogger', { y: 30, opacity: 0, rotate: -4 }, { y: 0, opacity: 1, rotate: 0, duration: 1.4, ease: 'expo.out' });
      G.to('#loginJogger', { y: -16, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 });
      const colours = ['#1b1a1c', '#565a3c', '#1f2a44', '#6b4f3f', '#3d3e42'];
      let i = 0;
      clearInterval(showLogin.t);
      showLogin.t = setInterval(() => {
        if ($('#login').hidden) return clearInterval(showLogin.t);
        i = (i + 1) % colours.length;
        G.to('#loginJogger', { opacity: 0, duration: 0.4, onComplete: () => { $('#loginJogger').innerHTML = J.svg(colours[i], ['cuffed', 'cargo', 'slim', 'open', 'cuffed'][i], { label: '' }); G.to('#loginJogger', { opacity: 1, duration: 0.6 }); } });
      }, 3800);
    }
    setTimeout(() => ($('#lEmail').value ? $('#lPass') : $('#lEmail')).focus(), 100);
  }
  $('[data-toggle-pass]').addEventListener('click', (e) => {
    const inp = $('#lPass');
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    e.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#loginError');
    err.textContent = '';
    const btn = $('button[type="submit"]', e.target);
    btn.classList.add('is-busy');
    try {
      cache.session = await API.signIn($('#lEmail').value.trim(), $('#lPass').value);
      $('#lPass').value = '';
      if (anim) await new Promise((r) => G.to('#login', { opacity: 0, duration: 0.4, onComplete: r }));
      showApp();
    } catch (ex) {
      err.textContent = ex.message;
      if (anim) G.fromTo('.login__form', { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, .3)' });
    } finally { btn.classList.remove('is-busy'); }
  });

  async function showApp() {
    $('#login').hidden = true;
    $('#login').style.opacity = '';
    $('#app').hidden = false;
    const chip = $('#modeChip');
    chip.textContent = 'Demo mode';
    chip.className = 'mode-chip is-demo';
    chip.hidden = API.mode === 'live';
    $('#avatar').title = cache.session.email;
    if (anim) {
      G.from('.side', { x: -30, opacity: 0, duration: 0.7, ease: 'expo.out', clearProps: 'all' });
      G.from('.side__nav a', { x: -12, opacity: 0, stagger: 0.04, duration: 0.5, ease: 'expo.out', delay: 0.1, clearProps: 'all' });
      G.from('.top', { y: -20, opacity: 0, duration: 0.6, ease: 'expo.out', clearProps: 'all' });
    }
    try { await Promise.all([load('settings'), load('orders'), load('inquiries'), load('products')]); } catch (err) { toast(err.message, 'err'); }
    refreshBadges();
    route();
  }

  (async function boot() {
    try {
      cache.session = await API.session();
    } catch { cache.session = null; }
    if (cache.session && cache.session.isAdmin) showApp(); else showLogin();
  })();
})();
