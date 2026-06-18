import type { Link } from "./db";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function relTime(iso: string): string {
  const t = Date.parse(iso.endsWith("Z") ? iso : iso + "Z");
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(t).toISOString().slice(0, 10);
}

function renderRow(link: Link): string {
  const slug = escapeHtml(link.slug);
  const target = escapeHtml(link.redirect_url);
  const dataJson = escapeHtml(JSON.stringify(link));
  const campaignCell = link.campaign_name
    ? `<span class="block max-w-[180px] truncate" title="${escapeHtml(link.campaign_name)}">${escapeHtml(link.campaign_name)}</span>`
    : `<span class="text-zinc-300">—</span>`;
  return `<tr data-slug="${slug}" data-link="${dataJson}" class="border-t border-zinc-100 hover:bg-zinc-50/60">
  <td class="px-4 py-3 text-sm font-medium text-zinc-800">${campaignCell}</td>
  <td class="px-4 py-3">
    <a href="/${slug}" target="_blank" class="font-mono text-sm font-medium text-zinc-900 hover:underline">${slug}</a>
  </td>
  <td class="px-4 py-3">
    <span class="block max-w-[240px] truncate text-zinc-600" title="${target}">${target}</span>
  </td>
  <td class="px-4 py-3 text-right font-mono text-sm tabular-nums text-zinc-700">${link.click_count}</td>
  <td class="px-4 py-3 text-xs text-zinc-500">${escapeHtml(relTime(link.created_at))}</td>
  <td class="px-4 py-3">
    <div class="flex items-center justify-end gap-1">
      <button onclick="copyLink('${slug}')" class="rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100" title="Copy short link">Copy</button>
      <button onclick="openEdit('${slug}')" class="rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100" title="Edit">Edit</button>
      <button onclick="deleteLink('${slug}')" class="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50" title="Delete">Delete</button>
    </div>
  </td>
</tr>`;
}

export function renderDashboard(
  links: Link[],
  env: { ADMIN_PATH: string },
): string {
  const rows = links.length
    ? links.map(renderRow).join("\n")
    : `<tr><td colspan="6" class="px-4 py-12 text-center text-sm text-zinc-400">No links yet. Paste a WhatsApp invite URL above and hit +.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>bosses-links</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
</style>
</head>
<body class="bg-zinc-50 text-zinc-900 antialiased">
<main class="mx-auto max-w-4xl px-4 py-10">
  <header class="mb-8 flex items-end justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">bosses-links</h1>
      <p class="text-sm text-zinc-500">Paste a WhatsApp invite, get a short link.</p>
    </div>
    <span id="count" class="text-xs text-zinc-500">${links.length} link${links.length === 1 ? "" : "s"}</span>
  </header>

  <form id="quickAdd" class="mb-6 flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
    <input
      type="text"
      name="campaign_name"
      placeholder="Campaign name"
      autocomplete="off"
      class="w-44 shrink-0 rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-zinc-400"
    />
    <span class="h-6 w-px shrink-0 bg-zinc-200"></span>
    <input
      type="url"
      name="redirect_url"
      placeholder="https://chat.whatsapp.com/..."
      required
      pattern="https?://.+"
      autocomplete="off"
      class="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-zinc-400"
    />
    <button id="addBtn" type="submit" class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-2xl leading-none text-white transition active:scale-95">+</button>
  </form>

  <div class="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
    <table class="w-full text-sm">
      <thead class="bg-zinc-50/60 text-left text-[10px] uppercase tracking-wider text-zinc-500">
        <tr>
          <th class="px-4 py-3 font-medium">Campaign</th>
          <th class="px-4 py-3 font-medium">Slug</th>
          <th class="px-4 py-3 font-medium">Target</th>
          <th class="px-4 py-3 text-right font-medium">Clicks</th>
          <th class="px-4 py-3 font-medium">Created</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody id="rows">
${rows}
      </tbody>
    </table>
  </div>

  <p class="mt-4 text-center text-xs text-zinc-400">Mobile visitors redirect straight to WhatsApp. Desktop sees the branded interstitial.</p>
</main>

<!-- Toast -->
<div id="toast" class="pointer-events-none fixed bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-lg"></div>

<!-- Edit drawer -->
<div id="drawer" class="fixed inset-0 z-50 hidden">
  <div class="absolute inset-0 bg-black/30" onclick="closeEdit()"></div>
  <div class="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
    <div class="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
      <h2 class="text-base font-semibold">Edit link</h2>
      <button onclick="closeEdit()" class="rounded-md p-1 text-zinc-500 hover:bg-zinc-100">&times;</button>
    </div>
    <form id="editForm" class="flex-1 overflow-y-auto px-6 py-4">
      <input type="hidden" name="slug" />
      <div class="space-y-4">
        <label class="block">
          <span class="text-xs font-medium uppercase tracking-wider text-zinc-500">Short link</span>
          <div id="editShortLink" class="mt-1 font-mono text-sm text-zinc-700"></div>
        </label>
        <label class="block">
          <span class="text-xs font-medium uppercase tracking-wider text-zinc-500">Campaign name</span>
          <input name="campaign_name" type="text" placeholder="Internal label, not shown to visitors" class="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400" />
        </label>
        <label class="block">
          <span class="text-xs font-medium uppercase tracking-wider text-zinc-500">Target URL</span>
          <input name="redirect_url" type="url" required class="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400" />
        </label>
        <div class="pt-2">
          <h3 class="text-xs font-medium uppercase tracking-wider text-zinc-500">Branding</h3>
          <p class="mt-1 text-xs text-zinc-400">Shown on the desktop interstitial.</p>
        </div>
        <label class="block">
          <span class="text-xs font-medium text-zinc-600">Eyebrow</span>
          <input name="eyebrow" type="text" class="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-zinc-600">Brand</span>
          <input name="brand" type="text" class="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-zinc-600">Badge</span>
          <input name="badge" type="text" class="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400" />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-zinc-600">Button label</span>
          <input name="button_label" type="text" class="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400" />
        </label>
      </div>
    </form>
    <div class="flex items-center justify-between border-t border-zinc-100 px-6 py-4">
      <a id="editPreview" target="_blank" class="text-xs font-medium text-zinc-500 hover:text-zinc-900">Preview &rarr;</a>
      <div class="flex gap-2">
        <button onclick="closeEdit()" class="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100">Cancel</button>
        <button onclick="saveEdit()" class="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">Save</button>
      </div>
    </div>
  </div>
</div>

<script>
const ADMIN_PATH = ${JSON.stringify(env.ADMIN_PATH)};
const ORIGIN = window.location.origin;
const shortFor = (slug) => ORIGIN + "/" + slug;

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2500);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    return true;
  }
}

function copyLink(slug) {
  const url = shortFor(slug);
  copyToClipboard(url).then(() => toast('Copied ' + url));
}

async function deleteLink(slug) {
  if (!confirm('Delete /g/' + slug + '?')) return;
  const res = await fetch('/' + ADMIN_PATH + '/links/' + slug, { method: 'DELETE' });
  if (!res.ok) { toast('Failed: ' + await res.text()); return; }
  document.querySelector('tr[data-slug="' + slug + '"]')?.remove();
  toast('Deleted');
  updateCount();
}

function openEdit(slug) {
  const row = document.querySelector('tr[data-slug="' + slug + '"]');
  if (!row) return;
  const link = JSON.parse(row.getAttribute('data-link'));
  const form = document.getElementById('editForm');
  form.slug.value = link.slug;
  form.campaign_name.value = link.campaign_name || '';
  form.redirect_url.value = link.redirect_url;
  form.eyebrow.value = link.eyebrow;
  form.brand.value = link.brand;
  form.badge.value = link.badge;
  form.button_label.value = link.button_label;
  document.getElementById('editShortLink').textContent = shortFor(link.slug);
  document.getElementById('editPreview').setAttribute('href', shortFor(link.slug));
  document.getElementById('drawer').classList.remove('hidden');
}

function closeEdit() {
  document.getElementById('drawer').classList.add('hidden');
}

async function saveEdit() {
  const form = document.getElementById('editForm');
  const slug = form.slug.value;
  const body = {
    redirect_url: form.redirect_url.value.trim(),
    campaign_name: form.campaign_name.value.trim(),
    eyebrow: form.eyebrow.value.trim(),
    brand: form.brand.value.trim(),
    badge: form.badge.value.trim(),
    button_label: form.button_label.value.trim(),
  };
  const res = await fetch('/' + ADMIN_PATH + '/links/' + slug, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { toast('Failed: ' + await res.text()); return; }
  const updated = await res.json();
  // Refresh the row's data attribute + visible cells
  const row = document.querySelector('tr[data-slug="' + slug + '"]');
  if (row) {
    row.setAttribute('data-link', JSON.stringify(updated));
    const tds = row.querySelectorAll('td');
    // Campaign cell (index 0)
    if (updated.campaign_name) {
      tds[0].innerHTML = '<span class="block max-w-[180px] truncate" title="' + escapeAttr(updated.campaign_name) + '">' + escapeText(updated.campaign_name) + '</span>';
    } else {
      tds[0].innerHTML = '<span class="text-zinc-300">—</span>';
    }
    // Target cell (index 2)
    const target = tds[2].querySelector('span');
    if (target) { target.textContent = updated.redirect_url; target.setAttribute('title', updated.redirect_url); }
  }
  closeEdit();
  toast('Saved');
}

document.getElementById('quickAdd').onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const url = form.redirect_url.value.trim();
  const name = form.campaign_name.value.trim();
  if (!url) return;
  const btn = document.getElementById('addBtn');
  btn.disabled = true;
  btn.textContent = '…';
  const res = await fetch('/' + ADMIN_PATH + '/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ redirect_url: url, campaign_name: name }),
  });
  btn.disabled = false;
  btn.textContent = '+';
  if (!res.ok) { toast('Failed: ' + await res.text()); return; }
  const link = await res.json();
  const shortUrl = shortFor(link.slug);
  await copyToClipboard(shortUrl);
  toast('Created — copied ' + shortUrl);
  form.reset();
  // Prepend the new row server-side render style
  const tbody = document.getElementById('rows');
  // If empty-state row exists, remove it
  const empty = tbody.querySelector('td[colspan]');
  if (empty) tbody.innerHTML = '';
  tbody.insertAdjacentHTML('afterbegin', buildRowHtml(link));
  updateCount();
};

function escapeAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeText(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function buildRowHtml(link) {
  const dataJson = escapeAttr(JSON.stringify(link));
  const target = escapeAttr(link.redirect_url);
  const campaignCell = link.campaign_name
    ? '<span class="block max-w-[180px] truncate" title="' + escapeAttr(link.campaign_name) + '">' + escapeText(link.campaign_name) + '</span>'
    : '<span class="text-zinc-300">—</span>';
  return \`<tr data-slug="\${link.slug}" data-link="\${dataJson}" class="border-t border-zinc-100 hover:bg-zinc-50/60">
  <td class="px-4 py-3 text-sm font-medium text-zinc-800">\${campaignCell}</td>
  <td class="px-4 py-3">
    <a href="/\${link.slug}" target="_blank" class="font-mono text-sm font-medium text-zinc-900 hover:underline">\${link.slug}</a>
  </td>
  <td class="px-4 py-3">
    <span class="block max-w-[240px] truncate text-zinc-600" title="\${target}">\${target}</span>
  </td>
  <td class="px-4 py-3 text-right font-mono text-sm tabular-nums text-zinc-700">\${link.click_count}</td>
  <td class="px-4 py-3 text-xs text-zinc-500">just now</td>
  <td class="px-4 py-3">
    <div class="flex items-center justify-end gap-1">
      <button onclick="copyLink('\${link.slug}')" class="rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100">Copy</button>
      <button onclick="openEdit('\${link.slug}')" class="rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100">Edit</button>
      <button onclick="deleteLink('\${link.slug}')" class="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
    </div>
  </td>
</tr>\`;
}

function updateCount() {
  const n = document.querySelectorAll('#rows tr[data-slug]').length;
  document.getElementById('count').textContent = n + ' link' + (n === 1 ? '' : 's');
}
</script>
</body>
</html>`;
}
