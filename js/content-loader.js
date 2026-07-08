'use strict';
/* ============================================================
   content-loader.js
   content/ フォルダの .txt を読み込み、ページに反映します。
   ※ 編集する人はこのファイルを触る必要はありません。
     編集は content/ フォルダの .txt だけでOKです。
   ============================================================ */

/* ---------- 共通ユーティリティ ---------- */

/* テキストファイルを読み込む（失敗しても止まらない） */
async function fetchText(path) {
  try {
    const res = await fetch(`${path}?t=${Date.now()}`);
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.warn(`[content] 読み込み失敗: ${path}`, e);
    return null;
  }
}

/* データが読み込めなかったとき、そのセクションだけに案内を出す
   （ページ全体が真っ白になったり、他のセクションが巻き込まれたりしない） */
function showLoadNotice(el, fileName) {
  if (!el) return;
  el.innerHTML = `<p class="content-load-notice">データを読み込めませんでした。` +
    `時間をおいて再読み込みするか、担当者は content/${fileName} の内容と` +
    `アップロード漏れがないかを確認してください。</p>`;
}

/* 「#」コメント除去・全角/半角コロン両対応で1行を key/value に分解 */
function splitKV(line) {
  const idx = line.search(/[：:]/);
  if (idx === -1) return null;
  const key = line.slice(0, idx).trim();
  const val = line.slice(idx + 1).trim();
  return [key, val];
}

/* 単純な key:value テキスト → オブジェクト
   blockKeys に指定した key だけ、値が空のとき
   「ブロック（複数行リスト）」として次の空行までを配列で保持する
   （例：coach.txt の「経歴」）。
   それ以外の key は、値が空なら空文字 '' として扱う。
   ※以前は「値が空＝すべてブロック」だったため、部員データの
     「写真：」（空欄）が直後の「出身県：」「学科：」を飲み込み、
     壊れた画像（灰色の人型が出ない）バグの原因になっていた。 */
function parseKV(text, blockKeys) {
  blockKeys = blockKeys || [];
  const obj = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.replace(/\s+$/, '');
    i++;
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const kv = splitKV(line);
    if (!kv) continue;
    const [key, val] = kv;
    if (val === '' && blockKeys.includes(key)) {
      /* ブロック開始：空行 or EOF まで生の行を集める */
      const block = [];
      while (i < lines.length) {
        const b = lines[i];
        if (!b.trim()) break;          // 空行でブロック終了
        if (b.trim().startsWith('#')) { i++; continue; }
        block.push(b.trim());
        i++;
      }
      obj[key] = block;
    } else {
      obj[key] = val;
    }
  }
  return obj;
}

/* 「---」区切りの複数レコード → オブジェクト配列 */
function parseRecords(text, blockKeys) {
  return text
    .split(/^\s*---\s*$/m)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length)
    .map(chunk => parseKV(chunk, blockKeys))
    .filter(obj => Object.keys(obj).length);
}

/* パイプ（全角/半角）で分割 */
function splitPipe(line) {
  return line.split(/[｜|]/).map(s => s.trim());
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* 動的生成カードを fade-up 表示させる */
function observeFadeUp(root) {
  const targets = (root || document).querySelectorAll('.fade-up:not(.visible)');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });
    targets.forEach(el => obs.observe(el));
  } else {
    targets.forEach(el => el.classList.add('visible'));
  }
}

/* ============================================================
   1. site.txt … ヒーロー・スローガン・SNS・連絡先（全ページ共通）
   ============================================================ */
async function applySite() {
  const text = await fetchText('/content/site.txt');
  if (!text) return;
  const c = parseKV(text);

  /* ヒーロー（トップページのみ） */
  const heroTitle = document.querySelector('[data-site="hero-title"]');
  if (heroTitle) {
    const l1 = escapeHtml(c['ヒーロータイトル'] || '');
    const l2 = escapeHtml(c['ヒーロータイトル2行目'] || '');
    heroTitle.innerHTML = l2 ? `${l1}<br>${l2}` : l1;
  }
  const heroSub = document.querySelector('[data-site="hero-sub"]');
  if (heroSub && c['ヒーローサブ']) heroSub.textContent = c['ヒーローサブ'];

  /* スローガン（トップページのみ） */
  const slogan = document.querySelector('[data-site="slogan"]');
  if (slogan && c['スローガン']) {
    const accents = (c['スローガン強調文字'] || '')
      .split(/[,、，]/).map(s => s.trim()).filter(Boolean);
    slogan.innerHTML = [...c['スローガン']].map(ch =>
      accents.includes(ch)
        ? `<span class="slogan-accent">${escapeHtml(ch)}</span>`
        : escapeHtml(ch)
    ).join('');
  }
  const sloganEn = document.querySelector('[data-site="slogan-en"]');
  if (sloganEn && c['スローガン英語']) sloganEn.textContent = c['スローガン英語'];

  /* SNS（全ページのリンク・アカウント名を差し替え） */
  const xUrl = c['X_URL'], xName = c['X_アカウント名'];
  const igUrl = c['Instagram_URL'], igName = c['Instagram_アカウント名'];

  function isX(href)  { return /x\.com\/|twitter\.com\//.test(href); }
  function isIg(href) { return /instagram\.com\//.test(href); }

  /* href を差し替え */
  if (xUrl)  document.querySelectorAll('a[href*="x.com/"], a[href*="twitter.com/"]').forEach(a => a.href = xUrl);
  if (igUrl) document.querySelectorAll('a[href*="instagram.com/"]').forEach(a => a.href = igUrl);

  /* フッターSNSリンクのアカウント名テキストを差し替え（アイコンは残す） */
  document.querySelectorAll('.f-sns-link').forEach(a => {
    const handle = isX(a.href) ? xName : isIg(a.href) ? igName : null;
    if (!handle) return;
    [...a.childNodes].forEach(n => { if (n.nodeType === 3) n.remove(); });
    a.appendChild(document.createTextNode(' ' + handle));
  });

  /* トップページ SNS カードのアカウント名を差し替え */
  document.querySelectorAll('.sns-card').forEach(card => {
    const handleEl = card.querySelector('.sns-handle');
    if (!handleEl) return;
    const handle = isX(card.href) ? xName : isIg(card.href) ? igName : null;
    if (handle) handleEl.textContent = handle;
  });

  /* 連絡先メール（お問い合わせページ）
     ★迷惑メール対策：site.txt では「前半」「後半」に分けて書かれており、
       ここ（実行時のJavaScript）ではじめて「前半@後半」に組み立てる。
       HTMLやtxtに完成形のアドレスを書かないことで、アドレスを自動収集する
       迷惑ボットに拾われにくくしている（人には今まで通り見える）。
       旧形式「連絡先メール：〜」が書かれている場合もそのまま動く。 */
  const mailFront = (c['連絡先メール前半'] || '').trim();
  const mailBack  = (c['連絡先メール後半'] || '').trim();
  const mail = (mailFront && mailBack)
    ? mailFront + '\u0040' + mailBack          /* \u0040 は「@」のこと */
    : (c['連絡先メール'] || '').trim();
  if (mail) {
    document.querySelectorAll('[data-site="contact-mail"]').forEach(el => {
      el.textContent = mail;
      if (el.tagName === 'A') el.href = 'mailto:' + mail;
    });
  }
}

/* ============================================================
   2. coach.txt … 監督紹介（トップページのみ）
   ============================================================ */
async function applyCoach() {
  const wrap = document.getElementById('coach-wrap');
  if (!wrap) return;
  const text = await fetchText('/content/coach.txt');
  if (!text) { showLoadNotice(wrap, 'coach.txt'); return; }
  const c = parseKV(text, ['経歴']);   // 「経歴：」だけ複数行ブロックとして読む

  const photo = c['写真'] ? `/images/${c['写真']}` : '';
  const career = Array.isArray(c['経歴']) ? c['経歴'] : (c['経歴'] ? [c['経歴']] : []);

  /* 氏名の末尾に「監督」がある場合、その部分だけ小さめ・サブ色で表示する。
     例：「奥野佳宏 監督」→ 奥野佳宏＋<span class="coach-name-sub">監督</span> */
  const nameRaw = (c['氏名'] || '').trim();
  const mName = nameRaw.match(/^(.*?)[\s　]*(監督)$/);
  const nameHtml = mName
    ? `${escapeHtml(mName[1].trim())}<span class="coach-name-sub">${escapeHtml(mName[2])}</span>`
    : escapeHtml(nameRaw);

  wrap.innerHTML = `
    <div>
      ${photo
        ? `<img class="coach-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(c['氏名'] || '監督')}">`
        : `<div class="coach-photo-placeholder"><span>監督写真</span></div>`}
    </div>
    <div>
      <p class="coach-name">${nameHtml}</p>
      <p class="coach-role">${escapeHtml(c['役職'] || '')}</p>
      ${career.length ? `<ul class="coach-career">${career.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>` : ''}
      ${c['一言'] ? `<blockquote class="coach-quote">「${escapeHtml(c['一言'])}」</blockquote>` : ''}
    </div>`;
}

/* ============================================================
   3. members.txt … 部員紹介（部員ページのみ）＋ クリックでモーダル
   ============================================================ */
let MEMBERS = [];

const AVATAR_PLACEHOLDER = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#D1D5DB">
  <circle cx="50" cy="36" r="22"/><ellipse cx="50" cy="88" rx="35" ry="28"/></svg>`;

function memberAvatar(m) {
  /* 写真はファイル名の文字列のときだけ表示。空欄・不正値は灰色の人型 */
  const photo = (typeof m.photo === 'string') ? m.photo.trim() : '';
  return photo
    ? `<img src="${escapeHtml('/images/members/' + photo)}" alt="${escapeHtml(m.name)}" style="width:100%;height:100%;object-fit:cover;"
           onerror="this.outerHTML='${AVATAR_PLACEHOLDER.replace(/\n/g, '').replace(/'/g, '&#39;').replace(/"/g, '&quot;')}';">`
    : AVATAR_PLACEHOLDER;
}

/* ローマ字姓でソートするための簡易キー（元データ順を尊重しつつ学年で並べる） */
function sortMembers(list) {
  return list.slice().sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;   // 4年→1年
    return 0;                                        // 同学年はファイル記載順を維持
  });
}

async function applyMembers() {
  if (!document.getElementById('members-long')) return;
  const text = await fetchText('/content/members.txt');
  if (!text) {
    ['long', 'short', 'manager'].forEach(k =>
      showLoadNotice(document.getElementById(`members-${k}`), 'members.txt'));
    return;
  }

  MEMBERS = parseRecords(text).map((r, i) => ({
    name:       r['氏名'] || '',
    role:       (r['役職'] || '').trim(),   /* 主将・副将など。空欄なら表示しない */
    year:       parseInt(r['学年'], 10) || 0,
    faculty:    r['学部'] || '',
    department: r['学科'] || '',
    block:      r['ブロック'] || '',
    event:      r['得意種目'] || '',
    school:     r['出身校'] || '',
    comment:    r['一言'] || '',
    prefecture: r['出身県'] || '',
    photo:      r['写真'] || '',
    _idx:       i
  }));

  function card(m) {
    /* 役職（主将など）がある人だけ、カード右上に金色バッジを表示 */
    const roleBadge = m.role
      ? `<span class="member-role-badge">${escapeHtml(m.role)}</span>` : '';
    return `<div class="member-card fade-up" data-member="${m._idx}" role="button" tabindex="0"
                 aria-label="${escapeHtml(m.name)}${m.role ? '（' + escapeHtml(m.role) + '）' : ''} の詳細を表示">
      ${roleBadge}
      <div class="member-avatar">${memberAvatar(m)}</div>
      <p class="member-name">${escapeHtml(m.name)}</p>
      <p class="member-year">${m.year}年生・${escapeHtml(m.faculty)}</p>
      <p class="member-event">得意種目：${escapeHtml(m.event)}</p>
      <p class="member-school">出身校：${escapeHtml(m.school)}</p>
      <p class="member-comment">「${escapeHtml(m.comment)}」</p>
      <span class="member-more">詳しく見る ＋</span>
    </div>`;
  }

  const map = { long: '長距離', short: '短距離', manager: 'マネージャー' };
  Object.entries(map).forEach(([key, block]) => {
    const el = document.getElementById(`members-${key}`);
    if (!el) return;
    const list = sortMembers(MEMBERS.filter(m => m.block === block));
    el.innerHTML = list.map(card).join('');
    /* 見出しの人数を実データに合わせて更新 */
    const countEl = document.querySelector(`#block-${key} .members-count`);
    if (countEl) countEl.textContent = `${list.length}名`;
    const navBtn = document.querySelector(`.block-nav-btn[data-scroll-to="block-${key}"]`);
    if (navBtn) navBtn.textContent = `${block}（${list.length}名）`;
  });

  observeFadeUp();
  setupMemberModal();
}

/* ---- モーダル（クリックで拡大＋追加情報） ---- */
/* 開いた元のカードを記憶し、閉じるときフォーカスをそこへ返す
   （フォーカスがモーダル内に残ったまま aria-hidden を付けると
     支援技術向けの警告が出るため） */
let MEMBER_MODAL_OPENER = null;

function setupMemberModal() {
  let modal = document.getElementById('member-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'member-modal';
    modal.className = 'member-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="member-modal-backdrop" data-close></div>
      <div class="member-modal-panel" role="dialog" aria-modal="true" aria-labelledby="member-modal-name">
        <button class="member-modal-close" data-close aria-label="閉じる">×</button>
        <div class="member-modal-body"></div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', e => {
      if (e.target.hasAttribute('data-close')) closeMemberModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMemberModal();
    });
  }

  function openFor(idx) {
    const m = MEMBERS[idx];
    if (!m) return;
    const extra = [];
    if (m.prefecture) extra.push(['出身県', m.prefecture]);
    if (m.department) extra.push(['学科', m.department]);

    modal.querySelector('.member-modal-body').innerHTML = `
      ${m.role ? `<span class="member-role-badge member-role-badge--modal">${escapeHtml(m.role)}</span>` : ''}
      <div class="member-modal-avatar">${memberAvatar(m)}</div>
      <p class="member-modal-name" id="member-modal-name">${escapeHtml(m.name)}</p>
      <p class="member-modal-year">${m.year}年生・${escapeHtml(m.faculty)}${m.block ? '・' + escapeHtml(m.block) : ''}</p>
      <dl class="member-modal-info">
        <div><dt>得意種目</dt><dd>${escapeHtml(m.event) || '—'}</dd></div>
        <div><dt>出身校</dt><dd>${escapeHtml(m.school) || '—'}</dd></div>
        ${extra.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}
      </dl>
      <blockquote class="member-modal-comment">「${escapeHtml(m.comment)}」</blockquote>`;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    /* キーボード・スクリーンリーダー利用者のためフォーカスを×ボタンへ */
    const closeBtn = modal.querySelector('.member-modal-close');
    if (closeBtn) closeBtn.focus();
  }

  document.querySelectorAll('.member-card[data-member]').forEach(cardEl => {
    const open = () => {
      MEMBER_MODAL_OPENER = cardEl;   /* 閉じたときフォーカスを返す先 */
      openFor(parseInt(cardEl.dataset.member, 10));
    };
    cardEl.addEventListener('click', open);
    cardEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

function closeMemberModal() {
  const modal = document.getElementById('member-modal');
  if (!modal) return;
  /* 重要：aria-hidden を付ける「前に」フォーカスをモーダルの外へ出す。
     （中にフォーカスが残ったまま隠すとブラウザが警告を出す） */
  if (modal.contains(document.activeElement)) {
    if (MEMBER_MODAL_OPENER && document.contains(MEMBER_MODAL_OPENER)) {
      MEMBER_MODAL_OPENER.focus();
    } else if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ============================================================
   3b. schedule.txt … 練習曜日（練習スケジュールページのみ）
   ------------------------------------------------------------
   「タイトル」「補足」以外のすべての行を「区分：曜日」として表示する。
   （長距離・短距離のほか、行を足せば項目を増やせる）
   ============================================================ */
async function applyPracticeDays() {
  const box = document.getElementById('practice-days-box');
  if (!box) return;
  const text = await fetchText('/content/schedule.txt');
  if (!text) { showLoadNotice(box, 'schedule.txt'); return; }

  const c = parseKV(text);
  const title = c['タイトル'] || '練習曜日';
  const note  = (c['補足'] || '').trim();

  const rows = Object.entries(c)
    .filter(([k, v]) => k !== 'タイトル' && k !== '補足' && String(v).trim() !== '')
    .map(([k, v]) => `
      <li class="practice-day-row">
        <span class="practice-day-label">${escapeHtml(k)}</span>
        <span class="practice-day-value">${escapeHtml(v)}</span>
      </li>`).join('');

  box.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <ul class="practice-days">${rows || '<li class="practice-day-row">（未設定）</li>'}</ul>
    ${note ? `<p class="practice-days-note">${escapeHtml(note)}</p>` : ''}`;
}

/* ============================================================
   4. ekiden.txt … 駅伝 歴代最高記録（歴代記録ページのみ）
   ============================================================ */
async function applyEkiden() {
  const container = document.getElementById('ekiden-container');
  if (!container) return;
  const text = await fetchText('/content/ekiden.txt');
  if (!text) { showLoadNotice(container, 'ekiden.txt'); return; }

  /* 【大会N】ごとに分割 */
  const blocks = text.split(/^\s*【[^】]*】\s*$/m).map(s => s.trim()).filter(Boolean);
  /* 先頭のコメント塊を除外：メンバー行を含むものだけ大会として扱う */
  const comps = blocks
    .map(b => parseEkidenBlock(b))
    .filter(c => c && c['大会名']);

  container.innerHTML = comps.map(c => {
    const members = (c['メンバー'] || []).map(line => {
      const p = splitPipe(line);
      return `<div class="ekiden-chip">
        <p class="ekiden-chip-kumi">${escapeHtml(p[0] || '')}</p>
        <p class="ekiden-chip-time">Time：${escapeHtml(p[1] || '')}</p>
        <p class="ekiden-chip-name">${escapeHtml(p[2] || '')}</p>
        <p class="ekiden-chip-grade">${escapeHtml(p[3] || '')}</p>
      </div>`;
    }).join('');

    return `<div class="ekiden-card fade-up">
      <div class="ekiden-head">${escapeHtml(c['大会名'])}</div>
      <div class="ekiden-body">
        <p class="ekiden-label">歴代最高記録</p>
        <p class="ekiden-time">${escapeHtml(c['記録'] || '')}</p>
        <p class="ekiden-meta">${escapeHtml(c['順位・詳細'] || '')}</p>
        ${c['メンバー見出し'] ? `<p style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px;">${escapeHtml(c['メンバー見出し'])}</p>` : ''}
        <div class="ekiden-members">${members}</div>
      </div>
    </div>`;
  }).join('');

  observeFadeUp();
}

/* ekiden ブロック用パーサ（メンバーは block として保持） */
function parseEkidenBlock(text) {
  const obj = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].replace(/\s+$/, '');
    i++;
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const kv = splitKV(line);
    if (!kv) continue;
    const [key, val] = kv;
    if (key === 'メンバー' && val === '') {
      const block = [];
      while (i < lines.length) {
        const b = lines[i];
        if (!b.trim()) break;
        if (b.trim().startsWith('#')) { i++; continue; }
        block.push(b.trim());
        i++;
      }
      obj['メンバー'] = block;
    } else {
      obj[key] = val;
    }
  }
  return obj;
}

/* ============================================================
   5. news.txt … ニュース一覧
      （トップページ・ニュースページ・整理用ページ）
   ------------------------------------------------------------
   ・記事の追加は content/news.txt に書くだけ（js編集は不要）
   ・日付の新しい順に自動で並びます（書く順番は自由）
   ・ニュースページは「6ヶ月以内」だけ表示（自動非表示）
   ・/news/maintenance/ で期限切れ記事の削除リストを確認できます
   ============================================================ */

function newsCatClass(cat) {
  if (cat === '大会結果') return 'cat-tag--result';
  if (cat === '駅伝')    return 'cat-tag--ekiden';
  if (cat === '活動報告') return 'cat-tag--activity';
  return 'cat-tag--notice';
}

/* '2026-04-01' / '2026.04.01' / '2026/04/01' のどれでも受け付ける */
function parseNewsDate(s) {
  const m = String(s || '').trim().match(/^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function formatNewsDate(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

/* 表示から1週間（7日）以内のニュースか判定する。
   きょうの日付から7日前以降のものを「NEW」とみなす。 */
function isRecentNews(date) {
  if (!date) return false;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  return date >= sevenDaysAgo;
}

/* NEW バッジのHTML（1週間以内なら付ける） */
function newsNewBadge(item) {
  return isRecentNews(item.date)
    ? '<span class="news-new-badge">NEW</span>'
    : '';
}

async function loadNews() {
  const text = await fetchText('/content/news.txt');
  if (!text) return null;   /* 読み込み失敗（applyNews 側で案内を表示） */
  const items = parseRecords(text).map(r => {
    const d = parseNewsDate(r['日付']);
    return {
      date:        d,
      displayDate: d ? formatNewsDate(d) : (r['日付'] || ''),
      category:    r['カテゴリ'] || 'お知らせ',
      title:       r['タイトル'] || '',
      link:        (r['リンク'] || '').trim() || null,
      raw:         r,
    };
  }).filter(n => n.title);
  /* 日付の新しい順（日付なしは末尾） */
  items.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date - a.date;
  });
  return items;
}

async function applyNews() {
  const topList   = document.getElementById('top-news-list');
  const pageList  = document.getElementById('news-page-list');
  const maintList = document.getElementById('news-maintenance-list');
  if (!topList && !pageList && !maintList) return;

  const items = await loadNews();
  if (items === null) {
    [topList, pageList, maintList].forEach(el => showLoadNotice(el, 'news.txt'));
    return;
  }

  /* --- トップページ：最新5件（1週間以内は NEW バッジ） --- */
  if (topList) {
    topList.innerHTML = items.slice(0, 5).map(n => {
      const inner = `
        <time class="news-date">${escapeHtml(n.displayDate)}</time>
        <span class="cat-tag ${newsCatClass(n.category)}">${escapeHtml(n.category)}</span>
        <span class="news-title">${escapeHtml(n.title)}${newsNewBadge(n)}</span>`;
      if (n.link) {
        return `<li class="news-item fade-up"><a href="${escapeHtml(n.link)}" class="news-item-inner" style="display:contents;">${inner}</a></li>`;
      }
      return `<li class="news-item fade-up" style="display:flex;align-items:flex-start;gap:14px;">${inner}</li>`;
    }).join('');
    observeFadeUp(topList);
  }

  /* --- ニュースページ：6ヶ月以内のみ表示（自動非表示）＋ 1ページ10件のページ送り --- */
  const now  = new Date();
  const half = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

  if (pageList) {
    const visible = items.filter(n => n.date && n.date >= half);
    const PER_PAGE = 10;
    const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE));

    /* 一覧の直後にページ送り用のコンテナを用意（無ければ作る） */
    let pager = document.getElementById('news-pager');
    if (!pager) {
      pager = document.createElement('div');
      pager.id = 'news-pager';
      pager.className = 'news-pager';
      pageList.after(pager);
    }

    /* 1記事分のHTML（1週間以内は NEW バッジ） */
    function newsPageItemHtml(n) {
      const inner = `
        <time class="news-page-date">${escapeHtml(n.displayDate)}</time>
        <span class="cat-tag ${newsCatClass(n.category)}">${escapeHtml(n.category)}</span>
        <span class="news-page-title">${escapeHtml(n.title)}${newsNewBadge(n)}</span>`;
      if (n.link) {
        return `<a href="${escapeHtml(n.link)}" class="news-page-item fade-up">${inner}</a>`;
      }
      return `<div class="news-page-item news-page-item--plain fade-up">${inner}</div>`;
    }

    /* ページ送りボタンのHTMLを組み立てる（前へ・番号・次へ）。
       ページ数が多いときは現在ページの周辺と両端だけを出し、
       間は「…」で省略する。 */
    function buildPagerHtml(current) {
      if (pageCount <= 1) return '';
      const parts = [];
      parts.push(`<button data-page="${current - 1}" ${current === 1 ? 'disabled' : ''} aria-label="前のページ">‹</button>`);

      const nums = [];
      for (let p = 1; p <= pageCount; p++) {
        if (p === 1 || p === pageCount || (p >= current - 1 && p <= current + 1)) {
          nums.push(p);
        } else if (nums[nums.length - 1] !== '…') {
          nums.push('…');
        }
      }
      nums.forEach(p => {
        if (p === '…') {
          parts.push('<span class="news-pager-ellipsis">…</span>');
        } else {
          parts.push(`<button data-page="${p}" class="${p === current ? 'active' : ''}" aria-label="${p}ページ目"${p === current ? ' aria-current="page"' : ''}>${p}</button>`);
        }
      });

      parts.push(`<button data-page="${current + 1}" ${current === pageCount ? 'disabled' : ''} aria-label="次のページ">›</button>`);
      return parts.join('');
    }

    function renderNewsPage(page) {
      if (!visible.length) {
        pageList.innerHTML = '<p class="news-empty">現在、直近6ヶ月以内のニュースはありません。</p>';
        pager.innerHTML = '';
        return;
      }
      const p = Math.min(Math.max(1, page), pageCount);
      const start = (p - 1) * PER_PAGE;
      const slice = visible.slice(start, start + PER_PAGE);
      pageList.innerHTML = slice.map(newsPageItemHtml).join('');
      observeFadeUp(pageList);
      pager.innerHTML = buildPagerHtml(p);
      pager.dataset.current = String(p);
    }

    /* ページ番号クリックで切り替え＋一覧の先頭へスクロール */
    pager.addEventListener('click', e => {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      const page = Number(btn.dataset.page);
      if (!page) return;
      renderNewsPage(page);
      const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68;
      const top = pageList.getBoundingClientRect().top + window.scrollY - headerH - 24;
      window.scrollTo({ top, behavior: 'smooth' });
    });

    renderNewsPage(1);
  }

  /* --- 整理用ページ（/news/maintenance/）：期限切れの削除リスト --- */
  if (maintList) {
    const expired = items.filter(n => !n.date || n.date < half);
    if (!expired.length) {
      maintList.innerHTML = '<p class="news-empty">✅ 期限切れ（6ヶ月以上前）のニュースはありません。整理は不要です。</p>';
      return;
    }
    maintList.innerHTML = expired.map(n => {
      /* content/news.txt から削除すべきブロックをそのまま提示する */
      const block = Object.entries(n.raw)
        .map(([k, v]) => `${k}：${Array.isArray(v) ? v.join(' ') : v}`)
        .join('\n');
      const folder = (n.link && n.link.startsWith('/news/'))
        ? `<p class="maint-folder">🗂 記事ページも削除する場合：<code>${escapeHtml(n.link.replace(/^\//, ''))}</code> フォルダごと削除</p>`
        : '';
      return `<div class="maint-item fade-up">
        <p class="maint-head">
          <time>${escapeHtml(n.displayDate)}</time>
          <span class="cat-tag ${newsCatClass(n.category)}">${escapeHtml(n.category)}</span>
          <span class="maint-title">${escapeHtml(n.title)}</span>
        </p>
        <p class="maint-note">↓ content/news.txt からこのブロック（前後の「---」の間）を削除してください</p>
        <pre class="maint-block">${escapeHtml(block)}</pre>
        ${folder}
      </div>`;
    }).join('');
    observeFadeUp(maintList);
  }
}

/* ============================================================
   起動
   ============================================================ */
/* 各セクションを独立して実行する。
   どれか1つでエラーが起きても（txt の書式ミスなど）、他のセクションや
   ページ全体は巻き込まれず、そのまま表示され続ける。 */
function runSafely(name, fn) {
  Promise.resolve().then(fn).catch(err => {
    console.warn(`[content] ${name} の表示中にエラーが発生しました`, err);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  runSafely('site.txt',    applySite);
  runSafely('coach.txt',   applyCoach);
  runSafely('members.txt', applyMembers);
  runSafely('schedule.txt', applyPracticeDays);
  runSafely('ekiden.txt',  applyEkiden);
  runSafely('news.txt',    applyNews);
});
