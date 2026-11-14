/* Slugsy's Django School: interactive tutorial */
"use strict";

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem("slugsy:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("slugsy:" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
};

const PRODUCTS = [
  { id: 1, name: "Red Running Shoes", slug: "red-running-shoes", price: "45.00", emoji: "👟", description: "Light, bouncy and ready for your morning jog.", in_stock: true },
  { id: 2, name: "Blue Denim Hat", slug: "blue-denim-hat", price: "18.50", emoji: "🧢", description: "A soft cap that goes with everything.", in_stock: true },
  { id: 3, name: "Wireless Headphones", slug: "wireless-headphones", price: "79.99", emoji: "🎧", description: "20 hours of battery and crisp sound.", in_stock: true },
  { id: 4, name: "Coffee Mug", slug: "coffee-mug", price: "9.00", emoji: "☕", description: "Keeps your coffee warm while you code.", in_stock: false },
  { id: 5, name: "Leather Backpack", slug: "leather-backpack", price: "120.00", emoji: "🎒", description: "Fits a laptop, lunch and your dreams.", in_stock: true },
  { id: 6, name: "Smart Watch", slug: "smart-watch", price: "99.00", emoji: "⌚", description: "Tracks steps, sleep and bad decisions.", in_stock: true }
];
const DB5 = PRODUCTS.slice(0, 5);

function cardHTML(p) {
  return '<div class="pc-emoji">' + p.emoji + '</div><h3>' + esc(p.name) + '</h3><div class="pc-price">$' + esc(p.price) +
    '</div><p>' + esc(p.description) + '</p><span class="badge ' + (p.in_stock ? "ok" : "no") + '">' + (p.in_stock ? "In stock" : "Sold out") + "</span>";
}

function chips(el, items, onPick, initial) {
  if (!el) return;
  el.innerHTML = "";
  items.forEach((it, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = it.label;
    b.onclick = () => { $$(".chip", el).forEach(c => c.classList.toggle("on", c === b)); onPick(it.value, i); };
    el.appendChild(b);
  });
  if (initial != null) $$(".chip", el)[initial].click();
}

/* ---------- syntax highlighting ---------- */
function highlight(code, lang) {
  const PY = "from|import|def|return|class|if|else|elif|for|in|as|True|False|None|pass|with";
  const defs = {
    python: [new RegExp("(#[^\\n]*)|(\"[^\"\\n]*\"|'[^'\\n]*')|\\b(" + PY + ")\\b", "g"), ["c", "s", "k"]],
    bash: [/(#[^\n]*)|("[^"\n]*"|'[^'\n]*')|\b(python3?|pip|cd|mkdir|source|django-admin)\b/g, ["c", "s", "k"]],
    html: [/(<!--[\s\S]*?-->)|(\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\})|(<\/?[a-zA-Z][a-zA-Z0-9]*|\/?>)|("[^"\n]*")/g, ["c", "t", "k", "s"]]
  };
  const d = defs[lang];
  if (!d) return esc(code);
  const re = d[0]; re.lastIndex = 0;
  let out = "", last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    const gi = m.slice(1).findIndex(x => x !== undefined);
    out += '<span class="tk-' + d[1][gi] + '">' + esc(m[0]) + "</span>";
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  return out + esc(code.slice(last));
}

function makeCode(raw, lang, file) {
  const w = document.createElement("div");
  w.className = "codeblock";
  w.innerHTML = '<div class="code-head"><span class="dots"><i></i><i></i><i></i></span><span class="fname">' + esc(file || lang || "code") +
    '</span><button class="copy" type="button">Copy</button></div><pre><code>' + highlight(raw, lang) + "</code></pre>";
  const b = $(".copy", w);
  b.onclick = async () => {
    try { await navigator.clipboard.writeText(raw); }
    catch (_) {
      const t = document.createElement("textarea"); t.value = raw; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch (__) { /* ignore */ }
      t.remove();
    }
    b.textContent = "Copied ✓"; setTimeout(() => { b.textContent = "Copy"; }, 1400);
  };
  return w;
}
function liveCode(id, raw, lang, file) { const el = $("#" + id); if (el) el.replaceChildren(makeCode(raw, lang, file)); }

$$("pre.code").forEach(pre => {
  const raw = pre.textContent.replace(/^\n/, "").replace(/\s+$/, "");
  pre.replaceWith(makeCode(raw, pre.dataset.lang || "text", pre.dataset.file));
});

/* ---------- tabs ---------- */
$$(".tabset").forEach(ts => {
  const btns = $$(".tab-btn", ts), panels = $$(".tab-panel", ts);
  btns.forEach((b, i) => b.addEventListener("click", () => {
    btns.forEach(x => x.classList.toggle("on", x === b));
    panels.forEach((p, j) => { p.hidden = j !== i; });
  }));
  if (btns[0]) btns[0].click();
});

/* ---------- quick checks ---------- */
$$(".qcheck").forEach(q => {
  const fb = $(".qfb", q), ans = q.dataset.answer;
  $$("button", q).forEach(b => b.addEventListener("click", () => {
    if (b.dataset.k === ans) {
      b.classList.add("right"); fb.textContent = "✅ " + (q.dataset.why || "Correct!");
      $$("button", q).forEach(x => { x.disabled = true; });
    } else {
      b.classList.add("wrong"); fb.textContent = "Not quite. Try another one! 🐌";
    }
  }));
});

/* ---------- navigation / progress ---------- */
const sections = $$(".lesson");
const done = new Set(store.get("done", []));
let cur = 0;

sections.forEach((s, i) => {
  const k = document.createElement("div");
  k.className = "kicker";
  k.textContent = "Lesson " + i + (s.dataset.min ? " · about " + s.dataset.min + " min" : "");
  s.prepend(k);
});

const nav = $("#nav");
sections.forEach((s, i) => {
  const a = document.createElement("a");
  a.className = "nav-item"; a.href = "#lesson-" + i;
  a.innerHTML = "<span>" + s.dataset.emoji + "</span><span>" + esc(s.dataset.title) + '</span><span class="nav-check">✓</span>';
  nav.appendChild(a);
});

function updateNav() {
  $$(".nav-item", nav).forEach((a, i) => { a.classList.toggle("active", i === cur); a.classList.toggle("done", done.has(i)); });
  $("#pbar").style.width = (done.size / sections.length * 100) + "%";
  $("#ptext").textContent = done.size + " of " + sections.length + " done";
  $("#crumb").textContent = sections[cur].dataset.emoji + " " + sections[cur].dataset.title;
  $("#prev").disabled = cur === 0;
  $("#next").textContent = cur === sections.length - 1 ? "🎉 Finish" : "Done, next →";
}
function fromHash() { const m = location.hash.match(/lesson-(\d+)/); return m ? +m[1] : store.get("cur", 0); }
function show() {
  cur = Math.max(0, Math.min(sections.length - 1, fromHash()));
  sections.forEach((s, j) => { s.hidden = j !== cur; });
  updateNav(); window.scrollTo({ top: 0 });
  document.body.classList.remove("nav-open");
  store.set("cur", cur);
}
window.addEventListener("hashchange", show);

function confetti() {
  const bits = ["🎉", "✨", "🐌", "⭐", "🎈", "💜"];
  for (let i = 0; i < 40; i++) {
    const s = document.createElement("span");
    s.className = "confetti"; s.textContent = bits[i % bits.length];
    s.style.left = Math.random() * 100 + "vw";
    s.style.animationDuration = (2 + Math.random() * 2.5) + "s";
    s.style.animationDelay = (Math.random() * 0.6) + "s";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 5500);
  }
}
function markDone(i) { done.add(i); store.set("done", Array.from(done)); }

$("#next").onclick = () => {
  markDone(cur);
  if (cur === sections.length - 1) { updateNav(); confetti(); return; }
  location.hash = "lesson-" + (cur + 1);
};
$("#prev").onclick = () => { location.hash = "lesson-" + Math.max(0, cur - 1); };
$("#menu").onclick = () => document.body.classList.toggle("nav-open");
$("#scrim").onclick = () => document.body.classList.remove("nav-open");
$("#reset").onclick = () => {
  if (!confirm("Reset all progress?")) return;
  done.clear(); store.set("done", []); store.set("todo", {});
  $$(".todo input[data-key]").forEach(c => { c.checked = false; });
  updateTodo(); location.hash = "lesson-0"; show();
};

/* theme */
(function () {
  const root = document.documentElement, btn = $("#theme");
  let t = store.get("theme", null);
  if (!t) t = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const apply = () => { root.setAttribute("data-theme", t); btn.textContent = t === "dark" ? "☀️" : "🌙"; };
  btn.onclick = () => { t = t === "dark" ? "light" : "dark"; store.set("theme", t); apply(); };
  apply();
})();

/* ---------- W1: the pain ---------- */
(function () {
  const r = $("#w1-range"); if (!r) return;
  const fmt = m => m < 60 ? Math.round(m) + " min" : (m / 60).toFixed(1) + " hours";
  const upd = () => {
    const n = +r.value;
    $("#w1-n").textContent = n; $("#w1-files").textContent = n; $("#w1-edits").textContent = n;
    $("#w1-time").textContent = fmt(n * 0.5);
    const shown = Math.min(n, 150);
    $("#w1-grid").innerHTML = "<i></i>".repeat(shown) + (n > shown ? "<em>+" + (n - shown) + " more…</em>" : "");
  };
  r.oninput = upd; upd();
})();

/* ---------- W2: form letter ---------- */
(function () {
  const pk = $("#w2-picker"); if (!pk) return;
  chips(pk, PRODUCTS.slice(0, 5).map(p => ({ label: p.emoji + " " + p.name, value: p })), p => {
    $("#w2-data").innerHTML = '<div class="kv"><b>name</b>: <span class="flash">"' + esc(p.name) + '"</span><br><b>price</b>: <span class="flash">' + esc(p.price) +
      '</span><br><b>description</b>: <span class="flash">"' + esc(p.description) + '"</span></div>';
    $("#w2-out").innerHTML = cardHTML(p);
  }, 0);
})();

/* ---------- W3: URL anatomy + slugify ---------- */
(function () {
  const inp = $("#w3-url"); if (!inp) return;
  const draw = () => {
    const m = inp.value.trim().match(/^(https?:\/\/)?([^\/\s]+)(\/products\/)([^\/?#\s]*)(\/?)(.*)$/);
    const out = $("#w3-parts");
    if (!m) { out.innerHTML = '<span class="msg err">Try a URL like https://myshop.com/products/anything/</span>'; return; }
    const part = (cls, label, val) => '<div class="part ' + cls + '"><small>' + label + "</small>" + esc(val) + "</div>";
    out.innerHTML = (m[1] ? part("", "protocol", m[1]) : "") + part("", "domain", m[2]) + part("", "fixed path", m[3]) +
      part("slug", "slug (changes!)", m[4] || "(empty)") + (m[5] ? part("", "slash", "/") : "") + (m[6] ? part("", "extra", m[6]) : "");
  };
  inp.oninput = draw; draw();

  const name = $("#w3-name"), out = $("#w3-slug");
  const slugify = s => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  name.oninput = () => { out.textContent = slugify(name.value) || "(type something)"; };
  name.oninput();
})();

/* ---------- W4: request flow stepper ---------- */
(function () {
  const pk = $("#w4-picker"); if (!pk) return;
  let slug = PRODUCTS[0].slug, step = 0;
  const nodes = [["🌐", "Browser"], ["🗺️", "urls.py"], ["🧠", "views.py"], ["🗃️", "Database"], ["🎨", "Template"]];
  const at = [0, 1, 2, 3, 4, 0];
  const text = () => [
    "You type <code>/products/" + esc(slug) + "/</code> and press Enter. The browser sends a <b>request</b> to the server.",
    "<b>urls.py</b> checks its patterns. <code>&lt;slug:slug&gt;/</code> matches! It captures <code>slug = '" + esc(slug) + "'</code>.",
    "Django calls the <b>view</b>: <code>product_detail(request, slug='" + esc(slug) + "')</code>.",
    "The view asks the <b>database</b>: <code>Product where slug = '" + esc(slug) + "'</code>. Found one row! 🎉",
    "The view hands the product to <b>product_detail.html</b>. The template fills in <code>{{ product.name }}</code>, <code>{{ product.price }}</code>…",
    "The finished HTML travels back to the <b>browser</b>. You see the page! ✨"
  ];
  const draw = () => {
    $("#w4-flow").innerHTML = nodes.map((n, i) => '<div class="node ' + (i === at[step] ? "on" : (i < at[step] ? "past" : "")) + '"><span>' + n[0] + "</span>" + n[1] + "</div>").join('<span class="sep">➜</span>');
    $("#w4-desc").innerHTML = "<b>Step " + (step + 1) + " of 6</b><br>" + text()[step];
    $("#w4-count").textContent = (step + 1) + " / 6";
    $("#w4-back").disabled = step === 0; $("#w4-next").disabled = step === 5;
  };
  chips(pk, DB5.map(p => ({ label: "/products/" + p.slug + "/", value: p.slug })), s => { slug = s; step = 0; draw(); }, 0);
  $("#w4-next").onclick = () => { step = Math.min(5, step + 1); draw(); };
  $("#w4-back").onclick = () => { step = Math.max(0, step - 1); draw(); };
  $("#w4-restart").onclick = () => { step = 0; draw(); };
})();

/* ---------- W5: setup checklist ---------- */
function updateTodo() {
  const boxes = $$(".todo input[data-key]"); if (!boxes.length) return;
  const n = boxes.filter(b => b.checked).length;
  $("#w5-prog").textContent = "(" + n + "/" + boxes.length + ")" + (n === boxes.length ? " 🎉" : "");
}
(function () {
  const saved = store.get("todo", {});
  $$(".todo input[data-key]").forEach(b => {
    b.checked = !!saved[b.dataset.key];
    b.addEventListener("change", () => { saved[b.dataset.key] = b.checked; store.set("todo", saved); updateTodo(); });
  });
  updateTodo();
})();

/* ---------- W6: model / database builder ---------- */
(function () {
  const table = $("#w6-table"); if (!table) return;
  const rows = [{ id: 1, name: "Red Running Shoes", slug: "red-running-shoes", price: "45.00" }, { id: 2, name: "Coffee Mug", slug: "coffee-mug", price: "9.00" }];
  const nameI = $("#w6-name"), slugI = $("#w6-slug"), priceI = $("#w6-price"), descI = $("#w6-desc"), msg = $("#w6-msg");
  let slugTouched = false;
  const slugify = s => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  const draw = (newId) => {
    table.innerHTML = "<tr><th>id</th><th>name</th><th>slug</th><th>price</th></tr>" +
      rows.map(r => '<tr class="' + (r.id === newId ? "new" : "") + '"><td>' + r.id + "</td><td>" + esc(r.name) + "</td><td>" + esc(r.slug) + "</td><td>" + esc(r.price) + "</td></tr>").join("");
  };
  const code = () => liveCode("w6-code",
    "Product.objects.create(\n    name=\"" + nameI.value + "\",\n    slug=\"" + slugI.value + "\",\n    price=" + (priceI.value || "0") + ",\n    description=\"" + descI.value + "\",\n)", "python", "Django shell (what happens under the hood)");
  nameI.oninput = () => { if (!slugTouched) slugI.value = slugify(nameI.value); code(); };
  slugI.oninput = () => { slugTouched = true; code(); };
  priceI.oninput = descI.oninput = code;
  $("#w6-add").onclick = () => {
    const s = slugI.value.trim();
    if (!nameI.value.trim() || !s) { msg.className = "msg err"; msg.textContent = "Fill in a name and slug."; return; }
    if (rows.some(r => r.slug === s)) {
      msg.className = "msg err";
      msg.textContent = "❌ IntegrityError: UNIQUE constraint failed: products_product.slug. Pick a different slug!";
      return;
    }
    const id = rows.length + 1;
    rows.push({ id, name: nameI.value.trim(), slug: s, price: priceI.value });
    msg.className = "msg ok"; msg.textContent = "✅ Saved! Visit /products/" + s + "/. It works already.";
    draw(id);
  };
  slugI.value = slugify(nameI.value); draw(); code();
})();

/* ---------- W7: URL matcher ---------- */
(function () {
  const sel = $("#w7-pattern"); if (!sel) return;
  const CONV = { slug: "[-a-zA-Z0-9_]+", int: "[0-9]+", str: "[^/]+" };
  const VAR = { slug: "slug", int: "id", str: "name" };
  const compile = pat => {
    const names = [];
    const re = new RegExp("^" + pat.replace(/<(\w+):(\w+)>/g, (m, t, n) => { names.push([t, n]); return "(" + CONV[t] + ")"; }) + "$");
    return { re, names };
  };
  const detail = () => "products/<" + sel.value + ":" + VAR[sel.value] + ">/";
  const run = () => {
    const raw = $("#w7-path").value.trim();
    const path = raw.replace(/^\//, "");
    const pats = [["products/", "product_list"], [detail(), "product_detail"]];
    liveCode("w7-code", "urlpatterns = [\n    path(\"\", views.product_list),            # products/\n    path(\"<" + sel.value + ":" + VAR[sel.value] + ">/\", views.product_detail),\n]", "python", "products/urls.py (shown with the include prefix)");
    const res = $("#w7-res");
    for (const [pat, view] of pats) {
      const { re, names } = compile(pat), m = path.match(re);
      if (m) {
        const cap = names.length ? "<br>Captured: <code>" + names[0][1] + " = " + (names[0][0] === "int" ? m[1] : "'" + esc(m[1]) + "'") + "</code> (" + (names[0][0] === "int" ? "a number" : "text") + ")" : "";
        res.className = "result ok";
        res.innerHTML = "✅ Matched <code>" + esc(pat) + "</code> → runs <code>" + view + "</code>" + cap;
        return;
      }
    }
    const withSlash = path.endsWith("/") ? null : path + "/";
    if (withSlash && pats.some(([p]) => compile(p).re.test(withSlash))) {
      res.className = "result mid";
      res.innerHTML = "↪️ No exact match, but with a trailing <code>/</code> it would match. Django's <b>APPEND_SLASH</b> redirects you there automatically.";
      return;
    }
    res.className = "result bad";
    res.innerHTML = '<span class="big404">404</span><br>No pattern matched, so Django shows "Page not found".';
  };
  chips($("#w7-quick"), ["/products/", "/products/red-running-shoes/", "/products/42/", "/products/Red Shoes!/", "/products/red-running-shoes", "/cart/"].map(v => ({ label: v, value: v })), v => { $("#w7-path").value = v; run(); }, 1);
  $("#w7-path").oninput = run; sel.onchange = run; run();
})();

/* ---------- W8: view simulator ---------- */
(function () {
  const inp = $("#w8-slug"); if (!inp) return;
  const table = $("#w8-table"), res = $("#w8-res");
  const drawTable = hit => {
    table.innerHTML = "<tr><th>id</th><th>name</th><th>slug</th></tr>" + DB5.map(p => '<tr class="' + (p.slug === hit ? "hit" : "") + '"><td>' + p.id + "</td><td>" + esc(p.name) + "</td><td>" + p.slug + "</td></tr>").join("");
  };
  const run = () => {
    const s = inp.value.trim(), p = DB5.find(x => x.slug === s);
    const mode = $('input[name="w8-mode"]:checked').value;
    drawTable(p ? p.slug : null);
    const q = mode === "safe" ? "get_object_or_404(Product, slug='" + esc(s) + "')" : "Product.objects.get(slug='" + esc(s) + "')";
    if (p) {
      res.className = "result ok";
      res.innerHTML = "1. Ran <code>" + q + "</code><br>2. Found <b>" + esc(p.name) + "</b> ✅<br>3. <code>render()</code> sends it to the template → <b>200 OK</b>";
    } else if (mode === "safe") {
      res.className = "result mid";
      res.innerHTML = "1. Ran <code>" + q + "</code><br>2. No match → Django raises <code>Http404</code><br>3. Visitor sees a polite <b>404 Page not found</b> 👍";
    } else {
      res.className = "result bad";
      res.innerHTML = "1. Ran <code>" + q + "</code><br>2. No match → <code>Product.DoesNotExist</code> is raised and nobody catches it<br>3. Visitor sees <b>500 Server Error</b> 💥";
    }
  };
  chips($("#w8-quick"), DB5.map(p => ({ label: p.slug, value: p.slug })).concat([{ label: "red-runing-shoes (typo)", value: "red-runing-shoes" }]), v => { inp.value = v; run(); }, 0);
  $("#w8-run").onclick = run; inp.onkeydown = e => { if (e.key === "Enter") run(); };
  $$('input[name="w8-mode"]').forEach(r => r.addEventListener("change", run));
  run();
})();

/* ---------- W9: template lab ---------- */
function lookup(o, path) { return path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o); }
function djangoRender(tpl, ctx, warns) {
  tpl = tpl.replace(/\{%\s*if\s+([\w.]+)\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/g, (m, v, a, b) => (lookup(ctx, v) ? a : (b || "")));
  return tpl.replace(/\{\{\s*([\w.]+)\s*(?:\|\s*(\w+)\s*)?\}\}/g, (m, v, f) => {
    let val = lookup(ctx, v);
    if (val === undefined) { warns.push(v); return ""; }
    val = String(val);
    if (f === "upper") val = val.toUpperCase();
    else if (f === "lower") val = val.toLowerCase();
    else if (f === "title") val = val.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    else if (f === "length") val = val.length;
    return esc(val);
  });
}
(function () {
  const ta = $("#w9-tpl"); if (!ta) return;
  const DEFAULT = [
    "<h1>{{ product.name }}</h1>",
    "<p>${{ product.price }}</p>",
    "<p>{{ product.description }}</p>",
    "",
    "{% if product.in_stock %}",
    "  <button>Add to cart</button>",
    "{% else %}",
    "  <p>Sorry, sold out.</p>",
    "{% endif %}"
  ].join("\n");
  let prod = PRODUCTS[0];
  const draw = () => {
    const warns = [];
    $("#w9-out").innerHTML = djangoRender(ta.value, { product: prod }, warns);
    $("#w9-warn").textContent = warns.length ? "⚠️ Unknown variable" + (warns.length > 1 ? "s" : "") + ": " + Array.from(new Set(warns)).join(", ") + ". Django shows nothing, with no error!" : "";
    if (/\|\s*upper/.test(ta.value)) $("#w9-ch1").checked = true;
    if (/\{%\s*if[\s\S]*\{%\s*endif/.test(ta.value)) $("#w9-ch2").checked = true;
    if (warns.length) $("#w9-ch3").checked = true;
  };
  ta.value = DEFAULT; ta.oninput = draw;
  $("#w9-reset").onclick = () => { ta.value = DEFAULT; draw(); };
  chips($("#w9-picker"), PRODUCTS.slice(0, 5).map(p => ({ label: p.emoji + " " + p.name, value: p })), p => { prod = p; draw(); }, 0);
})();

/* ---------- W10: mini browser ---------- */
(function () {
  const view = $("#b-view"); if (!view) return;
  let hist = ["/products/"], idx = 0;
  const seen = new Set(), found = new Set();
  const norm = p => { p = p.trim(); if (!p.startsWith("/")) p = "/" + p; if (!p.endsWith("/")) p += "/"; return p; };
  const draw = path => {
    const log = ["<span class='l-dim'>GET " + esc(path) + "</span>"];
    let status = 200;
    const m = path.match(/^\/products\/([-a-zA-Z0-9_]+)\/$/);
    if (path === "/products/") {
      log.push("<span class='l-ok'>urls.py → matched \"products/\" → view product_list</span>");
      log.push("<span class='l-ok'>template product_list.html rendered</span>");
      view.innerHTML = "<h1>All products</h1><div class='grid'>" + DB5.map(p => "<div class='mini' data-go='/products/" + p.slug + "/'><div>" + p.emoji + "</div>" + esc(p.name) + "</div>").join("") + "</div>";
    } else if (m) {
      const p = DB5.find(x => x.slug === m[1]);
      log.push("<span class='l-ok'>urls.py → matched \"products/&lt;slug:slug&gt;/\" → slug = '" + esc(m[1]) + "'</span>");
      log.push("<span class='l-dim'>view product_detail → get_object_or_404(slug='" + esc(m[1]) + "')</span>");
      if (p) {
        found.add(p.slug);
        log.push("<span class='l-ok'>found: " + esc(p.name) + "</span>");
        log.push("<span class='l-ok'>template product_detail.html rendered (the SAME file for every product)</span>");
        view.innerHTML = "<div class='product-card'>" + cardHTML(p) + "</div><p><a data-go='/products/'>← All products</a></p>";
      } else {
        status = 404;
        log.push("<span class='l-bad'>no such product → Http404</span>");
        view.innerHTML = "<h1>404</h1><p>Page not found. That product doesn't exist.</p><p><a data-go='/products/'>← All products</a></p>";
      }
    } else {
      status = 404;
      log.push("<span class='l-bad'>urls.py → no pattern matched</span>");
      view.innerHTML = "<h1>404</h1><p>Page not found.</p><p><a data-go='/products/'>← All products</a></p>";
    }
    log.push(status === 200 ? "<span class='l-ok'>→ 200 OK</span>" : "<span class='l-bad'>→ 404 Not Found</span>");
    $("#b-log").innerHTML = log.join("<br>");
    $("#b-url").value = path;
    $("#b-back").disabled = idx === 0; $("#b-fwd").disabled = idx === hist.length - 1;
    $("#b-stat").textContent = "Product pages viewed: " + found.size + " · template files used for them: 1";
    $$("[data-go]", view).forEach(el => el.onclick = () => go(el.dataset.go));
  };
  const go = (path, push = true) => {
    path = norm(path);
    if (push) { hist = hist.slice(0, idx + 1); hist.push(path); idx = hist.length - 1; }
    seen.add(path); draw(path);
  };
  $("#b-go").onclick = () => go($("#b-url").value);
  $("#b-url").onkeydown = e => { if (e.key === "Enter") go($("#b-url").value); };
  $("#b-back").onclick = () => { if (idx > 0) { idx--; draw(hist[idx]); } };
  $("#b-fwd").onclick = () => { if (idx < hist.length - 1) { idx++; draw(hist[idx]); } };
  const links = [{ label: "📋 List page", value: "/products/" }]
    .concat(DB5.map(p => ({ label: p.emoji + " " + p.slug, value: "/products/" + p.slug + "/" })))
    .concat([{ label: "🙈 typo: /products/red-runing-shoes/", value: "/products/red-runing-shoes/" }]);
  chips($("#b-links"), links, v => go(v));
  draw("/products/");
})();

/* ---------- W11: list loop ---------- */
(function () {
  const box = $("#w11-checks"); if (!box) return;
  const on = new Set(DB5.map(p => p.id));
  const draw = () => {
    const items = PRODUCTS.filter(p => on.has(p.id));
    $("#w11-out").innerHTML = "<h1>All products</h1>" + (items.length ? "<ul>" + items.map(p => "<li><a href='#' onclick='return false'>" + esc(p.name) + "</a> $" + esc(p.price) + " <small style='color:#888'>→ /products/" + p.slug + "/</small></li>").join("") + "</ul>" : "<ul><li>No products yet.</li></ul>");
  };
  PRODUCTS.forEach(p => {
    const l = document.createElement("label");
    l.innerHTML = '<input type="checkbox" ' + (on.has(p.id) ? "checked" : "") + "> " + p.emoji + " " + esc(p.name);
    $("input", l).onchange = e => { e.target.checked ? on.add(p.id) : on.delete(p.id); draw(); };
    box.appendChild(l);
  });
  draw();
})();

/* ---------- W12: escaping ---------- */
(function () {
  const inp = $("#w12-in"); if (!inp) return;
  const draw = () => {
    const v = inp.value;
    $("#w12-safe").textContent = v;
    $("#w12-unsafe").innerHTML = v.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  };
  inp.oninput = draw; draw();
})();

/* ---------- W13: quiz ---------- */
(function () {
  const box = $("#quiz"); if (!box) return;
  const Q = [
    ["What is a slug?", ["A type of database", "A URL-friendly name like red-running-shoes", "A Django command"], 1, "A slug is the readable, hyphenated name used in a URL."],
    ["You have 500 products. How many product-page templates do you need?", ["500", "50", "1"], 2, "One template, filled with different data."],
    ["Which file maps a URL to a view?", ["urls.py", "models.py", "settings.py"], 0, "urls.py is the router."],
    ["What does <slug:slug> in a path() do?", ["Deletes the slug", "Captures that part of the URL and passes it to the view", "Creates an HTML tag"], 1, "It captures the value and hands it to your view as an argument."],
    ["Why use get_object_or_404 instead of .get()?", ["It's faster", "A missing product gives a clean 404, not a crash", "It creates the product"], 1, "Typos in URLs are normal; a 404 is the right response."],
    ["Which prints the product name inside a template?", ["{{ product.name }}", "{% product.name %}", "<product.name>"], 0, "Double braces print values."],
    ["Why is the slug field unique=True?", ["So two products never share the same URL", "To make it uppercase", "Django needs it to start"], 0, "A URL must point to exactly one product."],
    ["A new product (number 501) arrives. What do you need to add?", ["A new template and a new URL", "A new view", "Just a new row in the database"], 2, "The URL, view and template already handle every slug."]
  ];
  let i = 0, score = 0;
  const render = () => {
    if (i >= Q.length) {
      const pct = Math.round(score / Q.length * 100);
      box.innerHTML = '<div class="final"><div class="score">' + score + " / " + Q.length + "</div><h2>" +
        (pct === 100 ? "Perfect! 🏆" : pct >= 60 ? "Nice work! 🎉" : "Good start! Review the lessons and retry 💪") + '</h2><button class="btn" id="q-retry" type="button">↺ Try again</button></div>';
      if (pct >= 60) { confetti(); markDone(13); updateNav(); }
      $("#q-retry").onclick = () => { i = 0; score = 0; render(); };
      return;
    }
    const [q, opts, ok, why] = Q[i];
    box.innerHTML = '<div class="qhead"><span>Question ' + (i + 1) + " of " + Q.length + "</span><span>Score: " + score + '</span></div><div class="qbar"><i style="width:' + (i / Q.length * 100) + '%"></i></div><h3 style="margin-top:0">' +
      esc(q) + "</h3>" + opts.map((o, k) => '<button class="qopt" type="button" data-k="' + k + '">' + esc(o) + "</button>").join("") + '<p class="qfb"></p><button class="btn" id="q-next" type="button" hidden>Next →</button>';
    $$(".qopt", box).forEach(b => b.onclick = () => {
      const k = +b.dataset.k;
      $$(".qopt", box).forEach(x => { x.disabled = true; if (+x.dataset.k === ok) x.classList.add("right"); });
      if (k === ok) { score++; $(".qfb", box).textContent = "✅ " + why; }
      else { b.classList.add("wrong"); $(".qfb", box).textContent = "❌ " + why; }
      const nx = $("#q-next"); nx.hidden = false; nx.textContent = i === Q.length - 1 ? "See result →" : "Next →";
      nx.onclick = () => { i++; render(); };
    });
  };
  render();
})();

/* ---------- start ---------- */
show();
