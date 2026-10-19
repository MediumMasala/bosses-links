import type { Link } from "./db";
import { TALBOSS_LOGO_SVG } from "./talboss-logo";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const AUTO_PRESS_MS = 2000;

export function renderInterstitial(link: Link): string {
  return link.template === "talboss"
    ? renderTalBoss(link)
    : renderBossesOfBangalore(link);
}

// Original orange page, unchanged
function renderBossesOfBangalore(link: Link): string {
  const eyebrow = escapeHtml(link.eyebrow);
  const brand = escapeHtml(link.brand);
  const badge = escapeHtml(link.badge);
  const buttonLabel = escapeHtml(link.button_label);
  const redirectUrlJson = JSON.stringify(link.redirect_url);
  const titleText = brand
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const ogDesc = `You're about to join ${brand} (${badge}). With love, by Tal.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<title>${titleText}</title>
<meta name="description" content="${ogDesc}" />
<meta property="og:title" content="${titleText}" />
<meta property="og:description" content="${ogDesc}" />
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;height:100%;background:#FF6B1A;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .stage{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:0 24px;background:linear-gradient(165deg,#FF8A3D 0%,#FF6B1A 52%,#EF5A0C 100%)}
  .glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(115% 75% at 50% 12%,rgba(255,255,255,0.22),rgba(255,255,255,0) 58%)}
  .col{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:40px;width:100%;max-width:384px}
  .head{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
  .eyebrow{color:rgba(255,255,255,0.85);font-size:16px;font-weight:500;letter-spacing:0.01em;margin:0}
  .brand{color:#fff;font-weight:900;text-transform:lowercase;letter-spacing:-0.02em;line-height:0.92;font-size:2.85rem;margin:0}
  @media (min-width:640px){.brand{font-size:3.75rem}}
  .badge{display:inline-flex;align-items:center;border-radius:9999px;background:#000;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;padding:4px 14px;box-shadow:0 1px 2px rgba(0,0,0,0.08)}
  .cta-wrap{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%}
  .cta{position:relative;width:100%;height:68px;overflow:hidden;border-radius:9999px;background:#000;display:flex;align-items:center;justify-content:center;gap:10px;border:0;cursor:pointer;color:#fff;font:inherit;user-select:none;box-shadow:0 10px 25px -8px rgba(0,0,0,0.4);transition:transform 180ms cubic-bezier(0.22,1,0.36,1)}
  .cta.pressed{transform:scale(0.98)}
  .cta .fill{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,0.15);pointer-events:none;transition:width 2000ms linear}
  .cta .fill.fast{transition:width 180ms linear}
  .cta .icon{position:relative;z-index:1;width:20px;height:20px;color:#fff}
  .cta .lbl{position:relative;z-index:1;color:#fff;font-size:17px;font-weight:600;letter-spacing:0.01em}
  .sign{display:flex;align-items:center;gap:6px;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:0.01em;margin:0}
  .sign svg{width:14px;height:14px;color:rgba(255,255,255,0.9)}
  .rise{opacity:0;transform:translateY(14px);transition:opacity 700ms ease,transform 700ms cubic-bezier(0.22,1,0.36,1)}
  .rise.in{opacity:1;transform:translateY(0)}
  .rise.d60{transition-delay:60ms}
  .rise.d140{transition-delay:140ms}
  .rise.d240{transition-delay:240ms}
  .rise.d360{transition-delay:360ms}
</style>
</head>
<body>
<div class="stage">
  <div class="glow"></div>
  <div class="col">
    <div class="head">
      <p class="eyebrow rise d60">${eyebrow}</p>
      <h1 class="brand rise d140">${brand}</h1>
      <span class="badge rise d240">${badge}</span>
    </div>
    <div class="cta-wrap rise d360">
      <button id="cta" type="button" class="cta" aria-label="${buttonLabel}">
        <span id="fill" class="fill"></span>
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.2 4.79 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.2-8.24 8.2zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>
        <span class="lbl">${buttonLabel}</span>
      </button>
      <p class="sign">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-6.72-4.35-9.34-8.08C.58 9.88 1.4 6.49 4.2 5.4c1.9-.74 3.86.05 5 1.66L12 9.9l2.8-2.84c1.14-1.61 3.1-2.4 5-1.66 2.8 1.09 3.62 4.48 1.54 7.52C18.72 16.65 12 21 12 21z"/></svg>
        with love, by Tal
      </p>
    </div>
  </div>
</div>
<script>
(function(){
  var REDIRECT = ${redirectUrlJson};
  var ua = navigator.userAgent || "";
  // Mobile skips the interstitial and goes straight to the link
  if (/Android|iPhone|iPad|iPod/i.test(ua)) {
    window.location.href = REDIRECT;
    return;
  }
  // Desktop: branded interstitial with auto-press
  document.querySelectorAll('.rise').forEach(function(el){
    requestAnimationFrame(function(){ el.classList.add('in'); });
  });
  var fired = false;
  var cta = document.getElementById('cta');
  var fill = document.getElementById('fill');
  function go(){
    if (fired) return;
    fired = true;
    fill.classList.add('fast');
    fill.style.width = '100%';
    cta.classList.add('pressed');
    setTimeout(function(){ window.location.href = REDIRECT; }, 200);
  }
  cta.addEventListener('click', go);
  // Kick off the 2s progress fill
  requestAnimationFrame(function(){ fill.style.width = '100%'; });
  setTimeout(go, ${AUTO_PRESS_MS});
})();
</script>
</body>
</html>`;
}

const TALBOSS_COUNTDOWN_S = 3;

// Black-and-white TalBoss page: copy is fixed (the per-link branding fields
// belong to the Bosses of Bangalore page), counts down 3-2-1 then auto-presses.
function renderTalBoss(link: Link): string {
  const redirectUrlJson = JSON.stringify(link.redirect_url).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="theme-color" content="#000000" />
<title>TalBoss</title>
<meta name="description" content="The fastest hiring app." />
<meta property="og:title" content="TalBoss" />
<meta property="og:description" content="The fastest hiring app." />
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;height:100%;background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .stage{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:0 24px;background:linear-gradient(165deg,#1c1c1e 0%,#0b0b0d 52%,#000 100%)}
  .glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(115% 75% at 50% 8%,rgba(255,255,255,0.12),rgba(255,255,255,0) 58%)}
  .col{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:40px;width:100%;max-width:384px}
  .head{display:flex;flex-direction:column;align-items:center;gap:22px;text-align:center}
  .logo{width:84px;height:84px;border-radius:18px;box-shadow:0 18px 40px -14px rgba(255,255,255,0.28),0 0 0 1px rgba(255,255,255,0.06)}
  .logo svg{display:block;width:100%;height:100%}
  .brand{color:#fff;font-weight:900;text-transform:lowercase;letter-spacing:-0.02em;line-height:0.92;font-size:2.85rem;margin:0}
  @media (min-width:640px){.brand{font-size:3.75rem}}
  .count{color:rgba(255,255,255,0.6);font-size:16px;font-weight:500;letter-spacing:0.01em;margin:0}
  .count b{display:inline-block;min-width:0.7em;color:#fff;font-weight:700;font-variant-numeric:tabular-nums}
  .count b.tick{animation:tick 420ms cubic-bezier(0.22,1,0.36,1)}
  @keyframes tick{0%{transform:scale(1.5);opacity:0.2}100%{transform:scale(1);opacity:1}}
  .cta-wrap{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%}
  .cta{position:relative;width:100%;height:68px;overflow:hidden;border-radius:9999px;background:#fff;display:flex;align-items:center;justify-content:center;gap:10px;border:0;cursor:pointer;color:#000;font:inherit;user-select:none;box-shadow:0 10px 30px -10px rgba(255,255,255,0.25);transition:transform 180ms cubic-bezier(0.22,1,0.36,1)}
  .cta.pressed{transform:scale(0.98)}
  .cta .fill{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(0,0,0,0.1);pointer-events:none;transition:width ${TALBOSS_COUNTDOWN_S * 1000}ms linear}
  .cta .fill.fast{transition:width 180ms linear}
  .cta .lbl{position:relative;z-index:1;color:#000;font-size:17px;font-weight:600;letter-spacing:0.01em}
  .cta .icon{position:relative;z-index:1;width:20px;height:20px;color:#000}
  .rise{opacity:0;transform:translateY(14px);transition:opacity 700ms ease,transform 700ms cubic-bezier(0.22,1,0.36,1)}
  .rise.in{opacity:1;transform:translateY(0)}
  .rise.d60{transition-delay:60ms}
  .rise.d140{transition-delay:140ms}
  .rise.d240{transition-delay:240ms}
  .rise.d360{transition-delay:360ms}
</style>
</head>
<body>
<div class="stage">
  <div class="glow"></div>
  <div class="col">
    <div class="head">
      <div class="logo rise d60" role="img" aria-label="TalBoss">${TALBOSS_LOGO_SVG}</div>
      <h1 class="brand rise d140">the fastest<br />hiring app</h1>
      <p id="count" class="count rise d240">Redirecting you in <b id="n">${TALBOSS_COUNTDOWN_S}</b></p>
    </div>
    <div class="cta-wrap rise d360">
      <button id="cta" type="button" class="cta" aria-label="Continue">
        <span id="fill" class="fill"></span>
        <span class="lbl">Continue</span>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </div>
  </div>
</div>
<script>
(function(){
  var REDIRECT = ${redirectUrlJson};
  var ua = navigator.userAgent || "";
  // Mobile skips the interstitial and goes straight to the link
  if (/Android|iPhone|iPad|iPod/i.test(ua)) {
    window.location.href = REDIRECT;
    return;
  }
  // Desktop: 3-2-1 countdown, then the button presses itself
  document.querySelectorAll('.rise').forEach(function(el){
    requestAnimationFrame(function(){ el.classList.add('in'); });
  });
  var fired = false;
  var cta = document.getElementById('cta');
  var fill = document.getElementById('fill');
  var n = document.getElementById('n');
  var left = ${TALBOSS_COUNTDOWN_S};
  var timer = setInterval(function(){
    left -= 1;
    if (left <= 0) { go(); return; }
    n.textContent = left;
    n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick');
  }, 1000);
  function go(){
    if (fired) return;
    fired = true;
    clearInterval(timer);
    document.getElementById('count').textContent = 'Redirecting…';
    fill.classList.add('fast');
    fill.style.width = '100%';
    cta.classList.add('pressed');
    setTimeout(function(){ window.location.href = REDIRECT; }, 200);
  }
  cta.addEventListener('click', go);
  requestAnimationFrame(function(){ fill.style.width = '100%'; });
})();
</script>
</body>
</html>`;
}
