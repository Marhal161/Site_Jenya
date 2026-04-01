/* ═══════════════════════════════════════════════════
   CART — localStorage, глобальный модуль
   Подключать ПЕРВЫМ после main.js на всех страницах
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'eraauto_cart';

  /* ─── STORAGE ─── */
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateBadge();
    renderDrawerItems();
  }

  /* ─── PUBLIC API ─── */
  window.Cart = {
    add: function (slug, name, price, image) {
      const items = loadCart();
      const idx   = items.findIndex(i => i.slug === slug);
      if (idx >= 0) {
        items[idx].quantity += 1;
      } else {
        items.push({
          slug,
          name:     String(name),
          price:    parseFloat(price) || 0,
          image:    image || null,
          quantity: 1,
        });
      }
      saveCart(items);
      showDrawer();
      flashBtn(slug);
    },

    remove: function (slug) {
      saveCart(loadCart().filter(i => i.slug !== slug));
    },

    update: function (slug, qty) {
      const items = loadCart();
      const idx   = items.findIndex(i => i.slug === slug);
      if (idx < 0) return;
      if (qty < 1) items.splice(idx, 1);
      else items[idx].quantity = qty;
      saveCart(items);
    },

    clear: function () { saveCart([]); },

    get: function () { return loadCart(); },

    total: function () {
      return loadCart().reduce((s, i) => s + i.price * i.quantity, 0);
    },

    count: function () {
      return loadCart().reduce((s, i) => s + i.quantity, 0);
    },
  };

  // Обратная совместимость
  window.cartAdd    = window.Cart.add;
  window.cartRemove = window.Cart.remove;
  window.cartUpdate = window.Cart.update;
  window.cartClear  = window.Cart.clear;
  window.cartGet    = window.Cart.get;

  /* ─── BADGE ─── */
  function updateBadge() {
    const n = window.Cart.count();
    document.querySelectorAll('.cart-badge').forEach(b => b.textContent = n);
  }

  /* ─── FLASH КНОПКИ ─── */
  function flashBtn(slug) {
    document.querySelectorAll(`[data-cart-slug="${slug}"]`).forEach(btn => {
      if (btn.dataset.flashing) return;
      btn.dataset.flashing = '1';
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Добавлено';
      btn.style.background = '#22c55e';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '';
        btn.disabled = false;
        delete btn.dataset.flashing;
      }, 1600);
    });
  }

  /* ─── UTILS ─── */
  function fmt(p) { return Number(p).toLocaleString('ru-RU'); }
  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function csrf() {
    return document.cookie.split(';')
      .find(c => c.trim().startsWith('csrftoken='))
      ?.split('=')[1] ?? '';
  }

  /* ═══ DRAWER ═══ */
  function injectDrawer() {
    if (document.getElementById('cartDrawer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'cartOverlay';
    overlay.className = 'cart-overlay';
    overlay.addEventListener('click', hideDrawer);

    const drawer = document.createElement('div');
    drawer.id = 'cartDrawer';
    drawer.className = 'cart-drawer';
    drawer.innerHTML = `
      <div class="cart-drawer-header">
        <div class="cart-drawer-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          Корзина
          <span class="cart-drawer-count" id="drawerCount">0</span>
        </div>
        <button class="cart-drawer-close" id="cartDrawerClose" aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="cart-drawer-body" id="drawerBody"></div>
      <div class="cart-drawer-footer" id="drawerFooter"></div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    document.getElementById('cartDrawerClose')
      .addEventListener('click', hideDrawer);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') hideDrawer();
    });
  }

  function showDrawer() {
    document.getElementById('cartDrawer')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function hideDrawer() {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ─── RENDER DRAWER ─── */
  function renderDrawerItems() {
    const body   = document.getElementById('drawerBody');
    const footer = document.getElementById('drawerFooter');
    const count  = document.getElementById('drawerCount');
    if (!body) return;

    const items = loadCart();
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const qty   = items.reduce((s, i) => s + i.quantity, 0);

    if (count) count.textContent = qty;

    if (!items.length) {
      body.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="52" height="52">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p>Корзина пуста</p>
          <a href="/catalog/" class="cart-empty-link">Перейти в каталог</a>
        </div>`;
      if (footer) footer.innerHTML = '';
      return;
    }

    body.innerHTML = items.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          ${item.image
            ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy">`
            : `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" width="32" height="32">
                 <rect x="3" y="6" width="42" height="30" rx="3"/>
                 <path d="M15 36l3-9 6 6 6-12 6 15"/>
               </svg>`}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${esc(item.name)}</div>
          <div class="cart-item-price">${fmt(item.price)} ₽</div>
          <div class="cart-item-controls">
            <button class="cart-qty-btn" data-action="dec" data-slug="${esc(item.slug)}">−</button>
            <span class="cart-qty-val">${item.quantity}</span>
            <button class="cart-qty-btn" data-action="inc" data-slug="${esc(item.slug)}">+</button>
            <button class="cart-item-remove" data-slug="${esc(item.slug)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="cart-item-subtotal">${fmt(item.price * item.quantity)} ₽</div>
      </div>`).join('');

    // Делегируем события на body drawer
    body.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slug = btn.dataset.slug;
        const cur  = loadCart().find(i => i.slug === slug)?.quantity || 1;
        window.Cart.update(slug, btn.dataset.action === 'inc' ? cur + 1 : cur - 1);
      });
    });

    body.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => window.Cart.remove(btn.dataset.slug));
    });

    if (footer) {
      footer.innerHTML = `
        <div class="cart-total">
          <span>Итого:</span>
          <span class="cart-total-price">${fmt(total)} ₽</span>
        </div>
        <a href="/cart/" class="cart-checkout-btn">
          Оформить заказ
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>
        <button class="cart-clear-btn" id="drawerClear">Очистить корзину</button>`;

      document.getElementById('drawerClear')
        ?.addEventListener('click', () => window.Cart.clear());
    }
  }

  /* ─── EVENT DELEGATION для кнопок «В корзину» ─── */
  function bindGlobalCartButtons() {
    document.addEventListener('click', function (e) {
      // Ищем кнопку «В корзину» вверх по дереву
      const btn = e.target.closest('[data-cart-slug]');
      if (!btn) return;

      // Не срабатывать на кнопки внутри drawer
      if (btn.closest('#cartDrawer')) return;

      e.preventDefault();
      e.stopPropagation();

      const slug  = btn.dataset.cartSlug;
      const name  = btn.dataset.cartName  || slug;
      const price = btn.dataset.cartPrice || 0;
      const image = btn.dataset.cartImage || null;

      window.Cart.add(slug, name, parseFloat(price), image);
    });
  }

  /* ─── INIT ─── */
  function init() {
    // Drawer уже в HTML — просто биндим закрытие
    document.getElementById('cartOverlay')
      ?.addEventListener('click', hideDrawer);
    document.getElementById('cartDrawerClose')
      ?.addEventListener('click', hideDrawer);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') hideDrawer();
    });

    updateBadge();
    renderDrawerItems();
    bindGlobalCartButtons();

    // Сигнализируем что Cart готов (для cart-page.js)
    document.dispatchEvent(new CustomEvent('cart:ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();