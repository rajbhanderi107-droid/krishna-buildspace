/* Krishna BuildSpace Ltd. — motion design layer (no dependencies).
   Numbers in comments (M01…M100) refer to MOTION.md. */
(function () {
  "use strict";

  var doc = document.documentElement, body = document.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var NS = "http://www.w3.org/2000/svg";
  function icon(name, cls) {
    var s = document.createElementNS(NS, "svg"), u = document.createElementNS(NS, "use");
    s.setAttribute("class", "ico" + (cls ? " " + cls : "")); s.setAttribute("aria-hidden", "true");
    u.setAttribute("href", "#i-" + name); s.appendChild(u); return s;
  }
  function inView(el, cb, opts) {
    if (!("IntersectionObserver" in window)) { cb(el); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } });
    }, opts || { threshold: 0.2 });
    io.observe(el);
  }

  /* ---- M02 preloader percentage counter ---- */
  var pct = $(".preloader__pct b");
  if (pct && !reduce) {
    var p0 = performance.now();
    (function tick(t) {
      var k = Math.min(1, (t - p0) / 900);
      pct.textContent = Math.round(100 * (1 - Math.pow(1 - k, 3)));
      if (k < 1 && !body.classList.contains("is-loaded")) requestAnimationFrame(tick); else pct.textContent = 100;
    })(p0);
  }

  /* ---- Investors: add icons to the verbatim accordion (M88–M90) ---- */
  $$(".accordion-item").forEach(function (item) {
    var head = $(".accordion-header", item);
    if (head) {
      var label = document.createElement("span"); label.className = "acc-label";
      Array.prototype.slice.call(head.childNodes).forEach(function (n) { if (!(n.nodeType === 1 && n.classList.contains("accordion-icon"))) label.appendChild(n); });
      head.insertBefore(label, head.firstChild);
      head.insertBefore(icon(/DRHP|Audio/.test(label.textContent) ? "play" : "folder", "acc-ico"), label);
    }
    $$(".investor-item, .accordion-content > p", item).forEach(function (row, i) { row.style.setProperty("--i", i); });
    $$(".investor-item", item).forEach(function (row) {
      var a = $("a", row), p = $("p", row);
      if (p) p.insertBefore(icon(a && /youtube/.test(a.href) ? "play" : "doc", "doc-ico"), p.firstChild);
      if (a) a.insertBefore(icon("eye"), a.firstChild);
    });
  });

  /* ---- M61 icons draw themselves when revealed ---- */
  if (!reduce) {
    $$("main .ico, .footer .ico").forEach(function (ic, i) {
      if (ic.closest(".btn, .theme-btn, .page-title__ico, .hero__gear, .search, .accordion-content, .copy")) return;
      ic.classList.add("draw");
      ic.style.setProperty("--di", i % 6);
      inView(ic, function (el) { el.classList.add("is-drawn"); }, { threshold: 0.4 });
    });
  }

  /* ---- M52 section titles: letters rise one by one ---- */
  $$("[data-chars]").forEach(function (t) {
    var c = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "wd";
            part.split("").forEach(function (ch) {
              var s = document.createElement("span"); s.className = "ch"; s.textContent = ch; s.style.setProperty("--c", c++);
              w.appendChild(s);
            });
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(t);
    t.setAttribute("aria-label", t.textContent);
  });

  /* ---- Scroll engine: header hide (M10), scroll-x text (M54), rotation (M46),
          marquee velocity (M44) ---- */
  var header = $(".header");
  var scrollX = $$("[data-scrollx]"), rotates = $$("[data-rotate]");
  var marquee = $(".marquee__track"), mAnim = null, lastY = window.scrollY, vel = 0, dir = 1, raf = false;
  function frame() {
    raf = false;
    var y = window.scrollY, dy = y - lastY, vh = window.innerHeight;
    lastY = y;
    if (header) header.classList.toggle("is-hidden", dy > 0 && y > 160);
    if (reduce) return;
    scrollX.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var prog = (vh - r.top) / (vh + r.height);
      el.style.transform = "translate3d(" + (parseFloat(el.dataset.scrollx) * prog * el.offsetWidth * 0.5).toFixed(1) + "px,0,0)";
    });
    rotates.forEach(function (el) { el.style.rotate = (y * parseFloat(el.dataset.rotate)).toFixed(1) + "deg"; });
    if (dy) dir = dy > 0 ? 1 : -1;
    vel = Math.min(6, Math.abs(dy) / 8);
  }
  window.addEventListener("scroll", function () { if (!raf) { raf = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();
  // Marquee speeds up with scroll velocity and reverses with scroll direction.
  if (marquee && marquee.getAnimations && !reduce) {
    var rate = 1;
    (function loop() {
      if (!mAnim) mAnim = marquee.getAnimations()[0];
      if (mAnim) { rate += ((dir * (1 + vel)) - rate) * 0.08; mAnim.playbackRate = rate; vel *= 0.92; }
      requestAnimationFrame(loop);
    })();
  }

  /* ---- M55 section dots on the home page ---- */
  var navSecs = $$("[data-nav]");
  if (navSecs.length > 2) {
    var dots = document.createElement("nav"); dots.className = "dots"; dots.setAttribute("aria-label", "Sections");
    navSecs.forEach(function (sec) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", sec.dataset.nav);
      var s = document.createElement("span"); s.textContent = sec.dataset.nav; b.appendChild(s);
      b.addEventListener("click", function () { window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - 60, behavior: reduce ? "auto" : "smooth" }); });
      dots.appendChild(b); sec._dot = b;
    });
    body.appendChild(dots);
    if ("IntersectionObserver" in window) {
      var dio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          navSecs.forEach(function (s) { s._dot.classList.remove("is-on"); });
          e.target._dot.classList.add("is-on");
        });
      }, { rootMargin: "-45% 0px -45% 0px" });
      navSecs.forEach(function (s) { dio.observe(s); });
    }
  }

  /* ---- M21–M24 cursor follower ---- */
  if (fine && !reduce) {
    var cur = document.createElement("div"); cur.className = "cur"; cur.setAttribute("aria-hidden", "true");
    cur.innerHTML = '<div class="cur__ring"><span></span></div>';
    body.appendChild(cur);
    var lbl = $("span", cur), cx = -100, cy = -100, tx = -100, ty = -100;
    document.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY; cur.classList.add("is-on");
      var t = e.target.closest ? e.target : null;
      var lab = t && t.closest("[data-cursor]");
      cur.classList.toggle("is-label", !!lab);
      if (lab) lbl.textContent = lab.dataset.cursor;
      cur.classList.toggle("is-link", !lab && !!(t && t.closest("a, button, .card, .member, input, textarea")));
    }, { passive: true });
    document.addEventListener("pointerdown", function () { cur.classList.add("is-down"); });
    document.addEventListener("pointerup", function () { cur.classList.remove("is-down"); });
    doc.addEventListener("pointerleave", function () { cur.classList.remove("is-on"); });
    (function follow() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cur.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      requestAnimationFrame(follow);
    })();
  }

  /* ---- M26 click ripple on buttons ---- */
  if (!reduce) {
    document.addEventListener("pointerdown", function (e) {
      var b = e.target.closest && e.target.closest(".btn, .theme-btn, .chips button, .copy");
      if (!b) return;
      var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, s = document.createElement("span");
      s.className = "ripple"; s.style.width = s.style.height = d + "px";
      s.style.left = e.clientX - r.left - d / 2 + "px"; s.style.top = e.clientY - r.top - d / 2 + "px";
      if (getComputedStyle(b).position === "static") b.style.position = "relative";
      b.style.overflow = "hidden"; b.appendChild(s);
      setTimeout(function () { s.remove(); }, 750);
    });
  }

  /* ---- M76 "Why choose us" tabs advance on their own until touched ---- */
  $$(".tabs[data-auto]").forEach(function (tabs) {
    if (reduce) return;
    var list = $$(".tab", tabs), timer = null, TIME = 6000;
    tabs.style.setProperty("--tab-time", TIME + "ms");
    var stop = function () { clearInterval(timer); tabs.classList.remove("is-auto"); };
    tabs.addEventListener("click", function (e) { if (e.isTrusted) stop(); });
    tabs.addEventListener("focusin", stop);
    inView(tabs, function () {
      tabs.classList.add("is-auto");
      timer = setInterval(function () {
        var i = list.findIndex(function (t) { return t.classList.contains("is-open"); });
        $(".tab__btn", list[(i + 1) % list.length]).click();
      }, TIME);
    }, { threshold: 0.5 });
  });

  /* ---- Projects: values count up (M85), search highlight (M86), counter tick ---- */
  $$(".projects .val").forEach(function (el) {
    if (reduce) return;
    var raw = el.dataset.val, end = parseFloat(raw.replace(/,/g, "")), dec = (raw.split(".")[1] || "").length;
    var fmt = function (v) { var s = v.toFixed(dec).split("."); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); return s.join("."); };
    el.textContent = fmt(0);
    inView(el, function () {
      var t0 = null;
      requestAnimationFrame(function step(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / 1300);
        el.textContent = k < 1 ? fmt(end * (1 - Math.pow(1 - k, 4))) : raw;
        if (k < 1) requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
  });
  var search = $("#projectSearch");
  if (search) {
    var descs = $$(".projects td.desc");
    descs.forEach(function (d) { d.dataset.text = d.textContent; });
    var count = $("#projectCount");
    search.addEventListener("input", function () {
      var q = search.value.trim();
      descs.forEach(function (d) {
        var text = d.dataset.text;
        d.textContent = "";
        if (q.length < 2) { d.textContent = text; return; }
        var low = text.toLowerCase(), ql = q.toLowerCase(), i = 0, at;
        while ((at = low.indexOf(ql, i)) > -1) {
          d.appendChild(document.createTextNode(text.slice(i, at)));
          var m = document.createElement("mark"); m.textContent = text.slice(at, at + q.length); d.appendChild(m);
          i = at + q.length;
        }
        d.appendChild(document.createTextNode(text.slice(i)));
      });
    });
    if (count && "MutationObserver" in window) new MutationObserver(function () {
      count.classList.remove("is-tick"); void count.offsetWidth; count.classList.add("is-tick");
    }).observe(count, { childList: true, characterData: true, subtree: true });
  }

  /* ---- M100 toast, M95 copy email ---- */
  var toastEl = $(".toast"), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2200);
  }
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var done = function () { b.classList.add("is-done"); toast("Email address copied"); setTimeout(function () { b.classList.remove("is-done"); }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(b.dataset.copy).then(done, function () { toast(b.dataset.copy); });
      else toast(b.dataset.copy);
    });
  });

  /* ---- M94 typewriter on the careers email ---- */
  $$("[data-type]").forEach(function (el) {
    if (reduce) return;
    var text = el.textContent; el.setAttribute("aria-label", text);
    el.style.minHeight = el.offsetHeight + "px"; el.textContent = "";
    inView(el.parentNode, function () {
      var i = 0; el.classList.add("is-typing");
      setTimeout(function type() {
        el.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(type, 70); else setTimeout(function () { el.classList.remove("is-typing"); }, 1500);
      }, 600);
    });
  });

  /* ---- M96 contact form: shake the fields that still need filling ---- */
  var form = $("#contactForm");
  if (form) {
    form.noValidate = true;
    form.addEventListener("submit", function (e) {
      var bad = $$("input, textarea", form).filter(function (f) { return !f.checkValidity(); });
      if (!bad.length) return;
      e.preventDefault(); e.stopImmediatePropagation();
      bad.forEach(function (f) {
        var w = f.closest(".field"); w.classList.remove("is-bad"); void w.offsetWidth; w.classList.add("is-bad");
        f.addEventListener("input", function () { w.classList.remove("is-bad"); }, { once: true });
      });
      bad[0].focus();
      var msg = $("#form-messages"); msg.className = "form-msg err"; msg.textContent = bad[0].validationMessage;
    }, true);
  }

  /* ---- M82 team cards tilt toward the pointer ---- */
  if (fine && !reduce) {
    $$(".member, .griev__card, .mv__card, .safety__item").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-y * 4).toFixed(2) + "deg) rotateY(" + (x * 4).toFixed(2) + "deg) translateY(-6px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }
})();
