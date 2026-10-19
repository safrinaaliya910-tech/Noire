/* ==========================================================================
   NOIRÉ — Objects of Desire
   js/main.js  (vanilla JS + Bootstrap 5 Offcanvas/Modal + Lucide icons)
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- Product data ---------- */
  const products = [
    { id: 1, name: 'Obsidian Eau de Parfum', category: 'Fragrance', price: 2499, tag: 'Bestseller',      image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85', description: 'A dark, enveloping composition of black pepper, cedar and skin musk.' },
    { id: 2, name: 'Botanical Repair Serum', category: 'Skincare',  price: 1899, tag: 'New arrival',     image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85', description: 'A restorative, plant-led serum for skin that deserves a quieter routine.' },
    { id: 3, name: 'Noiré Scented Oil',      category: 'Fragrance', price: 899,                          image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&q=85', description: 'A concentrated veil of cedar, black pepper and warm skin musk.' },
    { id: 4, name: 'Velvet Ritual Set',      category: 'Self-Care', price: 1799, tag: 'The Ritual Edit', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85', description: 'Three quiet essentials for the nightly ritual: oil, balm and silk.' },
    { id: 5, name: 'Midnight Renewal Cream', category: 'Skincare',  price: 1299,                         image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85', description: 'A rich overnight cream that softens, restores and leaves skin luminous by morning.' },
    { id: 6, name: 'Amber Objects Candle',   category: 'Living',    price: 1099,                         image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85', description: 'Warm amber, smoked wood and a small pool of light for slow evenings.' },
    // NOTE: the zip's card 7 image is a placeholder duplicate of card 1 — paste the exact "Essential Body Oil" image URL from your running version here.
    { id: 7, name: 'Essential Body Oil',     category: 'Self-Care', price: 1499,                         image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85', description: 'A nourishing body oil that melts into skin and leaves a soft, quiet glow.' },
    { id: 8, name: 'The Daily Cleanser',     category: 'Skincare',  price: 999,                          image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85', description: 'A gentle, everyday cleanser that lifts the day away without stripping skin.' }
  ];

  const ALL = 'All Objects';
  const money = (value) => `₹${value.toLocaleString('en-IN')}`;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const icons = (root = document) => { if (window.lucide) window.lucide.createIcons({ root }); };

  /* ---------- State (persisted exactly like the React version) ---------- */
  const readStore = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || fallback); } catch { return JSON.parse(fallback); }
  };
  const writeStore = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  };

  const state = {
    filter: ALL,
    sort: 'featured',
    cart: readStore('noire-cart', '{}'),      // { [productId]: quantity }
    wishlist: readStore('noire-wishlist', '[]') // [productId]
  };
  const byId = (id) => products.find((p) => p.id === Number(id));
  const cartCount = () => Object.values(state.cart).reduce((a, b) => a + b, 0);

  /* ---------- Element refs ---------- */
  const nav = $('.site-nav');
  const navLinks = $('#navLinks');
  const menuToggle = $('#menuToggle');
  const filtersEl = $('#filters');
  const sortSelect = $('#sortSelect');
  const grid = $('#productGrid');
  const cartEl = $('#cartDrawer');
  const cartContent = $('#cartContent');
  const modalEl = $('#quickViewModal');

  // Bootstrap components. The cart drawer keeps page scroll enabled, like the original.
  const cartDrawer = new bootstrap.Offcanvas(cartEl, { scroll: true });
  const quickModal = new bootstrap.Modal(modalEl);

  /* ---------- Scroll reveal + sticky nav ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
    { threshold: 0.12 }
  );
  const observeReveals = () => $$('.reveal:not(.is-visible)').forEach((el) => revealObserver.observe(el));
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    menuToggle.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  };
  menuToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- Product cards (built once, re-ordered on filter / sort) ---------- */
  const cardNodes = new Map();

  const buildCard = (p) => {
    const col = document.createElement('div');
    col.className = 'col-6 product-col';
    col.innerHTML = `
      <article class="product-card reveal">
        <div class="product-image">
          <img src="${p.image}" alt="${p.name}">
          ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
          <button type="button" class="wish" data-action="wish" aria-label="Wishlist ${p.name}"><i data-lucide="heart" width="16" height="16"></i></button>
          <button type="button" class="quick-view" data-action="quick">Quick view <i data-lucide="arrow-up-right" width="13" height="13"></i></button>
        </div>
        <div class="product-info">
          <div><p class="product-category">${p.category}</p><h3>${p.name}</h3></div>
          <strong>${money(p.price)}</strong>
        </div>
        <button type="button" class="add-button" data-action="add">Add to bag <span>+</span></button>
      </article>`;
    col.dataset.id = p.id;
    icons(col);
    return col;
  };

  const syncWishButtons = () => {
    cardNodes.forEach((col, id) => {
      const active = state.wishlist.includes(id);
      const btn = $('.wish', col);
      btn.classList.toggle('active', active);
      $('svg', btn)?.setAttribute('fill', active ? 'currentColor' : 'none');
    });
    $('#wishCount').textContent = state.wishlist.length;
  };

  const visibleProducts = () =>
    products
      .filter((p) => state.filter === ALL || p.category === state.filter)
      .sort((a, b) => (state.sort === 'low' ? a.price - b.price : state.sort === 'high' ? b.price - a.price : a.id - b.id));

  const renderFilters = () => {
    const names = [ALL, ...new Set(products.map((p) => p.category))];
    filtersEl.innerHTML = names
      .map((name) => `<button type="button" class="${name === state.filter ? 'active' : ''}" data-filter="${name}">${name}</button>`)
      .join('');
  };

  const renderGrid = () => {
    const list = visibleProducts();
    list.forEach((p, i) => {
      if (!cardNodes.has(p.id)) cardNodes.set(p.id, buildCard(p));
      $('.product-card', cardNodes.get(p.id)).style.setProperty('--delay', `${i * 55}ms`);
    });
    grid.replaceChildren(...list.map((p) => cardNodes.get(p.id)));
    syncWishButtons();
    observeReveals();
  };

  filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    state.filter = btn.dataset.filter;
    renderFilters();
    renderGrid();
  });
  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; renderGrid(); });

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.closest('.product-col').dataset.id);
    if (btn.dataset.action === 'wish') toggleWish(id);
    if (btn.dataset.action === 'add') addToCart(id);
    if (btn.dataset.action === 'quick') openQuickView(id);
  });

  /* ---------- Wishlist ---------- */
  const toggleWish = (id) => {
    state.wishlist = state.wishlist.includes(id) ? state.wishlist.filter((x) => x !== id) : [...state.wishlist, id];
    writeStore('noire-wishlist', state.wishlist);
    syncWishButtons();
  };
  $('#wishlistBtn').addEventListener('click', () => $('#collection').scrollIntoView());

  /* ---------- Cart ---------- */
  const renderCart = () => {
    const items = products.filter((p) => state.cart[p.id]);
    const count = cartCount();
    const subtotal = items.reduce((sum, p) => sum + p.price * state.cart[p.id], 0);

    $('#cartCount').textContent = count;
    $('#drawerCount').textContent = count;

    if (!items.length) {
      cartContent.innerHTML = `
        <div class="empty-cart">
          <i data-lucide="shopping-bag" width="28" height="28"></i>
          <p>Your bag is waiting<br>for something exceptional.</p>
          <a href="#collection" data-close-cart>Explore the collection ↗</a>
        </div>`;
    } else {
      cartContent.innerHTML = `
        <div class="cart-list">
          ${items.map((p) => `
            <div class="cart-item" data-id="${p.id}">
              <img src="${p.image}" alt="">
              <div>
                <h3>${p.name}</h3>
                <p>${money(p.price)}</p>
                <div class="qty">
                  <button type="button" data-qty="-1" aria-label="Decrease quantity"><i data-lucide="minus" width="12" height="12"></i></button>
                  <span>${state.cart[p.id]}</span>
                  <button type="button" data-qty="1" aria-label="Increase quantity"><i data-lucide="plus" width="12" height="12"></i></button>
                </div>
              </div>
              <button type="button" class="remove" data-remove>Remove</button>
            </div>`).join('')}
        </div>
        <div class="cart-total"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
        <button type="button" class="button button-gold checkout">Continue to checkout <i data-lucide="arrow-up-right" width="15" height="15"></i></button>
        <p class="demo-note">Checkout coming soon</p>`;
    }
    icons(cartContent);
  };

  const persistCart = () => { writeStore('noire-cart', state.cart); renderCart(); };

  const addToCart = (id, { open = true } = {}) => {
    state.cart[id] = (state.cart[id] || 0) + 1;
    persistCart();
    if (open) cartDrawer.show();
  };

  const changeQty = (id, amount) => {
    const qty = (state.cart[id] || 0) + amount;
    if (qty <= 0) delete state.cart[id]; else state.cart[id] = qty;
    persistCart();
  };

  $('#cartBtn').addEventListener('click', () => cartDrawer.show());
  cartContent.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-cart]')) { cartDrawer.hide(); return; }
    const item = e.target.closest('.cart-item');
    if (!item) return;
    const id = Number(item.dataset.id);
    const qtyBtn = e.target.closest('[data-qty]');
    if (qtyBtn) changeQty(id, Number(qtyBtn.dataset.qty));
    if (e.target.closest('[data-remove]')) changeQty(id, -state.cart[id]);
  });

  /* ---------- Quick view ---------- */
  let quickId = null;
  const openQuickView = (id) => {
    const p = byId(id);
    quickId = p.id;
    const img = $('#qvImage');
    img.src = p.image;
    img.alt = p.name;
    $('#qvCategory').textContent = p.category;
    $('#qvName').textContent = p.name;
    $('#qvPrice').textContent = money(p.price);
    $('#qvDesc').textContent = p.description;
    quickModal.show();
  };

  $('#qvAdd').addEventListener('click', () => {
    if (quickId == null) return;
    state.cart[quickId] = (state.cart[quickId] || 0) + 1;
    persistCart();
    // close the modal first, then slide the bag in (mirrors the original behaviour)
    modalEl.addEventListener('hidden.bs.modal', () => cartDrawer.show(), { once: true });
    quickModal.hide();
  });

  /* ---------- Newsletter ---------- */
  $('#newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const value = $('#email').value;
    $('#newsletterMsg').textContent = /^\S+@\S+\.\S+$/.test(value) ? 'You are on the list.' : 'Please enter a valid email.';
  });

  /* ---------- Init ---------- */
  renderFilters();
  renderGrid();
  renderCart();
  icons();
  syncWishButtons();
  observeReveals();
})();