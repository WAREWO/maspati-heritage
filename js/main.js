/* Kampoeng Lawas Maspati — perilaku bersama semua halaman */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var cfg = window.SITE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- header & menu ---------- */
  var header = $(".site-header");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = $(".burger"), nav = $(".nav");
  function closeNav() {
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  }
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  /* ---------- animasi muncul saat digulir ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- hero tiga gang ---------- */
  var panels = $$(".hp"), heroBtns = $$(".hero-index button");
  if (panels.length) {
    var cur = 0, timer = null;
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var show = function (i) {
      cur = i;
      panels.forEach(function (p, n) { p.classList.toggle("is-active", n === i); });
      heroBtns.forEach(function (b, n) {
        b.classList.toggle("on", n === i);
        b.setAttribute("aria-pressed", String(n === i));
      });
    };
    var play = function () {
      if (still) return;
      clearInterval(timer);
      timer = setInterval(function () { show((cur + 1) % panels.length); }, 5500);
    };
    heroBtns.forEach(function (b, i) { b.addEventListener("click", function () { show(i); play(); }); });
    show(0);
    play();
  }

  /* ---------- indeks 01 02 03 di hero halaman ---------- */
  var idxLinks = $$(".pidx a");
  if (idxLinks.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        idxLinks.forEach(function (a) {
          a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    idxLinks.forEach(function (a) {
      var t = document.getElementById(a.getAttribute("href").slice(1));
      if (t) spy.observe(t);
    });
  }

  /* ---------- kontak dari config.js ---------- */
  function waLink(text) {
    return "https://wa.me/" + cfg.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  window.MaspatiWA = { link: waLink, ready: !!cfg.whatsapp };

  $$("[data-wa]").forEach(function (el) {
    var msg = el.getAttribute("data-wa");
    /* bila nomor belum diisi, tautan tetap menuju halaman Contact */
    if (cfg.whatsapp) {
      el.href = waLink(msg);
      el.target = "_blank";
      el.rel = "noopener";
    }
  });
  $$("[data-wa-text]").forEach(function (el) {
    if (cfg.whatsapp) el.textContent = "+" + cfg.whatsapp;
  });
  $$("[data-social]").forEach(function (el) {
    var url = cfg[el.getAttribute("data-social")];
    if (url) { el.href = url; el.target = "_blank"; el.rel = "noopener"; }
    else { el.hidden = true; }
  });
  $$("[data-social-empty]").forEach(function (el) {
    if (cfg.instagram || cfg.tiktok || cfg.youtube) el.hidden = true;
  });

  /* ---------- tab workshop ---------- */
  $$(".tabs").forEach(function (tabs) {
    var btns = $$("button", tabs);
    function pick(btn, focus) {
      btns.forEach(function (b) {
        var on = b === btn;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) btn.focus();
    }
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () { pick(b); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") pick(btns[(i + 1) % btns.length], true);
        if (e.key === "ArrowLeft") pick(btns[(i - 1 + btns.length) % btns.length], true);
      });
    });
    pick(btns[0]);
    var hash = location.hash.slice(1);
    btns.forEach(function (b) { if (b.getAttribute("aria-controls") === hash) pick(b); });
  });

  /* ---------- kartu cerita bisa dibalik ---------- */
  $$(".story").forEach(function (c) {
    c.addEventListener("click", function () {
      c.setAttribute("aria-pressed", String(c.getAttribute("aria-pressed") !== "true"));
    });
  });

  /* ---------- peta warisan ---------- */
  var SITES = [
    { n: "Omah Tuo", t: "Rumah H. Soemargono dari 1907. Pernah menjadi pabrik sepatu, lalu tempat pejuang menyusun strategi pada 1945. Kini kedai kopi dan perpustakaan.", a: "Maspati V No. 31" },
    { n: "Sekolah Ongko Loro", t: "Tweede Inlandsche School, sekolah rakyat tiga tahun untuk memberantas buta huruf. Muridnya menulis di atas sabak dengan gerit.", a: "Area Kampung Lawas" },
    { n: "Rumah Raden Sumomiharjo", t: "Rumah keturunan Kraton Solo yang dikenal warga sebagai ndoro mantri nyamuk. Bangunannya rapuh, jadi hanya dilihat dari depan dan samping.", a: "Area Kampung Lawas" },
    { n: "Losmen Asri", t: "Rumah dan pabrik roti H. Iskak pada 1940-an, dapur umum pejuang pada 1945, dan losmen sejak 1958. Bangunannya tembus ke Jalan Tembaan.", a: "Sisi Jalan Tembaan" },
    { n: "Makam Mbah Buyut Suruh", t: "Pesarean Raden Karyo Sentono dan Mbah Buyut Suruh, sesepuh yang diyakini warga sebagai pendiri kampung. Tempat ziarah dan jamasan pusaka.", a: "Sudut Gang VI" }
  ];
  var panel = $("#map-panel");
  if (panel) {
    var pins = $$(".pin"), mapBtns = $$(".map-list button");
    var pickSite = function (i) {
      var s = SITES[i];
      $("h3", panel).textContent = s.n;
      $("[data-map-a]", panel).textContent = s.a;
      $("[data-map-t]", panel).textContent = s.t;
      pins.forEach(function (p, n) { p.classList.toggle("on", n === i); });
      mapBtns.forEach(function (b, n) { b.classList.toggle("on", n === i); });
    };
    pins.forEach(function (p, i) {
      p.addEventListener("click", function () { pickSite(i); });
      p.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickSite(i); }
      });
    });
    mapBtns.forEach(function (b, i) { b.addEventListener("click", function () { pickSite(i); }); });
    pickSite(0);
  }

  /* ---------- agenda ---------- */
  var BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  var EVENTS = [
    { d: "2026-11-10", t: "Napak Tilas 10 November", k: "program", x: "Jalan bersama menyusuri Omah Tuo dan Losmen Asri, dua tempat yang berperan pada pertempuran Surabaya." },
    { d: "2026-11-22", t: "Kerja Bakti & Tanam Toga", k: "program", x: "Pengunjung ikut warga merawat gang dan menanam tanaman obat keluarga." },
    { d: "2026-12-13", t: "Pasar UMKM Kampung Lawas", k: "program", x: "Produk unggulan lima RT dalam satu gang: cincau, semprit jahe, hingga sirup markisa." },
    { d: "2027-01-24", t: "Ulang Tahun Kampung Wisata", k: "program", x: "Mengenang peresmian Kampung Lawas Maspati sebagai kampung wisata pada 24 Januari 2016." },
    { d: "2027-03-14", t: "Halal Bihalal Warga", k: "tradisi", x: "Kaum muda bersilaturahmi ke para sesepuh. Tanggal menyesuaikan Idul Fitri." },
    { d: "2027-04-21", t: "Sehari di Sekolah Ongko Loro", k: "program", x: "Kelas lawas Hari Kartini: berkebaya jarik dan belajar menulis di atas sabak." },
    { d: "2027-05-31", t: "Remo untuk Hari Jadi Surabaya", k: "program", x: "Pentas Tari Remo dan musik patrol di gang kampung." },
    { d: "2027-06-06", t: "Suroan: Muluk Bareng & Jamasan", k: "tradisi", x: "Warga mengarak tumpeng, makan bersama, dan mensucikan pusaka. Tanggal mengikuti 1 Muharram." }
  ];

  function ymd(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function cultural(dateStr) {
    return { d: dateStr, t: "Cultural Night", k: "program", x: "Musik patrol, paduan suara lansia, dan Tari Remo, pukul 19.00 WIB.", pkg: "saturday-night" };
  }
  function eventsOn(dateStr) {
    var out = EVENTS.filter(function (e) { return e.d === dateStr; });
    if (parse(dateStr).getDay() === 6) out.push(cultural(dateStr));
    return out;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function evRow(e) {
    var d = parse(e.d);
    var label = e.k === "tradisi" ? "Tradisi warga" : "Program";
    var btn = e.pkg ? '<a class="btn btn--ghost" href="pass.html?paket=' + e.pkg + '">Pesan</a>' : "";
    return '<li class="ev"><div class="ev-date"><b>' + d.getDate() + "</b>" + BLN[d.getMonth()] + " " + d.getFullYear() +
      '</div><div><span class="tag">' + label + "</span><h3>" + esc(e.t) + "</h3><p>" + esc(e.x) + "</p></div>" + btn + "</li>";
  }
  function upcoming(n, kind) {
    var today = ymd(new Date());
    var list = EVENTS.filter(function (e) { return e.d >= today; });
    var d = new Date();
    for (var i = 0; i < 28; i++) {
      if (d.getDay() === 6) list.push(cultural(ymd(d)));
      d.setDate(d.getDate() + 1);
    }
    var firstSat = list.filter(function (e) { return e.pkg; })[0];
    list = list.filter(function (e) { return !e.pkg || e === firstSat; });
    if (kind && kind !== "all") list = list.filter(function (e) { return e.k === kind; });
    return list.sort(function (a, b) { return a.d < b.d ? -1 : 1; }).slice(0, n);
  }

  var upBox = $("[data-upcoming]");
  if (upBox) {
    upBox.innerHTML = upcoming(+upBox.getAttribute("data-upcoming")).map(evRow).join("");
  }

  var cal = $("#cal");
  if (cal) {
    var now = new Date(), view = new Date(now.getFullYear(), now.getMonth(), 1);
    var sel = null, kind = "all";
    var box = $("#cal-days"), label = $("#cal-label"), listBox = $("#cal-list"), listTitle = $("#cal-title");
    var match = function (e) { return kind === "all" || e.k === kind; };
    var renderList = function () {
      var rows;
      if (sel) {
        var d = parse(sel);
        listTitle.textContent = d.getDate() + " " + BULAN[d.getMonth()] + " " + d.getFullYear();
        rows = eventsOn(sel).filter(match);
      } else {
        listTitle.textContent = "Agenda terdekat";
        rows = upcoming(5, kind);
      }
      listBox.innerHTML = rows.length ? rows.map(evRow).join("") : '<li class="ev-empty">Tidak ada agenda pada tanggal ini.</li>';
    };
    var render = function () {
      label.textContent = BULAN[view.getMonth()] + " " + view.getFullYear();
      var html = "", y = view.getFullYear(), m = view.getMonth();
      var offset = (new Date(y, m, 1).getDay() + 6) % 7;
      var days = new Date(y, m + 1, 0).getDate();
      for (var i = 0; i < offset; i++) html += "<span></span>";
      for (var n = 1; n <= days; n++) {
        var ds = ymd(new Date(y, m, n));
        var evs = eventsOn(ds).filter(match);
        var cls = (evs.length ? "has " : "") + (ds === ymd(now) ? "today " : "") + (ds === sel ? "sel" : "");
        var dot = evs.length ? '<i class="' + (evs.some(function (e) { return e.k === "tradisi"; }) ? "tradisi" : "") + '"></i>' : "";
        html += '<button type="button" class="' + cls + '" data-d="' + ds + '" aria-label="' + n + " " + BULAN[m] + (evs.length ? ", ada " + evs.length + " agenda" : "") + '">' + n + dot + "</button>";
      }
      box.innerHTML = html;
    };
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      sel = sel === b.dataset.d ? null : b.dataset.d;
      render(); renderList();
    });
    $("#cal-prev").addEventListener("click", function () { view.setMonth(view.getMonth() - 1); render(); });
    $("#cal-next").addEventListener("click", function () { view.setMonth(view.getMonth() + 1); render(); });
    $$("#cal-chips button").forEach(function (b, _, all) {
      b.addEventListener("click", function () {
        kind = b.dataset.k;
        all.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        render(); renderList();
      });
    });
    render(); renderList();
  }

  /* ---------- formulir kontak ---------- */
  var cForm = $("#contact-form");
  if (cForm) {
    cForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$(".field", cForm).forEach(function (f) {
        var inp = $("input,textarea,select", f);
        var bad = !inp.checkValidity();
        f.classList.toggle("bad", bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      var msg = "Halo Reembun Nusantara, saya " + cForm.nama.value + ".\n" + cForm.pesan.value;
      var out = $("#contact-out");
      if (cfg.whatsapp) {
        window.open(waLink(msg), "_blank", "noopener");
        out.textContent = "WhatsApp dibuka di tab baru. Tinggal tekan kirim.";
      } else {
        out.textContent = "Pesan sudah tersusun, tetapi nomor WhatsApp belum diisi di js/config.js.";
      }
      out.hidden = false;
    });
  }
})();
