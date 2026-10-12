/* Kitan Essentials — storefront behaviour + motion */
(function () {
  'use strict';

  const API = window.KitanAPI;
  const J = window.Jogger;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileMQ = window.matchMedia('(max-width: 900px)');
  const anim = Boolean(G) && !reduce;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const naira = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (src, cls = '', alt = '', eager) => `<img class="lz ${cls}" src="${esc(src)}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onload="this.classList.add('is-in')" onerror="this.classList.add('is-in')" />`;
  const local = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'];

  const state = { settings: { ...API.DEFAULT_SETTINGS }, products: [], reviews: [], filter: 'All', cart: local.get('kitan_bag', []) };

  if (G && ST) G.registerPlugin(ST);
  if (G && window.SplitText) G.registerPlugin(window.SplitText);
  $('#year').textContent = new Date().getFullYear();

  /* ============================================================ helpers */
  function art(p, color, cls) {
    return `<div class="${cls || ''}">${J.svg(color.hex, p.cut, { label: `${p.name} in ${color.name}` })}</div>`;
  }
  function waLink(text) {
    let d = String(state.settings.whatsapp || '').replace(/\D/g, '');
    if (!d) return null;
    if (d.startsWith('0')) d = '234' + d.slice(1);
    return `https://wa.me/${d}${text ? '?text=' + encodeURIComponent(text) : ''}`;
  }
  const deliveryFee = (method, subtotal) => API.feeFor(state.settings, method, subtotal);
  const feeLabel = (v) => (Number(v) > 0 ? naira(v) : 'Free');
  const isNew = (p) => p.createdAt && Date.now() - new Date(p.createdAt).getTime() < 21 * 864e5;

  /* ===================================================== smooth scroll */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    if (G && ST) { lenis.on('scroll', ST.update); G.ticker.add((t) => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  function scrollLock(on) {
    if (lenis) on ? lenis.stop() : lenis.start();
    document.documentElement.style.overflow = on ? 'hidden' : '';
    $('#dock').classList.toggle('is-hidden', on);
  }
  function scrollToEl(target) {
    if (lenis) lenis.scrollTo(target, { offset: target.id === 'top' ? -400 : -60, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  // "/", "/index.html" → "/" ; "/shop.html", "/shop" → "/shop"
  const pagePath = (u) => u.pathname.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (href === '#top') { e.preventDefault(); closeMenu(); if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
    let url;
    try { url = new URL(href, location.href); } catch { return; }
    if (url.origin !== location.origin) return;
    if (pagePath(url) === pagePath(location) && url.search === location.search) {
      e.preventDefault();
      const target = url.hash.length > 1 && document.querySelector(url.hash);
      if (!target) return;
      closeMenu();
      scrollToEl(target);
      return;
    }
    e.preventDefault();
    leavePage(url.href);
  });
  // cream curtain slides up, then the next page loads
  function leavePage(href) {
    if (!anim) { location.href = href; return; }
    const cover = document.createElement('div');
    cover.className = 'page-cover';
    cover.innerHTML = '<span class="page-cover__mark">Kitan</span>';
    document.body.appendChild(cover);
    G.timeline({ onComplete: () => { location.href = href; } })
      .fromTo(cover, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'expo.inOut' })
      .from('.page-cover__mark', { yPercent: 60, opacity: 0, duration: 0.5, ease: 'expo.out' }, '-=.25');
  }
  window.addEventListener('pageshow', (e) => { if (e.persisted) $$('.page-cover').forEach((c) => c.remove()); });

  /* ======================================================= nav + dock */
  const nav = $('#nav');
  let lastY = 0;
  function onScroll(y) {
    nav.classList.toggle('is-scrolled', y > 20);
    const hide = y > lastY && y > 400 && !document.body.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', hide);
    document.body.classList.toggle('nav-shown', !hide && y > 20);
    lastY = y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    $('#progressBar').style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    // light nav text whenever a dark section sits under it
    const probe = 34;
    nav.classList.toggle('on-dark', darkSections().some((sec) => { const r = sec.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; }));
  }
  const darkSections = () => $$('.ticker, .footer');
  requestAnimationFrame(() => onScroll(window.scrollY));
  if (lenis) lenis.on('scroll', (l) => onScroll(l.scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  const menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  function openMenu() {
    menu.hidden = false;
    document.body.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
    scrollLock(true);
    if (anim) {
      G.fromTo(menu, { clipPath: 'circle(0% at calc(100% - 40px) 40px)' }, { clipPath: 'circle(150% at calc(100% - 40px) 40px)', duration: 0.9, ease: 'expo.inOut' });
      G.from($$('nav a', menu), { y: 60, opacity: 0, rotate: 3, stagger: 0.05, duration: 0.9, ease: 'expo.out', delay: 0.3 });
      G.from('.mobile-menu__foot > *', { y: 20, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'expo.out', delay: 0.6 });
    }
  }
  function closeMenu() {
    if (menu.hidden) return;
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    scrollLock(false);
    if (anim) G.to(menu, { clipPath: 'circle(0% at calc(100% - 40px) 40px)', duration: 0.6, ease: 'expo.inOut', onComplete: () => { menu.hidden = true; } });
    else menu.hidden = true;
  }
  menuBtn.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));

  /* ============================================================ settings */
  function applySettings() {
    const s = state.settings;
    $$('[data-setting]').forEach((el) => { const v = s[el.dataset.setting]; if (v) el.textContent = v; });
    $('#announce').hidden = !s.announcement;
    const meta = $('#shopMeta');
    if (meta && state.products.length) meta.textContent = `${state.products.length} styles · Wholesale from ${Math.min(...state.products.map((p) => p.wholesaleMin))} pcs`;
    $$('[data-setting-href="email"]').forEach((a) => { a.href = 'mailto:' + s.email; a.textContent = s.email; });
    $$('[data-fee]').forEach((el) => { el.textContent = feeLabel({ ibadan: s.ibadanFee, lagos: s.lagosFee, nationwide: s.nationwideFee }[el.dataset.fee]); });
    const wa = waLink('Hello Kitan Essentials! I’d like to make an enquiry.');
    $$('[data-wa]').forEach((a) => { if (wa) a.href = wa; else a.hidden = true; });
    if (wa) document.body.classList.add('has-fab');
    const ig = s.instagram ? 'https://instagram.com/' + encodeURIComponent(s.instagram) : null;
    $$('[data-ig]').forEach((a) => { if (ig) a.href = ig; else a.hidden = true; });
    $$('[data-ig-handle]').forEach((el) => { el.textContent = '@' + s.instagram; });
    if (s.phone && $('#contactPhone')) { const li = $('#contactPhone'); li.hidden = false; const a = $('a', li); a.href = 'tel:' + s.phone.replace(/\s/g, ''); a.textContent = s.phone; }
    if (ig && $('#contactInstagram')) { const li = $('#contactInstagram'); li.hidden = false; const a = $('a', li); a.href = ig; a.textContent = '@' + s.instagram; }
    const minWs = Math.min(...state.products.map((p) => p.wholesaleMin).filter(Boolean));
    if (Number.isFinite(minWs) && $('#tierWholesaleQty')) $('#tierWholesaleQty').textContent = `${minWs}+ pcs per style`;
    $('#coState').innerHTML = '<option value="">Select state</option>' + STATES.map((x) => `<option${x === 'Lagos' ? ' selected' : ''}>${x}</option>`).join('');
    if (s.lookbookTitle && $('#lookTitle')) $('#lookTitle').textContent = s.lookbookTitle;
    if (API.mode === 'demo') {
      const f = document.createElement('div');
      f.className = 'demo-flag';
      f.textContent = 'Demo mode';
      document.body.appendChild(f);
    }
  }

  /* ========================================================= decoration */
  // Hand-drawn floral sprig (romantic line art) and twinkling sparkles.
  function sprigSVG() {
    const leaves = [[220, -1], [196, 1], [170, -1], [146, 1], [120, -1], [96, 1]].map(([y, side]) =>
      `<path d="M0,0 C10,-11 28,-11 38,0 C28,11 10,11 0,0Z" transform="translate(${100 + side * 2},${y}) rotate(${side > 0 ? -38 : 218})" class="leaf"/>`).join('');
    const flower = (x, y, r) => `<g transform="translate(${x},${y})">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${Math.cos(a * Math.PI / 180) * r}" cy="${Math.sin(a * Math.PI / 180) * r}" r="${r * 0.85}" class="petal"/>`).join('')}<circle r="${r * 0.55}" class="heart"/></g>`;
    return `<svg viewBox="0 0 200 270" aria-hidden="true">
      <path d="M100,262 C95,210 106,160 99,108 C95,76 104,46 100,16" class="stem"/>
      <path d="M99,150 C120,128 138,118 156,96" class="stem"/><path d="M101,190 C80,170 62,160 46,140" class="stem"/>
      ${leaves}${flower(100, 18, 10)}${flower(158, 92, 8)}${flower(44, 136, 7)}
    </svg>`;
  }
  const SPARKLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z"/></svg>';
  function decorate() {
    $$('[data-sprig]').forEach((el) => { el.innerHTML = sprigSVG(); });
    const spots = [['.hero, .page-hero', 7], ['.why', 5], ['.featured, .shop', 5], ['.lookbook', 7], ['.wholesale', 6], ['.colourways', 5], ['.reviews', 4], ['.footer', 6]];
    spots.forEach(([sel, n]) => $$(sel).forEach((sec) => {
      for (let i = 0; i < n; i++) {
        const sp = document.createElement('i');
        sp.className = 'sparkle sparkle--' + ['gold', 'rose', 'white'][i % 3];
        sp.innerHTML = SPARKLE;
        const size = 10 + Math.round(Math.random() * 16);
        sp.style.cssText = `left:${4 + Math.random() * 92}%;top:${4 + Math.random() * 88}%;width:${size}px;height:${size}px;animation-delay:${(Math.random() * 4).toFixed(2)}s`;
        sec.appendChild(sp);
      }
    }));
  }

  /* ================================================================ hero */
  const heroColors = [];
  let heroIndex = 0, heroTimer = null;
  const heroPhotos = () => (state.settings.heroImages || []).filter(Boolean);
  function renderHero() {
    const media = $('#heroMedia');
    if (!media) return;
    const photos = heroPhotos();
    if (photos.length) {
      $('.hero').classList.add('has-photos');
      media.innerHTML = photos.map((u, i) => `<div class="hero__slide${i === 0 ? ' is-on' : ''}">${img(u, '', 'Kitan Essentials lookbook photo', i === 0)}</div>`).join('')
        + (photos.length > 1 ? `<div class="hero__dots">${photos.map((_, i) => `<i class="${i === 0 ? 'is-on' : ''}"></i>`).join('')}</div>` : '');
      return;
    }
    const seen = new Set();
    const featured = state.products.filter((p) => p.featured);
    for (const p of (featured.length ? featured : state.products)) {
      for (const c of p.colors) {
        if (seen.has(c.hex) || heroColors.length >= 6) continue;
        seen.add(c.hex);
        heroColors.push({ ...c, cut: p.cut });
      }
    }
    if (!heroColors.length) heroColors.push({ name: 'Jet Black', hex: '#1b1a1c', cut: 'cuffed' });
    const sw = $('#heroSwatches');
    if (!sw) { media.innerHTML = J.svg(heroColors[0].hex, heroColors[0].cut, { label: `Kitan piece in ${heroColors[0].name}` }); return; }
    sw.innerHTML = heroColors.map((c, i) => `<button class="hero-swatch" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" aria-label="${esc(c.name)}" style="background:${c.hex}" data-i="${i}"></button>`).join('');
    media.innerHTML = J.svg(heroColors[0].hex, heroColors[0].cut, { label: `Kitan piece in ${heroColors[0].name}` });
    sw.addEventListener('click', (e) => { const b = e.target.closest('.hero-swatch'); if (b) setHero(+b.dataset.i, true); });
    sw.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      e.preventDefault();
      const n = (heroIndex + (e.key === 'ArrowRight' ? 1 : -1) + heroColors.length) % heroColors.length;
      setHero(n, true);
      sw.children[n].focus();
    });
  }
  function setHero(i, user) {
    if (i === heroIndex) return;
    heroIndex = i;
    const c = heroColors[i];
    $$('.hero-swatch').forEach((b, k) => { b.setAttribute('aria-checked', k === i); b.tabIndex = k === i ? 0 : -1; });
    const el = $('#heroMedia');
    const swap = () => { el.innerHTML = J.svg(c.hex, c.cut, { label: `Kitan piece in ${c.name}` }); };
    if (anim) {
      G.timeline()
        .to(el, { opacity: 0, scale: 0.9, rotate: -5, y: 24, duration: 0.35, ease: 'power2.in', onComplete: swap })
        .to(el, { opacity: 1, scale: 1, rotate: 0, y: 0, duration: 1, ease: 'expo.out' });
    } else swap();
    if (user) clearInterval(heroTimer);
  }
  function autoplayHero() {
    if (reduce || !$('#heroMedia')) return;
    const photos = heroPhotos();
    if (photos.length > 1) {
      let k = 0;
      heroTimer = setInterval(() => {
        if (document.hidden) return;
        const slides = $$('.hero__slide'), dots = $$('.hero__dots i');
        const prev = slides[k];
        k = (k + 1) % slides.length;
        const next = slides[k];
        dots.forEach((d, j) => d.classList.toggle('is-on', j === k));
        next.classList.add('is-on');
        if (anim) {
          G.fromTo(next, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.inOut', onComplete: () => prev.classList.remove('is-on') });
        } else prev.classList.remove('is-on');
      }, 5000);
      return;
    }
    if (heroColors.length > 1) heroTimer = setInterval(() => { if (!document.hidden) setHero((heroIndex + 1) % heroColors.length); }, 3600);
  }

  /* ========================================================== categories */
  function renderCategories() {
    const cats = [];
    for (const p of state.products) {
      let c = cats.find((x) => x.name === p.category);
      if (!c) { c = { name: p.category, items: [] }; cats.push(c); }
      c.items.push(p);
    }
    if (!$('#catsRail')) return;
    $('#categories').hidden = cats.length < 2;
    $('#catsRail').innerHTML = cats.map((c) => {
      const withPhoto = c.items.find((p) => p.images.length);
      const p = withPhoto || c.items[0];
      const col = p.colors[0];
      const media = withPhoto ? img(p.images[0], '', c.name) : J.svg(col.hex, p.cut, { label: '' });
      return `<a class="cat" href="shop.html?cat=${encodeURIComponent(c.name)}" data-cat="${esc(c.name)}" style="--tint:${withPhoto ? 'var(--ink-3)' : J.mix(J.tint(col.hex, 0.55), '#3a332d', 0.18)}">
        <div class="cat__media">${media}</div>
        <span class="cat__label"><span class="cat__name">${esc(c.name)}</span>
        <span class="cat__meta"><span>${c.items.length} style${c.items.length > 1 ? 's' : ''}</span><span class="cat__go">${ARROW}</span></span></span>
      </a>`;
    }).join('');
  }

  /* ============================================================ products */
  function renderFilters() {
    if (!$('#filters')) return;
    const wanted = new URLSearchParams(location.search).get('cat');
    if (wanted && state.products.some((p) => p.category === wanted)) state.filter = wanted;
    const cats = ['All', ...new Set(state.products.map((p) => p.category))];
    $('#filters').innerHTML = cats.map((c) => `<button class="chip" role="tab" data-cat="${esc(c)}" aria-selected="${c === state.filter}">${esc(c)}<b>${c === 'All' ? state.products.length : state.products.filter((p) => p.category === c).length}</b></button>`).join('');
  }
  function setFilter(cat) {
    if (cat === state.filter) return;
    state.filter = cat;
    $$('#filters .chip').forEach((x) => x.setAttribute('aria-selected', x.dataset.cat === cat));
    const chip = $(`#filters .chip[data-cat="${CSS.escape(cat)}"]`);
    if (chip) chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    renderProducts(true);
  }
  if ($('#filters')) $('#filters').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) setFilter(b.dataset.cat); });

  function cardHTML(p, ci = 0) {
    const c = p.colors[ci] || p.colors[0];
    const low = p.stock > 0 && p.stock <= 10;
    const media = p.images.length
      ? img(p.images[0], 'img-1', `${p.name}`) + (p.images[1] ? img(p.images[1], 'img-2', '') : '')
      : art(p, c, 'product-card__art');
    return `<article class="product-card" data-id="${p.id}" data-ci="${ci}">
      <div class="product-card__media" style="--tint:${J.tint(c.hex)}" data-open>
        <div class="product-card__badges">
          ${isNew(p) ? '<span class="badge badge--new">New</span>' : ''}
          ${p.featured ? '<span class="badge badge--dark">Bestseller</span>' : ''}
          ${p.stock === 0 ? '<span class="badge badge--warn">Sold out</span>' : low ? `<span class="badge badge--warn">Only ${p.stock} left</span>` : ''}
        </div>
        ${media}
        <button class="product-card__quick" data-open aria-label="Quick add ${esc(p.name)}" ${p.stock === 0 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>${p.stock === 0 ? 'Sold out' : 'Quick add'}
        </button>
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name"><button data-open>${esc(p.name)}</button></h3>
        <div class="product-card__price">${naira(p.price)}</div>
        <div class="product-card__meta">
          <span>Wholesale <strong>${naira(p.wholesalePrice)}</strong> · ${p.wholesaleMin}+</span>
          <div class="mini-swatches">${p.colors.slice(0, 5).map((x, i) => `<button class="mini-swatch" style="background:${x.hex}" aria-label="${esc(x.name)}" aria-pressed="${i === ci}" data-ci="${i}"></button>`).join('')}</div>
        </div>
      </div>
    </article>`;
  }

  function renderFeatured() {
    const grid = $('#featuredGrid');
    if (!grid) return;
    const picks = state.products.filter((p) => p.featured);
    const list = (picks.length >= 2 ? picks : state.products).slice(0, 4);
    grid.innerHTML = list.map((p) => cardHTML(p)).join('');
    revealCards(grid);
  }
  function revealCards(grid) {
    if (!anim) return;
    const cards = $$('.product-card', grid);
    G.set(cards, { opacity: 0, y: 60 });
    ST.batch(cards, { start: 'top 92%', once: true, onEnter: (els) => G.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out', clearProps: 'transform,opacity' }) });
    cards.forEach((card) => {
      const m = $('.product-card__media', card);
      G.fromTo(m, { clipPath: 'inset(12% 8% 0% 8% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 60%', scrub: true } });
    });
  }
  function renderProducts(animate) {
    const grid = $('#products');
    if (!grid) return;
    const list = state.products.filter((p) => state.filter === 'All' || p.category === state.filter);
    const draw = () => {
      grid.innerHTML = list.length ? list.map((p) => cardHTML(p)).join('') : '<p class="empty">New styles are on the way — check back soon.</p>';
      if (!anim) return;
      const cards = $$('.product-card', grid);
      if (animate) G.from(cards, { opacity: 0, y: 40, scale: 0.96, duration: 0.8, stagger: 0.06, ease: 'expo.out', clearProps: 'transform,opacity' });
      else revealCards(grid);
    };
    if (animate && anim && grid.children.length) {
      G.to($$('.product-card', grid), { opacity: 0, y: 16, duration: 0.22, stagger: 0.02, ease: 'power2.in', onComplete: () => { draw(); ST.refresh(); } });
    } else draw();
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (!card || !card.dataset.id) return;
    const p = state.products.find((x) => x.id === card.dataset.id);
    const sw = e.target.closest('.mini-swatch');
    if (sw) {
      const ci = +sw.dataset.ci;
      card.dataset.ci = ci;
      $$('.mini-swatch', card).forEach((b) => b.setAttribute('aria-pressed', b === sw));
      $('.product-card__media', card).style.setProperty('--tint', J.tint(p.colors[ci].hex));
      const a = $('.product-card__art', card);
      if (a) {
        const swap = () => { a.innerHTML = J.svg(p.colors[ci].hex, p.cut, { label: `${p.name} in ${p.colors[ci].name}` }); };
        if (anim) G.to(a, { opacity: 0, y: 10, duration: 0.2, onComplete: () => { swap(); G.to(a, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }); } });
        else swap();
      }
      return;
    }
    if (e.target.closest('[data-open]')) openProduct(p, +card.dataset.ci || 0);
  });

  /* ========================================================= stack art */
  function renderStackArt() {
    const withPhotos = state.products.filter((p) => p.images.length);
    const first = state.products.find((p) => p.cut === 'cuffed') || state.products[0];
    const cotton = $('[data-art="cotton"]');
    if (!cotton) return;
    if (first) cotton.innerHTML = first.images[0] ? img(first.images[0], '', first.name) : J.svg(first.colors[0].hex, first.cut, { label: '' });
    const range = $('[data-art="range"]');
    if (withPhotos.length >= 3) {
      range.innerHTML = `<div class="art-trio">${withPhotos.slice(0, 3).map((p) => `<div style="aspect-ratio:3/4;border-radius:18px;overflow:hidden">${img(p.images[0], '', p.name)}</div>`).join('')}</div>`;
    } else {
      const picks = ['wide', 'tee', 'shades'].map((cut) => state.products.find((p) => p.cut === cut)).filter(Boolean);
      const trio = (picks.length === 3 ? picks : state.products.slice(0, 3));
      range.innerHTML = `<div class="art-trio">${trio.map((p) => `<div>${J.svg(p.colors[0].hex === '#1b1a1c' ? '#efece6' : p.colors[0].hex, p.cut, { label: '' })}</div>`).join('')}</div>`;
    }
    buildMap($('[data-art="map"]'), true);
  }

  /* =========================================================== lookbook */
  let lookUrls = [];
  function renderLookbook() {
    lookUrls = (state.settings.lookbook || []).filter(Boolean);
    const grid = $('#lookGrid');
    if (!grid) return;
    if (!lookUrls.length) { grid.hidden = true; $('#lookEmpty').hidden = false; return; }
    const cols = [[], [], []];
    lookUrls.forEach((u, i) => cols[i % 3].push(`<button class="look" data-i="${i}" aria-label="Open photo ${i + 1}">${img(u, '', 'Kitan Essentials lookbook')}</button>`));
    grid.innerHTML = cols.map((c) => `<div class="look-col">${c.join('')}</div>`).join('');
    // keep swipe order natural on mobile (columns use display: contents)
    if (mobileMQ.matches) grid.innerHTML = lookUrls.map((u, i) => `<button class="look" data-i="${i}" aria-label="Open photo ${i + 1}">${img(u, '', 'Kitan Essentials lookbook')}</button>`).join('');
    grid.addEventListener('click', (e) => { const b = e.target.closest('.look'); if (b) openLightbox(+b.dataset.i); });
  }
  let lbIndex = 0;
  function showLb(i) {
    lbIndex = (i + lookUrls.length) % lookUrls.length;
    const im = $('#lbImg');
    const set = () => { im.src = lookUrls[lbIndex]; $('#lbCount').textContent = `${lbIndex + 1} / ${lookUrls.length}`; };
    if (anim) G.to(im, { opacity: 0, scale: 0.97, duration: 0.18, onComplete: () => { set(); G.to(im, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' }); } });
    else set();
  }
  function openLightbox(i) {
    const lb = $('#lightbox');
    lastFocus = document.activeElement;
    lb.hidden = false;
    scrollLock(true);
    $('#lbImg').src = lookUrls[i];
    lbIndex = i;
    $('#lbCount').textContent = `${i + 1} / ${lookUrls.length}`;
    if (anim) G.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    $('.lightbox__close').focus();
  }
  function closeLightbox() {
    const lb = $('#lightbox');
    const done = () => { lb.hidden = true; scrollLock(false); lastFocus && lastFocus.focus(); };
    if (anim) G.to(lb, { opacity: 0, duration: 0.3, onComplete: done }); else done();
  }
  $('#lightbox').addEventListener('click', (e) => {
    if (e.target.closest('[data-close]') || e.target === e.currentTarget) closeLightbox();
    const n = e.target.closest('[data-lb]');
    if (n) showLb(lbIndex + +n.dataset.lb);
  });
  let lbX = null;
  $('#lightbox').addEventListener('touchstart', (e) => { lbX = e.touches[0].clientX; }, { passive: true });
  $('#lightbox').addEventListener('touchend', (e) => { if (lbX == null) return; const dx = e.changedTouches[0].clientX - lbX; if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1)); lbX = null; });

  /* ========================================================= colourways */
  function renderColourways() {
    const seen = new Map();
    for (const p of state.products) for (const c of p.colors) if (!seen.has(c.name) && p.cut !== 'shades') seen.set(c.name, { ...c, product: p });
    const track = $('#colourTrack');
    if (!track) return;
    track.innerHTML = [...seen.values()].map((c) => {
      const light = J.luminance(c.hex) > 0.35;
      const bg = light ? J.mix(c.hex, '#ffffff', 0.25) : J.mix(c.hex, '#000000', 0.25);
      const glow = light ? J.mix(c.hex, '#ffffff', 0.75) : J.mix(c.hex, '#ffffff', 0.38);
      return `<a class="cw${light ? ' cw--light' : ''}" style="--cw:${bg};--cw-glow:${glow}" href="#shop" data-pid="${c.product.id}" data-color="${esc(c.name)}" aria-label="${esc(c.name)} — ${esc(c.product.name)}">
        <span class="cw__shop"><span class="badge">${esc(c.product.category)}</span></span>
        <div class="cw__art">${J.svg(c.hex, c.product.cut, { label: '' })}</div>
        <span class="cw__name">${esc(c.name)}</span>
        <span class="cw__hex">${esc(c.product.name)}</span>
      </a>`;
    }).join('');
    track.addEventListener('click', (e) => {
      const a = e.target.closest('.cw');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      const p = state.products.find((x) => x.id === a.dataset.pid);
      openProduct(p, Math.max(0, p.colors.findIndex((c) => c.name === a.dataset.color)));
    });
  }

  // Scroll-linked coverflow for horizontal rails on touch screens
  function coverflow(track, items, rotate) {
    if (!anim || !track) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
      items().forEach((el) => {
        const r = el.getBoundingClientRect();
        const d = Math.max(-1, Math.min(1, (r.left + r.width / 2 - mid) / (track.clientWidth * 0.75)));
        el.style.transform = `perspective(900px) rotateY(${rotate ? -d * 28 : 0}deg) scale(${1 - Math.abs(d) * 0.14})`;
        el.style.opacity = String(1 - Math.abs(d) * 0.35);
      });
    };
    track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function renderReviews() {
    if (!state.reviews.length || !$('#reviews')) return;
    $('#reviews').hidden = false;
    const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 7 7 .6-5.3 4.6 1.6 7.3L12 17.8 5.7 21.5l1.6-7.3L2 9.6 9 9z"/></svg>';
    const html = state.reviews.map((r) => `<figure class="review"><div class="review__stars" aria-label="${r.rating} out of 5 stars">${star.repeat(r.rating)}</div><p>“${esc(r.text)}”</p><cite>${esc(r.name)}${r.location ? ` <span>· ${esc(r.location)}</span>` : ''}</cite></figure>`).join('');
    const rail = $('#reviewsRail');
    rail.innerHTML = html + (state.reviews.length > 2 ? html.replace(/<figure class="review"/g, '<figure aria-hidden="true" class="review"') : '');
    if (state.reviews.length <= 2) rail.style.animation = 'none';
  }

  /* ======================================================= delivery map */
  const CITIES = [
    { n: 'Kano', x: 268, y: 58 }, { n: 'Kaduna', x: 238, y: 112 }, { n: 'Jos', x: 300, y: 150 }, { n: 'Abuja', x: 232, y: 178 },
    { n: 'Ilorin', x: 128, y: 196 }, { n: 'Benin', x: 168, y: 292 }, { n: 'Enugu', x: 270, y: 280 }, { n: 'Port Harcourt', x: 232, y: 340 },
  ];
  const HUBS = { Lagos: { x: 62, y: 312 }, Ibadan: { x: 100, y: 262 } };
  const ROUTES = [['Lagos', 'Benin'], ['Lagos', 'Port Harcourt'], ['Lagos', 'Enugu'], ['Lagos', 'Abuja'], ['Ibadan', 'Ilorin'], ['Ibadan', 'Kaduna'], ['Ibadan', 'Kano'], ['Ibadan', 'Jos']];
  function buildMap(svg, mini) {
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); (parent || svg).appendChild(n); return n; };
    if (svg.tagName.toLowerCase() !== 'svg') { svg.innerHTML = ''; svg = el('svg', { viewBox: '0 0 400 380', class: 'map mini-map', 'aria-hidden': 'true' }, svg); }
    svg.innerHTML = '';
    const arcs = [];
    ROUTES.forEach(([h, c]) => {
      const a = HUBS[h], b = CITIES.find((x) => x.n === c);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
      const cx = mx + (-dy / len) * len * 0.22, cy = my + (dx / len) * len * 0.22 - 10;
      arcs.push(el('path', { d: `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`, class: 'arc' }));
    });
    el('path', { d: `M${HUBS.Lagos.x},${HUBS.Lagos.y} Q${HUBS.Lagos.x + 4},${HUBS.Ibadan.y + 10} ${HUBS.Ibadan.x},${HUBS.Ibadan.y}`, fill: 'none', stroke: 'var(--gold-light)', 'stroke-width': 2.4 });
    CITIES.forEach((c) => {
      el('circle', { cx: c.x, cy: c.y, r: 3.4, class: 'city' });
      if (!mini) { const t = el('text', { x: c.x + 8, y: c.y + 4 }); t.textContent = c.n; }
    });
    Object.entries(HUBS).forEach(([n, h]) => {
      el('circle', { cx: h.x, cy: h.y, r: 6, class: 'hub-ring' });
      el('circle', { cx: h.x, cy: h.y, r: 6, class: 'hub' });
      const t = el('text', { x: n === 'Lagos' ? h.x - 4 : h.x + 12, y: n === 'Lagos' ? h.y + 28 : h.y - 8, class: 'hub-label', 'text-anchor': n === 'Lagos' ? 'middle' : 'start' });
      t.textContent = n;
    });
    if (mini) { svg.querySelectorAll('.arc').forEach((p) => p.setAttribute('stroke', 'var(--gold)')); return; }
    if (!anim) return;
    const lengths = arcs.map((p) => p.getTotalLength());
    arcs.forEach((p, i) => G.set(p, { strokeDasharray: lengths[i], strokeDashoffset: lengths[i] }));
    const runners = arcs.map(() => el('circle', { r: 3, class: 'runner', opacity: 0 }));
    const tl = G.timeline({ scrollTrigger: { trigger: svg, start: 'top 80%', once: true } });
    tl.from(svg.querySelectorAll('.city, .hub'), { scale: 0, transformOrigin: 'center', transformBox: 'fill-box', stagger: 0.04, duration: 0.6, ease: 'back.out(3)' })
      .to(arcs, { strokeDashoffset: 0, duration: 1.4, stagger: 0.08, ease: 'power2.inOut' }, 0.2)
      .add(() => {
        arcs.forEach((p) => { p.style.strokeDasharray = '3 5'; p.style.strokeDashoffset = '0'; });
        runners.forEach((r, i) => {
          const L = lengths[i], o = { t: 0 };
          G.to(o, {
            t: 1, duration: 2.4 + (i % 3) * 0.5, repeat: -1, delay: i * 0.35, ease: 'power1.inOut',
            onUpdate: () => { const pt = arcs[i].getPointAtLength(o.t * L); r.setAttribute('cx', pt.x); r.setAttribute('cy', pt.y); r.setAttribute('opacity', Math.sin(o.t * Math.PI)); },
          });
        });
      });
  }

  /* ============================================================== modal */
  let lastFocus = null;
  const isSheet = () => mobileMQ.matches;
  function trapFocus(container, e) {
    if (e.key !== 'Tab') return;
    const f = $$('button:not([disabled]), [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', container).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openLayer(el, panel, from) {
    lastFocus = document.activeElement;
    el.hidden = false;
    scrollLock(true);
    panel.style.transform = '';
    if (anim) {
      G.fromTo($('.modal__scrim, .drawer__scrim', el), { opacity: 0 }, { opacity: 1, duration: 0.4 });
      if (from === 'right') G.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.7, ease: 'expo.out' });
      else if (isSheet()) G.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' });
      else G.fromTo(panel, { y: 60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out' });
    }
    setTimeout(() => { const f = $('.modal__close, [data-close].icon-btn', el); f && f.focus({ preventScroll: true }); }, 60);
  }
  function closeLayer(el, panel, to) {
    if (el.hidden) return;
    const done = () => { el.hidden = true; G && G.set(panel, { clearProps: 'all' }); scrollLock(false); lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true }); };
    if (anim) {
      G.to($('.modal__scrim, .drawer__scrim', el), { opacity: 0, duration: 0.3 });
      if (to === 'right') G.to(panel, { xPercent: 100, duration: 0.45, ease: 'expo.in', onComplete: done });
      else if (isSheet()) G.to(panel, { yPercent: 100, y: 0, duration: 0.45, ease: 'expo.in', onComplete: done });
      else G.to(panel, { y: 40, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: done });
    } else done();
  }
  const LAYERS = [['#productModal', '.modal__panel'], ['#trackModal', '.modal__panel'], ['#bag', '.drawer__panel']];
  LAYERS.forEach(([id, p]) => {
    const el = $(id), panel = $(p, el), side = id === '#bag' ? 'right' : null;
    el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeLayer(el, panel, side); });
    el.addEventListener('keydown', (e) => trapFocus(el, e));
    // drag the handle down to dismiss the bottom sheet
    const grab = $('.pm__grab', el);
    if (grab) {
      let y0 = null, dy = 0;
      grab.addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; grab.setPointerCapture(e.pointerId); });
      grab.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); panel.style.transform = `translateY(${dy}px)`; });
      grab.addEventListener('pointerup', () => {
        if (y0 == null) return;
        y0 = null;
        if (dy > 110) closeLayer(el, panel);
        else if (anim) G.to(panel, { y: 0, duration: 0.5, ease: 'expo.out', onComplete: () => { panel.style.transform = ''; } });
        else panel.style.transform = '';
      });
    }
  });
  document.addEventListener('keydown', (e) => {
    if (!$('#lightbox').hidden) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showLb(lbIndex + 1);
      if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
      return;
    }
    if (e.key !== 'Escape') return;
    const open = LAYERS.find(([id]) => !$(id).hidden);
    if (open) closeLayer($(open[0]), $(open[1], $(open[0])), open[0] === '#bag' ? 'right' : null);
    else closeMenu();
  });

  /* --------------------------------------------------- product modal */
  const pm = { p: null, ci: 0, size: null };
  function openProduct(p, ci) {
    if (!p) return;
    pm.p = p; pm.ci = ci || 0; pm.size = p.sizes.length === 1 ? p.sizes[0] : null;
    $('#pmCat').textContent = p.category;
    $('#pmTitle').textContent = p.name;
    $('#pmPrice').textContent = naira(p.price);
    $('#pmWholesale').textContent = `Wholesale ${naira(p.wholesalePrice)} each for ${p.wholesaleMin}+ pcs`;
    $('#pmDesc').textContent = p.description;
    $('#pmColors').innerHTML = p.colors.map((c, i) => `<button class="swatch" role="radio" aria-checked="${i === pm.ci}" aria-label="${esc(c.name)}" style="background:${c.hex}" data-ci="${i}"></button>`).join('');
    $('#pmSizes').innerHTML = p.sizes.map((s) => `<button class="size" role="radio" aria-checked="${s === pm.size}">${esc(s)}</button>`).join('');
    $('#pmQty').value = 1;
    $('#pmAdd').disabled = p.stock === 0;
    $('#pmAdd span').textContent = p.stock === 0 ? 'Sold out' : 'Add to bag';
    drawGallery();
    updatePmNote();
    openLayer($('#productModal'), $('#productModal .modal__panel'));
    $('#productModal .modal__panel').scrollTop = 0;
    if (anim) G.from('.pm__info > *', { y: 24, opacity: 0, stagger: 0.04, duration: 0.7, ease: 'expo.out', delay: 0.15, clearProps: 'all' });
  }
  function drawGallery() {
    const p = pm.p, c = p.colors[pm.ci];
    $('#pmColorName').textContent = c.name;
    $$('#pmColors .swatch').forEach((b, i) => b.setAttribute('aria-checked', i === pm.ci));
    $('.pm__media').style.setProperty('--tint', J.tint(c.hex));
    const slides = p.images.length ? p.images.map((u, i) => `<div class="pm__slide">${img(u, '', `${p.name} photo ${i + 1}`, i === 0)}</div>`)
      : [`<div class="pm__slide"><div class="pm__art">${J.svg(c.hex, p.cut, { label: `${p.name} in ${c.name}` })}</div></div>`];
    $('#pmGallery').innerHTML = slides.join('');
    $('#pmGallery').scrollLeft = 0;
    $('#pmDots').innerHTML = slides.length > 1 ? slides.map((_, i) => `<i class="${i ? '' : 'is-on'}"></i>`).join('') : '';
    $$('.pm__arrow').forEach((b) => { b.hidden = slides.length < 2; });
    if (anim && !p.images.length) G.from('.pm__art', { opacity: 0, y: 20, scale: 0.94, duration: 0.7, ease: 'expo.out' });
  }
  $('#pmGallery').addEventListener('scroll', () => {
    const g = $('#pmGallery');
    const i = Math.round(g.scrollLeft / g.clientWidth);
    $$('#pmDots i').forEach((d, k) => d.classList.toggle('is-on', k === i));
  }, { passive: true });
  $$('.pm__arrow').forEach((b) => b.addEventListener('click', () => { const g = $('#pmGallery'); g.scrollBy({ left: +b.dataset.slide * g.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); }));
  function updatePmNote() {
    const p = pm.p;
    const qty = Math.max(1, +$('#pmQty').value || 1);
    const inBag = state.cart.filter((i) => i.productId === p.id).reduce((s, i) => s + i.qty, 0);
    const total = qty + inBag;
    $('#pmNote').textContent = total >= p.wholesaleMin ? `✓ Wholesale price unlocked — ${naira(p.wholesalePrice)} each` : `Add ${p.wholesaleMin - total} more of this style (any colour/size) for wholesale pricing.`;
  }
  $('#pmColors').addEventListener('click', (e) => { const b = e.target.closest('.swatch'); if (b) { pm.ci = +b.dataset.ci; if (pm.p.images.length) { $('.pm__media').style.setProperty('--tint', J.tint(pm.p.colors[pm.ci].hex)); $('#pmColorName').textContent = pm.p.colors[pm.ci].name; $$('#pmColors .swatch').forEach((x, i) => x.setAttribute('aria-checked', i === pm.ci)); } else drawGallery(); } });
  $('#pmSizes').addEventListener('click', (e) => {
    const b = e.target.closest('.size');
    if (!b) return;
    pm.size = b.textContent;
    $$('#pmSizes .size').forEach((x) => x.setAttribute('aria-checked', x === b));
    updatePmNote();
  });
  $('.pm__buy .qty').addEventListener('click', (e) => {
    const b = e.target.closest('[data-qty]');
    if (!b) return;
    const inp = $('#pmQty');
    inp.value = Math.max(1, Math.min(500, (+inp.value || 1) + +b.dataset.qty));
    updatePmNote();
  });
  $('#pmQty').addEventListener('input', updatePmNote);
  $('#pmAdd').addEventListener('click', () => {
    if (!pm.size) {
      $('#pmNote').textContent = 'Please choose a size.';
      if (anim) G.fromTo('#pmSizes', { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, .3)' });
      $('#pmSizes').scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    const p = pm.p;
    const from = $('.pm__media');
    const qty = Math.max(1, +$('#pmQty').value || 1);
    flyToBag(from, p, p.colors[pm.ci]);
    addToBag(p, p.colors[pm.ci].name, pm.size, qty);
    closeLayer($('#productModal'), $('#productModal .modal__panel'));
  });

  /* ======================================================= fly to bag */
  function flyToBag(source, p, color) {
    const target = mobileMQ.matches ? $('#dockBag') : $('#bagBtn');
    if (!anim || !source || !target) return;
    const s = source.getBoundingClientRect(), t = target.getBoundingClientRect();
    const size = Math.min(s.width, s.height, 220);
    const fly = document.createElement('div');
    fly.className = 'fly';
    fly.style.cssText = `left:${s.left + s.width / 2 - size / 2}px;top:${s.top + s.height / 2 - size * 0.6}px;width:${size}px;height:${size * 1.2}px;--tint:${J.tint(color.hex)}`;
    fly.innerHTML = p.images.length ? `<img src="${esc(p.images[0])}" alt="" />` : J.svg(color.hex, p.cut, { label: '' });
    document.body.appendChild(fly);
    const dx = t.left + t.width / 2 - (s.left + s.width / 2), dy = t.top + t.height / 2 - (s.top + s.height / 2) + size * 0.1;
    G.timeline({ onComplete: () => { fly.remove(); bump(); } })
      .to(fly, { scale: 1.06, duration: 0.18, ease: 'power2.out' })
      .to(fly, { x: dx, duration: 0.85, ease: 'power1.inOut' }, '>')
      .to(fly, { y: dy, duration: 0.85, ease: 'back.in(1.6)' }, '<')
      .to(fly, { scale: 0.08, rotate: 25, borderRadius: '50%', opacity: 0.6, duration: 0.85, ease: 'power2.in' }, '<');
  }
  function bump() {
    $$('#bagBtn, #dockBag').forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  }

  /* ================================================================ bag */
  const saveCart = () => local.set('kitan_bag', state.cart);
  function cartLines() {
    const totals = {};
    state.cart.forEach((i) => { totals[i.productId] = (totals[i.productId] || 0) + i.qty; });
    return state.cart.map((i) => {
      const p = state.products.find((x) => x.id === i.productId);
      if (!p) return null;
      const wholesale = totals[p.id] >= p.wholesaleMin;
      const unit = wholesale ? p.wholesalePrice : p.price;
      return { ...i, p, color: p.colors.find((c) => c.name === i.color) || p.colors[0], unit, wholesale, line: unit * i.qty, styleQty: totals[p.id] };
    }).filter(Boolean);
  }
  const subtotal = () => cartLines().reduce((s, l) => s + l.line, 0);
  function addToBag(p, color, size, qty) {
    const key = `${p.id}|${color}|${size}`;
    const ex = state.cart.find((i) => i.key === key);
    if (ex) ex.qty += qty; else state.cart.push({ key, productId: p.id, color, size, qty });
    saveCart();
    renderBag();
    if (!anim) bump();
    const c = p.colors.find((x) => x.name === color) || p.colors[0];
    setTimeout(() => toast(`<div class="toast__img" style="--tint:${J.tint(c.hex)}">${p.images.length ? `<img src="${esc(p.images[0])}" alt="" />` : J.svg(c.hex, p.cut, { label: '' })}</div>
      <div><strong>Added to bag</strong><span style="opacity:.7">${esc(p.name)} · ${esc(color)} · ${esc(size)}</span></div>
      <button type="button" data-open-bag>View bag</button>`), anim ? 700 : 0);
  }
  function renderBag() {
    const lines = cartLines();
    $$('[data-bag-count]').forEach((el) => { el.textContent = lines.reduce((s, l) => s + l.qty, 0); });
    const box = $('#bagItems');
    if (!lines.length) {
      box.innerHTML = `<div class="bag-empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><strong>Your bag is empty</strong><p>Find your next favourite piece.</p><a href="shop.html" class="btn btn--dark" data-close><span>Shop now</span></a></div>`;
      $('#toCheckout').disabled = true;
    } else {
      box.innerHTML = lines.map((l) => {
        const need = l.p.wholesaleMin - l.styleQty;
        return `<div class="bag-item" data-key="${esc(l.key)}">
          <div class="bag-item__img" style="--tint:${J.tint(l.color.hex)}">${l.p.images.length ? `<img src="${esc(l.p.images[0])}" alt="" />` : J.svg(l.color.hex, l.p.cut, { label: '' })}</div>
          <div>
            <h3>${esc(l.p.name)}</h3>
            <p class="bag-item__var"><i style="background:${l.color.hex}"></i>${esc(l.color.name)} · ${esc(l.size)}</p>
            <div class="qty qty--sm"><button type="button" data-d="-1" aria-label="Decrease">−</button><input type="number" min="1" value="${l.qty}" aria-label="Quantity" /><button type="button" data-d="1" aria-label="Increase">+</button></div>
          </div>
          <div class="bag-item__right">
            <span class="bag-item__price">${naira(l.line)}</span>
            <span class="bag-item__ws">${l.wholesale ? `Wholesale · ${naira(l.unit)} each` : need > 0 && need < l.p.wholesaleMin ? `${need} more for wholesale` : ''}</span>
            <button class="bag-item__remove" type="button" data-remove>Remove</button>
          </div>
        </div>`;
      }).join('');
      $('#toCheckout').disabled = false;
    }
    // wholesale progress meter for the style closest to unlocking
    const styles = {};
    lines.forEach((l) => { styles[l.p.id] = { p: l.p, qty: l.styleQty }; });
    const close = Object.values(styles).filter((s) => s.qty < s.p.wholesaleMin).sort((a, b) => (b.qty / b.p.wholesaleMin) - (a.qty / a.p.wholesaleMin))[0];
    const unlocked = Object.values(styles).filter((s) => s.qty >= s.p.wholesaleMin);
    const meter = $('#wsMeter');
    if (close) {
      meter.hidden = false;
      meter.innerHTML = `Add <strong>${close.p.wholesaleMin - close.qty}</strong> more ${esc(close.p.name)} to unlock wholesale (${naira(close.p.wholesalePrice)} each)<div class="ws-meter__bar"><i style="width:${(close.qty / close.p.wholesaleMin) * 100}%"></i></div>`;
    } else if (unlocked.length) {
      meter.hidden = false;
      meter.innerHTML = `✓ Wholesale price unlocked on ${unlocked.length} style${unlocked.length > 1 ? 's' : ''}<div class="ws-meter__bar"><i style="width:100%"></i></div>`;
    } else meter.hidden = true;
    $('#bagSubtotal').textContent = naira(subtotal());
    updateSummary();
  }
  $('#bagItems').addEventListener('click', (e) => {
    const row = e.target.closest('.bag-item');
    if (!row) return;
    const item = state.cart.find((i) => i.key === row.dataset.key);
    if (e.target.closest('[data-remove]')) {
      const done = () => { state.cart = state.cart.filter((i) => i !== item); saveCart(); renderBag(); };
      if (anim) G.to(row, { opacity: 0, x: 60, height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.45, ease: 'power3.in', onComplete: done });
      else done();
      return;
    }
    const d = e.target.closest('[data-d]');
    if (d) { item.qty = Math.max(1, Math.min(500, item.qty + +d.dataset.d)); saveCart(); renderBag(); }
  });
  $('#bagItems').addEventListener('change', (e) => {
    const row = e.target.closest('.bag-item');
    if (!row || e.target.tagName !== 'INPUT') return;
    const item = state.cart.find((i) => i.key === row.dataset.key);
    item.qty = Math.max(1, Math.min(500, Math.round(+e.target.value) || 1));
    saveCart(); renderBag();
  });
  function goStep(name) {
    const order = ['items', 'checkout', 'done'];
    $$('.bag-step').forEach((s) => {
      const i = order.indexOf(s.dataset.step), t = order.indexOf(name);
      s.classList.toggle('is-active', i === t);
      s.classList.toggle('is-left', i < t);
    });
    $('#bagTitle').textContent = name === 'items' ? 'Your bag' : name === 'checkout' ? 'Checkout' : 'Thank you';
    if (document.activeElement && document.activeElement.closest('.bag-step:not(.is-active)')) $('#bag .drawer__head [data-close]').focus();
  }
  function openBag() { goStep('items'); renderBag(); openLayer($('#bag'), $('#bag .drawer__panel'), 'right'); }
  $('#bagBtn').addEventListener('click', openBag);
  $('#dockBag').addEventListener('click', openBag);
  document.addEventListener('click', (e) => { if (e.target.closest('[data-open-bag]')) { hideToast(); openBag(); } });
  $('#toCheckout').addEventListener('click', () => { goStep('checkout'); setTimeout(() => $('#coName').focus({ preventScroll: true }), 300); });
  $('#bag').addEventListener('click', (e) => { const b = e.target.closest('[data-goto]'); if (b) goStep(b.dataset.goto); });
  function updateSummary() {
    const sub = subtotal();
    const method = ($('input[name="delivery"]:checked') || {}).value || 'lagos';
    const fee = deliveryFee(method, sub);
    $('#coSubtotal').textContent = naira(sub);
    $('#coDelivery').textContent = feeLabel(fee);
    $('#coTotal').textContent = naira(sub + fee);
  }
  $$('input[name="delivery"]').forEach((r) => r.addEventListener('change', () => {
    updateSummary();
    if (r.checked && r.value === 'ibadan') $('#coState').value = 'Oyo';
    if (r.checked && r.value === 'lagos') $('#coState').value = 'Lagos';
    if (r.checked && r.value === 'nationwide' && ['Lagos', 'Oyo'].includes($('#coState').value)) $('#coState').value = '';
  }));

  function setErrors(form, fields) {
    $$('.field', form).forEach((f) => { f.classList.remove('has-error'); const s = $('.field__err', f); if (s) s.textContent = ''; });
    $$('[aria-invalid]', form).forEach((x) => x.removeAttribute('aria-invalid'));
    let first = null;
    for (const [name, msg] of Object.entries(fields || {})) {
      const input = form.elements[name];
      if (!input) continue;
      const f = input.closest('.field');
      f.classList.add('has-error');
      const s = $('.field__err', f);
      if (s) s.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      first = first || input;
    }
    if (first) { first.focus(); if (anim) G.fromTo(first.closest('.field'), { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, .3)' }); }
    return !first;
  }
  const phoneOk = (v) => /^\+?[0-9\s-]{10,16}$/.test(v.trim());

  $('#checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const v = (n) => (f.elements[n].value || '').trim();
    const errs = {};
    if (v('name').length < 2) errs.name = 'Please enter your full name.';
    if (!phoneOk(v('phone'))) errs.phone = 'Enter a valid phone number, e.g. 0803 123 4567.';
    if (v('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) errs.email = 'That email doesn’t look right.';
    if (v('address').length < 5) errs.address = 'Where should we deliver to?';
    if (!v('city')) errs.city = 'Enter your city or area.';
    if (!v('state')) errs.state = 'Select your state.';
    if (!setErrors(f, errs)) return;
    const status = $('.form-status', f), btn = $('#placeOrder');
    btn.classList.add('is-busy'); btn.disabled = true; status.textContent = ''; status.className = 'form-status';
    try {
      const res = await API.placeOrder({
        customer: { name: v('name'), phone: v('phone'), email: v('email'), address: v('address'), city: v('city'), state: v('state') },
        delivery: f.elements.delivery.value, note: v('note'),
        items: state.cart.map((i) => ({ productId: i.productId, color: i.color, size: i.size, qty: i.qty })),
      });
      const summary = cartLines().map((l) => `• ${l.p.name} — ${l.color.name}, ${l.size} × ${l.qty}`).join('\n');
      state.cart = []; saveCart(); renderBag();
      showDone(res, v('name'), summary);
      f.reset();
      $('#coState').value = 'Lagos';
    } catch (err) {
      status.textContent = err.message; status.className = 'form-status is-err';
    } finally { btn.classList.remove('is-busy'); btn.disabled = false; }
  });

  function showDone(res, name, summary) {
    const s = state.settings;
    const msg = `Hello Kitan Essentials! I just placed order ${res.number} (${naira(res.total)}).\n${summary}\nName: ${name}`;
    const wa = waLink(msg);
    const mail = `mailto:${s.email}?subject=${encodeURIComponent('Order ' + res.number)}&body=${encodeURIComponent(msg)}`;
    $('#doneBox').innerHTML = `
      <svg class="done__check" viewBox="0 0 88 88" aria-hidden="true"><circle cx="44" cy="44" r="40"/><path d="M28 45l11 11 21-23"/></svg>
      <h3>Order placed!</h3>
      <p class="done__num">Order ${esc(res.number)}</p>
      <p>Thank you, ${esc(name.split(' ')[0])}. We’ll reach out shortly to confirm your order and delivery.</p>
      <div class="summary">
        <div class="bag-row"><span>Subtotal</span><span>${naira(res.subtotal)}</span></div>
        <div class="bag-row"><span>Delivery</span><span>${feeLabel(res.deliveryFee)}</span></div>
        <div class="bag-row bag-row--total"><span>Total</span><strong>${naira(res.total)}</strong></div>
      </div>
      ${res.payment ? `<div class="pay-box"><h4>Pay by bank transfer</h4><dl>
        <dt>Bank</dt><dd>${esc(res.payment.bankName)}</dd><dt>Account name</dt><dd>${esc(res.payment.accountName)}</dd>
        <dt>Account no.</dt><dd>${esc(res.payment.accountNumber)}</dd><dt>Amount</dt><dd>${naira(res.total)}</dd><dt>Reference</dt><dd>${esc(res.number)}</dd></dl></div>` : ''}
      <div class="done__actions">
        ${wa ? `<a class="btn btn--dark" href="${wa}" target="_blank" rel="noopener"><span>Send order on WhatsApp</span></a>` : ''}
        <a class="btn btn--ghost" href="${mail}"><span>Email your order</span></a>
        <button class="back-link" type="button" data-close>Continue shopping</button>
      </div>`;
    goStep('done');
    if (!anim) return;
    const c = $('.done__check circle'), p = $('.done__check path');
    [c, p].forEach((el) => { const L = el.getTotalLength(); G.set(el, { strokeDasharray: L, strokeDashoffset: L }); });
    G.timeline({ delay: 0.3 }).to(c, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }).to(p, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, '-=.2')
      .add(confetti, '-=.2')
      .from('.done > *:not(svg):not(.confetti)', { opacity: 0, y: 16, stagger: 0.06, duration: 0.6, ease: 'expo.out' }, '-=.3');
  }
  function confetti() {
    const box = $('#doneBox');
    const colors = ['#D4A24C', '#0C0A09', '#F1DDB2', '#A16207', '#ffffff'];
    for (let i = 0; i < 36; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.background = colors[i % colors.length];
      if (i % 5 === 4) c.style.boxShadow = 'inset 0 0 0 1px #D4A24C';
      box.appendChild(c);
      const a = (Math.random() - 0.5) * Math.PI * 1.2 - Math.PI / 2;
      const v = 140 + Math.random() * 160;
      G.timeline({ onComplete: () => c.remove() })
        .to(c, { x: Math.cos(a) * v, y: Math.sin(a) * v, rotate: Math.random() * 720, duration: 0.9, ease: 'power3.out' })
        .to(c, { y: '+=260', opacity: 0, rotate: '+=360', duration: 1.2, ease: 'power1.in' });
    }
  }

  /* ============================================================ toast */
  let toastT;
  function toast(html) {
    const t = $('#toast');
    t.innerHTML = html;
    t.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(hideToast, 4200);
  }
  function hideToast() { $('#toast').classList.remove('is-on'); }

  /* ============================================================ track */
  const openTrack = () => { $('#trackResult').innerHTML = ''; openLayer($('#trackModal'), $('#trackModal .modal__panel')); };
  $('#trackBtn').addEventListener('click', openTrack);
  $('#dockTrack').addEventListener('click', openTrack);
  $('#trackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = $('#trackResult'), btn = $('button[type="submit"]', e.target);
    btn.classList.add('is-busy');
    try {
      const o = await API.trackOrder(e.target.number.value.trim(), e.target.phone.value.trim());
      const flow = ['pending', 'confirmed', 'paid', 'shipped', 'delivered'];
      const idx = flow.indexOf(o.status);
      out.innerHTML = `<div class="track-card">
        <p class="eyebrow" style="margin-bottom:8px">${esc(o.number)}</p>
        <span class="track-card__status">${o.status === 'cancelled' ? 'Cancelled' : esc(o.status)}</span>
        ${o.status === 'cancelled' ? '' : `<div class="track-steps" aria-hidden="true">${flow.map((_, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>`}
        <p class="muted" style="margin:6px 0 0;font-size:14px">Total ${naira(o.total)} · ${esc(API.DELIVERY[o.delivery] || 'Nationwide')} · Updated ${new Date(o.updatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
      </div>`;
      if (anim) G.from('.track-steps i', { scaleX: 0, transformOrigin: 'left', stagger: 0.08, duration: 0.5, ease: 'power3.out' });
    } catch (err) {
      out.innerHTML = `<p class="form-status is-err">${esc(err.message)}</p>`;
    } finally { btn.classList.remove('is-busy'); }
  });

  /* ======================================================= inquiries */
  function bindInquiry(form, type) {
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = (n) => (form.elements[n] ? form.elements[n].value.trim() : '');
      const errs = {};
      if (v('name').length < 2) errs.name = 'Please tell us your name.';
      if (!phoneOk(v('phone')) && !v('email')) errs.phone = 'Add a phone number (or email) so we can reply.';
      if (type === 'contact' && v('message').length < 3) errs.message = 'What would you like to ask?';
      if (!setErrors(form, errs)) return;
      const btn = $('button[type="submit"]', form), status = $('.form-status', form);
      btn.classList.add('is-busy'); btn.disabled = true;
      try {
        await API.sendInquiry({ type, name: v('name'), phone: v('phone'), email: v('email'), business: v('business'), quantity: v('quantity'), message: v('message') });
        form.reset();
        status.textContent = type === 'wholesale' ? 'Request received — we’ll be in touch with pricing soon.' : 'Message sent — we’ll get back to you soon.';
        status.className = 'form-status is-ok';
      } catch (err) {
        status.textContent = err.message; status.className = 'form-status is-err';
      } finally { btn.classList.remove('is-busy'); btn.disabled = false; }
    });
  }
  bindInquiry($('#wholesaleForm'), 'wholesale');
  bindInquiry($('#contactForm'), 'contact');

  /* ============================================================= FAQ */
  $$('.acc').forEach((d) => {
    const s = $('summary', d), body = $('.acc__body', d);
    s.addEventListener('click', (e) => {
      if (!anim) return;
      e.preventDefault();
      if (d.open) G.to(body, { height: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => { d.open = false; body.style.height = ''; } });
      else { d.open = true; G.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.6, ease: 'expo.out' }); G.from($('p', body), { y: 12, opacity: 0, duration: 0.6, ease: 'expo.out' }); }
    });
  });

  /* =========================================================== motion */
  function splitHeadings() {
    if (!window.SplitText) return;
    $$('.split').forEach((el) => {
      const split = new window.SplitText(el, { type: 'lines,words', linesClass: 'line-mask', aria: 'auto' });
      G.from(split.words, { yPercent: 115, rotate: 4, duration: 1.1, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }

  function scrollMotion() {
    const has = (sel) => Boolean($(sel));
    splitHeadings();
    ST.batch('.reveal', { start: 'top 90%', once: true, onEnter: (els) => G.from(els, { opacity: 0, y: 40, duration: 1, stagger: 0.1, ease: 'expo.out', overwrite: true }) });

    // categories: curtain reveal
    $$('.cat').forEach((c, i) => {
      G.from(c, { clipPath: 'inset(100% 0% 0% 0% round 28px)', duration: 1.3, ease: 'expo.inOut', delay: (i % 4) * 0.08, scrollTrigger: { trigger: '#catsRail', start: 'top 85%', once: true } });
      G.from($('.cat__media', c), { scale: 1.35, duration: 1.8, ease: 'expo.out', delay: (i % 4) * 0.08, scrollTrigger: { trigger: '#catsRail', start: 'top 85%', once: true } });
    });

    // ticker rows move in opposite directions, faster with scroll velocity
    if (has('.ticker')) {
      const rows = [[$('.ticker__row--a .ticker__track'), -50, 30], [$('.ticker__row--b .ticker__track'), 50, 38]];
      const loops = rows.map(([el, to, dur]) => (to > 0 ? G.fromTo(el, { xPercent: -50 }, { xPercent: 0, duration: dur, ease: 'none', repeat: -1 }) : G.to(el, { xPercent: to, duration: dur, ease: 'none', repeat: -1 })));
      const skewTo = G.quickTo('.ticker__track', 'skewX', { duration: 0.5, ease: 'power3.out' });
      ST.create({
        trigger: '.ticker', start: 'top bottom', end: 'bottom top',
        onUpdate: (self) => {
          const v = self.getVelocity();
          const speed = 1 + Math.min(4, Math.abs(v) / 400);
          loops.forEach((l) => { G.to(l, { timeScale: speed, duration: 0.3, overwrite: true }); G.to(l, { timeScale: 1, duration: 1.2, delay: 0.3 }); });
          skewTo(Math.max(-8, Math.min(8, v / -300)));
        },
        onLeave: () => skewTo(0), onLeaveBack: () => skewTo(0),
      });
    }

    // stacking cards: each card shrinks back as the next one slides over it
    const cards = $$('.stack-card');
    cards.forEach((c, i) => c.style.setProperty('--i', i));
    cards.forEach((c, i) => {
      if (i === cards.length - 1) return;
      G.to(c, { scale: 0.9 - (cards.length - i) * 0.01, '--dim': 0.45, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 25%', scrub: true } });
      G.from($('.stack-card__art', cards[i + 1]), { y: 80, rotate: 6, opacity: 0, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 40%', scrub: true } });
    });

    const lightSteps = (p) => $$('.step').forEach((s, i) => s.classList.toggle('is-on', p >= i / 4 + 0.05));
    const mm = G.matchMedia();
    mm.add('(min-width: 901px)', () => {
      if (has('.hero')) {
        G.to('.hero__stage', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
        G.to('.hero__copy', { yPercent: -10, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true } });
      }
      const tr = $('#colourTrack');
      if (tr) {
        // colourways: pin + horizontal scroll
        const dist = () => Math.max(0, tr.scrollWidth - (window.innerWidth - tr.getBoundingClientRect().left) + 40);
        const tween = G.to(tr, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.colourways', start: 'top top', end: () => '+=' + dist(), pin: '.colourways__pin', scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
        $$('.cw', tr).forEach((card) => G.from($('.cw__art', card), { rotate: -8, scale: 0.85, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'center center', scrub: true } }));
      }
      $$('.look-col').forEach((col, i) => G.fromTo(col, { yPercent: [6, -4, 8][i] }, { yPercent: [-6, 6, -8][i], ease: 'none', scrollTrigger: { trigger: '#lookbook', start: 'top bottom', end: 'bottom top', scrub: true } }));
      if (has('#steps')) G.fromTo('.steps__line i', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 80%', end: 'bottom 60%', scrub: true, onUpdate: (s) => lightSteps(s.progress) } });
    });
    mm.add('(max-width: 900px)', () => {
      if (has('.hero')) G.to('.hero__stage', { yPercent: 14, scale: 0.94, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      if (has('#steps')) G.fromTo('.steps__line i', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 75%', end: 'bottom 55%', scrub: true, onUpdate: (s) => lightSteps(s.progress) } });
    });

    // page header blobs drift as you scroll
    if (has('.page-hero')) G.to('.page-hero .blob', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: true } });
    if (has('.wholesale__orb')) G.to('.wholesale__orb', { xPercent: 40, yPercent: -30, ease: 'none', scrollTrigger: { trigger: '.wholesale', start: 'top bottom', end: 'bottom top', scrub: true } });
    // footer wordmark fills with gold
    const word = $('.footer__word span');
    G.fromTo(word, { '--fill': '0%' }, { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'bottom bottom', scrub: true } });
    G.from(word, { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    $$('.wa-cta').forEach((c) => G.from($('.wa-cta__icon', c), { scale: 0, rotate: -90, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: c, start: 'top 85%', once: true } }));
    if (has('.float-card')) {
      G.to('.float-card--a', { y: -14, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      G.to('.float-card--b', { y: 12, duration: 3.1, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.4 });
    }
  }

  function pageIntro() {
    document.body.classList.add('is-ready');
    const tl = G.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.nav__inner > *', { y: -30, opacity: 0, duration: 1, stagger: 0.08 }, 0)
      .from('.wa-fab', { scale: 0, opacity: 0, duration: 0.9, ease: 'back.out(2)' }, 0.8);
    if ($('.hero')) {
      $$('.hero__title .line').forEach((l) => { l.innerHTML = `<span>${l.innerHTML}</span>`; });
      tl.from('.hero__eyebrow', { y: 20, opacity: 0, duration: 1 }, 0.1)
        .from($$('.hero__title .line > span'), { yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.1 }, 0.15)
        .from('.hero__disc', { scale: 0.6, opacity: 0, duration: 1.6 }, 0.05)
        .from('.blob', { scale: 0.4, opacity: 0, duration: 2.4, stagger: 0.15, ease: 'power3.out' }, 0)
        .from('#heroMedia', $('.hero').classList.contains('has-photos') ? { clipPath: 'inset(100% 0 0 0 round 999px 999px 30px 30px)', duration: 1.6, ease: 'expo.inOut' } : { yPercent: 30, opacity: 0, rotate: -6, duration: 1.6 }, 0.25)
        .from('.hero__ctas > *', { y: 20, opacity: 0, duration: 1, stagger: 0.08 }, 0.7)
        .from('.float-card', { scale: 0.6, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'back.out(1.6)' }, 0.9)
        .from('.stamp', { scale: 0, rotate: -120, duration: 1.4, ease: 'back.out(1.6)' }, 1)
        .from('.sprig', { scale: 0.6, opacity: 0, rotate: -12, transformOrigin: 'bottom center', duration: 1.8, stagger: 0.15 }, 0.3);
    }
    if ($('.page-hero')) {
      const title = $('.page-hero__title');
      if (window.SplitText) {
        const split = new window.SplitText(title, { type: 'lines,words', linesClass: 'line-mask', aria: 'auto' });
        tl.from(split.words, { yPercent: 115, rotate: 4, duration: 1.2, stagger: 0.06 }, 0.1);
      }
      tl.from('.page-hero .eyebrow, .page-hero__meta', { y: 16, opacity: 0, duration: 1, stagger: 0.1 }, 0.05)
        .from('.page-hero .blob', { scale: 0.4, opacity: 0, duration: 2.2, stagger: 0.15, ease: 'power3.out' }, 0);
    }
    // arriving at page.html#section
    if (location.hash && $(location.hash)) setTimeout(() => scrollToEl($(location.hash)), 500);
  }

  function runLoader(ready) {
    const loader = $('#loader');
    const finish = () => { loader.remove(); document.body.classList.remove('is-loading'); };
    if (!anim) return ready.then(() => { finish(); document.body.classList.add('is-ready'); if (location.hash && $(location.hash)) $(location.hash).scrollIntoView(); });
    let seen = false;
    try { seen = sessionStorage.getItem('kitan_intro') === '1'; sessionStorage.setItem('kitan_intro', '1'); } catch { /* ignore */ }
    if (seen) {
      // later pages: a quick reveal instead of the full intro
      G.set('.loader__inner', { opacity: 0 });
      return ready.then(() => new Promise((resolve) => {
        G.timeline({ onComplete: resolve })
          .to('.loader__curtain--top', { yPercent: -100, duration: 0.9, ease: 'expo.inOut' })
          .to('.loader__curtain--bottom', { yPercent: 100, duration: 0.9, ease: 'expo.inOut' }, '<')
          .add(() => { document.body.classList.remove('is-loading'); pageIntro(); }, '-=.6');
      })).then(finish);
    }
    const count = { v: 0 };
    $$('.loader__ring circle').forEach((c) => { const L = c.getTotalLength(); G.set(c, { strokeDasharray: c.classList.contains('r2') ? '1 5' : L, strokeDashoffset: c.classList.contains('r2') ? 0 : L }); });
    const tl = G.timeline();
    tl.to('.loader__ring .r1', { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to('.loader__ring .r3', { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0.15)
      .from('.loader__ring .r2', { opacity: 0, rotate: -90, transformOrigin: 'center', duration: 1.4, ease: 'power2.out' }, 0.2)
      .from('.loader__word span', { yPercent: 120, duration: 1, stagger: 0.07, ease: 'expo.out' }, 0.2)
      .from('.loader__sub', { opacity: 0, letterSpacing: '1.2em', duration: 1, ease: 'expo.out' }, 0.6)
      .to(count, { v: 86, duration: 1.4, ease: 'power2.out', onUpdate: () => { $('#loaderCount').textContent = Math.round(count.v); } }, 0.1);
    return Promise.all([ready, new Promise((r) => tl.eventCallback('onComplete', r))]).then(() => new Promise((resolve) => {
      G.timeline({ onComplete: resolve })
        .to(count, { v: 100, duration: 0.35, onUpdate: () => { $('#loaderCount').textContent = Math.round(count.v); } })
        .to('.loader__inner', { scale: 1.15, opacity: 0, duration: 0.6, ease: 'power3.in' }, '+=.1')
        .to('.loader__curtain--top', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=.2')
        .to('.loader__curtain--bottom', { yPercent: 100, duration: 1, ease: 'expo.inOut' }, '<')
        .add(() => { document.body.classList.remove('is-loading'); pageIntro(); }, '-=.75');
    })).then(finish);
  }

  /* ============================================================ boot */
  async function load() {
    try {
      const data = await API.getStore();
      state.settings = data.settings;
      state.products = data.products;
      state.reviews = data.reviews;
    } catch (err) {
      console.error(err);
      $('#products').innerHTML = '<p class="empty">We couldn’t load the collection right now. Please refresh the page.</p>';
    }
    state.cart = state.cart.filter((i) => state.products.some((p) => p.id === i.productId));
    applySettings();
    decorate();
    renderHero();
    renderCategories();
    renderFilters();
    renderProducts(false);
    renderFeatured();
    renderStackArt();
    renderLookbook();
    renderColourways();
    buildMap($('#deliveryMap'));
    renderReviews();
    renderBag();
    if (mobileMQ.matches) {
      coverflow($('#colourTrack'), () => $$('#colourTrack .cw'), true);
      coverflow($('#lookGrid'), () => $$('#lookGrid .look'), false);
    }
  }

  const ready = load();
  runLoader(ready).then(() => {
    if (anim && ST) { scrollMotion(); ST.refresh(); }
    autoplayHero();
  });
  window.addEventListener('load', () => ST && ST.refresh());
})();
