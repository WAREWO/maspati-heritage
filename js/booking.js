/* Heritage Pass — alur 5 langkah. Pembayaran di sini hanya simulasi. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* est: true = harga dari riset 2022; false = harga rancangan */
  var PACKAGES = [
    { id: "walk-mandiri", g: "Heritage Walk", n: "Jelajah Mandiri", d: "Berkeliling sendiri tanpa pemandu.", p: 5000, min: 1, max: 30, est: true },
    { id: "walk-guide", g: "Heritage Walk", n: "Walk bersama Pemandu", d: "Ditemani pemandu warga. Minimal 5 orang.", p: 15000, min: 5, max: 30, est: true },
    { id: "walk-lunch", g: "Heritage Walk", n: "Walk + Makan Siang", d: "Pemandu warga dan makan siang setelah berkeliling. Minimal 10 orang.", p: 50000, min: 10, max: 40, est: true },
    { id: "komplit", g: "Heritage Walk", n: "Paket Komplit Rombongan", d: "Pinjaman sarung dan udeng, welcome drink, musik patrol, paduan suara lansia, praktik daur ulang. 20–25 orang.", p: 2000000, flat: true, min: 20, max: 25, est: true },
    { id: "cultural-night", g: "Budaya", n: "Cultural Night", d: "Pentas warga setiap Sabtu pukul 19.00 WIB.", p: 75000, min: 1, max: 40, sat: true },
    { id: "games", g: "Budaya", n: "Traditional Games", d: "Bermain dolanan lawas bersama anak-anak kampung.", p: 25000, min: 2, max: 30 },
    { id: "remo", g: "Budaya", n: "Kelas Tari Remo", d: "Belajar gerak dasar Tari Remo, 90 menit.", p: 100000, min: 1, max: 15 },
    { id: "ws-kopi", g: "Local Workshop", n: "Workshop Coffee", d: "Menyeduh kopi di Omah Tuo.", p: 60000, min: 1, max: 12 },
    { id: "ws-kerupuk", g: "Local Workshop", n: "Workshop Kerupuk Upil", d: "Menggoreng kerupuk dengan pasir, tanpa minyak.", p: 50000, min: 1, max: 12 },
    { id: "ws-cincau", g: "Local Workshop", n: "Workshop Cincau", d: "Mengolah daun cincau dari pot warga.", p: 40000, min: 1, max: 12 },
    { id: "ws-ketupat", g: "Local Workshop", n: "Workshop Ketupat", d: "Menganyam janur menjadi ketupat.", p: 40000, min: 1, max: 12 }
  ];
  var SLOTS = ["09.00 WIB", "13.00 WIB", "15.30 WIB"];
  var METHODS = { qris: "QRIS", va: "Transfer Virtual Account", tunai: "Tunai saat tiba" };
  var HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  var BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  var state = { step: 1, pkg: null, date: "", slot: "", qty: 1, method: "" };
  var form = $("#pass-form");
  if (!form) return;

  function rupiah(n) { return "Rp" + n.toLocaleString("id-ID"); }
  function ymd(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function nice(s) { var d = parse(s); return HARI[d.getDay()] + ", " + d.getDate() + " " + BULAN[d.getMonth()] + " " + d.getFullYear(); }
  function total() { return !state.pkg ? 0 : state.pkg.flat ? state.pkg.p : state.pkg.p * state.qty; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /* --- daftar paket --- */
  var list = $("#pkg-list"), group = "";
  list.innerHTML = PACKAGES.map(function (p) {
    var head = p.g !== group ? '<p class="pkg-group">' + p.g + "</p>" : "";
    group = p.g;
    return head + '<label class="pkg"><input type="radio" name="pkg" value="' + p.id + '"><span><b>' + p.n + "</b><small>" + p.d + '</small></span><span class="amt">' +
      rupiah(p.p) + "<small> /" + (p.flat ? "rombongan" : "orang") + "</small></span></label>";
  }).join("");

  /* --- jam & jumlah --- */
  function renderSlots() {
    var box = $("#slots");
    var opts = state.pkg && state.pkg.sat ? ["19.00 WIB"] : SLOTS;
    if (opts.indexOf(state.slot) < 0) state.slot = "";
    if (opts.length === 1) state.slot = opts[0];
    box.innerHTML = opts.map(function (s) {
      return '<label><input type="radio" name="slot" value="' + s + '"' + (s === state.slot ? " checked" : "") + ">" + s + "</label>";
    }).join("");
  }
  function clampQty() {
    if (!state.pkg) return;
    state.qty = Math.min(state.pkg.max, Math.max(state.pkg.min, state.qty));
    $("#qty-out").textContent = state.qty;
    $("#qty-hint").textContent = "Paket ini untuk " + state.pkg.min + "–" + state.pkg.max + " orang." + (state.pkg.flat ? " Harganya tetap per rombongan." : "");
  }
  $("#qty-minus").addEventListener("click", function () { state.qty--; clampQty(); summary(); });
  $("#qty-plus").addEventListener("click", function () { state.qty++; clampQty(); summary(); });

  /* --- ringkasan --- */
  function summary() {
    $("#s-pkg").textContent = state.pkg ? state.pkg.n : "Belum dipilih";
    $("#s-date").textContent = state.date ? nice(state.date) : "—";
    $("#s-slot").textContent = state.slot || "—";
    $("#s-qty").textContent = state.pkg ? state.qty + " orang" : "—";
    $("#s-total").textContent = rupiah(total());
    $("#s-note").textContent = !state.pkg ? "Pilih pengalaman untuk melihat total."
      : state.pkg.est ? "Harga mengacu pada kajian Kampung Lawas Maspati tahun 2022." : "Harga program ini masih rancangan.";
  }

  /* --- validasi --- */
  function bad(id, cond) {
    var f = document.getElementById(id);
    f.classList.toggle("bad", cond);
    return cond;
  }
  function checkDate() {
    var msg = "";
    if (!state.date) msg = "Pilih tanggal kunjungan.";
    else if (state.date < ymd(new Date())) msg = "Tanggal tidak boleh lewat dari hari ini.";
    else if (state.pkg.sat && parse(state.date).getDay() !== 6) msg = "Cultural Night hanya ada pada hari Sabtu.";
    $("#f-date .err").textContent = msg;
    return !bad("f-date", !!msg);
  }
  var validators = {
    1: function () { return !bad("f-pkg", !state.pkg); },
    2: function () {
      var a = checkDate();
      var b = !bad("f-slot", !state.slot);
      return a && b;
    },
    3: function () {
      var a = !bad("f-nama", form.nama.value.trim().length < 2);
      var b = !bad("f-hp", !/^(\+62|62|0)8[0-9 -]{7,14}$/.test(form.hp.value.trim()));
      var c = !bad("f-email", !form.email.checkValidity() || !form.email.value);
      return a && b && c;
    },
    4: function () { return !bad("f-pay", !state.method); }
  };

  /* --- perpindahan langkah --- */
  function go(n) {
    state.step = n;
    $$(".pane").forEach(function (p) { p.hidden = +p.dataset.step !== n; });
    $$(".steps li").forEach(function (li, i) {
      li.classList.toggle("on", i + 1 === n);
      li.classList.toggle("done", i + 1 < n);
      if (i + 1 === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    if (n === 2) { renderSlots(); clampQty(); }
    summary();
    var top = $("#booking").getBoundingClientRect().top + window.scrollY - 92;
    if (window.scrollY > top) window.scrollTo({ top: top });
    var h = $('.pane[data-step="' + n + '"] h2');
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  $$("[data-next]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!validators[state.step]()) {
        var e = $('.pane[data-step="' + state.step + '"] .bad');
        if (e) e.scrollIntoView({ block: "center" });
        return;
      }
      if (state.step === 4) { finish(); return; }
      go(state.step + 1);
    });
  });
  $$("[data-prev]").forEach(function (b) {
    b.addEventListener("click", function () { go(state.step - 1); });
  });

  /* --- perubahan input --- */
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "pkg") {
      state.pkg = PACKAGES.filter(function (p) { return p.id === t.value; })[0];
      state.qty = state.pkg.min;
      document.getElementById("f-pkg").classList.remove("bad");
    }
    if (t.name === "slot") { state.slot = t.value; document.getElementById("f-slot").classList.remove("bad"); }
    if (t.name === "pay") { state.method = t.value; document.getElementById("f-pay").classList.remove("bad"); }
    if (t.name === "tanggal") { state.date = t.value; checkDate(); }
    summary();
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  form.tanggal.min = ymd(new Date());

  /* --- tiket --- */
  function finish() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", tail = "";
    for (var i = 0; i < 5; i++) tail += chars[Math.floor(Math.random() * chars.length)];
    var code = "MSP-" + state.date.slice(2).replace(/-/g, "") + "-" + tail;
    var name = form.nama.value.trim();

    $("#t-pkg").textContent = state.pkg.n;
    $("#t-name").textContent = name;
    $("#t-date").textContent = nice(state.date);
    $("#t-slot").textContent = state.slot;
    $("#t-qty").textContent = state.qty + " orang";
    $("#t-pay").textContent = METHODS[state.method];
    $("#t-total").textContent = rupiah(total());
    $("#t-code").textContent = code;

    var qr = window.qrcode(0, "M");
    qr.addData("MASPATI|" + code + "|" + state.pkg.id + "|" + state.date + "|" + state.qty);
    qr.make();
    $("#t-qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });

    var wa = $("#t-wa");
    var msg = "Halo Reembun Nusantara, saya " + name + ". Saya memesan " + state.pkg.n + " pada " + nice(state.date) + " pukul " + state.slot + " untuk " + state.qty + " orang. Kode: " + code + ".";
    if (window.MaspatiWA && window.MaspatiWA.ready) {
      wa.href = window.MaspatiWA.link(msg);
      wa.target = "_blank";
      wa.rel = "noopener";
    }
    go(5);
  }
  $("#t-print").addEventListener("click", function () { window.print(); });
  $("#t-new").addEventListener("click", function () {
    form.reset();
    state = { step: 1, pkg: null, date: "", slot: "", qty: 1, method: "" };
    go(1);
  });

  /* --- pilih otomatis dari tautan ?paket= --- */
  var want = new URLSearchParams(location.search).get("paket");
  if (want) {
    var input = $('input[name="pkg"][value="' + want.replace(/[^a-z-]/g, "") + '"]', form);
    if (input) {
      input.checked = true;
      state.pkg = PACKAGES.filter(function (p) { return p.id === input.value; })[0];
      state.qty = state.pkg.min;
    }
  }
  summary();
})();
