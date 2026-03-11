// ─── CART ───
let cartCount = 0;

function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) badge.textContent = cartCount;
}

// ─── SEARCH ───
const searchInput = document.querySelector('.search-wrap input');
const searchBtn = document.querySelector('.search-btn');

function handleSearch() {
  const query = searchInput.value.trim();
  if (query) {
    console.log('Поиск:', query);
    // TODO: подключить к Django URL, например: window.location.href = `/search/?q=${encodeURIComponent(query)}`;
  }
}

if (searchBtn) {
  searchBtn.addEventListener('click', handleSearch);
}

if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
}

// ─── CALLBACK BTN ───
const ctaBtn = document.querySelector('.cta-btn');
if (ctaBtn) {
  ctaBtn.addEventListener('click', () => {
    const target = document.getElementById('callback');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.log('Открыть модалку заказа звонка');
      // TODO: открыть модальное окно
    }
  });
}

// ─── CATALOG BTN ───
const catalogBtn = document.getElementById('catalogBtn');
const catalogDropdown = document.getElementById('catalogDropdown');

if (catalogBtn && catalogDropdown) {
  catalogBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    catalogDropdown.classList.toggle('open');
  });

  // Закрыть при клике вне меню
  document.addEventListener('click', () => {
    catalogDropdown.classList.remove('open');
  });
}

// ─── STICKY HEADER SHADOW ───
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (header) {
    if (window.scrollY > 10) {
      header.style.boxShadow = '0 4px 32px rgba(0,0,0,0.5)';
    } else {
      header.style.boxShadow = 'none';
    }
  }
});
// ─── HERO SLIDER ───
(function() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length <= 1) return;
  let current = 0;

  function goTo(index) {
    const prev = current;
    slides[prev].classList.remove('active');
    slides[prev].classList.add('exit');
    setTimeout(() => slides[prev].classList.remove('exit'), 800);
    current = index;
    slides[current].classList.add('active');
  }

  setInterval(() => goTo((current + 1) % slides.length), 3500);
})();