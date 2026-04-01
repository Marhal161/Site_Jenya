/* ═══ KNOWLEDGE BASE ═══ */

(function () {
  const listEl      = document.getElementById('kbList');
  const searchInput = document.getElementById('kbSearch');
  const catSelect   = document.getElementById('kbCategory');

  let allProducts = [];

  // Иконки по расширению файла
  const extIcon = {
    pdf:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    docx: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    doc:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    xlsx: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
    xls:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  };

  const extColor = {
    pdf: '#dc2626', docx: '#1d4ed8', doc: '#1d4ed8',
    xlsx: '#16a34a', xls: '#16a34a',
  };

  function getIcon(ext) {
    return extIcon[ext] || extIcon.docx;
  }

  // Загрузка данных
  async function load() {
    try {
      const res = await fetch('/api/knowledge/');
      allProducts = await res.json();
      fillCategories();
      render();
    } catch (e) {
      listEl.innerHTML = `<div class="kb-error">Не удалось загрузить документы</div>`;
    }
  }

  // Заполнение фильтра категорий
  function fillCategories() {
    const cats = {};
    allProducts.forEach(p => { cats[p.category_slug] = p.category; });
    Object.entries(cats).forEach(([slug, name]) => {
      const opt = document.createElement('option');
      opt.value = slug;
      opt.textContent = name;
      catSelect.appendChild(opt);
    });
  }

  // Фильтрация
  function filtered() {
    const q    = searchInput.value.trim().toLowerCase();
    const cat  = catSelect.value;
    return allProducts.filter(p => {
      const matchQ   = !q   || p.name.toLowerCase().includes(q);
      const matchCat = !cat || p.category_slug === cat;
      return matchQ && matchCat;
    });
  }

  // Рендер
  function render() {
    const products = filtered();
    if (!products.length) {
      listEl.innerHTML = `
        <div class="kb-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>Документы не найдены</p>
        </div>`;
      return;
    }

    listEl.innerHTML = products.map(product => `
      <div class="kb-product-card">
        <div class="kb-product-header">
          <div class="kb-product-name">
            <a href="/catalog/${product.category_slug}/${product.slug}/">${product.name}</a>
          </div>
          <div class="kb-product-cat">${product.category}</div>
          <div class="kb-product-count">${product.documents.length} ${docWord(product.documents.length)}</div>
        </div>
        <div class="kb-docs-grid">
          ${product.documents.map(doc => `
            <a href="${doc.url}" target="_blank" class="kb-doc-item kb-doc--${doc.extension}" download>
              <div class="kb-doc-icon" style="color:${extColor[doc.extension] || '#6b7280'}">
                ${getIcon(doc.extension)}
              </div>
              <div class="kb-doc-info">
                <div class="kb-doc-title">${doc.title}</div>
                <div class="kb-doc-meta">
                  <span class="kb-doc-type">${doc.doc_type_label}</span>
                  <span class="kb-doc-ext">${doc.extension.toUpperCase()}</span>
                </div>
              </div>
              <div class="kb-doc-download">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  function docWord(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'документ';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'документа';
    return 'документов';
  }

  // События
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 250);
  });
  catSelect.addEventListener('change', render);

  load();
})();