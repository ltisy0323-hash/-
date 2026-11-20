/* OLIVE — 쇼핑몰 앱 (바닐라 JS, 해시 라우팅, localStorage 상태) */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('olive_' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('olive_' + k, JSON.stringify(v)); } catch { } }
};
const state = { cart: store.get('cart', []), wish: store.get('wish', []), user: store.get('user', null) };
const byId = id => PRODUCTS.find(p => p.id === +id);
const ICON = {
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>',
  zoom: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5"/></svg>',
  bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
};
const FREE_SHIP = 50000, SHIP_FEE = 3000;

/* ---------- 공통 UI ---------- */
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400);
}
function saveState() {
  store.set('cart', state.cart); store.set('wish', state.wish); store.set('user', state.user);
  const cc = state.cart.reduce((a, b) => a + b.qty, 0);
  const cEl = $('#cartCnt'); cEl.textContent = cc; cEl.classList.toggle('on', cc > 0);
  const wEl = $('#wishCnt'); wEl.textContent = state.wish.length; wEl.classList.toggle('on', state.wish.length > 0);
  $('#loginBtn').setAttribute('aria-label', state.user ? state.user.name + ' 님' : '로그인');
  $('#loginBtn').style.color = state.user ? 'var(--khaki)' : '';
}
function toggleWish(id) {
  id = +id; const i = state.wish.indexOf(id);
  if (i > -1) { state.wish.splice(i, 1); toast('관심 상품에서 삭제했습니다.'); }
  else { state.wish.push(id); toast('관심 상품에 저장했습니다.'); }
  saveState();
  $$(`[data-act="wish"][data-id="${id}"]`).forEach(b => {
    b.classList.toggle('on', state.wish.includes(id));
    const l = b.querySelector('.wl'); if (l) l.textContent = state.wish.includes(id) ? 'SAVED' : 'WISH';
  });
  if (route().name === 'wish') render();
}

/* 오버레이 관리 */
function closeAll() {
  ['cartDrawer', 'menuDrawer'].forEach(i => { $('#' + i).classList.remove('on'); $('#' + i).setAttribute('aria-hidden', 'true'); });
  $('#scrim').classList.remove('on'); $('#searchOv').classList.remove('on');
  $('#modal').classList.remove('on'); $('#modal').setAttribute('aria-hidden', 'true');
  closeLightbox(); document.body.style.overflow = '';
}
function openDrawer(id) {
  closeAll(); const d = $('#' + id); d.classList.add('on'); d.setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('on'); document.body.style.overflow = 'hidden';
}
function openModal(html) {
  closeAll(); const m = $('#modal');
  m.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button class="icon-btn x" data-act="close-all" aria-label="닫기">${ICON.x}</button>${html}</div>`;
  m.classList.add('on'); m.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  const f = m.querySelector('input'); if (f) setTimeout(() => f.focus(), 120);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeAll(); });

/* ---------- 가격/카드 ---------- */
function priceHTML(p) {
  return p.sale
    ? `<div class="pprice"><s>${won(p.price)}</s><b>${won(salePrice(p))}</b><span class="pct">${p.sale}%</span></div>`
    : `<div class="pprice"><b>${won(p.price)}</b></div>`;
}
const wishBtn = id => { const on = state.wish.includes(id); return `<button class="wish ${on ? 'on' : ''}" data-act="wish" data-id="${id}" aria-label="관심상품 등록">${ICON.heart}<span class="wl">${on ? 'SAVED' : 'WISH'}</span></button>`; };
const dotsHTML = p => `<div class="dots" aria-label="컬러 ${p.colors.map(c => c.name).join(', ')}">${p.colors.map(c => `<i title="${c.name}" style="background:${c.hex}"></i>`).join('')}</div>`;

function card(p, o = {}) {
  const href = `#/product/${p.id}`;
  return `<article class="pcard">
    ${o.rank ? `<div class="rank">BEST ${String(o.rank).padStart(2, '0')}<small>${p.cat}</small></div>` : ''}
    <a class="pimg" href="${href}" aria-label="${esc(p.name)} 상세보기">
      <img src="${art(p, 0)}" alt="${esc(p.name)} 착용 이미지" loading="lazy"><img src="${art(p, 2)}" alt="" loading="lazy">
      ${p.isNew && !o.rank ? '<span class="badge">NEW</span>' : ''}
      ${o.rank ? `<div class="quick"><p>${esc(p.desc)}</p><span>${esc(p.material[0])}</span><em>VIEW DETAIL →</em></div>` : ''}
    </a>
    <div class="pinfo">
      <a class="pname" href="${href}">${esc(p.name)}</a>
      ${priceHTML(p)}
      <div class="pbot">${dotsHTML(p)}${wishBtn(p.id)}</div>
    </div></article>`;
}
const skeleton = (n = 8) => `<div class="wrap page"><div class="grid skel" style="padding:80px 0">${Array(n).fill('<div><div class="pimg"></div><i class="l"></i><i class="l"></i></div>').join('')}</div></div>`;

/* ---------- 헤더 / 메가메뉴 / 모바일 메뉴 ---------- */
function buildNav() {
  const nav = $('#nav');
  const catKeys = Object.keys(CATS);
  nav.innerHTML = `<li><a href="#/new" data-r="new">NEW</a></li><li><a href="#/best" data-r="best">BEST</a></li>` +
    catKeys.map(k => `<li data-mega="${k}"><a href="#/shop/${CATS[k].key}" data-r="shop-${CATS[k].key}">${k}</a></li>`).join('') +
    `<li data-mega="ABOUT"><a href="#/about" data-r="about">ABOUT</a></li>`;
  let mh = '';
  catKeys.forEach(k => {
    const c = CATS[k];
    const feat = PRODUCTS.filter(p => p.cat === k).sort((a, b) => b.pop - a.pop).slice(0, 4);
    mh += `<div class="mega" data-m="${k}"><div class="mega-in"><div><h5>${k}</h5><p class="blurb">${c.blurb}</p><ul>
      <li><a href="#/shop/${c.key}">전체보기</a></li>${c.subs.map(s => `<li><a href="#/shop/${c.key}?sub=${encodeURIComponent(s)}">${s}</a></li>`).join('')}</ul></div>
      <div class="mega-feat">${feat.map(p => `<a href="#/product/${p.id}"><div class="im"><img src="${art(p, 0)}" alt="" loading="lazy"></div><p>${esc(p.name)}</p><small>${won(salePrice(p))}</small></a>`).join('')}</div></div></div>`;
  });
  mh += `<div class="mega" data-m="ABOUT"><div class="mega-in"><div><h5>About</h5><p class="blurb">OLIVE의 이야기</p><ul>
    <li><a href="#/about">Brand Story</a></li>${EDITORIALS.map((e, i) => `<li><a href="#/editorial/${i}">${e.title}</a></li>`).join('')}</ul></div>
    <div class="mega-feat">${EDITORIALS.map((e, i) => `<a href="#/editorial/${i}"><div class="im"><img src="${scene({ w: 400, h: 500, ...e.scene })}" alt="" loading="lazy"></div><p>${e.title}</p><small>${e.ko}</small></a>`).join('')}</div></div></div>`;
  $('#megaWrap').innerHTML = mh;
  let t;
  const show = k => { clearTimeout(t); $$('.mega').forEach(m => m.classList.toggle('open', m.dataset.m === k)); };
  const hide = () => { t = setTimeout(() => $$('.mega').forEach(m => m.classList.remove('open')), 120); };
  $$('[data-mega]', nav).forEach(li => { li.addEventListener('mouseenter', () => show(li.dataset.mega)); li.addEventListener('mouseleave', hide); li.addEventListener('focusin', () => show(li.dataset.mega)); });
  $('#megaWrap').addEventListener('mouseenter', () => clearTimeout(t));
  $('#megaWrap').addEventListener('mouseleave', hide);
  nav.addEventListener('click', hide); $('#megaWrap').addEventListener('click', e => { if (e.target.closest('a')) hide(); });
  $('#hdr').addEventListener('focusout', e => { if (!e.relatedTarget || !$('#hdr').contains(e.relatedTarget)) hide(); });

  $('#menuDrawer').innerHTML = `<div class="dr-h"><h3>MENU</h3><button class="icon-btn" data-act="close-all" aria-label="닫기">${ICON.x}</button></div>
    <div class="dr-b"><ul class="menu-list"><li><a href="#/new">NEW</a></li><li><a href="#/best">BEST</a></li>
    ${catKeys.map(k => `<li><details><summary>${k}</summary><div class="sub"><a href="#/shop/${CATS[k].key}">전체보기</a>${CATS[k].subs.map(s => `<a href="#/shop/${CATS[k].key}?sub=${encodeURIComponent(s)}">${s}</a>`).join('')}</div></details></li>`).join('')}
    <li><details><summary>ABOUT</summary><div class="sub"><a href="#/about">Brand Story</a>${EDITORIALS.map((e, i) => `<a href="#/editorial/${i}">${e.title}</a>`).join('')}</div></details></li></ul>
    <p style="margin:26px 0 0;font-size:12.5px;color:var(--brown)"><a href="#/wish">관심상품</a> &nbsp;·&nbsp; <a href="#" data-act="mypage">마이페이지</a> &nbsp;·&nbsp; <a href="#" data-act="login">로그인</a></p></div>`;
}
function setActiveNav(r) {
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === r));
}

/* ---------- 검색 ---------- */
function searchProducts(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  const terms = q.split(/\s+/);
  return PRODUCTS.filter(p => {
    const hay = [p.name, p.cat, p.sub, p.desc, p.material.join(' '), p.colors.map(c => c.name).join(' '), p.isNew ? '신상 new' : ''].join(' ').toLowerCase();
    return terms.every(t => hay.includes(t));
  });
}
const POP_TAGS = ['코트', '린넨', '니트', '원피스', '슬랙스', '가방', '카키', '셔츠'];
function renderSearchSug(q) {
  const box = $('#searchSug');
  if (!q.trim()) { box.innerHTML = `<h5>POPULAR SEARCHES</h5><div class="tags">${POP_TAGS.map(t => `<a class="tag" href="#/search/${encodeURIComponent(t)}">${t}</a>`).join('')}</div>`; return; }
  const r = searchProducts(q).slice(0, 5);
  box.innerHTML = r.length
    ? `<h5>${searchProducts(q).length}개의 상품</h5><div class="sres">${r.map(p => `<a href="#/product/${p.id}"><img src="${art(p, 0)}" alt=""><div>${esc(p.name)}<small>${p.cat} · ${p.sub}</small></div><b>${won(salePrice(p))}</b></a>`).join('')}</div><p style="margin-top:18px"><a class="link" href="#/search/${encodeURIComponent(q)}">전체 결과 보기</a></p>`
    : `<h5>검색 결과 없음</h5><p style="color:var(--brown)">‘${esc(q)}’에 대한 상품을 찾지 못했습니다. 다른 검색어를 입력해 보세요.</p>`;
}
function openSearch() {
  closeAll(); $('#searchOv').classList.add('on'); document.body.style.overflow = 'hidden';
  const i = $('#searchInput'); i.value = ''; renderSearchSug(''); setTimeout(() => i.focus(), 150);
}
$('#searchInput').addEventListener('input', e => renderSearchSug(e.target.value));
$('#searchForm').addEventListener('submit', e => {
  e.preventDefault(); const q = $('#searchInput').value.trim();
  if (!q) { toast('검색어를 입력해 주세요.'); return; }
  closeAll(); location.hash = '#/search/' + encodeURIComponent(q);
});

/* ---------- 장바구니 ---------- */
const lineTotal = l => salePrice(byId(l.id)) * l.qty;
function cartTotals() {
  const items = state.cart.reduce((a, l) => a + byId(l.id).price * l.qty, 0);
  const sub = state.cart.reduce((a, l) => a + lineTotal(l), 0);
  const ship = sub === 0 || sub >= FREE_SHIP ? 0 : SHIP_FEE;
  return { items, disc: items - sub, sub, ship, total: sub + ship };
}
function cartLine(l, i, big) {
  const p = byId(l.id);
  return `<div class="ci"><a class="im" href="#/product/${p.id}" data-act="close-all"><img src="${art(p, 0)}" alt=""></a>
    <div><h4><a href="#/product/${p.id}" data-act="close-all">${esc(p.name)}</a></h4><small>${esc(l.color)} / ${esc(l.size)}</small>
    <div class="qty"><button data-act="cart-qty" data-i="${i}" data-d="-1" aria-label="수량 감소">−</button><span>${l.qty}</span><button data-act="cart-qty" data-i="${i}" data-d="1" aria-label="수량 증가">+</button></div></div>
    <button class="rm" data-act="cart-rm" data-i="${i}" aria-label="삭제">×</button><div class="pr">${won(lineTotal(l))}</div></div>`;
}
function renderCart() {
  const t = cartTotals(), empty = !state.cart.length;
  const remain = Math.max(0, FREE_SHIP - t.sub);
  $('#cartDrawer').innerHTML = `<div class="dr-h"><h3>CART <span style="font-size:15px;letter-spacing:.06em;color:var(--brown)">${state.cart.reduce((a, b) => a + b.qty, 0)}</span></h3><button class="icon-btn" data-act="close-all" aria-label="닫기">${ICON.x}</button></div>
    <div class="dr-b">${empty ? `<div class="empty" style="padding:70px 0">${ICON.bag}<h3>장바구니가 비어 있어요</h3><p>마음에 드는 상품을 담아 보세요.</p><a class="btn ghost sm" href="#/new" data-act="close-all">신상품 보러가기</a></div>` : state.cart.map((l, i) => cartLine(l, i)).join('')}</div>
    ${empty ? '' : `<div class="dr-f"><p class="free-note">${remain ? `${won(remain)} 더 담으면 무료배송` : '무료배송 혜택이 적용되었습니다'}</p><div class="free-bar"><i style="width:${Math.min(100, t.sub / FREE_SHIP * 100)}%"></i></div>
    ${t.disc ? `<div class="sum"><span>상품금액</span><span>${won(t.items)}</span></div><div class="sum"><span>할인</span><span>-${won(t.disc)}</span></div>` : ''}
    <div class="sum"><span>배송비</span><span>${t.ship ? won(t.ship) : '무료'}</span></div><div class="sum t"><span>합계</span><b>${won(t.total)}</b></div>
    <a class="btn block" style="margin-top:18px" href="#/cart" data-act="close-all">장바구니 보기</a>
    <button class="btn ghost block" style="margin-top:8px" data-act="checkout">주문하기</button></div>`}`;
}
function addToCart(id, color, size, qty) {
  const ex = state.cart.find(l => l.id === id && l.color === color && l.size === size);
  if (ex) ex.qty = Math.min(10, ex.qty + qty); else state.cart.push({ id, color, size, qty });
  saveState();
}
function openCart() { renderCart(); openDrawer('cartDrawer'); }
function checkout(lines) {
  lines = lines || state.cart;
  if (!lines.length) { toast('주문할 상품이 없습니다.'); return; }
  const sub = lines.reduce((a, l) => a + lineTotal(l), 0), ship = sub >= FREE_SHIP ? 0 : SHIP_FEE;
  openModal(`<h3>ORDER</h3><p class="sub">데모 환경입니다. 실제 결제는 이루어지지 않습니다.</p>
    ${lines.map(l => `<div class="row"><span>${esc(byId(l.id).name)}<br><small style="color:var(--brown)">${esc(l.color)} / ${esc(l.size)} · ${l.qty}개</small></span><span>${won(lineTotal(l))}</span></div>`).join('')}
    <div class="row"><span>배송비</span><span>${ship ? won(ship) : '무료'}</span></div><div class="row" style="font-weight:500;font-size:17px"><span>결제 예정 금액</span><span>${won(sub + ship)}</span></div>
    <button class="btn block" data-act="place-order" data-direct="${lines === state.cart ? 0 : 1}">결제하기 (데모)</button>`);
  window._orderLines = lines;
}
function placeOrder(direct) {
  const no = 'OL' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
  const orders = store.get('orders', []); orders.unshift({ no, n: window._orderLines.reduce((a, l) => a + l.qty, 0), at: Date.now() }); store.set('orders', orders.slice(0, 5));
  if (!+direct) state.cart = []; saveState();
  openModal(`<div class="ok">${ICON.check}</div><h3>Thank you.</h3><p class="sub">주문이 정상적으로 접수되었습니다. (데모)</p><div class="row"><span>주문번호</span><span>${no}</span></div><p class="tiny">자연스러운 하루에 OLIVE가 함께하겠습니다.</p><a class="btn block" href="#/" data-act="close-all">쇼핑 계속하기</a>`);
  if (route().name === 'cart') render();
}

/* ---------- 로그인 / 마이페이지 ---------- */
function openLogin() {
  if (state.user) return openMyPage();
  openModal(`<h3>LOGIN</h3><p class="sub">데모 환경: 아무 이메일/비밀번호로 로그인할 수 있습니다.</p>
    <form id="loginForm" novalidate><label for="le">EMAIL</label><input id="le" type="email" placeholder="olive@example.com" autocomplete="off"><label for="lp">PASSWORD</label><input id="lp" type="password" placeholder="••••••••">
    <p class="msg" id="loginMsg"></p><button class="btn block" type="submit">로그인</button></form><p class="tiny">회원가입 · 아이디/비밀번호 찾기</p>`);
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault(); const em = $('#le').value.trim(), pw = $('#lp').value, m = $('#loginMsg');
    if (!/^\S+@\S+\.\S+$/.test(em)) { m.textContent = '올바른 이메일 주소를 입력해 주세요.'; m.classList.add('on'); return; }
    if (pw.length < 1) { m.textContent = '비밀번호를 입력해 주세요.'; m.classList.add('on'); return; }
    state.user = { name: em.split('@')[0], email: em }; saveState(); closeAll(); toast(`${state.user.name} 님, 환영합니다.`);
  });
}
function openMyPage() {
  if (!state.user) { toast('로그인이 필요한 서비스입니다.'); return openLogin(); }
  const orders = store.get('orders', []);
  openModal(`<h3>MY PAGE</h3><p class="sub">${esc(state.user.name)} 님 · ${esc(state.user.email)}</p>
    <div class="row"><span>관심 상품</span><a href="#/wish" data-act="close-all"><b>${state.wish.length}</b>개</a></div><div class="row"><span>장바구니</span><a href="#/cart" data-act="close-all"><b>${state.cart.length}</b>개</a></div>
    <div class="row"><span>최근 주문</span><span>${orders.length ? orders[0].no : '내역 없음'}</span></div><div class="row"><span>적립금</span><span>3,000원</span></div>
    <button class="btn ghost block" data-act="logout">로그아웃</button>`);
}
function infoModal(t) {
  const T = {
    '이용약관': '본 약관은 OLIVE가 제공하는 온라인 쇼핑몰 서비스 이용과 관련한 권리·의무 및 책임사항을 규정합니다. (데모용 안내문)',
    '개인정보처리방침': 'OLIVE는 서비스 제공을 위해 필요한 최소한의 개인정보만을 수집하며, 관련 법령에 따라 안전하게 관리합니다. (데모용 안내문)',
    '고객센터': '대표번호 1588-0000 · help@olive-demo.example<br>평일 10:00 – 17:00 (점심 12:30 – 13:30 / 주말·공휴일 휴무)',
    '배송 안내': '결제 완료 후 평균 1–3 영업일 이내 출고됩니다. 5만원 이상 구매 시 무료배송, 미만 시 배송비 3,000원이 부과됩니다.',
    '교환·반품 안내': '상품 수령 후 7일 이내 교환·반품이 가능합니다. 착용 흔적, 세탁, 택 제거 시에는 어려운 점 양해 부탁드립니다.',
    '운영시간': '고객센터 평일 10:00 – 17:00 / 점심시간 12:30 – 13:30 / 토·일·공휴일 휴무'
  };
  openModal(`<h3 style="font-size:28px">${esc(t)}</h3><p class="sub" style="margin-top:14px;line-height:1.9">${T[t] || ''}</p><button class="btn ghost block" data-act="close-all">확인</button>`);
}

/* ---------- 라이트박스 ---------- */
let lb = { p: null, i: 0 };
function openLightbox(p, i) {
  lb = { p, i }; let el = $('#lb');
  if (!el) { el = document.createElement('div'); el.id = 'lb'; el.className = 'lb'; document.body.appendChild(el); }
  const labels = ['FRONT', 'DETAIL', 'HANGER', 'STYLING'];
  el.innerHTML = `<div class="lb-top"><span>${esc(p.name)} · ${labels[i]} ${i + 1}/4</span><button class="icon-btn" data-act="lb-close" aria-label="닫기">${ICON.x}</button></div>
    <div class="lb-stage" id="lbStage"><button class="lb-nav lb-prev" data-act="lb-nav" data-d="-1" aria-label="이전">${ICON.left}</button><img src="${art(p, i)}" alt="${esc(p.name)} 확대 이미지"><button class="lb-nav lb-next" data-act="lb-nav" data-d="1" aria-label="다음">${ICON.right}</button></div>
    <div class="lb-cap">클릭하면 확대 / 축소됩니다 · ← → 로 이동</div>`;
  el.classList.add('on'); document.body.style.overflow = 'hidden';
  const st = $('#lbStage', el), img = $('img', st);
  st.addEventListener('click', e => { if (e.target.closest('.lb-nav')) return; st.classList.toggle('z'); });
  st.addEventListener('mousemove', e => { if (!st.classList.contains('z')) return; const r = st.getBoundingClientRect(); img.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; });
}
function closeLightbox() { const el = $('#lb'); if (el && el.classList.contains('on')) { el.classList.remove('on'); document.body.style.overflow = ''; } }
document.addEventListener('keydown', e => { const el = $('#lb'); if (!el || !el.classList.contains('on')) return; if (e.key === 'ArrowRight') openLightbox(lb.p, (lb.i + 1) % 4); if (e.key === 'ArrowLeft') openLightbox(lb.p, (lb.i + 3) % 4); });

/* ---------- 페이지: 홈 ---------- */
let heroTimer, heroIdx = 0;
function pageHome() {
  const news = PRODUCTS.filter(p => p.isNew).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const best = [...PRODUCTS].sort((a, b) => b.pop - a.pop).slice(0, 8);
  const slides = [
    { dark: 0, k: 'SPRING · AUTUMN COLLECTION', h: 'OLIVE<em>A Natural Way to Dress</em>', p: '일상에 자연스럽게 스며드는 옷,<br>오래도록 입고 싶은 당신만의 스타일.', cta: ['SHOP NOW', '#/new'] },
    { dark: 0, k: 'LINEN & COTTON', h: 'Soft Linen<em>가볍게, 자연스럽게</em>', p: '바람이 지나가는 린넨의 결.<br>올리브 그린으로 완성하는 데일리 원피스.', cta: ['DRESS 보기', '#/shop/dress'] },
    { dark: 1, k: 'EDITORIAL', h: 'The Mood of Autumn<em>가을의 결을 입다</em>', p: '깊어지는 색, 포근한 질감.<br>이번 시즌 OLIVE의 스타일링을 만나보세요.', cta: ['VIEW EDITORIAL', '#/editorial/0'] }
  ];
  const html = `<div class="page">
  <section class="hero" id="hero" aria-roledescription="carousel" aria-label="메인 배너">
    ${slides.map((s, i) => `<div class="slide ${i === 0 ? 'on' : ''} ${s.dark ? 'dark' : ''}" data-i="${i}" role="group" aria-label="${i + 1} / 3"><img src="${HERO[i].src()}" style="object-position:${HERO[i].pos}" alt="OLIVE 시즌 비주얼 ${i + 1}">
      <div class="slide-txt"><span class="eyebrow">${s.k}</span>${i === 0 ? `<h1>${s.h}</h1>` : `<h2>${s.h}</h2>`}<p>${s.p}</p><div><a class="btn ${s.dark ? 'light' : ''}" href="${s.cta[1]}">${s.cta[0]}</a></div></div></div>`).join('')}
    <div class="hero-ctl"><span id="heroNo">01 / 03</span><div class="hero-bar"><i id="heroBar"></i></div>
      <div class="hero-arrows"><button data-act="hero" data-d="-1" aria-label="이전 슬라이드">${ICON.left}</button><button data-act="hero" data-d="1" aria-label="다음 슬라이드">${ICON.right}</button></div></div>
  </section>
  <div class="wrap"><div class="values"><div><b>NATURAL</b><span>자연에서 온 소재</span></div><div><b>COMFORT</b><span>하루 종일 편안한 착용감</span></div><div><b>DETAIL</b><span>섬세하게 다듬은 디테일</span></div><div><b>TIMELESS</b><span>유행을 넘는 디자인</span></div></div></div>

  <section class="sec" id="new"><div class="wrap"><div class="sec-h rv"><div><span class="k">JUST LANDED</span><h2>New <em>Arrivals</em></h2><p>이번 주 새로 입고된 OLIVE의 신상품</p></div><a class="link" href="#/new">VIEW ALL</a></div>
    <div class="grid rv">${news.map(p => card(p)).join('')}</div></div></section>

  <section class="sec beige" id="best"><div class="wrap"><div class="sec-h rv"><div><span class="k">MOST LOVED</span><h2>Best <em>Seller</em></h2><p>OLIVE 고객이 가장 사랑한 베스트 8</p></div><a class="link" href="#/best">VIEW ALL</a></div>
    <div class="grid rv">${best.map((p, i) => card(p, { rank: i + 1 })).join('')}</div></div></section>

  <section class="sec"><div class="wrap"><div class="sec-h rv"><div><span class="k">SHOP BY</span><h2>Category</h2><p>카테고리별로 OLIVE를 둘러보세요</p></div></div>
    <div class="cats rv">${Object.keys(CATS).map(k => {
      const c = CATS[k], rep = PRODUCTS.filter(p => p.cat === k).sort((a, b) => b.pop - a.pop)[0];
      const sc = { OUTER: { wall: '#D9C4A6', floor: '#B79F82', figs: [{ kind: 'coat', coat: '#B8977A', inner: '#F1EBDD', bottom: '#4A4B45' }] }, TOP: { wall: '#ECE4D3', floor: '#D3C3A6', light: 1, figs: [{ kind: 'knit', coat: '#E2D6BE', inner: '#E2D6BE', bottom: '#8A715D' }] }, BOTTOM: { wall: '#E4D9C4', floor: '#CDBB9C', light: 1, figs: [{ kind: 'knit', coat: '#FAF8F2', inner: '#FAF8F2', bottom: '#747A50' }] }, DRESS: { wall: '#E9E3CF', outdoor: 1, hills: ['#8A9068', '#747A50'], floor: '#C7B78E', figs: [{ kind: 'dress', coat: '#8E9468', inner: '#8E9468', bottom: '#8E9468' }] }, ACC: null }[k];
      const img = sc ? scene({ w: 600, h: 860, fx: .5, fs: 1.0, ...sc }) : art(PRODUCTS.find(p => p.id === 16), 3);
      return `<a class="cat" href="#/shop/${c.key}"><img src="${img}" alt="${k} 카테고리" loading="lazy"><div class="cat-t"><b>${k}</b><span>${c.subs.join(' · ')}</span><i>SHOP ${k} →</i></div></a>`;
    }).join('')}</div></div></section>

  <section class="sec beige"><div class="wrap"><div class="sec-h rv"><div><span class="k">OLIVE EDITORIAL</span><h2>Styling <em>Notes</em></h2><p>입는 방법까지 제안하는 OLIVE의 스타일 노트</p></div></div>
    <div class="edi rv">${EDITORIALS.map((e, i) => `<a href="#/editorial/${i}"><div class="im"><img src="${scene({ w: 900, h: i % 3 === 0 ? 760 : 1040, fx: .5, fs: .95, ...e.scene })}" alt="${e.title}" loading="lazy"></div><span class="no">0${i + 1}</span><h3>${e.title}</h3><p>${e.desc}</p></a>`).join('')}</div></div></section>

  <section class="about" id="about-sec"><div class="about-im"><img src="${scene({ w: 900, h: 900, wall: '#E3D6BF', floor: '#C9B592', light: 1, curtain: 1, plant: 1, fx: .55, figs: [{ kind: 'dress', coat: '#D8C8AC', inner: '#D8C8AC', bottom: '#D8C8AC', hair: '#3E2F27' }] })}" alt="OLIVE 브랜드 이미지" loading="lazy"></div>
    <div class="about-tx rv"><span class="k">ABOUT OLIVE</span><h2>Wear Your Own <em>Nature.</em></h2><p class="lead">자연스러운 아름다움은 가장 오래도록 빛납니다.</p>
      <p>OLIVE는 특별한 날뿐만 아니라 평범한 일상에서도 자신만의 분위기를 만들어 갈 수 있는 옷을 제안합니다.</p>
      <p>편안함 속에 담긴 섬세한 디테일,<br>유행을 넘어 오래도록 함께할 수 있는 디자인.</p>
      <p>당신의 일상에 자연스럽게 스며드는 스타일, OLIVE입니다.</p><a class="btn ghost" href="#/about">BRAND STORY</a></div></section></div>`;
  return { html, after: initHero };
}
function setHero(i) {
  const h = $('#hero'); if (!h) return;
  const s = $$('.slide', h); heroIdx = (i + s.length) % s.length;
  s.forEach((e, k) => e.classList.toggle('on', k === heroIdx));
  h.classList.toggle('dark-mode', s[heroIdx].classList.contains('dark'));
  $('#heroNo').textContent = `0${heroIdx + 1} / 0${s.length}`;
  const b = $('#heroBar'); b.classList.remove('run'); void b.offsetWidth; b.classList.add('run');
  clearTimeout(heroTimer); heroTimer = setTimeout(() => setHero(heroIdx + 1), 6500);
}
function initHero() {
  setHero(0); const h = $('#hero'); let sx = 0;
  h.addEventListener('mouseenter', () => { clearTimeout(heroTimer); $('#heroBar').style.animationPlayState = 'paused'; });
  h.addEventListener('mouseleave', () => { setHero(heroIdx); $('#heroBar').style.animationPlayState = ''; });
  h.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  h.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 45) setHero(heroIdx + (d < 0 ? 1 : -1)); });
}

/* ---------- 페이지: 상품 목록 ---------- */
const PAGE_SIZE = 8;
let listState = { key: '', sort: 'new', shown: PAGE_SIZE };
const SORTS = [['new', '신상품순'], ['pop', '인기순'], ['low', '낮은 가격순'], ['high', '높은 가격순']];
function sortItems(a, s) {
  const r = [...a];
  if (s === 'pop') r.sort((x, y) => y.pop - x.pop);
  else if (s === 'low') r.sort((x, y) => salePrice(x) - salePrice(y));
  else if (s === 'high') r.sort((x, y) => salePrice(y) - salePrice(x));
  else r.sort((x, y) => y.date.localeCompare(x.date) || y.id - x.id);
  return r;
}
function pageList({ title, sub, items, chips, base, crumb, emptyMsg }) {
  const key = location.hash; if (listState.key !== key) listState = { key, sort: listState.sort, shown: PAGE_SIZE };
  const html = `<div class="page wrap"><div class="crumb"><a href="#/">HOME</a> &nbsp;/&nbsp; ${crumb}</div>
    <div class="list-h"><h1>${title}</h1><p>${sub}</p></div>
    <div class="tbar"><div class="chips">${(chips || []).map(c => `<a class="chip ${c.on ? 'on' : ''}" href="${c.href}">${c.label}</a>`).join('')}</div>
    <div class="sortbar"><span class="total">총 <b>${items.length}</b>개</span><div class="sort" role="group" aria-label="정렬">${SORTS.map(([k, l]) => `<button data-act="sort" data-k="${k}" class="${listState.sort === k ? 'on' : ''}">${l}</button>`).join('')}</div></div></div>
    <div id="listBody"></div></div>`;
  const draw = () => {
    const sorted = sortItems(items, listState.sort), shown = sorted.slice(0, listState.shown), body = $('#listBody');
    if (!sorted.length) { body.innerHTML = `<div class="empty">${ICON.search}<h3>상품이 없습니다</h3><p>${emptyMsg || '조건에 맞는 상품이 아직 준비되지 않았어요.'}</p><a class="btn ghost sm" href="#/new">신상품 보기</a></div>`; return; }
    body.innerHTML = `<div class="grid">${shown.map(p => card(p)).join('')}</div>${sorted.length > shown.length ? `<div class="more"><div class="bar"><i style="width:${shown.length / sorted.length * 100}%"></i></div><p>${shown.length} / ${sorted.length}</p><button class="btn ghost" data-act="more">더 보기</button></div>` : `<div class="more"><p style="margin:0">${sorted.length}개 상품을 모두 확인하셨습니다</p></div>`}`;
  };
  window._listDraw = draw;
  return { html, after: draw };
}

/* ---------- 페이지: 상품 상세 ---------- */
let sel = { color: null, size: null, qty: 1 }, curImg = 0;
function pageProduct(id) {
  const p = byId(id);
  if (!p) return pageNotFound();
  sel = { color: null, size: null, qty: 1 }; curImg = 0;
  const cat = CATS[p.cat], rel = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const sizeTable = p.cat === 'ACC' ? '<p>FREE 사이즈 상품입니다. (신발은 mm 단위 표기)</p>' : p.cat === 'BOTTOM'
    ? `<table><tr><th>SIZE</th><th>허리</th><th>엉덩이</th><th>총장</th></tr><tr><td>S</td><td>64</td><td>94</td><td>98</td></tr><tr><td>M</td><td>68</td><td>98</td><td>99</td></tr><tr><td>L</td><td>72</td><td>102</td><td>100</td></tr><tr><td>XL</td><td>76</td><td>106</td><td>101</td></tr></table>`
    : `<table><tr><th>SIZE</th><th>어깨</th><th>가슴</th><th>소매</th><th>총장</th></tr><tr><td>S</td><td>40</td><td>94</td><td>58</td><td>${p.cat === 'DRESS' ? 112 : 62}</td></tr><tr><td>M</td><td>41</td><td>98</td><td>59</td><td>${p.cat === 'DRESS' ? 113 : 63}</td></tr><tr><td>L</td><td>42</td><td>102</td><td>60</td><td>${p.cat === 'DRESS' ? 114 : 64}</td></tr></table>`;
  const html = `<div class="page wrap"><div class="crumb"><a href="#/">HOME</a> &nbsp;/&nbsp; <a href="#/shop/${cat.key}">${p.cat}</a> &nbsp;/&nbsp; <a href="#/shop/${cat.key}?sub=${encodeURIComponent(p.sub)}">${p.sub}</a></div>
  <div class="pd"><div class="gal"><div class="thumbs">${[0, 1, 2, 3].map(i => `<button data-act="thumb" data-i="${i}" class="${i === 0 ? 'on' : ''}" aria-label="이미지 ${i + 1}"><img src="${art(p, i)}" alt=""></button>`).join('')}</div>
    <div class="mainimg" data-act="zoom" role="button" tabindex="0" aria-label="이미지 확대"><img id="mainImg" src="${art(p, 0)}" alt="${esc(p.name)}"><span class="zoom-hint">${ICON.zoom} CLICK TO ZOOM</span>${p.isNew ? '<span class="badge">NEW</span>' : ''}</div></div>
  <div class="pi"><span class="cat-k">${p.cat} / ${p.sub}</span><h1>${esc(p.name)}</h1>
    <div class="pi-price">${p.sale ? `<s>${won(p.price)}</s><b>${won(salePrice(p))}</b><span class="pct">${p.sale}%</span>` : `<b>${won(p.price)}</b>`}</div>
    <p class="desc">${esc(p.desc)}</p>
    <div class="opt" id="optColor"><div class="opt-l">COLOR <span id="colorName">색상을 선택해 주세요</span></div><div class="sw">${p.colors.map((c, i) => `<button data-act="color" data-i="${i}" style="background:${c.hex}" title="${c.name}" aria-label="${c.name}"></button>`).join('')}</div></div>
    <div class="opt" id="optSize"><div class="opt-l">SIZE <span>${p.soldout.length ? '품절 사이즈는 선택할 수 없습니다' : ''}</span></div><div class="sz">${p.sizes.map(s => `<button data-act="size" data-s="${s}" ${p.soldout.includes(s) ? 'disabled' : ''}>${s}</button>`).join('')}</div></div>
    <div class="opt"><div class="opt-l">QUANTITY</div><div class="qty"><button data-act="pqty" data-d="-1" aria-label="수량 감소">−</button><span id="pqty">1</span><button data-act="pqty" data-d="1" aria-label="수량 증가">+</button></div></div>
    <p class="msg" id="optMsg" role="alert"></p>
    <div class="total-row"><span style="font-size:12px;letter-spacing:.18em">TOTAL</span><b id="ptotal">${won(salePrice(p))}</b></div>
    <div class="cta"><button class="btn ghost" data-act="add" data-id="${p.id}">장바구니 담기</button><button class="btn" data-act="buy" data-id="${p.id}">바로 구매하기</button>
      <button class="wishbtn ${state.wish.includes(p.id) ? 'on' : ''}" data-act="wish" data-id="${p.id}" aria-label="관심상품 등록">${ICON.heart}</button></div>
    <div class="acc"><details open><summary>PRODUCT DETAIL</summary><div class="ct"><p>${esc(p.desc)}</p><ul style="margin-top:10px"><li>자연스러운 실루엣과 편안한 착용감을 고려해 설계했습니다.</li><li>모델 착용 사이즈: ${p.cat === 'ACC' ? 'FREE' : 'M'} (키 168cm / 52kg)</li><li>화면 환경에 따라 색상이 다르게 보일 수 있습니다.</li></ul></div></details>
    <details><summary>MATERIAL</summary><div class="ct"><ul><li>겉감: ${esc(p.material[0])}</li>${p.material[1] ? `<li>${esc(p.material[1])}</li>` : ''}<li>신축성: 없음 / 두께감: ${p.cat === 'OUTER' ? '도톰함' : '보통'} / 비침: 없음</li></ul></div></details>
    <details><summary>SIZE INFO</summary><div class="ct">${sizeTable}<p style="margin-top:8px;font-size:12.5px;color:var(--brown)">단위 cm · 측정 방법에 따라 1–3cm 오차가 있을 수 있습니다.</p></div></details>
    <details><summary>CARE GUIDE</summary><div class="ct"><ul><li>${p.kind === 'coat' || p.kind === 'jacket' || p.kind === 'bag' || p.kind === 'shoe' ? '드라이클리닝을 권장합니다.' : '30°C 이하 중성세제로 단독 손세탁해 주세요.'}</li><li>표백제 사용 금지, 비틀어 짜지 말고 그늘에서 평평하게 건조해 주세요.</li><li>다림질은 저온으로 안감을 대고 진행해 주세요.</li></ul></div></details>
    <details><summary>SHIPPING &amp; RETURNS</summary><div class="ct"><ul><li>5만원 이상 무료배송 (미만 3,000원), 결제 후 1–3 영업일 출고</li><li>수령 후 7일 이내 교환·반품 가능 (왕복 배송비 고객 부담)</li><li>착용·세탁 흔적, 택 제거, 향수/화장품 오염 시 교환·반품이 제한됩니다.</li></ul></div></details></div>
  </div></div>
  <section class="sec" style="padding-top:20px"><div class="sec-h"><div><span class="k">YOU MAY ALSO LIKE</span><h2>More from <em>${p.cat}</em></h2></div></div><div class="grid">${rel.map(x => card(x)).join('')}</div></section></div>`;
  return { html };
}
function updateTotal() {
  const p = byId(location.hash.split('/')[2]); if (!p) return;
  $('#ptotal').textContent = won(salePrice(p) * sel.qty); $('#pqty').textContent = sel.qty;
}
function validateOpts(p) {
  const m = $('#optMsg'); let miss = [];
  $('#optColor').classList.toggle('err', !sel.color); $('#optSize').classList.toggle('err', !sel.size);
  if (!sel.color) miss.push('색상'); if (!sel.size) miss.push('사이즈');
  if (miss.length) { m.textContent = miss.length > 1 ? '색상과 사이즈를 선택해 주세요.' : `${miss[0] === '색상' ? '색상을' : '사이즈를'} 선택해 주세요.`; m.classList.add('on'); m.style.animation = 'none'; void m.offsetWidth; m.style.animation = ''; return false; }
  m.classList.remove('on'); return true;
}

/* ---------- 페이지: 기타 ---------- */
function pageWish() {
  const items = state.wish.map(byId).filter(Boolean);
  return { html: `<div class="page wrap"><div class="crumb"><a href="#/">HOME</a> &nbsp;/&nbsp; WISH LIST</div><div class="list-h"><h1>WISH LIST</h1><p>마음에 담아 둔 상품 ${items.length}개</p></div>
  ${items.length ? `<div class="grid" style="padding-bottom:100px">${items.map(p => card(p)).join('')}</div>` : `<div class="empty">${ICON.heart}<h3>관심 상품이 없습니다</h3><p>마음에 드는 상품의 WISH 버튼을 눌러 저장해 보세요.</p><a class="btn ghost sm" href="#/best">베스트 상품 보기</a></div>`}</div>` };
}
function pageCart() {
  const t = cartTotals();
  return { html: `<div class="page wrap"><div class="crumb"><a href="#/">HOME</a> &nbsp;/&nbsp; CART</div><div class="list-h"><h1>CART</h1><p>${state.cart.length ? `선택한 상품 ${state.cart.length}종` : ''}</p></div>
  ${state.cart.length ? `<div class="cartp"><div>${state.cart.map((l, i) => cartLine(l, i)).join('')}</div><aside class="sumbox"><h3>SUMMARY</h3>
    <div class="sum"><span>상품금액</span><span>${won(t.items)}</span></div><div class="sum"><span>할인</span><span>-${won(t.disc)}</span></div><div class="sum"><span>배송비</span><span>${t.ship ? won(t.ship) : '무료'}</span></div>
    <div class="sum t"><span>결제 예정 금액</span><b>${won(t.total)}</b></div><button class="btn block" style="margin-top:22px" data-act="checkout">주문하기</button><a class="btn ghost block" style="margin-top:8px" href="#/new">쇼핑 계속하기</a></aside></div>`
    : `<div class="empty">${ICON.bag}<h3>장바구니가 비어 있어요</h3><p>마음에 드는 상품을 담아 보세요.</p><a class="btn ghost sm" href="#/new">신상품 보러가기</a></div>`}</div>` };
}
function pageAbout() {
  return { html: `<div class="page"><section class="about" style="min-height:calc(100vh - 140px)"><div class="about-im"><img src="${scene({ w: 900, h: 1000, wall: '#E3D6BE', floor: '#C9B592', light: 1, curtain: 1, plant: 1, fx: .55, figs: [{ kind: 'coat', coat: '#B8977A', inner: '#F1EBDD', bottom: '#4A4B45' }] })}" alt="OLIVE"></div>
    <div class="about-tx"><span class="k">BRAND STORY</span><h2>Wear Your Own <em>Nature.</em></h2><p class="lead">자연스러운 아름다움은 가장 오래도록 빛납니다.</p>
    <p>OLIVE는 특별한 날뿐만 아니라 평범한 일상에서도 자신만의 분위기를 만들어 갈 수 있는 옷을 제안합니다.</p><p>편안함 속에 담긴 섬세한 디테일,<br>유행을 넘어 오래도록 함께할 수 있는 디자인.</p><p>당신의 일상에 자연스럽게 스며드는 스타일, OLIVE입니다.</p><a class="btn" href="#/new">SHOP NOW</a></div></section>
    <div class="wrap" style="padding-top:60px;padding-bottom:60px"><div class="values"><div><b>NATURAL</b><span>린넨·코튼·울 등 자연 소재</span></div><div><b>COMFORT</b><span>움직임을 배려한 실루엣</span></div><div><b>DETAIL</b><span>보이지 않는 곳까지 섬세하게</span></div><div><b>TIMELESS</b><span>오래 입는 즐거움</span></div></div></div></div>` };
}
function pageEditorial(i) {
  const e = EDITORIALS[+i]; if (!e) return pageNotFound();
  return { html: `<div class="page"><div class="ed-hero"><img src="${scene({ w: 1600, h: 800, ...e.scene, fx: .5, fs: .9 })}" alt="${e.title}"></div>
  <div class="ed-body"><span class="k">OLIVE EDITORIAL 0${+i + 1}</span><h1>${e.title}</h1><p class="ko">${e.ko}</p>${e.body.map(t => `<p>${t}</p>`).join('')}</div>
  <div class="wrap" style="padding-bottom:100px"><div class="sec-h"><div><span class="k">SHOP THE LOOK</span><h2>Featured <em>Items</em></h2></div></div><div class="grid">${e.ids.map(id => card(byId(id))).join('')}</div>
  <div style="display:flex;justify-content:space-between;margin-top:64px;border-top:1px solid var(--line);padding-top:24px"><a class="link" href="#/editorial/${(+i + 3) % 4}">← PREV</a><a class="link" href="#/editorial/${(+i + 1) % 4}">NEXT →</a></div></div></div>` };
}
function pageNotFound() {
  return { html: `<div class="page wrap"><div class="empty">${ICON.search}<h3>페이지를 찾을 수 없습니다</h3><p>주소가 변경되었거나 존재하지 않는 페이지입니다.</p><a class="btn ghost sm" href="#/">홈으로</a></div></div>` };
}

/* ---------- 라우터 ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, ''), [path, qs] = h.split('?'), seg = path.split('/').filter(Boolean).map(decodeURIComponent);
  const q = new URLSearchParams(qs || '');
  return { name: seg[0] || 'home', seg, q };
}
let renderT;
function render() {
  const r = route(), app = $('#app'); clearTimeout(heroTimer);
  const catByKey = Object.entries(CATS).find(([, c]) => c.key === r.seg[1]);
  let res, navKey = '', delay = 0;
  switch (r.name) {
    case 'home': res = pageHome(); break;
    case 'new': case 'best': {
      const isNew = r.name === 'new';
      const items = isNew ? PRODUCTS.filter(p => p.isNew) : [...PRODUCTS].sort((a, b) => b.pop - a.pop).slice(0, 12);
      if (!isNew && listState.key !== location.hash) listState.sort = 'pop';
      res = pageList({ title: isNew ? 'NEW' : 'BEST', sub: isNew ? '새롭게 입고된 신상품' : '지금 가장 사랑받는 인기 상품', items, crumb: isNew ? 'NEW' : 'BEST' });
      navKey = r.name; delay = 260; break;
    }
    case 'shop': {
      if (!catByKey) { res = pageNotFound(); break; }
      const [cat, c] = catByKey, sub = r.q.get('sub');
      const items = PRODUCTS.filter(p => p.cat === cat && (!sub || p.sub === sub));
      res = pageList({ title: sub || cat, sub: sub ? `${cat} · ${sub}` : c.blurb, items, crumb: `<a href="#/shop/${c.key}">${cat}</a>${sub ? ` &nbsp;/&nbsp; ${esc(sub)}` : ''}`,
        chips: [{ label: '전체', href: `#/shop/${c.key}`, on: !sub }, ...c.subs.map(s => ({ label: s, href: `#/shop/${c.key}?sub=${encodeURIComponent(s)}`, on: s === sub }))] });
      navKey = 'shop-' + c.key; delay = 260; break;
    }
    case 'search': {
      const q = r.seg[1] || '', items = searchProducts(q);
      res = pageList({ title: 'SEARCH', sub: `‘${esc(q)}’ 검색 결과 ${items.length}건`, items, crumb: 'SEARCH', emptyMsg: `‘${esc(q)}’에 대한 상품을 찾지 못했습니다. 다른 검색어(코트, 린넨, 니트 등)로 시도해 보세요.` });
      delay = 200; break;
    }
    case 'product': res = pageProduct(r.seg[1]); break;
    case 'wish': res = pageWish(); break;
    case 'cart': res = pageCart(); break;
    case 'about': res = pageAbout(); navKey = 'about'; break;
    case 'editorial': res = pageEditorial(r.seg[1]); navKey = 'about'; break;
    default: res = pageNotFound();
  }
  setActiveNav(navKey);
  clearTimeout(renderT);
  const done = () => { app.innerHTML = res.html; if (res.after) res.after(); observeReveal(); };
  if (delay && !window._noDelay) { app.innerHTML = skeleton(); renderT = setTimeout(done, delay); } else done();
}
let lastPath = '';
window.addEventListener('hashchange', () => {
  closeAll();
  const p = location.hash.split('?')[0];
  render();
  if (p !== lastPath) window.scrollTo({ top: 0, behavior: 'instant' }); lastPath = p;
});
function observeReveal() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  $$('.rv').forEach(el => io.observe(el));
  setTimeout(() => $$('.rv').forEach(el => el.getBoundingClientRect().top < innerHeight && el.classList.add('in')), 80);
}

/* ---------- 이벤트 위임 ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, pid = () => byId(location.hash.split('/')[2]);
  const keep = ['close-all'];
  if (t.tagName === 'A' && a === 'close-all') { closeAll(); return; }
  if (t.tagName === 'A' && t.getAttribute('href') === '#') e.preventDefault();
  switch (a) {
    case 'close-all': closeAll(); break;
    case 'search-open': openSearch(); break;
    case 'search-close': closeAll(); break;
    case 'menu-open': openDrawer('menuDrawer'); break;
    case 'cart-open': openCart(); break;
    case 'login': openLogin(); break;
    case 'mypage': openMyPage(); break;
    case 'logout': state.user = null; saveState(); closeAll(); toast('로그아웃되었습니다.'); break;
    case 'info': infoModal(t.dataset.t); break;
    case 'wish': e.preventDefault(); toggleWish(t.dataset.id); break;
    case 'hero': setHero(heroIdx + (+t.dataset.d)); break;
    case 'sort': listState.sort = t.dataset.k; listState.shown = PAGE_SIZE; $$('[data-act=sort]').forEach(b => b.classList.toggle('on', b === t)); window._listDraw(); break;
    case 'more': listState.shown += PAGE_SIZE; window._listDraw(); break;
    case 'thumb': { curImg = +t.dataset.i; $('#mainImg').src = art(pid(), curImg); $$('.thumbs button').forEach((b, i) => b.classList.toggle('on', i === curImg)); break; }
    case 'zoom': openLightbox(pid(), curImg); break;
    case 'lb-close': closeLightbox(); break;
    case 'lb-nav': openLightbox(lb.p, (lb.i + +t.dataset.d + 4) % 4); break;
    case 'color': { sel.color = pid().colors[+t.dataset.i]; $$('.sw button').forEach(b => b.classList.toggle('on', b === t)); $('#colorName').textContent = sel.color.name; $('#optColor').classList.remove('err'); if (sel.size) $('#optMsg').classList.remove('on'); break; }
    case 'size': { sel.size = t.dataset.s; $$('.sz button').forEach(b => b.classList.toggle('on', b === t)); $('#optSize').classList.remove('err'); if (sel.color) $('#optMsg').classList.remove('on'); break; }
    case 'pqty': sel.qty = Math.max(1, Math.min(10, sel.qty + +t.dataset.d)); updateTotal(); break;
    case 'add': { const p = pid(); if (!validateOpts(p)) break; addToCart(p.id, sel.color.name, sel.size, sel.qty); openCart(); break; }
    case 'buy': { const p = pid(); if (!validateOpts(p)) break; checkout([{ id: p.id, color: sel.color.name, size: sel.size, qty: sel.qty }]); break; }
    case 'cart-qty': { const l = state.cart[+t.dataset.i]; l.qty = Math.max(1, Math.min(10, l.qty + +t.dataset.d)); saveState(); renderCart(); if (route().name === 'cart') render(); break; }
    case 'cart-rm': state.cart.splice(+t.dataset.i, 1); saveState(); renderCart(); if (route().name === 'cart') render(); break;
    case 'checkout': checkout(); break;
    case 'place-order': placeOrder(t.dataset.direct); break;
  }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.mainimg')) { e.preventDefault(); openLightbox(byId(location.hash.split('/')[2]), curImg); } });
window.addEventListener('scroll', () => $('#hdr').classList.toggle('scrolled', scrollY > 40), { passive: true });

/* ---------- 시작 ---------- */
buildNav(); saveState(); renderCart(); lastPath = location.hash.split('?')[0]; render();
