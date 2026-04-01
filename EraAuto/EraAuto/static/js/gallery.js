(function () {
  'use strict';

  const API_URL  = '/api/gallery/';
  const API_CATS = '/api/categories/';

  let galleryImages = [];
  let currentIndex  = 0;

  fetchCategories();
  fetchGallery();

  // ─── FETCH GALLERY ───
  async function fetchGallery() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) { renderEmpty(); return; }
      const data = await res.json();
      galleryImages = Array.isArray(data) ? data : (data.results ?? []);
      if (galleryImages.length === 0) {
        renderEmpty();
      } else {
        renderGallery(galleryImages);
      }
    } catch {
      renderEmpty();
    }
  }

  // ─── RENDER GALLERY ───
  function renderGallery(images) {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = images.map((img, i) => `
      <div class="gallery-item" data-index="${i}">
        <img src="${img.url}" alt="${escapeHtml(img.title || '')}" loading="lazy">
        <div class="gallery-item-overlay">
          ${img.title ? `<div class="gallery-item-title">${escapeHtml(img.title)}</div>` : ''}
        </div>
        <div class="gallery-item-zoom">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
      </div>
    `).join('');

    // Click handlers
    grid.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        openLightbox(+item.dataset.index);
      });
    });
  }

  // ─── EMPTY STATE ───
  function renderEmpty() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = `
      <div class="gallery-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="56" height="56">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p>Фотографии скоро появятся</p>
      </div>`;
  }

  // ─── LIGHTBOX ───
  const lightbox       = document.getElementById('lightbox');
  const lightboxImg    = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const btnClose       = document.getElementById('lightboxClose');
  const btnPrev        = document.getElementById('lightboxPrev');
  const btnNext        = document.getElementById('lightboxNext');

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    const img = galleryImages[currentIndex];
    if (!img) return;
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = img.url;
      lightboxImg.alt = img.title || '';
      lightboxCaption.textContent = img.title || '';
      lightboxCounter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
      lightboxImg.style.opacity = '1';
    }, 150);
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    updateLightbox();
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % galleryImages.length;
    updateLightbox();
  }

  if (btnClose) btnClose.addEventListener('click', closeLightbox);
  if (btnPrev)  btnPrev.addEventListener('click', prevImage);
  if (btnNext)  btnNext.addEventListener('click', nextImage);

  // Click outside image closes lightbox
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
        closeLightbox();
      }
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });

  // Touch swipe support
  let touchStartX = 0;
  if (lightbox) {
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? prevImage() : nextImage();
      }
    }, { passive: true });
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
    } catch { /* ignore */ }
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
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})();