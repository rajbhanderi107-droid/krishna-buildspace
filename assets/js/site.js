/* Krishna BuildSpace Ltd. — interactions & animation (no dependencies) */
(function () {
  "use strict";

  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- Preloader / page enter ---- */
  function loaded() { body.classList.add("is-loaded"); }
  if (document.readyState === "complete") setTimeout(loaded, 350);
  else {
    window.addEventListener("load", function () { setTimeout(loaded, 350); });
    setTimeout(loaded, 2500); // never trap the visitor behind the loader
  }
  window.addEventListener("pageshow", function (e) { if (e.persisted) { body.classList.remove("is-leaving"); loaded(); } });

  /* ---- Page leave transition for internal links ---- */
  if (!reduce) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var href = a.getAttribute("href");
      if (a.target === "_blank" || /^(#|mailto:|tel:|https?:)/i.test(href) || !/\.html($|#|\?)/.test(href)) return;
      e.preventDefault();
      body.classList.remove("menu-open");
      body.classList.add("is-leaving");
      setTimeout(function () { window.location.href = href; }, 420);
    });
  }

  /* ---- Header, scroll progress, back to top, parallax ---- */
  var header = $(".header"), bar = $(".scroll-bar"), toTop = $(".to-top");
  var parallax = $$("[data-speed]");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || 0;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, y / max) : 0;
    if (header) header.classList.toggle("is-stuck", y > 40);
    if (bar) bar.style.transform = "scaleX(" + p + ")";
    if (toTop) { toTop.classList.toggle("is-on", y > 500); toTop.style.setProperty("--sp", p.toFixed(3)); }
    if (!reduce) {
      for (var i = 0; i < parallax.length; i++) {
        var el = parallax[i], r = el.parentNode.getBoundingClientRect();
        if (r.bottom < -100 || r.top > window.innerHeight + 100) continue;
        el.style.transform = "translate3d(0," + ((r.top + r.height / 2 - window.innerHeight / 2) * parseFloat(el.dataset.speed)).toFixed(1) + "px,0)";
      }
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* ---- Mobile menu ---- */
  var burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") body.classList.remove("menu-open"); });
    $$(".mobile-menu li").forEach(function (li, i) { li.style.setProperty("--i", i); });
  }

  /* ---- Split hero heading into words ---- */
  $$("[data-split]").forEach(function (h) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var s = document.createElement("span"); s.textContent = part; s.style.setProperty("--i", i++);
            w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    })(h);
  });

  /* ---- Reveal on scroll (with stagger) ---- */
  $$("[data-stagger]").forEach(function (group) {
    Array.prototype.slice.call(group.children).forEach(function (c, i) {
      if (!c.hasAttribute("data-reveal")) c.setAttribute("data-reveal", group.dataset.stagger || "up");
      c.style.setProperty("--d", i % 8);
    });
  });
  var revealEls = $$("[data-reveal], .sec-head, table.projects tbody tr");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add("is-in"); });

  /* ---- Count-up numbers ---- */
  function countUp(el) {
    var end = parseFloat(el.dataset.count), t0 = null, dur = 1800;
    if (reduce) { el.textContent = end; return; }
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(end * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  } else counters.forEach(function (c) { c.textContent = c.dataset.count; });

  /* ---- Pointer effects: card tilt + spotlight, magnetic buttons, hero art ---- */
  if (fine && !reduce) {
    $$("[data-tilt]").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", x * 100 + "%"); card.style.setProperty("--my", y * 100 + "%");
        card.style.transform = "perspective(800px) rotateX(" + ((0.5 - y) * 7).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 7).toFixed(2) + "deg) translateY(-6px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
    $$(".btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
    var hero = $(".hero"), layers = $$("[data-depth]");
    if (hero && layers.length) {
      hero.addEventListener("pointermove", function (e) {
        var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
        layers.forEach(function (l) {
          var d = parseFloat(l.dataset.depth);
          l.style.translate = (x * d).toFixed(1) + "px " + (y * d).toFixed(1) + "px";
        });
      });
    }
  }

  /* ---- Tabs (single-open) ---- */
  $$(".tabs").forEach(function (tabs) {
    $$(".tab__btn", tabs).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.parentNode, open = tab.classList.contains("is-open");
        $$(".tab", tabs).forEach(function (t) { t.classList.remove("is-open"); $(".tab__btn", t).setAttribute("aria-expanded", "false"); });
        if (!open) { tab.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); }
      });
    });
  });

  /* ---- Investors accordion (animated height) ---- */
  $$(".accordion-item").forEach(function (item) {
    var head = $(".accordion-header", item), content = $(".accordion-content", item);
    if (!head || !content) return;
    head.setAttribute("aria-expanded", "false");
    head.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      head.setAttribute("aria-expanded", open);
      if (open) {
        content.style.height = content.scrollHeight + "px";
        content.addEventListener("transitionend", function te() { if (item.classList.contains("is-open")) content.style.height = "auto"; content.removeEventListener("transitionend", te); });
      } else {
        content.style.height = content.scrollHeight + "px";
        void content.offsetHeight;
        content.style.height = "0px";
      }
    });
  });

  /* ---- Modals (DRHP residency confirmation) ---- */
  function openModal(m) { if (m) { m.classList.add("is-open"); m.setAttribute("aria-hidden", "false"); var f = $("button", m); if (f) f.focus(); } }
  function closeModal(m) { if (m) { m.classList.remove("is-open"); m.setAttribute("aria-hidden", "true"); } }
  $$("[data-bs-target]").forEach(function (t) {
    t.addEventListener("click", function (e) { e.preventDefault(); openModal($(t.getAttribute("data-bs-target"))); });
  });
  $$("[data-close]").forEach(function (b) { b.addEventListener("click", function () { closeModal(b.closest(".modal")); }); });
  var confirmBtn = $("#btnConfirmDrhp"), denyBtn = $("#btnDoNotConfirmDrhp");
  if (confirmBtn) confirmBtn.addEventListener("click", function () {
    closeModal(confirmBtn.closest(".modal"));
    window.open(confirmBtn.getAttribute("data-pdf"), "_blank", "noopener");
  });
  if (denyBtn) denyBtn.addEventListener("click", function () {
    closeModal(denyBtn.closest(".modal"));
    openModal($("#drhpDoNotConfirmModal"));
  });

  /* ---- Project table: search + sector filter ---- */
  var table = $("table.projects");
  if (table) {
    var rows = $$("tbody tr", table), search = $("#projectSearch"), chips = $$(".chips button"), count = $("#projectCount"), empty = $(".empty");
    var sector = "";
    var apply = function () {
      var q = (search.value || "").trim().toLowerCase(), n = 0;
      rows.forEach(function (r) {
        var ok = (!sector || r.dataset.sector === sector) && (!q || r.textContent.toLowerCase().indexOf(q) > -1);
        r.classList.toggle("is-hidden", !ok);
        if (ok) { n++; r.classList.add("is-in"); }
      });
      count.textContent = n;
      empty.classList.toggle("is-on", n === 0);
    };
    search.addEventListener("input", apply);
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (x) { x.classList.remove("is-on"); x.setAttribute("aria-pressed", "false"); });
        c.classList.add("is-on"); c.setAttribute("aria-pressed", "true");
        sector = c.dataset.sector; apply();
      });
    });
  }

  /* ---- Contact form (same endpoint and field names as the live site) ---- */
  var form = $("#contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = $("#btnSend"), msg = $("#form-messages");
      var data = new FormData();
      data.append("c_name", $("#ip_name").value);
      data.append("c_email", $("#ip_email").value);
      data.append("c_mobile", $("#ip_contact_number").value);
      data.append("c_message", $("#ip_message").value);
      btn.disabled = true;
      var sp = document.createElement("span"); sp.className = "spin"; btn.insertBefore(sp, btn.firstChild);
      msg.textContent = ""; msg.className = "form-msg";
      fetch(form.getAttribute("action"), { method: "POST", body: data })
        .then(function (res) { return res.text().then(function (t) { if (!res.ok) throw new Error(t); return t; }); })
        .then(function (t) { msg.textContent = t; msg.classList.add("ok"); form.reset(); })
        .catch(function (err) {
          msg.textContent = err && err.message && err.message !== "Failed to fetch" ? err.message : "Your message could not be sent. Please Try Again";
          msg.classList.add("err");
        })
        .then(function () { btn.disabled = false; sp.remove(); });
    });
  }
})();
