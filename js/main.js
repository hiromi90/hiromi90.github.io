'use strict';
/* ============================================================
   愛知工業大学 陸上競技部 — main.js
   ============================================================ */

let hiddenShortPlayers = new Set();
let hiddenLongPlayers = new Set();

/* ----------------------------------------------------------
   1. Hamburger Menu
   ---------------------------------------------------------- */
(function () {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mobile-nav');
  if (!btn || !nav) return;

  // メニューを開く／閉じる
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    btn.classList.toggle('is-active', open);
    btn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';   // 背景のスクロールを止める
    document.body.classList.toggle('nav-open', open);       // 開いている間はロゴを隠す（css 側で制御）
  });

  // メニュー内のリンクを押したら閉じる
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      document.body.classList.remove('nav-open');
    });
  });
})();

/* ----------------------------------------------------------
   2. Highlight current nav item
   ---------------------------------------------------------- */
(function () {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  // 親ナビ：一致するページの <li> に .current（「記録」は子ページ閲覧中も付く）
  document.querySelectorAll('.global-nav > ul > li').forEach(li => {
    const a = li.querySelector('a');
    if (!a) return;
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    if (href === path || (href !== '/' && path.startsWith(href))) {
      li.classList.add('current');
    }
  });
  // ドロップダウン内：いま見ている子ページ（大会結果など）のリンクにも .current
  document.querySelectorAll('.global-nav .dropdown a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    if (href !== '/' && path.startsWith(href)) a.classList.add('current');
  });
})();

/* ----------------------------------------------------------
   3. Smooth scroll for hash links
   ---------------------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerH - 20, behavior: 'smooth' });
  });
});

/* ----------------------------------------------------------
   4. Block nav (Members page: scroll to section)
   ---------------------------------------------------------- */
document.querySelectorAll('[data-scroll-to]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.scrollTo);
    if (!target) return;
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerH - 28, behavior: 'smooth' });
    btn.closest('.block-nav').querySelectorAll('.block-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* ----------------------------------------------------------
   5. Tab switching (Personal Records page)
   ---------------------------------------------------------- */
(function () {
  const tabs = document.querySelectorAll('.tab-btn');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === tab.dataset.tab);
      });
    });
  });
})();

/* ----------------------------------------------------------
   6. Year nav (Results page)
   ---------------------------------------------------------- */
(function () {
  const btns = document.querySelectorAll('.year-btn');
  if (!btns.length) return;
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.year-section').forEach(s => {
        s.classList.toggle('active', s.id === `year-${btn.dataset.year}`);
      });
    });
  });
})();

/* ----------------------------------------------------------
   7. Intersection Observer — Fade-up animation
   ---------------------------------------------------------- */
(function () {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
  document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
})();

/* ----------------------------------------------------------
   8. Members page
   ※ 部員カードの生成・クリックモーダルは content-loader.js が
     content/members.txt を読み込んで担当します（ここでは何もしません）。
   ---------------------------------------------------------- */

/* ----------------------------------------------------------
   9. ページ上部へ戻るボタン（全ページ共通）
   ------------------------------------------------------------
   ボタン本体は layout.js（フッターの下）にあり、見た目は
   css の「.to-top」で設定しています。ここでは
   「いつ現れるか」と「押したら上に戻る」動作だけを担当します。
   ---------------------------------------------------------- */
/* 【調整】何pxスクロールしたらボタンが現れるか。
   ・数字を大きくする → もっとスクロールしないと出てこない
   ・0 にする → 最初から常に表示 */
const TOTOP_SHOW_AT = 300;

(function () {
  const btn = document.getElementById('to-top');
  if (!btn) return;

  // スクロール量に応じて表示・非表示を切り替え
  let ticking = false;
  function update() {
    btn.classList.toggle('is-visible', window.scrollY > TOTOP_SHOW_AT);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  update();   // 読み込み直後の状態も反映（途中位置で再読み込みした場合など）

  // クリックで最上部へスムーズスクロール
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ----------------------------------------------------------
   10.-11. ニュース表示（トップページ・ニュースページ）
   ※ content/news.txt を content-loader.js が読み込んで描画します
     （ここでは何もしません）。記事の追加は content/news.txt へ。
   ---------------------------------------------------------- */


/* ----------------------------------------------------------
   12. Apps Script history
   ---------------------------------------------------------- */
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbyShgvD8-Ay4R533SqcwKEF_iy0j01fZ4yPcf39x1Pfbx1EjVPde3DTrP5TgLPw0AYM/exec";

let rankingData = [];
let currentRank = 1;

async function loadRankingData() {
  try {
    const response = await fetch(
      `${GAS_URL}?t=${Date.now()}`
    );

    if (!response.ok) throw new Error(`サーバーエラー (${response.status})`);

    const data = await response.json();

    if (data && data.error) throw new Error(data.error);

    rankingData = Array.isArray(data) ? data : [];

    renderTable(currentRank);

    const update =
    document.getElementById(
      "last-update"
    );

    if (update) {
      update.textContent =
        `最終更新：${new Date().toLocaleString("ja-JP")}`;
    }

    console.log(
      `データ更新：${new Date().toLocaleTimeString()}`
    );
    } catch (error) {
      console.error("データ取得エラー", error);
      const container = document.getElementById("ranking-table");
      if (container) {
        container.innerHTML = `<p class="records-error">記録データを読み込めませんでした。<br>
          しばらくしてから再読み込みしてください。<br>
          <span style="font-size:12px;color:var(--sub);">（${error.message}）</span></p>`;
      }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const rankingTable = document.getElementById("ranking-table");

  if (!rankingTable) return;

  /* 読み込み完了までメッセージを表示（描画時に自動で消える） */
  rankingTable.innerHTML =
    `<p class="records-loading">表示には少し時間がかかる場合がございます。</p>`;

  loadRankingData();
  setInterval(loadRankingData, 600000);
});

function renderTable(rank) {
  const container = document.getElementById("ranking-table");

  if (!container) return;

  let html = `
  <div class="table-wrap">
    <table class="records-table">
      <thead>
        <tr>
          <th>距離</th>
          <th>タイム</th>
          <th>氏名</th>
          <th>樹立年度</th>
        </tr>
      </thead>
      <tbody>
  `;

  rankingData.forEach(row => {
    let time = "";
    let name = "";
    let year = "";

    if (rank === 1) {
      time = row.firstTime;
      name = row.firstName;
      year = row.firstYear;
    }

    if (rank === 2) {
      time = row.secondTime;
      name = row.secondName;
      year = row.secondYear;
    }

    if (rank === 3) {
      time = row.thirdTime;
      name = row.thirdName;
      year = row.thirdYear;
    }

    if (rank === 4) {
      time = row.fourthTime;
      name = row.fourthName;
      year = row.fourthYear;
    }

    html += `
      <tr>
        <td class="distance-cell">${row.distance}</td>
        <td class="time-cell">${time ?? ""}</td>
        <td class="name-cell">${name ?? ""}</td>
        <td class="year-cell">${year ?? ""}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  </div>
  `;

  container.innerHTML = html;
}

document.addEventListener("click", e => {
  const container = document.getElementById("ranking-table");
  if (!container) return;

  if (!e.target.classList.contains("rank-btn")) return;

  document
    .querySelectorAll(".rank-btn")
    .forEach(btn => btn.classList.remove("active"));

  e.target.classList.add("active");

  currentRank = Number(e.target.dataset.rank);

  renderTable(currentRank);
});


/* ----------------------------------------------------------
   13. Apps Script personal
   ---------------------------------------------------------- */
const PERSONAL_URL =
  "https://script.google.com/macros/s/AKfycbzok4lJyytHzfGh935TRNwt-TqhRFIPTPacq_7cBqyN268AMDixzyGqK64t-Lco3bz_cg/exec";

/* データ取得の共通処理（失敗しても止まらない・空でも落ちない） */
async function fetchSheetJson(sheetName) {
  const res = await fetch(`${PERSONAL_URL}?sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`);
  if (!res.ok) throw new Error(`サーバーエラー (${res.status})`);
  const data = await res.json();
  if (data && data.error) throw new Error(data.error);
  return Array.isArray(data) ? data : [];
}

function showPersonalError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<p class="records-error">記録データを読み込めませんでした。<br>
    しばらくしてから再読み込みしてください。<br>
    <span style="font-size:12px;color:var(--sub);">（${message}）</span></p>`;
}

let personalShortData = [];

async function loadPersonalShortData() {
  try {
    personalShortData = await fetchSheetJson("短距離");
    renderPersonalTable(personalShortData, "personal-short-table");
    const update = document.getElementById("personal-short-update");
    if (update) update.textContent = `最終更新：${new Date().toLocaleString("ja-JP")}`;
  } catch (error) {
    console.error("短距離データ取得エラー", error);
    showPersonalError("personal-short-table", error.message);
  }
}

let personalLongData = [];

async function loadPersonalLongData() {
  try {
    personalLongData = await fetchSheetJson("長距離");
    renderPersonalTable(personalLongData, "personal-long-table");
    const update = document.getElementById("personal-long-update");
    if (update) update.textContent = `最終更新：${new Date().toLocaleString("ja-JP")}`;
  } catch (error) {
    console.error("長距離データ取得エラー", error);
    showPersonalError("personal-long-table", error.message);
  }
}

function renderPersonalTable(
  data,
  containerId
) {
  const container =
    document.getElementById(containerId);

  if (!container) return;

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = `<p class="records-empty">まだ記録が登録されていません。</p>`;
    return;
  }

  const headers =
    Object.keys(data[0]);

  let html = `
    <div class="table-wrap">
      <table class="records-table">
        <thead>
          <tr>
  `;

  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  data.forEach(row => {

    const player =
      row["氏名（学年）"];

    let hiddenSet;

if (containerId === "personal-short-table") {
  hiddenSet = hiddenShortPlayers;
} else {
  hiddenSet = hiddenLongPlayers;
}

if (hiddenSet.has(player)) {
  return;
}

    html += "<tr>";

    headers.forEach(header => {

      if (header === "氏名（学年）") {

        const player = row[header] ?? "";

        html += `
          <td class="player-cell">
            <span>${player}</span>

            <button
              class="hide-player-btn"
              data-player="${player}"
            >
              非表示
            </button>
          </td>
        `;
      }
      else {
        html += `
          <td>${row[header] ?? ""}</td>
        `;
      }
    });

    html += "</tr>";
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const shortTable = document.getElementById("personal-short-table");
    if (shortTable) {
      /* 読み込み完了までメッセージを表示（描画時に自動で消える） */
      shortTable.innerHTML =
        `<p class="records-loading">表示には少し時間がかかる場合がございます。</p>`;
      loadPersonalShortData();
      setInterval(
        loadPersonalShortData,
        600000
      );
    }

    const longTable = document.getElementById("personal-long-table");
    if (longTable) {
      longTable.innerHTML =
        `<p class="records-loading">表示には少し時間がかかる場合がございます。</p>`;
      loadPersonalLongData();
      setInterval(
        loadPersonalLongData,
        600000
      );
    }
  }
);

document.addEventListener("click", e => {

  if (
    !e.target.classList.contains(
      "hide-player-btn"
    )
  ) {
    return;
  }

  const player =
    e.target.dataset.player;

  if (
  e.target.closest("#personal-short-table")
) {
  hiddenShortPlayers.add(player);
}
else if (
  e.target.closest("#personal-long-table")
) {
  hiddenLongPlayers.add(player);
}

  if (
  e.target.closest("#personal-short-table")
) {
  hiddenShortPlayers.add(player);

  renderHiddenPlayers(
    hiddenShortPlayers,
    "hidden-short-list",
    "short"
  );

  loadPersonalShortData();
}
else if (
  e.target.closest("#personal-long-table")
) {
  hiddenLongPlayers.add(player);

  renderHiddenPlayers(
    hiddenLongPlayers,
    "hidden-long-list",
    "long"
  );

  loadPersonalLongData();
}
});

function renderHiddenPlayers(
  hiddenSet,
  listId,
  type
) {
  const list =
    document.getElementById(listId);

  if (!list) return;

  if (hiddenSet.size === 0) {
    list.innerHTML =
      `<p>非表示の選手はいません</p>`;
    return;
  }

  let html = "";

  hiddenSet.forEach(player => {
    html += `
      <div class="hidden-player-item">
        👤 ${player}
        <button
          class="restore-btn"
          data-player="${player}"
          data-type="${type}"
        >
          再表示
        </button>
      </div>
    `;
  });

  list.innerHTML = html;
}

renderHiddenPlayers(
  hiddenShortPlayers,
  "hidden-short-list",
  "short"
);

renderHiddenPlayers(
  hiddenLongPlayers,
  "hidden-long-list",
  "long"
);

document.addEventListener(
  "click",
  e => {

    if (
      !e.target.classList.contains(
        "restore-btn"
      )
    ) {
      return;
    }

    const player =
      e.target.dataset.player;

    const type =
      e.target.dataset.type;

    if (type === "short") {
      hiddenShortPlayers.delete(player);

      loadPersonalShortData();

      renderHiddenPlayers(
        hiddenShortPlayers,
        "hidden-short-list",
        "short"
      );
    }
    else {
      hiddenLongPlayers.delete(player);

      loadPersonalLongData();

      renderHiddenPlayers(
        hiddenLongPlayers,
        "hidden-long-list",
        "long"
      );
    }
  }
);

/* ----------------------------------------------------------
   14. Results page (大会結果) — GAS方式・年度別
   ※ 年度とGASのURLは content/results.txt で管理します
     （メモ帳で編集できます。jsファイルの編集は不要です）。
   ※ 大会は「シート名に書かれた開催日」の新しい順に
     自動で上から表示されます。タブを足す位置は自由です。
   ---------------------------------------------------------- */
(async function () {
  const nav = document.getElementById("results-year-nav");
  const content = document.getElementById("results-content");
  if (!nav || !content) return;

  /* --- content/results.txt を読み込んで「年度：URL」を取り出す --- */
  let years = [];
  try {
    const res = await fetch(`/content/results.txt?t=${Date.now()}`);
    if (!res.ok) throw new Error(`results.txt が読み込めません (${res.status})`);
    const text = await res.text();
    years = text.split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("#"))
      .map(l => {
        const idx = l.search(/[：:]/);
        if (idx === -1) return null;
        return { year: l.slice(0, idx).trim(), url: l.slice(idx + 1).trim() };
      })
      .filter(y => y && /^\d{4}$/.test(y.year));
  } catch (e) {
    console.error("results.txt 読み込みエラー", e);
    content.innerHTML = `<p class="records-error">年度の設定が読み込めませんでした<br>（content/results.txt を確認してください）。</p>`;
    return;
  }

  if (!years.length) {
    content.innerHTML = `<p class="records-error">年度の設定が見つかりません（content/results.txt に「2026：URL」の形で書いてください）。</p>`;
    return;
  }

  /* 年度は書いた順に関わらず、新しい年度が先頭になるよう自動で並べ替え */
  years.sort((a, b) => Number(b.year) - Number(a.year));

  const cache = {};

  /* 年度ボタンを生成 */
  nav.innerHTML = years.map((y, i) =>
    `<button class="year-btn${i === 0 ? " active" : ""}" data-year="${y.year}">${y.year}年度</button>`
  ).join("");

  nav.addEventListener("click", e => {
    const btn = e.target.closest(".year-btn");
    if (!btn) return;
    nav.querySelectorAll(".year-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    showYear(btn.dataset.year);
  });

  function findYear(year) {
    return years.find(y => String(y.year) === String(year));
  }

  async function showYear(year) {
    const cfg = findYear(year);
    if (!cfg) return;

    if (cache[year]) { renderResults(cache[year], year); return; }

    if (!cfg.url) {
      content.innerHTML = resultsPlaceholder(year);
      return;
    }

    content.innerHTML = `<p class="records-loading">表示には少し時間がかかる場合がございます。</p>`;
    try {
      const res = await fetch(`${cfg.url}?t=${Date.now()}`);
      if (!res.ok) throw new Error(`サーバーエラー (${res.status})`);
      const data = await res.json();
      if (data && data.error) throw new Error(data.error);
      const sheets = Array.isArray(data) ? data : [];
      cache[year] = sheets;
      renderResults(sheets, year);
    } catch (error) {
      console.error("大会結果取得エラー", error);
      content.innerHTML = `<p class="records-error">${year}年度の大会結果を読み込めませんでした。<br>
        しばらくしてから再読み込みしてください。<br>
        <span style="font-size:12px;color:var(--sub);">（${error.message}）</span></p>`;
    }
  }

  function resultsPlaceholder(year) {
    return `<div class="embed-ph">
      <div class="embed-ph-icon">📊</div>
      <h3>${year}年度のスプレッドシートが未設定です</h3>
      <p>${year}年度用のスプレッドシートを作成・公開し、GASのURLを<br>
      content/results.txt に追加してください。</p>
    </div>`;
  }

  /* シート名 → { 大会名, メタ(日付｜場所) } を取り出す */
  function parseCompTitle(title) {
    title = String(title || "").trim();
    let rest = title, place = "";
    const pipeIdx = title.search(/[｜|]/);
    if (pipeIdx !== -1) {
      rest = title.slice(0, pipeIdx).trim();
      place = title.slice(pipeIdx + 1).trim();
    }
    let name = rest, date = "";
    const m = rest.match(/^(.*?)[\s　]+(\d{4}年.*)$/);
    if (m) { name = m[1].trim(); date = m[2].trim(); }
    return { name, meta: [date, place].filter(Boolean).join("｜") };
  }

  const onlyDigits = s => String(s == null ? "" : s).replace(/[^0-9]/g, "");

  /* シート名の開催日「2026年3月28日」等 → Date（読めなければ null） */
  function parseCompDate(title) {
    const m = String(title || "").match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  /* 大会を「開催日の新しい順」に並べ替える。
     日付が読めない大会は末尾に回し、タブの右側にあるもの
     （＝新しく追加したもの）を先に表示する。 */
  function sortSheetsByDate(sheets) {
    return sheets
      .map((s, i) => ({ s, i, d: parseCompDate(s.sheet || s.name || "") }))
      .sort((a, b) => {
        if (a.d && b.d) return b.d - a.d;   // 新しい日付が先
        if (a.d) return -1;                  // 日付ありが先
        if (b.d) return 1;
        return b.i - a.i;                    // 日付なし同士：右のタブが先
      })
      .map(x => x.s);
  }

  function renderResults(sheets, year) {
    if (!sheets.length) {
      content.innerHTML = `<p class="records-empty">${year}年度の大会結果はまだ登録されていません。</p>`;
      return;
    }

    sheets = sortSheetsByDate(sheets);

    content.innerHTML = sheets.map(sheet => {
      const title = parseCompTitle(sheet.sheet || sheet.name || "");
      const rows = Array.isArray(sheet.data) ? sheet.data : [];

      const head = `<div class="comp-head fade-up">
        <p class="comp-name">${escapeResultHtml(title.name)}</p>
        ${title.meta ? `<p class="comp-meta">${escapeResultHtml(title.meta)}</p>` : ""}
      </div>`;

      if (!rows.length) {
        return head + `<p class="records-empty" style="margin-bottom:30px;">この大会のデータはまだ入力されていません。</p>`;
      }

      const headers = Object.keys(rows[0]);
      const rankKey = headers.find(h => h.includes("順位"));
      const pbKey = headers.find(h => /PB|SB/i.test(h));

      const thead = headers.map(h => `<th>${escapeResultHtml(h)}</th>`).join("");

      const tbody = rows.map(row => {
        const isFirst = rankKey && onlyDigits(row[rankKey]) === "1";
        const cells = headers.map(h => {
          let v = row[h];
          if (h === rankKey && isFirst) {
            return `<td><span class="badge badge-gold">🥇 ${escapeResultHtml(v)}</span></td>`;
          }
          if (h === pbKey) {
            const t = String(v == null ? "" : v).trim().toUpperCase();
            if (t === "PB" || t === "SB") {
              return `<td><span class="badge badge-gold">${escapeResultHtml(t)}</span></td>`;
            }
          }
          return `<td>${escapeResultHtml(v)}</td>`;
        }).join("");
        return `<tr${isFirst ? ' class="badge-rank1-row"' : ""}>${cells}</tr>`;
      }).join("");

      return head +
        `<p class="scroll-hint">← 横にスクロールできます →</p>
         <div class="table-wrap fade-up" style="margin-bottom:36px;">
           <table class="records-table">
             <thead><tr>${thead}</tr></thead>
             <tbody>${tbody}</tbody>
           </table>
         </div>`;
    }).join("");

    /* fade-up 発火 */
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
      }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
      content.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
    } else {
      content.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    }
  }

  function escapeResultHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* 起動：最新（先頭）年度を表示 */
  if (years.length) showYear(years[0].year);
})();

/* ----------------------------------------------------------
   15. 埋め込みiframeの読み込み中メッセージ制御
   ------------------------------------------------------------
   .embed-frame[data-embed-loading] 内の iframe が読み込み終わったら
   .is-loaded を付けて「表示には少し時間が…」メッセージを消す。
   万一 load が発火しない場合に備えて、一定時間後に強制解除する。
   ---------------------------------------------------------- */
(function () {
  const wraps = document.querySelectorAll('.embed-frame[data-embed-loading]');
  wraps.forEach(wrap => {
    const iframe = wrap.querySelector('iframe');
    if (!iframe) { wrap.classList.add('is-loaded'); return; }

    const done = () => wrap.classList.add('is-loaded');

    if (iframe.addEventListener) {
      iframe.addEventListener('load', done, { once: true });
    }
    /* フォールバック：10秒経ったらメッセージを消す */
    setTimeout(done, 10000);
  });
})();

/* ============================================================
   12. コンテンツ保護（抑止）
   ------------------------------------------------------------
   画像の右クリック保存・ドラッグ保存を防ぐ。
   文字の選択禁止・iPhone長押し禁止は css/style.css 側で設定。
   ※スクリーンショット等までは防げません（静的サイトの技術的限界）。
   ============================================================ */
(function () {
  /* 画像上の右クリックメニューを出さない */
  document.addEventListener('contextmenu', e => {
    if (e.target.closest('img, .hero-bg, .member-avatar')) e.preventDefault();
  });
  /* 画像のドラッグ開始を止める（デスクトップでのドラッグ保存対策） */
  document.addEventListener('dragstart', e => {
    if (e.target.closest('img')) e.preventDefault();
  });
})();
