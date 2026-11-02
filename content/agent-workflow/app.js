(() => {
  'use strict';
  const { pages, sources } = window.WORKFLOW_DOCS;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const article = $('article');
  let page, observer, selected = 0, toastTimer, markdownURL;
  const nav = $('document-nav');
  for (const group of [...new Set(pages.map(p => p.group))]) {
    const items = pages.filter(p => p.group === group);
    nav.insertAdjacentHTML('beforeend', `<section class="nav-group"><h2>${esc(group)}</h2>${items.map(p => `<a href="#${p.id}"><span>${String(pages.indexOf(p)+1).padStart(2,'0')}</span>${esc(p.title)}</a>`).join('')}</section>`);
  }
  function toast(text) {
    $('toast').textContent = text;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2100);
  }
  async function copy(text) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement('textarea');
      field.value = text; field.style.cssText = 'position:fixed;opacity:0';
      document.body.append(field); field.select();
      const done = document.execCommand('copy'); field.remove();
      if (!done) { toast('复制未完成，请下载 Markdown 文件'); return; }
    }
    toast('已复制');
  }
  function closeMenu() {
    $('sidebar').classList.remove('open');
    $('menu-toggle').setAttribute('aria-expanded','false');
    $('menu-backdrop').hidden = true;
    document.body.style.overflow = '';
  }
  function render() {
    const [id, section] = location.hash.slice(1).split('/');
    const next = pages.find(p => p.id === id) || pages[0];
    const changed = page?.id !== next.id;
    page = next;
    if (changed) {
      observer?.disconnect();
      article.innerHTML = page.html;
      document.title = `${page.title} · Agent Workflow`;
      $('breadcrumb').textContent = `${page.group} / ${page.title}`;
      $('mobile-title').textContent = page.title;
      $('md-file').href = page.file;
      // Portable HTML can download its Markdown without an adjacent docs directory.
      if (location.pathname.endsWith('preview.html')) {
        if(markdownURL) URL.revokeObjectURL(markdownURL);
        markdownURL = URL.createObjectURL(new Blob([page.markdown],{type:'text/markdown;charset=utf-8'}));
        $('md-file').href = markdownURL;
      }
      $('md-file').download = page.file.split('/').pop();
      nav.querySelectorAll('a').forEach(a => {
        if (a.hash === '#'+page.id) a.setAttribute('aria-current','page');
        else a.removeAttribute('aria-current');
      });
      $('toc').innerHTML = page.headings.map(h => `<a href="#${page.id}/${h.id}">${esc(h.title)}</a>`).join('');
      $('source-count').textContent = page.sources.length;
      $('related-sources').innerHTML = page.sources.map(path => `<button data-source="${esc(path)}" title="${esc(path)}">${esc(sources[path].name)}</button>`).join('');
      const index = pages.indexOf(page);
      const prev = pages[index-1], after = pages[index+1];
      $('page-pagination').innerHTML = (prev ? `<a href="#${prev.id}"><small>← 上一篇</small>${esc(prev.title)}</a>` : '') + (after ? `<a class="next" href="#${after.id}"><small>下一篇 →</small>${esc(after.title)}</a>` : '');
      const headingNodes = article.querySelectorAll('h2');
      observer = new IntersectionObserver(entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a,b) => a.boundingClientRect.top-b.boundingClientRect.top);
        if (visible.length) activateHeading(visible[0].target.id);
      },{rootMargin:'-110px 0px -55% 0px',threshold:0});
      headingNodes.forEach(h => observer.observe(h));
      activateHeading(page.headings[0]?.id);
    }
    closeMenu();
    if (section && article.querySelector('#'+CSS.escape(section))) {
      article.querySelector('#'+CSS.escape(section)).scrollIntoView();
      activateHeading(section);
    } else if (changed) window.scrollTo(0,0);
  }
  function activateHeading(id) {
    $('toc').querySelectorAll('a').forEach(a => {
      if(a.hash.endsWith('/'+id)) a.setAttribute('aria-current','location');
      else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', render);
  nav.addEventListener('click', e => {
    const link = e.target.closest('a');
    if(link) {closeMenu(); if(link.hash === location.hash) window.scrollTo(0,0);}
  });
  document.querySelector('.skip-link').addEventListener('click', e => {e.preventDefault(); article.focus(); article.scrollIntoView();});
  $('menu-toggle').addEventListener('click', () => {
    const open = !$('sidebar').classList.contains('open');
    $('sidebar').classList.toggle('open',open);
    $('menu-toggle').setAttribute('aria-expanded',String(open));
    $('menu-backdrop').hidden = !open;
    document.body.style.overflow = open?'hidden':'';
  });
  $('menu-backdrop').addEventListener('click',closeMenu);
  window.addEventListener('resize', () => {if(innerWidth > 760) closeMenu();});
  $('theme-toggle').addEventListener('click', () => {
    const dark = getComputedStyle(document.documentElement).colorScheme === 'dark';
    const theme = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try {localStorage.setItem('workflow-reader-theme',theme);} catch {}
    updateThemeLabel();
  });
  function updateThemeLabel() {
    const dark = getComputedStyle(document.documentElement).colorScheme === 'dark';
    $('theme-toggle').setAttribute('aria-label',dark?'切换为浅色':'切换为深色');
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',updateThemeLabel);
  $('copy-md').addEventListener('click', () => copy(page.markdown));
  article.addEventListener('click', e => {
    const b = e.target.closest('.copy-code');
    if (b) copy(b.closest('.code-block').querySelector('code').textContent);
  });
  const sourceDialog = $('source-dialog');
  $('related-sources').addEventListener('click', e => {
    const button = e.target.closest('[data-source]');
    if (!button) return;
    const source = sources[button.dataset.source];
    $('source-title').textContent = source.name;
    $('source-path').textContent = source.path + ` · L${source.start}–L${source.end}`;
    $('source-code').innerHTML = source.code.split('\n').map((line,i) => `<span class="source-line"><span>${source.start+i}</span>${esc(line)}</span>`).join('');
    $('source-external').href = source.url;
    sourceDialog.showModal();
  });
  const searchDialog = $('search-dialog');
  function results() {
    const q = $('search-input').value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const found = pages.filter(p => terms.every(term => (p.title+' '+p.markdown).toLowerCase().includes(term)));
    selected = 0;
    $('search-results').innerHTML = found.length ? found.map(p => {
      const plain = p.markdown.replace(/[#`*|]/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\s+/g,' ');
      const at = q ? Math.max(0,plain.toLowerCase().indexOf(terms[0])-25) : 0;
      return `<a class="search-result" href="#${p.id}" aria-selected="false"><strong>${esc(p.title)}</strong><p>${at?'…':''}${esc(plain.slice(at,at+110))}…</p></a>`;
    }).join('') : '<p class="empty-result">没有找到相关文档。试试「证据」「Gate」或「升级」。</p>';
    highlightResult();
  }
  function highlightResult() {
    $('search-results').querySelectorAll('a').forEach((a,i) => a.setAttribute('aria-selected',String(i === selected)));
  }
  function openSearch() {results(); searchDialog.showModal(); $('search-input').focus();}
  $('search-open').addEventListener('click',openSearch);
  $('search-input').addEventListener('input',results);
  $('search-input').addEventListener('keydown',e => {
    const items = [...$('search-results').querySelectorAll('a')];
    if(!items.length) return;
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); selected = (selected+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;
      highlightResult(); items[selected].scrollIntoView({block:'nearest'});
    }
    if(e.key === 'Enter') {e.preventDefault(); items[selected].click();}
  });
  $('search-results').addEventListener('click',e => {
    if(e.target.closest('a')) {searchDialog.close(); if(e.target.closest('a').hash === location.hash) window.scrollTo(0,0);}
  });
  document.addEventListener('keydown',e => {
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k') {e.preventDefault(); if(!searchDialog.open) openSearch();}
    if(e.key === 'Escape') closeMenu();
  });
  for(const dialog of [searchDialog,sourceDialog]) {
    dialog.querySelector('.dialog-close').addEventListener('click',() => dialog.close());
    dialog.addEventListener('click',e => {if(e.target===dialog) {const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close();}});
  }
  render(); updateThemeLabel();
})();
