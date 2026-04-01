(function () {
  'use strict';

  const STORAGE_KEY = 'eraauto_cart';

  function fmt(p) { return Number(p).toLocaleString('ru-RU'); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function csrf() { return document.cookie.split(';').find(c=>c.trim().startsWith('csrftoken='))?.split('=')[1]??''; }

  // Читаем localStorage напрямую — не зависим от window.Cart
  function getItems() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Обновляем бейдж если cart.js уже загружен
    if (window.Cart) window.Cart.get(); // триггер обновления бейджа
    document.querySelectorAll('.cart-badge').forEach(b => {
      b.textContent = items.reduce((s, i) => s + i.quantity, 0);
    });
  }

  // ─── ОБНОВИТЬ СПИСОК ТОВАРОВ ───
  function renderItems() {
    const items    = getItems();
    const list     = document.getElementById('cpItemsList');
    const count    = document.getElementById('cpCount');
    const clearBtn = document.getElementById('cpClear');
    if (!list) return;

    const total    = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const qty      = items.reduce((s, i) => s + i.quantity, 0);

    // Счётчик и кнопка очистки
    if (count) count.textContent = items.length ? `(${qty})` : '';
    if (clearBtn) clearBtn.style.display = items.length ? '' : 'none';

    // Список товаров
    if (!items.length) {
      list.innerHTML = `
        <div class="cp-empty-items">
          <p>Добавьте товары из <a href="/catalog/">каталога</a>, чтобы они появились в заявке</p>
        </div>`;
    } else {
      list.innerHTML = items.map(item => `
        <div class="cp-item" data-slug="${esc(item.slug)}">
          <div class="cp-item-img">
            ${item.image
              ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy">`
              : `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" width="40" height="40">
                   <rect x="3" y="6" width="42" height="30" rx="3"/>
                   <path d="M15 36l3-9 6 6 6-12 6 15"/>
                 </svg>`}
          </div>
          <div class="cp-item-body">
            <div class="cp-item-name">${esc(item.name)}</div>
            <div class="cp-item-price-row">
              <span class="cp-item-unit">${fmt(item.price)} ₽ / шт.</span>
              <div class="cp-item-qty">
                <button class="cp-qty-btn" data-action="dec" data-slug="${esc(item.slug)}">−</button>
                <span class="cp-qty-val">${item.quantity}</span>
                <button class="cp-qty-btn" data-action="inc" data-slug="${esc(item.slug)}">+</button>
              </div>
              <span class="cp-item-subtotal">${fmt(item.price * item.quantity)} ₽</span>
              <button class="cp-item-del" data-slug="${esc(item.slug)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>`).join('');
    }

    // Автозаполнение textarea
    const msg = document.getElementById('cpMessage');
    if (msg) {
      msg.value = items.length
        ? items.map(i => `• ${i.name} × ${i.quantity} = ${fmt(i.price * i.quantity)} ₽`).join('\n')
          + `\n\nИтого: ${fmt(total)} ₽`
        : 'Корзина пуста';
      msg.rows = Math.max(4, items.length + 2);
    }

    bindItemEvents();
  }

  // ─── СОБЫТИЯ ТОВАРОВ ───
  function bindItemEvents() {
    document.querySelectorAll('.cp-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const items = getItems();
        const item  = items.find(i => i.slug === btn.dataset.slug);
        if (!item) return;
        const newQty = btn.dataset.action === 'inc' ? item.quantity + 1 : item.quantity - 1;
        if (newQty < 1) {
          saveItems(items.filter(i => i.slug !== btn.dataset.slug));
        } else {
          item.quantity = newQty;
          saveItems(items);
        }
        renderItems();
      });
    });

    document.querySelectorAll('.cp-item-del').forEach(btn => {
      btn.addEventListener('click', () => {
        saveItems(getItems().filter(i => i.slug !== btn.dataset.slug));
        renderItems();
      });
    });
  }

  // ─── ИНИЦИАЛИЗАЦИЯ ───
  function init() {
    renderItems();

    // Очистить корзину
    document.getElementById('cpClear')?.addEventListener('click', () => {
      saveItems([]);
      renderItems();
    });

    // Маска телефона
    document.getElementById('cpPhone')?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let f = '+7';
      if (v.length > 1) f += ' (' + v.slice(1,4);
      if (v.length >= 4) f += ') ' + v.slice(4,7);
      if (v.length >= 7) f += '-' + v.slice(7,9);
      if (v.length >= 9) f += '-' + v.slice(9,11);
      e.target.value = f;
    });

    // Отправка формы
    document.getElementById('cpOrderForm')?.addEventListener('submit', async e => {
      e.preventDefault();

      const name    = document.getElementById('cpName').value.trim();
      const phone   = document.getElementById('cpPhone').value.trim();
      const comment = document.getElementById('cpComment').value.trim();
      const errEl   = document.getElementById('cpError');
      const btn     = document.getElementById('cpSubmit');
      const items   = getItems();
      const total   = items.reduce((s, i) => s + i.price * i.quantity, 0);

      errEl.textContent = '';
      if (!name)             { errEl.textContent = 'Введите имя'; return; }
      if (phone.length < 16) { errEl.textContent = 'Введите корректный телефон'; return; }

      btn.disabled    = true;
      btn.textContent = 'Отправка...';

      const cartText = items.length
        ? items.map(i => `• ${i.name} × ${i.quantity} = ${fmt(i.price * i.quantity)} ₽`).join('\n')
          + `\n\nИтого: ${fmt(total)} ₽`
        : 'Корзина пуста';

      const message = cartText + (comment ? `\n\nКомментарий: ${comment}` : '');

      try {
        const res = await fetch('/api/callback/', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() },
          body:    JSON.stringify({ name, phone, message }),
        });

        if (res.ok || res.status === 201) {
          saveItems([]);
          document.getElementById('cpOrderForm').style.display = 'none';
          document.getElementById('cpSuccess').style.display   = 'flex';
        } else {
          errEl.textContent = 'Ошибка отправки. Попробуйте снова.';
          btn.disabled = false;
          btn.textContent = 'Отправить заявку';
        }
      } catch {
        errEl.textContent = 'Ошибка сети. Попробуйте позже.';
        btn.disabled = false;
        btn.textContent = 'Отправить заявку';
      }
    });

    // Навдропдаун + футер каталог
    fetch('/api/categories/').then(r => r.json()).then(data => {
      const cats = Array.isArray(data) ? data : (data.results ?? []);
      const list = document.getElementById('navDropdownList');
      if (list && cats.length)
        list.innerHTML = cats.map(c => `<li><a href="/catalog/${c.slug}/">${c.name}</a></li>`).join('');
      const footer = document.getElementById('footerCatalogLinks');
      if (footer && cats.length)
        footer.innerHTML = cats.slice(0, 6).map(c => `<li><a href="/catalog/${c.slug}/">${c.name}</a></li>`).join('')
          + '<li class="footer-links-all"><a href="/catalog/">Весь каталог →</a></li>';
    }).catch(() => {});
  }

  // Запускаем после полной загрузки страницы — window.Cart уже точно готов
  // localStorage доступен сразу — никакой зависимости от window.Cart
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();