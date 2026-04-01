(function () {
  'use strict';

  const API_URL = '/api/categories/';

  // ─── FETCH CATEGORIES ───
  async function loadCategories() {
    try {
      const res = await fetch(API_URL);

      if (!res.ok) {
        const text = await res.text();
        console.error(`API error ${res.status}:`, text);
        renderError(`Ошибка сервера: ${res.status}`);
        return;
      }

      const data = await res.json();
      const categories = Array.isArray(data) ? data : (data.results ?? []);

      renderSidebar(categories);
      renderGrid(categories);
      renderNavDropdown(categories);

    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
      renderError('Не удалось подключиться к серверу');
    }
  }

  // ─── SIDEBAR ───
  function renderSidebar(categories) {
    const list = document.getElementById('sidebarList');
    if (!list) return;

    if (!categories.length) {
      list.innerHTML = '<li class="cat-sidebar-item"><span class="cat-sidebar-empty">Категории не найдены</span></li>';
      return;
    }

    const currentPath = window.location.pathname;

    list.innerHTML = categories.map((cat, i) => {
      const href     = `/catalog/${cat.slug}/`;
      const isActive = currentPath === href;
      const isLast   = i === categories.length - 1;
      return `
        <li class="cat-sidebar-item ${isLast ? 'cat-sidebar-item--promo' : ''}">
          <a href="${href}" class="cat-sidebar-link ${isActive ? 'active' : ''}">
            <div class="cat-sidebar-icon cat-sidebar-icon--placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <span>${escapeHtml(cat.name)}</span>
          </a>
        </li>`;
    }).join('');
  }

  // ─── NAV DROPDOWN ───
  function renderNavDropdown(categories) {
    const list = document.getElementById('navDropdownList');
    if (!list) return;

    list.innerHTML = categories.length
      ? categories.map(cat =>
          `<li><a href="/catalog/${cat.slug}/">${escapeHtml(cat.name)}</a></li>`
        ).join('')
      : '<li class="empty">Категории не найдены</li>';
  }

  // ─── GRID ───
  function renderGrid(categories) {
    const grid = document.getElementById('catGrid');
    if (!grid) return;

    if (!categories.length) {
      grid.innerHTML = '<div class="cat-grid-empty">Категории не найдены</div>';
      return;
    }

    grid.innerHTML = categories.map(cat => {
      const href    = `/catalog/${cat.slug}/`;
      const imgHtml = cat.preview_image
        ? `<img src="${cat.preview_image}" alt="${escapeHtml(cat.name)}" class="cat-card-img" loading="lazy">`
        : `<div class="cat-card-img-placeholder">
             <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
               <rect x="4" y="8" width="56" height="40" rx="4"/>
               <path d="M20 48l4-12 8 8 8-16 8 20"/>
               <circle cx="22" cy="24" r="5"/>
             </svg>
           </div>`;
      return `
        <a href="${href}" class="cat-card">
          <div class="cat-card-img-wrap">${imgHtml}</div>
          <div class="cat-card-name">${escapeHtml(cat.name)}</div>
        </a>`;
    }).join('');

    // Убираем правый бордер у карточек в последней колонке каждого ряда
    fixCardBorders(grid);

    // Делаем категории доступными для футера
    window._catalogCategories = categories;
    const fl = document.getElementById('footerCatalogLinks');
    if (fl) {
      fl.innerHTML = categories.slice(0, 6).map(c =>
        `<li><a href="/catalog/${c.slug}/">${escapeHtml(c.name)}</a></li>`
      ).join('') + '<li class="footer-links-all"><a href="/catalog/">Весь каталог →</a></li>';
    }
  }

  function fixCardBorders(grid) {
    const cards = Array.from(grid.querySelectorAll('.cat-card'));
    if (!cards.length) return;
    // Вычисляем сколько колонок реально занято
    const firstTop = cards[0].getBoundingClientRect().top;
    let cols = 0;
    for (const card of cards) {
      if (card.getBoundingClientRect().top !== firstTop) break;
      cols++;
    }
    if (!cols) cols = 3;
    cards.forEach((card, i) => {
      card.style.borderRight  = (i + 1) % cols === 0 ? 'none' : '';
      // убираем bottom у последнего ряда
      const isLastRow = i >= cards.length - (cards.length % cols || cols);
      card.style.borderBottom = isLastRow ? 'none' : '';
    });
  }

  // ─── ERROR STATE ───
  function renderError(msg = 'Не удалось загрузить категории. Попробуйте обновить страницу.') {
    const grid    = document.getElementById('catGrid');
    const sidebar = document.getElementById('sidebarList');
    if (grid)    grid.innerHTML    = `<div class="cat-grid-empty">${msg}</div>`;
    if (sidebar) sidebar.innerHTML = `<li class="cat-sidebar-item"><span class="cat-sidebar-empty">Ошибка загрузки</span></li>`;
  }

  // ─── SEARCH (каталог — переопределяем поведение под страницу каталога) ───
  const catalogSearchInput = document.getElementById('searchInput');
  const catalogSearchBtn   = document.getElementById('searchBtn');

  function handleCatalogSearch() {
    const query = catalogSearchInput?.value.trim();
    if (query) window.location.href = `/catalog/?q=${encodeURIComponent(query)}`;
  }

  // Переназначаем листенеры поиска (main.js мог навесить свои)
  if (catalogSearchBtn) {
    catalogSearchBtn.replaceWith(catalogSearchBtn.cloneNode(true));
    document.getElementById('searchBtn').addEventListener('click', handleCatalogSearch);
  }
  if (catalogSearchInput) {
    catalogSearchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleCatalogSearch();
    });
  }

  // ─── MOBILE SIDEBAR TOGGLE ───
  const catMobileBtn = document.getElementById('catMobileBtn');
  const catSidebar   = document.getElementById('catSidebar');

  catMobileBtn?.addEventListener('click', () => {
    const isOpen = catSidebar.classList.toggle('open');
    const arrow  = catMobileBtn.querySelector('svg');
    if (arrow) {
      arrow.style.transform  = isOpen ? 'rotate(180deg)' : '';
      arrow.style.transition = 'transform 0.2s';
    }
  });

  // ─── UTIL ───
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── INIT ───
  loadCategories();

})();