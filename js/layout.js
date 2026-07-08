'use strict';
/* ============================================================
   layout.js  —  ヘッダー・フッターの一括管理ファイル
   ------------------------------------------------------------
   ★ ヘッダー／フッターを直したいときは、この 1 ファイルだけを
     編集してください。全ページ（トップ・部員紹介・記録 …）に
     自動で反映されます。
   ★ 各ページ側には次の 2 行だけを置いています（編集不要）：
        <div id="site-header"></div>   … ヘッダーが入る場所
        <div id="site-footer"></div>   … フッターが入る場所
   ------------------------------------------------------------
   読み込み順（各HTMLの <body> 末尾）：
     layout.js → content-loader.js → main.js
   layout.js が最初に走ってヘッダー／フッターを挿入するので、
   その後の main.js（ハンバーガー・スクロール制御など）や
   content-loader.js（SNS名の差し替え）が正しく動作します。
   ============================================================ */

/* ---------- ① ヘッダー（グローバルナビ＋スマホ用メニュー） ---------- */
var SITE_HEADER_HTML = `
<header class="site-header">
  <div class="header-inner">
    <!-- ロゴ（左端）。白い角丸枠は css の「.site-logo」で付けています。
         大きさを変えたいときは css の「.site-logo img { height: … }」を調整。 -->
    <a href="/" class="site-logo" aria-label="愛知工業大学 陸上競技部 トップへ">
      <img src="/images/logo.png" alt="愛知工業大学 陸上競技部">
    </a>
    <button class="hamburger" id="hamburger" aria-label="メニューを開く" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="global-nav" aria-label="グローバルナビゲーション">
      <ul>
        <li><a href="/">トップ</a></li>
        <li><a href="/news/">ニュース</a></li>
        <li><a href="/members">部員紹介</a></li>
        <li><a href="/schedule">練習スケジュール</a></li>
        <li class="has-dropdown">
          <a href="/records">記録</a>
          <ul class="dropdown">
            <li><a href="/records/results">大会結果</a></li>
            <li><a href="/records/personal">自己ベスト記録</a></li>
            <li><a href="/records/history">歴代記録</a></li>
          </ul>
        </li>
        <li><a href="/contact">お問い合わせ</a></li>
      </ul>
    </nav>
  </div>
</header>
<nav class="mobile-nav" id="mobile-nav" aria-label="モバイルナビゲーション">
  <ul>
    <li><a href="/">トップ</a></li>
    <li><a href="/news/">ニュース</a></li>
    <li><a href="/members">部員紹介</a></li>
    <li><a href="/schedule">練習スケジュール</a></li>
    <li>
      <a href="/records">記録</a>
      <div class="mobile-sub">
        <a href="/records/results">大会結果</a>
        <a href="/records/personal">自己ベスト記録</a>
        <a href="/records/history">歴代記録</a>
      </div>
    </li>
    <li><a href="/contact">お問い合わせ</a></li>
  </ul>
</nav>`;

/* ---------- ② フッター（サイトマップ・SNS・QR・コピーライト） ---------- */
var SITE_FOOTER_HTML = `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <p class="f-nav-title">サイトマップ</p>
        <nav class="f-nav-links">
          <a href="/">トップ</a>
          <a href="/news/">ニュース</a>
          <a href="/members">部員紹介</a>
          <a href="/schedule">練習スケジュール</a>
          <a href="/records">記録</a>
          <a href="/records/results" class="sub">大会結果</a>
          <a href="/records/personal" class="sub">自己ベスト記録</a>
          <a href="/records/history" class="sub">歴代記録</a>
          <a href="/contact">お問い合わせ</a>
        </nav>
      </div>
      <div>
        <p class="f-nav-title">SNS</p>
        <div class="f-sns">
          <a href="https://x.com/iko_dai_ld" target="_blank" rel="noopener noreferrer" class="f-sns-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            @iko_dai_ld
          </a>
          <a href="https://www.instagram.com/ait_runners" target="_blank" rel="noopener noreferrer" class="f-sns-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            @ait_runners
          </a>
        </div>
        <div class="f-qr">
          <div class="f-qr-item">
            <img src="/images/qr-x.png" alt="X QRコード" width="96" height="96" style="border-radius:8px;">
            <p class="f-qr-label">X</p>
          </div>
          <div class="f-qr-item">
            <img src="/images/qr-instagram.png" alt="Instagram QRコード" width="96" height="96" style="border-radius:8px;">
            <p class="f-qr-label">Instagram</p>
          </div>
        </div>
      </div>
    </div>
    <div class="f-copy"><p>© 2026 愛知工業大学 陸上競技部 All Rights Reserved.</p></div>
  </div>
</footer>
<!-- ページ上部へ戻るボタン（全ページ共通）。
     見た目は css の「.to-top」、出現タイミングは main.js の「TOTOP_SHOW_AT」で調整。 -->
<button class="to-top" id="to-top" aria-label="ページ上部へ戻る">↑</button>`;

/* ---------- ③ 挿入処理（触る必要はありません） ---------- */
(function insertLayout() {
  var headerMount = document.getElementById('site-header');
  if (headerMount) headerMount.outerHTML = SITE_HEADER_HTML;

  var footerMount = document.getElementById('site-footer');
  if (footerMount) footerMount.outerHTML = SITE_FOOTER_HTML;
})();

/* ---------- ④ 起動スプラッシュ（触る必要はありません） ----------
   ・そのセッション（＝ブラウザでサイトを開いてから閉じるまで）で
     最初の1回だけ、紫の全画面＋中央ロゴのアニメーションを表示する。
   ・ヘッダーのロゴをタップしたときも再生してからトップへ移動する。
   ・OSの「視差効果を減らす」設定の人には表示しない（酔い・負担への配慮）。
   【調整】表示時間を変えたいとき：下の SPLASH_TOTAL_MS（全体）を変更 */
(function appSplash() {
  var SPLASH_TOTAL_MS = 1400;   /* 全体の表示時間（ミリ秒） */
  var NAV_DELAY_MS    = 700;    /* ロゴタップ時、何ms後にトップへ移動するか */

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function buildSplash() {
    var el = document.createElement('div');
    el.id = 'app-splash';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="app-splash-center">' +
      '  <span class="app-splash-ring"></span>' +
      '  <span class="app-splash-tile"><img src="/images/logo.png" alt=""></span>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  function play() {
    if (reduceMotion) return;
    var el = document.getElementById('app-splash') || buildSplash();
    el.classList.remove('is-playing');
    void el.offsetWidth;              /* 再生し直せるようリフロー */
    el.classList.add('is-playing');
    setTimeout(function () { el.remove(); }, SPLASH_TOTAL_MS);
  }

  /* 1) セッション最初の1回だけ自動再生 */
  var KEY = 'ait-splash-shown';
  var shown = false;
  try { shown = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  if (!shown && !reduceMotion) {
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    play();
  }

  /* 2) ヘッダーのロゴをタップ→再生してからトップへ */
  var logo = document.querySelector('.site-logo');
  if (logo) {
    logo.addEventListener('click', function (e) {
      if (reduceMotion) return;       /* 設定者は通常どおり即移動 */
      e.preventDefault();
      play();
      setTimeout(function () { window.location.href = '/'; }, NAV_DELAY_MS);
    });
  }
})();
