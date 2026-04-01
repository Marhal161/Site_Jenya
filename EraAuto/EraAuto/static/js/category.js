(function () {
  'use strict';

  const SLUG         = window.CATEGORY_SLUG;
  const API_PRODUCTS = `/api/categories/${SLUG}/products/`;
  const API_CATS     = '/api/categories/';
  let   currentPage  = 1;

  fetchCategories();
  fetchProducts(currentPage);

  // ─── FETCH PRODUCTS ───
  async function fetchProducts(page) {
    showSkeletons();
    try {
      const res  = await fetch(`${API_PRODUCTS}?page=${page}`);
      if (!res.ok) { renderProductsError(); return; }
      const data = await res.json();
      renderProducts(data.results ?? []);
      renderPagination(data.count, page);
    } catch {
      renderProductsError();
    }
  }

  // ─── RENDER PRODUCTS ───
  function renderProducts(products) {
    const list = document.getElementById('productsList');
    if (!list) return;

    if (!products.length) {
      list.innerHTML = '<div class="products-empty">В этой категории пока нет товаров</div>';
      return;
    }

    list.innerHTML = products.map((p, i) => {
      const offset = (currentPage - 1) * 10 + i + 1;

      const imgHtml = p.preview_image
        ? `<img src="${p.preview_image}" alt="${escapeHtml(p.name)}" class="product-card-img" loading="lazy">`
        : `<div class="product-card-no-img">
             <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" width="40" height="40">
               <rect x="3" y="6" width="42" height="30" rx="3"/>
               <path d="M15 36l3-9 6 6 6-12 6 15"/>
               <circle cx="16" cy="18" r="4"/>
             </svg>
           </div>`;

      const stock = p.in_stock
        ? '<span class="product-badge product-badge--in">В наличии</span>'
        : '<span class="product-badge product-badge--out">Под заказ</span>';

      const priceHtml = p.price
        ? `<div class="product-card-price">${formatPrice(p.price)}<sup>₽</sup></div>`
        : `<div class="product-card-price product-card-price--request">Цена по запросу</div>`;

      return `
        <a href="/catalog/${SLUG}/${p.slug}/" class="product-card">
          <span class="product-card-index">${String(offset).padStart(2, '0')}</span>
          <div class="product-card-img-wrap">${imgHtml}</div>
          <div class="product-card-body">
            <div class="product-card-top">${stock}</div>
            <div class="product-card-name">${escapeHtml(p.name)}</div>
            ${p.slug ? `<div class="product-card-meta">Арт. ${escapeHtml(p.slug.toUpperCase())}</div>` : ''}
            <div class="product-card-footer">
              ${priceHtml}
              <div class="product-card-actions">
                <button class="product-card-btn"
                  data-cart-slug="${escapeHtml(p.slug)}"
                  data-cart-name="${escapeHtml(p.name)}"
                  data-cart-price="${p.price || 0}"
                  data-cart-image="${p.preview_image ? escapeHtml(p.preview_image) : ''}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  <span>В корзину</span>
                </button>
              </div>
            </div>
          </div>
        </a>`;
    }).join('');
  }

  // ─── PAGINATION ───
  function renderPagination(totalCount, page) {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(totalCount / 10);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    const range = getPageRange(page, totalPages);

    container.innerHTML = `
      <button class="page-btn page-btn--arrow" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      ${range.map(p =>
        p === '...'
          ? `<span class="page-dots">…</span>`
          : `<button class="page-btn ${p === page ? 'page-btn--active' : ''}" data-page="${p}">${p}</button>`
      ).join('')}
      <button class="page-btn page-btn--arrow" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>`;

    container.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = Number(btn.dataset.page);
        fetchProducts(currentPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function getPageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
    return [1, '...', current-1, current, current+1, '...', total];
  }

  // ─── SIDEBAR ───
  async function fetchCategories() {
    try {
      const res  = await fetch(API_CATS);
      if (!res.ok) return;
      const data = await res.json();
      const cats = Array.isArray(data) ? data : (data.results ?? []);
      renderSidebar(cats);
      renderNavDropdown(cats);
    } catch { /* необязателен */ }
  }

  function renderSidebar(categories) {
    const list = document.getElementById('sidebarList');
    if (!list) return;
    list.innerHTML = categories.map((cat, i) => {
      const href     = `/catalog/${cat.slug}/`;
      const isActive = cat.slug === SLUG;
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

  function renderNavDropdown(categories) {
    const list = document.getElementById('navDropdownList');
    if (!list) return;
    list.innerHTML = categories.map(cat =>
      `<li><a href="/catalog/${cat.slug}/">${escapeHtml(cat.name)}</a></li>`
    ).join('');
  }

  // ─── SKELETON ───
  function showSkeletons() {
    const list = document.getElementById('productsList');
    if (!list) return;
    list.innerHTML = Array(10).fill('<div class="product-skeleton"></div>').join('');
  }

  function renderProductsError() {
    const list = document.getElementById('productsList');
    if (list) list.innerHTML = '<div class="products-empty">Не удалось загрузить товары. Попробуйте обновить страницу.</div>';
  }

  // ─── SEARCH ───
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.replaceWith(searchBtn.cloneNode(true));
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
  }
  document.getElementById('searchInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
  });
  function handleSearch() {
    const q = document.getElementById('searchInput')?.value.trim();
    if (q) window.location.href = `/catalog/?q=${encodeURIComponent(q)}`;
  }

  // ─── MOBILE SIDEBAR ───
  const catMobileBtn = document.getElementById('catMobileBtn');
  const catSidebar   = document.getElementById('catSidebar');
  catMobileBtn?.addEventListener('click', () => {
    const isOpen = catSidebar.classList.toggle('open');
    const arrow  = catMobileBtn.querySelector('svg');
    if (arrow) { arrow.style.transform = isOpen ? 'rotate(180deg)' : ''; arrow.style.transition = 'transform 0.2s'; }
  });

  // ─── UTILS ───
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function formatPrice(price) {
    return Number(price).toLocaleString('ru-RU');
  }

})();