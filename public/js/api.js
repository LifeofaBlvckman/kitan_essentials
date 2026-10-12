/* Data layer shared by the storefront and the admin panel.
   - Supabase mode: real database (see supabase/schema.sql).
   - Demo mode: everything lives in this browser's localStorage. */
(function () {
  const cfg = window.KITAN_CONFIG || {};
  const live = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const sb = live ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  const DEFAULT_SETTINGS = {
    storeName: 'Kitan Essentials', handle: 'kitan_essentials0',
    tagline: 'Clothing & sunglasses — classic and affordable. Wholesale & retail.',
    email: 'musaolaitan5@gmail.com', phone: '+234 903 450 6977', whatsapp: '+234 903 450 6977', instagram: 'kitan_essentials0',
    location: 'Lagos & Ibadan, Nigeria',
    announcement: 'Doorstep delivery in Lagos & Ibadan · Nationwide shipping on every order',
    ibadanFee: 2000, lagosFee: 2500, nationwideFee: 5000, freeDeliveryOver: 0,
    bankName: '', accountName: '', accountNumber: '',
    heroImages: [], lookbook: [], lookbookTitle: 'The new collection',
  };

  /* Shrinks a photo in the browser before upload (faster pages on mobile data).
     Returns a Blob (WebP when supported, otherwise JPEG). */
  async function compressImage(file, maxDim = 1600, quality = 0.84) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('Couldn’t read “' + file.name + '”. Try a JPG or PNG.'));
        i.src = url;
      });
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const toBlob = (type) => new Promise((r) => c.toBlob(r, type, quality));
      let blob = await toBlob('image/webp');
      if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg');
      return blob && blob.size < file.size ? blob : file;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const blobToDataURL = (b) => new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  const STATUSES = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'];
  const CUTS = ['cuffed', 'open', 'wide', 'cargo', 'slim', 'shorts', 'tee', 'shades'];
  const DELIVERY = { ibadan: 'Doorstep · Ibadan', lagos: 'Doorstep · Lagos', nationwide: 'Nationwide' };
  const deliveryMethod = (m) => (DELIVERY[m] ? m : 'nationwide');
  function feeFor(s, method, subtotal) {
    if (s.freeDeliveryOver > 0 && subtotal >= s.freeDeliveryOver) return 0;
    return Number(method === 'ibadan' ? s.ibadanFee : method === 'lagos' ? s.lagosFee : s.nationwideFee) || 0;
  }

  /* ------------------------------------------------------------ mapping */
  const productFromRow = (r) => ({
    id: r.id, slug: r.slug, name: r.name, category: r.category, cut: r.cut, description: r.description,
    price: r.price, wholesalePrice: r.wholesale_price, wholesaleMin: r.wholesale_min, stock: r.stock,
    featured: r.featured, active: r.active, colors: r.colors || [], sizes: r.sizes || [], images: r.images || [],
    sort: r.sort, createdAt: r.created_at, updatedAt: r.updated_at,
  });
  const productToRow = (p) => ({
    slug: p.slug, name: p.name, category: p.category, cut: p.cut, description: p.description,
    price: p.price, wholesale_price: p.wholesalePrice, wholesale_min: p.wholesaleMin, stock: p.stock,
    featured: p.featured, active: p.active, colors: p.colors, sizes: p.sizes, images: p.images,
    sort: p.sort || 0, updated_at: new Date().toISOString(),
  });
  const orderFromRow = (r) => ({
    id: r.id, number: r.number, customer: r.customer, delivery: r.delivery, items: r.items,
    subtotal: r.subtotal, deliveryFee: r.delivery_fee, total: r.total, status: r.status,
    note: r.note, adminNotes: r.admin_notes, createdAt: r.created_at, updatedAt: r.updated_at, demo: false,
  });
  const inquiryFromRow = (r) => ({ ...r, createdAt: r.created_at });
  const reviewFromRow = (r) => ({ ...r, createdAt: r.created_at });

  function slugify(s) {
    return String(s || '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function cleanProduct(p) {
    const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : d);
    return {
      ...p,
      name: String(p.name || '').trim().slice(0, 80),
      slug: slugify(p.slug || p.name),
      category: String(p.category || 'Classic').trim().slice(0, 40),
      cut: CUTS.includes(p.cut) ? p.cut : 'cuffed',
      description: String(p.description || '').trim().slice(0, 1200),
      price: n(p.price), wholesalePrice: n(p.wholesalePrice), wholesaleMin: Math.max(1, n(p.wholesaleMin, 6)),
      stock: n(p.stock), featured: Boolean(p.featured), active: p.active !== false,
      colors: (p.colors || []).filter((c) => c && c.name).map((c) => ({ name: String(c.name).slice(0, 40), hex: /^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : '#1b1a1c' })),
      sizes: (p.sizes || []).map((s) => String(s).trim()).filter(Boolean),
      images: (p.images || []).slice(0, 8),
    };
  }

  function check(res) {
    if (res.error) throw new Error(res.error.message || 'Something went wrong. Please try again.');
    return res.data;
  }

  /* ========================================================= SUPABASE */
  const supa = {
    mode: 'live',
    async getStore() {
      const [s, p, r] = await Promise.all([
        sb.from('settings').select('data').eq('id', 1).maybeSingle(),
        sb.from('products').select('*').eq('active', true).order('sort').order('created_at'),
        sb.from('reviews').select('*').eq('visible', true).order('created_at', { ascending: false }),
      ]);
      return {
        settings: { ...DEFAULT_SETTINGS, ...(check(s)?.data || {}) },
        products: check(p).map(productFromRow),
        reviews: check(r).map(reviewFromRow),
      };
    },
    async placeOrder(payload) { return check(await sb.rpc('place_order', { payload })); },
    async trackOrder(number, phone) {
      const data = check(await sb.rpc('track_order', { p_number: number, p_phone: phone }));
      if (!data) throw new Error('We couldn’t find an order with that number and phone.');
      return data;
    },
    async sendInquiry(d) {
      check(await sb.from('inquiries').insert({
        type: d.type, name: d.name, phone: d.phone || '', email: d.email || '', business: d.business || '',
        quantity: Number(d.quantity) || 0, message: d.message || '',
      }));
    },

    /* admin */
    async session() {
      const { data } = await sb.auth.getSession();
      if (!data.session) return null;
      const isAdmin = check(await sb.rpc('is_admin'));
      return { email: data.session.user.email, isAdmin };
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : error.message);
      const s = await this.session();
      if (!s.isAdmin) { await sb.auth.signOut(); throw new Error('This account isn’t an admin yet. Run the “make admin” step in supabase/schema.sql.'); }
      return s;
    },
    async signOut() { await sb.auth.signOut(); },
    async changePassword(next) { check(await sb.auth.updateUser({ password: next })); },
    async listProducts() { return check(await sb.from('products').select('*').order('sort').order('created_at')).map(productFromRow); },
    async saveProduct(p) {
      p = cleanProduct(p);
      const row = productToRow(p);
      const res = p.id
        ? await sb.from('products').update(row).eq('id', p.id).select().single()
        : await sb.from('products').insert(row).select().single();
      return productFromRow(check(res));
    },
    async deleteProduct(id) { check(await sb.from('products').delete().eq('id', id)); },
    async uploadImages(files, folder = 'products') {
      const urls = [];
      for (const f of files) {
        const blob = await compressImage(f);
        const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
        const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        check(await sb.storage.from('product-images').upload(path, blob, { cacheControl: '31536000', contentType: blob.type || 'image/jpeg' }));
        urls.push(sb.storage.from('product-images').getPublicUrl(path).data.publicUrl);
      }
      return urls;
    },
    async listOrders() { return check(await sb.from('orders').select('*').order('created_at', { ascending: false })).map(orderFromRow); },
    async setOrderStatus(id, status) { return orderFromRow(check(await sb.rpc('set_order_status', { p_id: id, p_status: status }))); },
    async updateOrderNotes(id, adminNotes) {
      return orderFromRow(check(await sb.from('orders').update({ admin_notes: adminNotes, updated_at: new Date().toISOString() }).eq('id', id).select().single()));
    },
    async deleteOrder(id) {
      const o = check(await sb.from('orders').select('status').eq('id', id).single());
      if (o.status !== 'cancelled') await this.setOrderStatus(id, 'cancelled'); // return stock first
      check(await sb.from('orders').delete().eq('id', id));
    },
    async listInquiries() { return check(await sb.from('inquiries').select('*').order('created_at', { ascending: false })).map(inquiryFromRow); },
    async markInquiry(id, read) { check(await sb.from('inquiries').update({ read }).eq('id', id)); },
    async deleteInquiry(id) { check(await sb.from('inquiries').delete().eq('id', id)); },
    async listReviews() { return check(await sb.from('reviews').select('*').order('created_at', { ascending: false })).map(reviewFromRow); },
    async saveReview(r) {
      const row = { name: r.name, location: r.location || '', text: r.text, rating: r.rating, visible: r.visible !== false };
      const res = r.id ? await sb.from('reviews').update(row).eq('id', r.id).select().single() : await sb.from('reviews').insert(row).select().single();
      return reviewFromRow(check(res));
    },
    async deleteReview(id) { check(await sb.from('reviews').delete().eq('id', id)); },
    async getSettings() {
      const s = check(await sb.from('settings').select('data').eq('id', 1).maybeSingle());
      return { ...DEFAULT_SETTINGS, ...(s?.data || {}) };
    },
    async saveSettings(data) { check(await sb.from('settings').upsert({ id: 1, data, updated_at: new Date().toISOString() })); return data; },
    async clearDemo() { return 0; },
  };

  /* ============================================================= DEMO */
  const KEY = 'kitan_demo_db_v2';
  const uid = (p) => p + Math.random().toString(36).slice(2, 10);

  function demoProducts() {
    const now = new Date().toISOString();
    const adult = ['S', 'M', 'L', 'XL', 'XXL'];
    return [
      ['The Signature Jogger', 'Classic', 'cuffed', 'Our everyday hero. Heavy-knit 100% cotton, ribbed ankle cuffs, deep side pockets and an adjustable drawcord waist. Soft on day one, softer every wash.', 12500, 9500, 120, true,
        [['Jet Black', '#1b1a1c'], ['Charcoal', '#3d3e42'], ['Ash Grey', '#a7a7a3'], ['Midnight Navy', '#1f2a44']], adult],
      ['The Open-Hem Lounger', 'Lounge', 'open', 'A relaxed straight-leg silhouette with a clean open hem. Brushed-back cotton for that lived-in feel — made for slow Sundays and long journeys.', 13000, 10000, 80, true,
        [['Oat Cream', '#e7dcc8'], ['Jet Black', '#1b1a1c'], ['Mocha', '#6b4f3f']], adult],
      ['The Cargo Utility', 'Utility', 'cargo', 'Street-ready cargo joggers with flap thigh pockets, a tapered leg and cuffed ankles. Thick cotton that keeps its shape.', 15500, 12000, 64, true,
        [['Olive', '#565a3c'], ['Sand', '#c8b48f'], ['Jet Black', '#1b1a1c']], adult],
      ['The Essential Slim', 'Classic', 'slim', 'A sharper, slimmer taper that dresses up as easily as it dresses down. Lightweight cotton jersey with a snug cuff.', 12000, 9000, 96, false,
        [['Midnight Navy', '#1f2a44'], ['Wine', '#5a2230'], ['Jet Black', '#1b1a1c']], adult],
      ['The Heavyweight Fleece', 'Lounge', 'cuffed', 'Our warmest pair. Dense 100% cotton fleece with a cloud-soft brushed interior — harmattan mornings never felt this good.', 16500, 13000, 48, false,
        [['Charcoal', '#3d3e42'], ['Forest', '#27392f'], ['Jet Black', '#1b1a1c']], adult],
      ['The Wide-Leg Trouser', 'Pants & Shorts', 'wide', 'Flowing wide-leg cotton trousers with a soft drawcord waist — effortless, breezy and made to be styled up or down.', 14000, 11000, 70, true,
        [['Cloud White', '#efece6'], ['Jet Black', '#1b1a1c'], ['Sand', '#d9c7a3']], adult],
      ['The Lounge Short', 'Pants & Shorts', 'shorts', 'Easy cotton shorts with a drawcord waist and deep pockets. Your hot-afternoon essential.', 8000, 6000, 90, false,
        [['Oat Cream', '#e7dcc8'], ['Olive', '#565a3c'], ['Jet Black', '#1b1a1c']], adult],
      ['The Everyday Tee', 'Tops', 'tee', 'A clean, breathable cotton tee with a ribbed collar — the perfect partner for every pair of joggers.', 7000, 5000, 110, false,
        [['Midnight Navy', '#1f2a44'], ['Cloud White', '#efece6'], ['Jet Black', '#1b1a1c']], adult],
      ['The Classic Shades', 'Sunglasses', 'shades', 'Bold, classic and affordable sunglasses with dark lenses — the finishing touch to any Kitan fit.', 6000, 4000, 60, false,
        [['Gloss Black', '#1b1a1c'], ['Tortoise Brown', '#6b4f3f']], ['One size']],
    ].map(([name, category, cut, description, price, wholesalePrice, stock, featured, colors, sizes], i) => ({
      id: uid('p_'), slug: slugify(name), name, category, cut, description, price, wholesalePrice, wholesaleMin: 6, stock, featured,
      active: true, colors: colors.map(([n, h]) => ({ name: n, hex: h })), sizes, images: [], sort: i + 1, createdAt: now, updatedAt: now,
    }));
  }

  // Sample orders so the dashboard has something to show. All flagged demo.
  function demoOrders(prods) {
    const people = [
      ['Adaeze Okafor', 'Bodija', 'Ibadan', 'Oyo'], ['Tunde Bakare', 'Ring Road', 'Ibadan', 'Oyo'], ['Bisi Lawal', 'Surulere', 'Lagos', 'Lagos'], ['Tolu Akande', 'Ajah', 'Lagos', 'Lagos'],
      ['Halima Sule', 'Wuse 2', 'Abuja', 'FCT'], ['Chinedu Eze', 'Lekki Phase 1', 'Lagos', 'Lagos'],
      ['Funmi Adeyemi', 'Akobo', 'Ibadan', 'Oyo'], ['Ibrahim Musa', 'Nassarawa GRA', 'Kano', 'Kano'],
      ['Blessing Etim', 'Marian Road', 'Calabar', 'Cross River'], ['Seyi Ogunleye', 'Challenge', 'Ibadan', 'Oyo'],
      ['Kemi Alabi', 'Sabo, Yaba', 'Lagos', 'Lagos'], ['Emeka Nwosu', 'Independence Layout', 'Enugu', 'Enugu'],
      ['Zainab Bello', 'Samonda', 'Ibadan', 'Oyo'], ['Dayo Ajayi', 'Ikeja GRA', 'Lagos', 'Lagos'],
    ];
    const orders = [];
    let n = 1001;
    const now = Date.now();
    for (let d = 44; d >= 0; d--) {
      const count = Math.floor(Math.random() * 3) + (d % 6 === 0 ? 2 : 0) + (d < 10 ? 1 : 0);
      for (let i = 0; i < count; i++) {
        const [name, area, city, state] = people[Math.floor(Math.random() * people.length)];
        const items = [];
        const lines = Math.random() < 0.7 ? 1 : 2;
        for (let l = 0; l < lines; l++) {
          const p = prods[Math.floor(Math.random() * prods.length)];
          const col = p.colors[Math.floor(Math.random() * p.colors.length)];
          const bulk = Math.random() < 0.18;
          const qty = bulk ? p.wholesaleMin + Math.floor(Math.random() * 18) : 1 + Math.floor(Math.random() * 2);
          const wholesale = qty >= p.wholesaleMin;
          const unitPrice = wholesale ? p.wholesalePrice : p.price;
          items.push({ productId: p.id, name: p.name, color: col.name, colorHex: col.hex, size: p.sizes[Math.floor(Math.random() * p.sizes.length)], qty, unitPrice, wholesale, lineTotal: unitPrice * qty });
        }
        const delivery = state === 'Oyo' ? 'ibadan' : state === 'Lagos' ? 'lagos' : 'nationwide';
        const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
        const deliveryFee = feeFor(DEFAULT_SETTINGS, delivery, subtotal);
        const created = new Date(now - d * 864e5 - Math.floor(Math.random() * 3.6e7)).toISOString();
        const pool = d > 7 ? ['delivered', 'delivered', 'delivered', 'shipped', 'cancelled'] : ['pending', 'pending', 'confirmed', 'paid', 'shipped', 'delivered'];
        orders.push({
          id: uid('o_'), number: 'KE-' + n++, demo: true,
          customer: { name, phone: '080' + String(Math.floor(1e7 + Math.random() * 9e7)), email: '', address: `${Math.floor(Math.random() * 40) + 1}, ${area}`, city, state },
          delivery, items, subtotal, deliveryFee, total: subtotal + deliveryFee,
          status: pool[Math.floor(Math.random() * pool.length)], note: '', adminNotes: '', stockApplied: false,
          createdAt: created, updatedAt: created,
        });
      }
    }
    return { orders, next: n };
  }

  function demoSeed() {
    const products = demoProducts();
    const { orders, next } = demoOrders(products);
    return {
      settings: { ...DEFAULT_SETTINGS },
      products, orders, seq: next, reviews: [],
      inquiries: [{
        id: uid('i_'), demo: true, type: 'wholesale', name: 'Sample Boutique (demo)', phone: '08000000000', email: '',
        business: 'Sample Boutique', quantity: 60, read: false, createdAt: new Date().toISOString(),
        message: 'This is a sample wholesale enquiry so you can see how they appear. You can clear demo data in Settings.',
      }],
      password: 'kitan-demo',
    };
  }

  let mem = null;
  function db() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)); } catch { mem = null; }
    if (!mem || !mem.products) { mem = demoSeed(); persist(); }
    return mem;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* storage full or blocked */ } }
  const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));
  const clone = (v) => JSON.parse(JSON.stringify(v));
  let demoSession = null;
  try { demoSession = sessionStorage.getItem('kitan_demo_session'); } catch { /* ignore */ }

  const demo = {
    mode: 'demo',
    async getStore() {
      await wait(120);
      const d = db();
      return { settings: clone(d.settings), products: clone(d.products.filter((p) => p.active)).sort((a, b) => (a.sort || 0) - (b.sort || 0)), reviews: clone(d.reviews.filter((r) => r.visible)) };
    },
    async placeOrder(payload) {
      await wait(500);
      const d = db();
      const c = payload.customer || {};
      if (!c.name || c.name.trim().length < 2) throw new Error('Please enter your full name.');
      if (!/^\+?[0-9\s-]{10,16}$/.test(c.phone || '')) throw new Error('Enter a valid phone number, e.g. 0803 123 4567.');
      if (!c.address || c.address.trim().length < 5) throw new Error('Please enter your delivery address.');
      if (!c.city || !c.state) throw new Error('Please enter your city and state.');
      const totals = {};
      const lines = payload.items.map((raw) => {
        const p = d.products.find((x) => x.id === raw.productId && x.active);
        if (!p) throw new Error('One of the items in your bag is no longer available.');
        const qty = Math.max(1, Math.min(500, Math.round(raw.qty) || 1));
        const col = p.colors.find((x) => x.name === raw.color) || p.colors[0];
        totals[p.id] = (totals[p.id] || 0) + qty;
        return { productId: p.id, name: p.name, color: col.name, colorHex: col.hex, size: p.sizes.includes(raw.size) ? raw.size : p.sizes[0], qty };
      });
      for (const id in totals) {
        const p = d.products.find((x) => x.id === id);
        if (p.stock < totals[id]) throw new Error(`Sorry, only ${p.stock} of ${p.name} left in stock. Reduce the quantity or message us for a restock date.`);
      }
      const items = lines.map((l) => {
        const p = d.products.find((x) => x.id === l.productId);
        const wholesale = totals[p.id] >= p.wholesaleMin;
        const unitPrice = wholesale ? p.wholesalePrice : p.price;
        return { ...l, wholesale, unitPrice, lineTotal: unitPrice * l.qty };
      });
      const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
      const s = d.settings;
      const deliveryFee = feeFor(s, deliveryMethod(payload.delivery), subtotal);
      for (const id in totals) d.products.find((x) => x.id === id).stock -= totals[id];
      const order = {
        id: uid('o_'), number: 'KE-' + d.seq++, customer: c, delivery: deliveryMethod(payload.delivery),
        items, subtotal, deliveryFee, total: subtotal + deliveryFee, status: 'pending', note: payload.note || '', adminNotes: '',
        stockApplied: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      d.orders.push(order);
      persist();
      return {
        number: order.number, subtotal, deliveryFee, total: order.total,
        payment: s.accountNumber ? { bankName: s.bankName, accountName: s.accountName, accountNumber: s.accountNumber } : null,
      };
    },
    async trackOrder(number, phone) {
      await wait(300);
      const digits = String(phone).replace(/\D/g, '');
      const o = db().orders.find((x) => x.number === String(number).trim().toUpperCase() && digits.length >= 8 && x.customer.phone.replace(/\D/g, '').slice(-8) === digits.slice(-8));
      if (!o) throw new Error('We couldn’t find an order with that number and phone.');
      return { number: o.number, status: o.status, total: o.total, delivery: o.delivery, createdAt: o.createdAt, updatedAt: o.updatedAt };
    },
    async sendInquiry(data) {
      await wait(400);
      db().inquiries.push({ id: uid('i_'), read: false, createdAt: new Date().toISOString(), quantity: 0, business: '', email: '', ...data });
      persist();
    },

    async session() { return demoSession ? { email: demoSession, isAdmin: true } : null; },
    async signIn(email, password) {
      await wait(500);
      if (email.trim().toLowerCase() !== db().settings.email.toLowerCase() || password !== db().password) throw new Error('Email or password is incorrect.');
      demoSession = email.trim().toLowerCase();
      try { sessionStorage.setItem('kitan_demo_session', demoSession); } catch { /* ignore */ }
      return { email: demoSession, isAdmin: true };
    },
    async signOut() { demoSession = null; try { sessionStorage.removeItem('kitan_demo_session'); } catch { /* ignore */ } },
    async changePassword(next) { await wait(); db().password = next; persist(); },
    async listProducts() { await wait(); return clone(db().products).sort((a, b) => (a.sort || 0) - (b.sort || 0)); },
    async saveProduct(p) {
      await wait();
      p = cleanProduct(p);
      const d = db();
      p.updatedAt = new Date().toISOString();
      if (p.id) d.products[d.products.findIndex((x) => x.id === p.id)] = p;
      else { p.id = uid('p_'); p.createdAt = p.updatedAt; p.sort = d.products.length + 1; d.products.push(p); }
      persist();
      return clone(p);
    },
    async deleteProduct(id) { await wait(); const d = db(); d.products = d.products.filter((p) => p.id !== id); persist(); },
    async uploadImages(files) {
      // Demo mode keeps a small, compressed copy of each photo in this browser.
      const out = [];
      for (const f of files) out.push(await blobToDataURL(await compressImage(f, 900, 0.78)));
      return out;
    },
    async listOrders() { await wait(); return clone(db().orders).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
    async setOrderStatus(id, status) {
      await wait(160);
      if (!STATUSES.includes(status)) throw new Error('Unknown status');
      const d = db();
      const o = d.orders.find((x) => x.id === id);
      const dir = status === 'cancelled' && o.stockApplied ? 1 : o.status === 'cancelled' && status !== 'cancelled' && !o.demo && !o.stockApplied ? -1 : 0;
      if (dir) {
        for (const it of o.items) { const p = d.products.find((x) => x.id === it.productId); if (p) p.stock = Math.max(0, p.stock + dir * it.qty); }
        o.stockApplied = dir === -1;
      }
      o.status = status; o.updatedAt = new Date().toISOString();
      persist();
      return clone(o);
    },
    async updateOrderNotes(id, adminNotes) {
      await wait(160);
      const o = db().orders.find((x) => x.id === id);
      o.adminNotes = adminNotes; o.updatedAt = new Date().toISOString();
      persist();
      return clone(o);
    },
    async deleteOrder(id) {
      const o = db().orders.find((x) => x.id === id);
      if (o && o.status !== 'cancelled') await this.setOrderStatus(id, 'cancelled');
      const d = db(); d.orders = d.orders.filter((x) => x.id !== id); persist();
    },
    async listInquiries() { await wait(); return clone(db().inquiries).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
    async markInquiry(id, read) { const q = db().inquiries.find((x) => x.id === id); if (q) q.read = read; persist(); },
    async deleteInquiry(id) { const d = db(); d.inquiries = d.inquiries.filter((x) => x.id !== id); persist(); },
    async listReviews() { await wait(); return clone(db().reviews); },
    async saveReview(r) {
      await wait();
      const d = db();
      if (r.id) Object.assign(d.reviews.find((x) => x.id === r.id), r);
      else { r = { ...r, id: uid('r_'), createdAt: new Date().toISOString() }; d.reviews.unshift(r); }
      persist();
      return clone(r);
    },
    async deleteReview(id) { const d = db(); d.reviews = d.reviews.filter((x) => x.id !== id); persist(); },
    async getSettings() { await wait(); return clone(db().settings); },
    async saveSettings(s) { await wait(); db().settings = { ...db().settings, ...s }; persist(); return clone(db().settings); },
    async clearDemo() {
      const d = db();
      const n = d.orders.filter((o) => o.demo).length + d.inquiries.filter((i) => i.demo).length;
      d.orders = d.orders.filter((o) => !o.demo); d.inquiries = d.inquiries.filter((i) => !i.demo);
      persist();
      return n;
    },
    resetDemo() { mem = demoSeed(); persist(); },
  };

  window.KitanAPI = live ? supa : demo;
  window.KitanAPI.STATUSES = STATUSES;
  window.KitanAPI.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  window.KitanAPI.DELIVERY = DELIVERY;
  window.KitanAPI.CUTS = CUTS;
  window.KitanAPI.feeFor = feeFor;
})();
