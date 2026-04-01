(function () {
  'use strict';

  const PRODUCT_SLUG  = window.PRODUCT_SLUG;
  const CATEGORY_SLUG = window.CATEGORY_SLUG;
  const API_URL       = `/api/products/${PRODUCT_SLUG}/`;
  const API_CATS      = '/api/categories/';

  fetchCategories();
  fetchProduct();

  // ─── FETCH PRODUCT ───
  async function fetchProduct() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) { renderError(); return; }
      const product = await res.json();
      renderProduct(product);
    } catch {
      renderError();
    }
  }

  // ─── RENDER PRODUCT ───
  function renderProduct(p) {
    const inner = document.getElementById('productInner');
    if (!inner) return;

    const images  = p.images ?? [];
    const hasImgs = images.length > 0;

    const stock = p.in_stock
      ? '<span class="product-badge product-badge--in">В наличии</span>'
      : '<span class="product-badge product-badge--out">Под заказ</span>';

    const priceHtml = p.price
      ? `<div class="pd-price">${formatPrice(p.price)}<sup>₽</sup></div>`
      : `<div class="pd-price pd-price--request">Цена по запросу</div>`;

    // Галерея
    const galleryHtml = hasImgs
      ? `<div class="pd-gallery">
           <div class="pd-gallery-main">
             <img src="${images[0].url}" alt="${escapeHtml(p.name)}" class="pd-gallery-main-img" id="galleryMain">
           </div>
           ${images.length > 1 ? `
           <div class="pd-gallery-thumbs" id="galleryThumbs">
             ${images.map((img, i) => `
               <button class="pd-thumb ${i === 0 ? 'pd-thumb--active' : ''}" data-src="${img.url}" data-index="${i}">
                 <img src="${img.url}" alt="${escapeHtml(p.name)} фото ${i+1}">
               </button>`).join('')}
           </div>` : ''}
         </div>`
      : `<div class="pd-gallery pd-gallery--empty">
           <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1" width="64" height="64">
             <rect x="4" y="10" width="72" height="52" rx="4"/>
             <path d="M28 62l6-18 10 10 10-20 10 28"/>
             <circle cx="26" cy="30" r="7"/>
           </svg>
         </div>`;

    inner.innerHTML = `
      ${galleryHtml}
      <div class="pd-info">

        <div class="pd-info-top">
          ${stock}
          <span class="pd-sku">Арт. ${escapeHtml(p.slug.toUpperCase())}</span>
        </div>

        <h1 class="pd-name">${escapeHtml(p.name)}</h1>

        <div class="pd-price-block">
          ${priceHtml}
          <div class="pd-price-note">Цена указана с НДС</div>
        </div>

        <div class="pd-actions">
          <button class="pd-btn-primary"
            data-cart-slug="${escapeHtml(p.slug)}"
            data-cart-name="${escapeHtml(p.name)}"
            data-cart-price="${p.price || 0}"
            data-cart-image="${p.images && p.images.length ? escapeHtml(p.images[0].url) : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Добавить в корзину
          </button>
          <a href="https://wa.me/79771053011" target="_blank" class="pd-btn-wa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
            </svg>
            Спросить в WhatsApp
          </a>
        </div>

        <div class="pd-delivery">
          <div class="pd-delivery-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <rect x="1" y="3" width="15" height="13" rx="1"/>
              <path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span>Доставка по России за 48 часов</span>
          </div>
          <div class="pd-delivery-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Гарантия качества и сертификаты EAC</span>
          </div>
        </div>

        ${p.description ? `
        <div class="pd-description">
          <h2 class="pd-section-title">Описание</h2>
          <div class="pd-description-text">${p.description}</div>
        </div>` : ''}

        ${renderReviews(p.reviews ?? [])}

      </div>`;

    // Инициализация галереи
    initGallery(images);

    // Инициализация формы отзывов
    initReviewForm();
  }

  // ─── REVIEWS ───
  function renderReviews(reviews) {
    const avg      = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    const starsHtml = (rating) => Array.from({ length: 5 }, (_, i) =>
      `<svg viewBox="0 0 24 24" width="14" height="14"
        fill="${i < rating ? '#e8232a' : 'none'}"
        stroke="${i < rating ? '#e8232a' : '#55556a'}" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
       </svg>`
    ).join('');

    const listHtml = reviews.length
      ? reviews.map(r => `
          <div class="pd-review">
            <div class="pd-review-header">
              <div class="pd-review-author">${escapeHtml(r.name)}</div>
              <div class="pd-review-stars">${starsHtml(r.rating)}</div>
              <div class="pd-review-date">${formatDate(r.created_at)}</div>
            </div>
            <div class="pd-review-text">${escapeHtml(r.text)}</div>
          </div>`).join('')
      : `<div class="pd-reviews-empty">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
             <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
           </svg>
           <span>Отзывов пока нет. Будьте первым!</span>
         </div>`;

    return `
      <div class="pd-reviews" id="pdReviews">

        <div class="pd-section-header">
          <h2 class="pd-section-title">
            Отзывы
            ${reviews.length ? `<span class="pd-reviews-count-badge">${reviews.length}</span>` : ''}
          </h2>
          ${avg ? `
          <div class="pd-reviews-avg">
            <div class="pd-reviews-stars">${starsHtml(Math.round(avg))}</div>
            <span class="pd-reviews-score">${avg}</span>
          </div>` : ''}
        </div>

        <div class="pd-reviews-list" id="pdReviewsList">${listHtml}</div>

        <!-- ФОРМА ОТЗЫВА -->
        <div class="pd-review-form-wrap">
          <h3 class="pd-review-form-title">Оставить отзыв</h3>
          <form class="pd-review-form" id="pdReviewForm" novalidate>

            <div class="pd-form-row">
              <div class="pd-form-field">
                <label class="pd-form-label">Ваше имя <span>*</span></label>
                <input type="text" class="pd-form-input" id="reviewName" placeholder="Иван Иванов" maxlength="100">
              </div>
              <div class="pd-form-field">
                <label class="pd-form-label">Оценка <span>*</span></label>
                <div class="pd-star-picker" id="starPicker" data-rating="0">
                  ${[1,2,3,4,5].map(n => `
                    <button type="button" class="pd-star-btn" data-value="${n}">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#55556a" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>`).join('')}
                </div>
              </div>
            </div>

            <div class="pd-form-field">
              <label class="pd-form-label">Текст отзыва <span>*</span></label>
              <textarea class="pd-form-input pd-form-textarea" id="reviewText" placeholder="Расскажите о товаре..." rows="4" maxlength="2000"></textarea>
            </div>

            <div class="pd-form-footer">
              <div class="pd-form-error" id="reviewError"></div>
              <button type="submit" class="pd-btn-submit" id="reviewSubmit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Отправить отзыв
              </button>
            </div>

          </form>
        </div>

      </div>`;
  }

  // ─── FORM LOGIC ───
  function initReviewForm() {
    const form    = document.getElementById('pdReviewForm');
    const picker  = document.getElementById('starPicker');
    if (!form || !picker) return;

    // Звёздный пикер
    picker.querySelectorAll('.pd-star-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => highlightStars(picker, +btn.dataset.value));
      btn.addEventListener('mouseleave', () => highlightStars(picker, +picker.dataset.rating));
      btn.addEventListener('click', () => {
        picker.dataset.rating = btn.dataset.value;
        highlightStars(picker, +btn.dataset.value);
      });
    });

    // Сабмит
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name   = document.getElementById('reviewName').value.trim();
      const text   = document.getElementById('reviewText').value.trim();
      const rating = +picker.dataset.rating;
      const errEl  = document.getElementById('reviewError');
      const btn    = document.getElementById('reviewSubmit');

      errEl.textContent = '';
      errEl.style.color = '';

      if (!name)        { errEl.textContent = 'Введите имя'; return; }
      if (!rating)      { errEl.textContent = 'Выберите оценку'; return; }
      if (text.length < 5) { errEl.textContent = 'Напишите отзыв (минимум 5 символов)'; return; }

      btn.disabled    = true;
      btn.textContent = 'Отправка...';

      try {
        const res = await fetch(`/api/products/${PRODUCT_SLUG}/reviews/`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
          body:    JSON.stringify({ name, rating, text }),
        });

        if (res.ok) {
          form.reset();
          picker.dataset.rating = '0';
          highlightStars(picker, 0);
          btn.innerHTML = '✓ Отзыв отправлен';
          btn.style.background = '#22c55e';

          // Показать сообщение о модерации
          errEl.style.color = '#22c55e';
          errEl.textContent = 'Спасибо! Ваш отзыв отправлен на модерацию и появится после проверки.';

          setTimeout(() => {
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Отправить отзыв`;
            btn.style.background = '';
            btn.disabled = false;
            errEl.style.color = '';
            errEl.textContent = '';
          }, 4000);
        } else {
          const data = await res.json().catch(() => ({}));
          errEl.textContent = data.error || 'Ошибка отправки. Попробуйте снова.';
          btn.disabled = false;
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Отправить отзыв`;
        }
      } catch {
        errEl.textContent = 'Ошибка сети. Проверьте подключение.';
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Отправить отзыв`;
      }
    });
  }

  function highlightStars(picker, rating) {
    picker.querySelectorAll('.pd-star-btn svg').forEach((svg, i) => {
      const active = i < rating;
      svg.setAttribute('fill',   active ? '#e8232a' : 'none');
      svg.setAttribute('stroke', active ? '#e8232a' : '#55556a');
    });
  }

  function getCsrfToken() {
    return document.cookie.split(';')
      .find(c => c.trim().startsWith('csrftoken='))
      ?.split('=')[1] ?? '';
  }

  // ─── GALLERY ───
  function initGallery(images) {
    if (images.length <= 1) return;

    const mainImg = document.getElementById('galleryMain');
    const thumbs  = document.querySelectorAll('.pd-thumb');

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('pd-thumb--active'));
        thumb.classList.add('pd-thumb--active');
        mainImg.style.opacity = '0';
        mainImg.style.transform = 'scale(0.97)';
        setTimeout(() => {
          mainImg.src = thumb.dataset.src;
          mainImg.style.opacity = '1';
          mainImg.style.transform = 'scale(1)';
        }, 180);
      });
    });
  }

  // ─── ERROR ───
  function renderError() {
    const inner = document.getElementById('productInner');
    if (inner) inner.innerHTML = '<div class="product-error">Товар не найден или произошла ошибка загрузки.</div>';
  }

  // ─── SIDEBAR (nav dropdown) ───
  async function fetchCategories() {
    try {
      const res  = await fetch(API_CATS);
      if (!res.ok) return;
      const data = await res.json();
      const cats = Array.isArray(data) ? data : (data.results ?? []);
      const list = document.getElementById('navDropdownList');
      if (list) {
        list.innerHTML = cats.map(cat =>
          `<li><a href="/catalog/${cat.slug}/">${escapeHtml(cat.name)}</a></li>`
        ).join('');
      }
    } catch { /* необязателен */ }
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

  // ─── UTILS ───
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function formatPrice(price) {
    return Number(price).toLocaleString('ru-RU');
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

})();