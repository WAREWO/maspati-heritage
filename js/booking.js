/* Heritage Pass — alur 5 langkah. Pembayaran di sini hanya simulasi. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Kurs yang ditetapkan kelompok untuk paket berharga USD */
  var KURS = 18108.5;
  var WORKSHOPS = {
    kopi: "Traditional Coffee Making",
    kerupuk: "Kerupuk Upil Making",
    cincau: "Cincau Making",
    ketupat: "Ketupat Weaving"
  };
  var PATROL = 500000; /* add-on musik patrol, per rombongan */

  /*
    day: "weekday" = Minggu–Jumat, "sat" = khusus Sabtu, "any" = setiap hari
    ws : jumlah workshop yang harus dipilih rombongan
    usd: harga dalam dolar (dikonversi dengan KURS)
  */
  var PACKAGES = [
    { id: "everyday", g: "Tiket Masuk", n: "Everyday Ticket", d: "Tiket masuk kampung + gratis 1 Heritage Keychain. Berlaku Minggu–Jumat.", p: 5000, min: 1, max: 30, day: "weekday",
      inc: "Tiket masuk + Heritage Keychain", slots: ["09.00 WIB", "13.00 WIB", "15.30 WIB"] },
    { id: "saturday-night", g: "Tiket Masuk", n: "Saturday Night Ticket", d: "Tiket masuk hari Sabtu + gratis Heritage Keychain + Cultural Night pukul 19.00 WIB.", p: 15000, min: 1, max: 40, day: "sat",
      inc: "Tiket masuk + Heritage Keychain + Cultural Night", slots: ["09.00 WIB", "13.00 WIB", "15.30 WIB", "19.00 WIB"] },
    { id: "royal-welcome", g: "Paket Wisata", n: "A · Maspati Royal Welcome", d: "Wisatawan mancanegara. Jaranan, jamu, pijat kepala, heritage walk, storytelling, 2 workshop, kuliner lokal, souvenir. ± 3 jam 50 menit. Minimal 20 orang.", usd: 15, min: 20, max: 40, day: "any", ws: 2,
      slots: ["08.00 WIB", "13.00 WIB"] },
    { id: "student-explorer", g: "Paket Wisata", n: "B · Maspati Student Explorer", d: "Pelajar SD–SMA dan mahasiswa. Heritage walk, storytelling, 1 workshop, air mineral. ± 2 jam 10 menit. Minimal 24 orang.", p: 50000, min: 24, max: 40, day: "any", ws: 1,
      slots: ["08.00 WIB", "10.30 WIB", "13.00 WIB"] },
    { id: "cultural-gathering", g: "Paket Wisata", n: "D · Maspati Cultural Gathering", d: "Komunitas, instansi, korporat. Heritage walk, traditional team building, 1 workshop, local snack. ± 2 jam 50 menit. Minimal 25 orang.", p: 75000, min: 25, max: 50, day: "any", ws: 1, addon: true,
      slots: ["08.00 WIB", "13.00 WIB"] }
  ];
  PACKAGES.forEach(function (p) { if (p.usd) p.p = p.usd * KURS; });

  var METHODS = { qris: "QRIS", va: "Transfer Virtual Account", tunai: "Tunai saat tiba" };
  var HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  var BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  function fresh() { return { step: 1, pkg: null, date: "", slot: "", qty: 1, method: "", ws: [], patrol: false }; }
  var state = fresh();
  var form = $("#pass-form");
  if (!form) return;

  function rupiah(n) { return "Rp" + Math.round(n).toLocaleString("id-ID"); }
  function ymd(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function nice(s) { var d = parse(s); return HARI[d.getDay()] + ", " + d.getDate() + " " + BULAN[d.getMonth()] + " " + d.getFullYear(); }
  function byId(id) { return PACKAGES.filter(function (p) { return p.id === id; })[0]; }
  function total() {
    if (!state.pkg) return 0;
    return state.pkg.p * state.qty + (state.pkg.addon && state.patrol ? PATROL : 0);
  }
  function totalText() {
    if (state.pkg && state.pkg.usd) {
      var t = "USD " + state.pkg.usd * state.qty;
      if (state.patrol && state.pkg.addon) t += " + " + rupiah(PATROL);
      return t + " (≈" + rupiah(total()) + ")";
    }
    return rupiah(total());
  }
  function priceLabel(p) { return p.usd ? "USD " + p.usd : rupiah(p.p); }
  function wsText() { return state.ws.map(function (k) { return WORKSHOPS[k]; }).join(", "); }

  /* --- daftar paket --- */
  var list = $("#pkg-list"), group = "";
  list.innerHTML = PACKAGES.map(function (p) {
    var head = p.g !== group ? '<p class="pkg-group">' + p.g + "</p>" : "";
    group = p.g;
    return head + '<label class="pkg"><input type="radio" name="pkg" value="' + p.id + '"><span><b>' + p.n + "</b><small>" + p.d + '</small></span><span class="amt">' +
      priceLabel(p) + "<small> /orang</small></span></label>";
  }).join("");

  /* --- pilihan workshop & add-on (muncul untuk paket wisata) --- */
  var extra = $("#pkg-extra");
  function renderExtra() {
    var p = state.pkg;
    if (!p || !p.ws) { extra.hidden = true; extra.innerHTML = ""; return; }
    extra.hidden = false;
    var html = '<div class="field" id="f-ws" style="margin:0"><span class="lbl">Pilih ' + p.ws + " workshop untuk rombongan</span>" +
      '<div class="ws-pick">' + Object.keys(WORKSHOPS).map(function (k) {
        return '<label><input type="checkbox" name="ws" value="' + k + '"' + (state.ws.indexOf(k) > -1 ? " checked" : "") + "> " + WORKSHOPS[k] + "</label>";
      }).join("") + "</div>" +
      '<span class="hint">' + (p.ws === 2 ? "Dua workshop dipilih untuk satu rombongan, bukan per peserta." : "Satu workshop untuk seluruh rombongan.") + "</span>" +
      '<span class="err">Pilih tepat ' + p.ws + " workshop.</span></div>";
    if (p.addon) {
      html += '<div class="field" style="margin:14px 0 0"><span class="lbl">Add-on opsional</span>' +
        '<label class="pkg"><input type="checkbox" name="patrol"' + (state.patrol ? " checked" : "") + "><span><b>Penyambutan musik patrol</b><small>Dimainkan anak dan remaja kampung saat welcoming.</small></span>" +
        '<span class="amt">' + rupiah(PATROL) + "<small> /rombongan</small></span></label></div>";
    }
    extra.innerHTML = html;
  }

  /* --- jam & jumlah --- */
  function renderSlots() {
    var box = $("#slots");
    var opts = state.pkg ? state.pkg.slots : [];
    if (opts.indexOf(state.slot) < 0) state.slot = "";
    if (opts.length === 1) state.slot = opts[0];
    box.innerHTML = opts.map(function (s) {
      var lbl = s + (state.pkg.day === "sat" && s === "19.00 WIB" ? " · langsung Cultural Night" : "");
      return '<label><input type="radio" name="slot" value="' + s + '"' + (s === state.slot ? " checked" : "") + ">" + lbl + "</label>";
    }).join("");
  }
  function clampQty() {
    if (!state.pkg) return;
    state.qty = Math.min(state.pkg.max, Math.max(state.pkg.min, state.qty));
    $("#qty-out").textContent = state.qty;
    $("#qty-hint").textContent = state.pkg.min > 1
      ? "Minimal pemesanan " + state.pkg.min + " orang, maksimal " + state.pkg.max + " orang."
      : "Maksimal " + state.pkg.max + " orang per pemesanan.";
  }
  $("#qty-minus").addEventListener("click", function () { state.qty--; clampQty(); summary(); });
  $("#qty-plus").addEventListener("click", function () { state.qty++; clampQty(); summary(); });

  /* --- ringkasan --- */
  function summary() {
    var p = state.pkg;
    $("#s-pkg").textContent = p ? p.n : "Belum dipilih";
    $("#s-date").textContent = state.date ? nice(state.date) : "—";
    $("#s-slot").textContent = state.slot || "—";
    $("#s-qty").textContent = p ? state.qty + " orang" : "—";
    var incRow = $("#s-inc-row"), wsRow = $("#s-ws-row");
    incRow.hidden = !(p && p.inc);
    if (p && p.inc) $("#s-inc").textContent = p.inc;
    wsRow.hidden = !(p && p.ws);
    if (p && p.ws) $("#s-ws").textContent = (state.ws.length ? wsText() : "Belum dipilih") + (p.addon && state.patrol ? " + musik patrol" : "");
    $("#s-total").textContent = totalText();
    $("#s-note").textContent = !p ? "Pilih tiket atau paket untuk melihat total."
      : p.usd ? "Harga USD dikonversi dengan kurs Rp18.108,50. Pembayaran rupiah mengikuti kurs ini."
      : p.day === "sat" ? "Tiket hari Sabtu otomatis memakai harga Saturday Night karena ada Cultural Night."
      : p.day === "weekday" ? "Datang hari Sabtu? Tiket otomatis berganti ke Saturday Night Ticket."
      : "Harga per orang sudah termasuk pemandu, bahan workshop, dan dokumentasi kelompok.";
  }

  /* --- validasi --- */
  function bad(id, cond) {
    var f = document.getElementById(id);
    if (f) f.classList.toggle("bad", cond);
    return cond;
  }
  var dayNote = $("#date-note");
  function selectPkg(id) {
    var input = $('input[name="pkg"][value="' + id + '"]', form);
    if (input) input.checked = true;
    var prev = state.pkg;
    state.pkg = byId(id);
    if (!prev || prev.min !== state.pkg.min) state.qty = Math.max(state.qty, state.pkg.min);
  }
  function checkDate() {
    var msg = "";
    dayNote.hidden = true;
    if (!state.date) msg = "Pilih tanggal kunjungan.";
    else if (state.date < ymd(new Date())) msg = "Tanggal tidak boleh lewat dari hari ini.";
    else {
      var sat = parse(state.date).getDay() === 6;
      if (state.pkg.day === "weekday" && sat) {
        selectPkg("saturday-night");
        dayNote.textContent = "Hari Sabtu memakai Saturday Night Ticket (Rp15.000): tiket masuk, keychain, dan Cultural Night pukul 19.00 WIB. Pilihanmu sudah diganti otomatis.";
        dayNote.hidden = false;
        renderSlots(); clampQty();
      } else if (state.pkg.day === "sat" && !sat) {
        selectPkg("everyday");
        dayNote.textContent = "Selain hari Sabtu berlaku Everyday Ticket (Rp5.000) dengan keychain. Cultural Night hanya ada Sabtu malam. Pilihanmu sudah diganti otomatis.";
        dayNote.hidden = false;
        renderSlots(); clampQty();
      }
    }
    $("#f-date .err").textContent = msg;
    return !bad("f-date", !!msg);
  }
  var validators = {
    1: function () {
      if (bad("f-pkg", !state.pkg)) return false;
      if (state.pkg.ws) return !bad("f-ws", state.ws.length !== state.pkg.ws);
      return true;
    },
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
      state.pkg = byId(t.value);
      state.qty = state.pkg.min;
      state.ws = [];
      state.patrol = false;
      dayNote.hidden = true;
      document.getElementById("f-pkg").classList.remove("bad");
      renderExtra();
    }
    if (t.name === "ws") {
      state.ws = $$('input[name="ws"]:checked', form).map(function (i) { return i.value; });
      if (state.ws.length > state.pkg.ws) {
        t.checked = false;
        state.ws = $$('input[name="ws"]:checked', form).map(function (i) { return i.value; });
      }
      if (state.ws.length === state.pkg.ws) bad("f-ws", false);
    }
    if (t.name === "patrol") state.patrol = t.checked;
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
    var p = state.pkg;

    $("#t-pkg").textContent = p.n;
    $("#t-name").textContent = name;
    $("#t-date").textContent = nice(state.date);
    $("#t-slot").textContent = state.slot;
    $("#t-qty").textContent = state.qty + " orang";
    $("#t-pay").textContent = METHODS[state.method];
    $("#t-total").textContent = totalText();
    $("#t-code").textContent = code;
    var extraTxt = p.inc ? p.inc : wsText() + (p.addon && state.patrol ? " + musik patrol" : "");
    $("#t-inc-label").textContent = p.inc ? "Termasuk" : "Workshop";
    $("#t-inc").textContent = extraTxt;

    var qr = window.qrcode(0, "M");
    qr.addData("MASPATI|" + code + "|" + p.id + "|" + state.date + "|" + state.qty + (state.ws.length ? "|" + state.ws.join("+") : "") + (state.patrol ? "|patrol" : ""));
    qr.make();
    $("#t-qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });

    var wa = $("#t-wa");
    var msg = "Halo Reembun Nusantara, saya " + name + ". Saya memesan " + p.n + " pada " + nice(state.date) + " pukul " + state.slot + " untuk " + state.qty + " orang" +
      (state.ws.length ? " dengan workshop " + wsText() : "") + (state.patrol ? " dan add-on musik patrol" : "") + ". Total " + totalText() + ". Kode: " + code + ".";
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
    state = fresh();
    dayNote.hidden = true;
    renderExtra();
    go(1);
  });

  /* --- pilih otomatis dari tautan ?paket= --- */
  var want = new URLSearchParams(location.search).get("paket");
  if (want) {
    var input = $('input[name="pkg"][value="' + want.replace(/[^a-z-]/g, "") + '"]', form);
    if (input) {
      input.checked = true;
      state.pkg = byId(input.value);
      state.qty = state.pkg.min;
      renderExtra();
    }
  }
  summary();
})();
