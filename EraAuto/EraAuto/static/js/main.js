// ─── CART BADGE (обновляется из cart.js) ───
// updateCartBadge вызывается автоматически при загрузке cart.js

// ─── SEARCH ───
const searchInput = document.querySelector('.search-wrap input');
const searchBtn   = document.querySelector('.search-btn');

function handleSearch() {
  const query = searchInput?.value.trim();
  if (query) {
    window.location.href = `/catalog/?q=${encodeURIComponent(query)}`;
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

// ─── CALLBACK BTN (заказать звонок → скролл к форме) ───
const ctaBtn = document.querySelector('.cta-btn');
if (ctaBtn) {
  ctaBtn.addEventListener('click', () => {
    const target = document.getElementById('callback');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
}

// ─── CATALOG BTN (дропдаун) ───
const catalogBtn      = document.getElementById('catalogBtn');
const catalogDropdown = document.getElementById('catalogDropdown');

if (catalogBtn && catalogDropdown) {
  catalogBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    catalogDropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    // Не закрывать если кликнули на cart-btn
    if (e.target.closest('.cart-btn')) return;
    catalogDropdown.classList.remove('open');
  });
}

// ─── CART BTN — открытие drawer ───
document.addEventListener('click', function (e) {
  const cartBtn = e.target.closest('.cart-btn');
  if (!cartBtn) return;
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
});

// ─── STICKY HEADER SHADOW ───
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (header) {
    header.style.boxShadow = window.scrollY > 10
      ? '0 4px 32px rgba(0,0,0,0.5)'
      : 'none';
  }
});

// ─── HERO SLIDER ───
(function () {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length <= 1) return;
  let current = 0;

  function goTo(index) {
    slides[current].classList.remove('active');
    slides[current].classList.add('exit');
    setTimeout(() => slides[current].classList.remove('exit'), 800);
    current = index;
    slides[current].classList.add('active');
  }

  setInterval(() => goTo((current + 1) % slides.length), 3500);
})();

// ─── CALLBACK FORM ───
(function () {
  const form    = document.getElementById('callbackForm');
  const success = document.getElementById('cbSuccess');
  if (!form) return;

  const phoneInput = document.getElementById('cbPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let f = '+7';
      if (v.length > 1) f += ' (' + v.slice(1, 4);
      if (v.length >= 4) f += ') ' + v.slice(4, 7);
      if (v.length >= 7) f += '-' + v.slice(7, 9);
      if (v.length >= 9) f += '-' + v.slice(9, 11);
      e.target.value = f;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name    = document.getElementById('cbName').value.trim();
    const phone   = document.getElementById('cbPhone').value.trim();
    const message = document.getElementById('cbMessage').value.trim();
    const errEl   = document.getElementById('cbError');
    const btn     = document.getElementById('cbSubmit');

    errEl.textContent = '';
    if (!name)             { errEl.textContent = 'Введите ваше имя'; return; }
    if (phone.length < 16) { errEl.textContent = 'Введите корректный номер телефона'; return; }

    btn.disabled    = true;
    btn.textContent = 'Отправка...';

    try {
      const res = await fetch('/api/callback/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrf() },
        body:    JSON.stringify({ name, phone, message }),
      });

      if (res.ok || res.status === 201) {
        form.style.display = 'none';
        success?.classList.add('show');
      } else {
        const data = await res.json().catch(() => ({}));
        errEl.textContent = data.error || 'Ошибка отправки. Попробуйте снова.';
        btn.disabled = false;
        btn.textContent = 'Заказать звонок';
      }
    } catch {
      errEl.textContent = 'Ошибка сети. Попробуйте позже.';
      btn.disabled = false;
      btn.textContent = 'Заказать звонок';
    }
  });

  function getCsrf() {
    return document.cookie.split(';')
      .find(c => c.trim().startsWith('csrftoken='))
      ?.split('=')[1] ?? '';
  }
})();