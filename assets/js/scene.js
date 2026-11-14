/* Krishna BuildSpace Ltd. — cinematic, scroll-scrubbed home hero.
   A pinned full-screen vector scene that the visitor "plays" by scrolling:
   finished towers at dusk → blueprint wireframe → top-down floor plan →
   floors rising under a crane → glazed, lit towers at dusk again.
   Everything is drawn here in SVG; no images or libraries. */
(function () {
  "use strict";
  var root = document.querySelector(".cine");
  if (!root) return;
  var svg = root.querySelector(".cine__svg"), pin = root.querySelector(".cine__pin");
  var stages = Array.prototype.slice.call(root.querySelectorAll(".cine__stage"));
  var rail = Array.prototype.slice.call(root.querySelectorAll(".cine__rail button"));
  var railFill = root.querySelector(".cine__rail i");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  }
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { var t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var G = 780, CX = 1050, CY = 470, FH = 25;
  var TOWERS = [{ x: 860, w: 176, n: 22 }, { x: 1066, w: 196, n: 17 }];

  /* ---------- defs ---------- */
  var defs = el("defs", {});
  function grad(id, stops) {
    var g = el("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    stops.forEach(function (s) { el("stop", { offset: s[0], "stop-color": s[1] }, g); });
  }
  grad("cDay", [[0, "#a9d3ee"], [0.62, "#e4eef2"], [1, "#f8dfc4"]]);
  grad("cDusk", [[0, "#0b1030"], [0.5, "#2a2d62"], [0.8, "#a8527a"], [1, "#f59a58"]]);
  grad("cGlass", [[0, "#4a6a8e"], [1, "#1f3050"]]);
  grad("cGlassDusk", [[0, "#1c2748"], [1, "#0e1530"]]);
  var pat = el("pattern", { id: "cGrid", width: 40, height: 40, patternUnits: "userSpaceOnUse" }, defs);
  el("path", { d: "M40 0H0V40", fill: "none", stroke: "rgba(159,212,255,.13)", "stroke-width": 1 }, pat);
  var pat2 = el("pattern", { id: "cGrid2", width: 200, height: 200, patternUnits: "userSpaceOnUse" }, defs);
  el("path", { d: "M200 0H0V200", fill: "none", stroke: "rgba(159,212,255,.2)", "stroke-width": 1.2 }, pat2);

  /* ---------- sky ---------- */
  var WIDE = { x: -3000, width: 8000 };
  el("rect", { x: WIDE.x, width: WIDE.width, y: -1300, height: 2200, fill: "url(#cDay)" });
  var sun = el("circle", { cx: 1440, cy: 300, r: 46, fill: "#fff6dc", opacity: 0.95 });
  var skyDusk = el("rect", { x: WIDE.x, width: WIDE.width, y: -1300, height: 2200, fill: "url(#cDusk)" });
  var stars = el("g", { class: "cine-stars" });
  for (var s = 0; s < 60; s++) el("circle", { cx: Math.round(rnd() * 2600 - 300), cy: Math.round(rnd() * 900 - 470), r: (rnd() * 1.4 + 0.5).toFixed(1), fill: "#fff", style: "animation-delay:" + (rnd() * 4).toFixed(1) + "s" }, stars);
  var clouds = el("g", { class: "cine-clouds" });
  [[420, 170, 1], [1250, 120, 0.8], [1700, 230, 1.2], [60, 260, 0.7], [900, 90, 0.6]].forEach(function (c, i) {
    var g = el("g", { transform: "translate(" + c[0] + " " + c[1] + ") scale(" + c[2] + ")", class: "cine-cloud", style: "animation-duration:" + (60 + i * 17) + "s;animation-delay:-" + i * 9 + "s" }, clouds);
    var inner = el("g", {}, g);
    el("ellipse", { cx: 0, cy: 0, rx: 90, ry: 20, fill: "#fff" }, inner);
    el("ellipse", { cx: -24, cy: -16, rx: 40, ry: 24, fill: "#fff" }, inner);
    el("ellipse", { cx: 26, cy: -12, rx: 32, ry: 18, fill: "#fff" }, inner);
  });
  var skyBlue = el("g", {});
  el("rect", { x: WIDE.x, width: WIDE.width, y: -1300, height: 2200, fill: "#0f1b35" }, skyBlue);
  var gridG = el("g", { class: "cine-grid" }, skyBlue);
  el("rect", { x: WIDE.x, width: WIDE.width, y: -1400, height: 3800, fill: "url(#cGrid)" }, gridG);
  el("rect", { x: WIDE.x, width: WIDE.width, y: -1400, height: 3800, fill: "url(#cGrid2)" }, gridG);

  /* ---------- distant skyline ---------- */
  var far = el("g", {});
  var d = "", lit = [], x = -900;
  while (x < 3000) {
    var w = 46 + Math.round(rnd() * 80), h = 50 + Math.round(rnd() * 230);
    if (x + w > 800 && x < 1320) h = Math.min(h, 110);
    d += "M" + x + " " + G + "V" + (G - h) + "H" + (x + w) + "V" + G + "Z";
    for (var k = 0; k < 3; k++) if (rnd() > 0.45) lit.push([x + 6 + Math.round(rnd() * (w - 16)), G - 10 - Math.round(rnd() * (h - 18))]);
    x += w + Math.round(rnd() * 14);
  }
  var farDay = el("path", { d: d, fill: "#9db3c4", opacity: 0.55 }, far);
  var farDusk = el("g", {}, far);
  el("path", { d: d, fill: "#161c3c" }, farDusk);
  lit.forEach(function (p) { el("rect", { x: p[0], y: p[1], width: 4, height: 5, fill: "#ffd98a", opacity: (0.4 + rnd() * 0.6).toFixed(2) }, farDusk); });
  var farWire = el("path", { d: d, fill: "none", stroke: "#9fd4ff", "stroke-width": 1, opacity: 0.3 }, far);

  /* ---------- ground ---------- */
  var groundDay = el("rect", { x: WIDE.x, width: WIDE.width, y: G, height: 1400, fill: "#cdc6b8" });
  var groundDusk = el("rect", { x: WIDE.x, width: WIDE.width, y: G, height: 1400, fill: "#0a0e20" });
  var groundBlue = el("g", {});
  el("rect", { x: WIDE.x, width: WIDE.width, y: G, height: 1400, fill: "#0f1b35" }, groundBlue);
  el("path", { d: "M-3000 " + G + "H5000", stroke: "#9fd4ff", "stroke-width": 1.5 }, groundBlue);

  /* ---------- elevation: towers ---------- */
  var elev = el("g", {});
  var floors = [];
  TOWERS.forEach(function (t, ti) {
    for (var i = 0; i < t.n; i++) {
      var y = G - (i + 1) * FH, g = el("g", {}, elev), cell = t.w / 8, j, cols = "", mull = "";
      for (j = 0; j <= 4; j++) cols += "M" + (t.x + 6 + j * (t.w - 12) / 4) + " " + y + "v" + FH;
      for (j = 1; j < 8; j++) mull += "M" + (t.x + j * cell) + " " + y + "v" + FH;
      // concrete structure
      var slab = el("g", { opacity: 0 }, g);
      el("rect", { x: t.x, y: y, width: t.w, height: FH, fill: "#c9ccd2" }, slab);
      el("rect", { x: t.x - 4, y: y + FH - 5, width: t.w + 8, height: 5, fill: "#8e939d" }, slab);
      el("path", { d: cols, stroke: "#8e939d", "stroke-width": 5 }, slab);
      // finished facade (day + dusk tint) with slab band and mullions
      var glass = el("g", {}, g);
      el("rect", { x: t.x, y: y, width: t.w, height: FH, fill: "url(#cGlass)" }, glass);
      var tint = el("rect", { x: t.x, y: y, width: t.w, height: FH, fill: "url(#cGlassDusk)" }, glass);
      el("path", { d: mull, stroke: "rgba(255,255,255,.16)", "stroke-width": 1 }, glass);
      el("rect", { x: t.x - 5, y: y + FH - 5, width: t.w + 10, height: 5, fill: "#eef1f4" }, glass);
      // lit windows
      var lg = el("g", {}, g), nl = 1 + Math.floor(rnd() * 4);
      for (j = 0; j < nl; j++) el("rect", { x: t.x + Math.floor(rnd() * 8) * cell + 3, y: y + 3, width: cell - 6, height: FH - 11, fill: rnd() > 0.3 ? "#ffd98a" : "#ffeccc" }, lg);
      // blueprint wire
      var wire = el("g", { opacity: 0, fill: "none", stroke: "#9fd4ff" }, g);
      el("rect", { x: t.x, y: y, width: t.w, height: FH, "stroke-width": 1.2 }, wire);
      el("path", { d: mull, "stroke-width": 0.6, opacity: 0.6 }, wire);
      floors.push({ i: i, n: t.n, slab: slab, glass: glass, tint: tint, lit: lg, wire: wire, r: rnd(), g: g, ti: ti });
    }
    // roof crown
    var top = G - t.n * FH, crown = el("g", {}, elev);
    el("rect", { x: t.x + 14, y: top - 16, width: t.w - 28, height: 16, fill: "#2a3d5e" }, crown);
    el("rect", { x: t.x + t.w * 0.42, y: top - 54, width: 4, height: 40, fill: "#eb2027" }, crown);
    t.crown = crown;
    var cw = el("g", { fill: "none", stroke: "#9fd4ff", "stroke-width": 1.2, opacity: 0 }, elev);
    el("rect", { x: t.x + 14, y: top - 16, width: t.w - 28, height: 16 }, cw);
    t.crownWire = cw;
  });

  /* ---------- drafting labels (blueprint view) ---------- */
  var dims = el("g", { opacity: 0, class: "cine-dims" });
  var topA = G - TOWERS[0].n * FH, rx = TOWERS[1].x + TOWERS[1].w + 46;
  el("path", { d: "M" + rx + " " + topA + "V" + G + "M" + (rx - 10) + " " + topA + "h20M" + (rx - 10) + " " + G + "h20", pathLength: 1, class: "pl" }, dims);
  el("path", { d: "M" + TOWERS[0].x + " " + (G + 38) + "H" + (TOWERS[1].x + TOWERS[1].w) + "M" + TOWERS[0].x + " " + (G + 28) + "v20M" + (TOWERS[1].x + TOWERS[1].w) + " " + (G + 28) + "v20", pathLength: 1, class: "pl" }, dims);
  el("path", { d: "M" + (TOWERS[0].x - 60) + " " + topA + "H" + (rx + 40) + "M" + (TOWERS[0].x - 60) + " " + (G - TOWERS[1].n * FH) + "H" + (rx + 40), pathLength: 1, class: "pl pl--dash" }, dims);
  el("text", { x: TOWERS[0].x, y: G + 74, class: "cine-lbl" }, dims).textContent = "ELEVATION";
  el("text", { x: rx + 16, y: (topA + G) / 2, class: "cine-lbl", transform: "rotate(-90 " + (rx + 16) + " " + (topA + G) / 2 + ")", "text-anchor": "middle" }, dims).textContent = "SECTION";

  /* ---------- crane ---------- */
  var crane = el("g", { opacity: 0, class: "cine-crane", fill: "none", stroke: "#eb2027", "stroke-linecap": "round" }, elev);
  var MX = 800, MT = 120, JR = 1290, zig = "";
  for (var z = G; z > MT + 20; z -= 26) zig += "M" + (MX - 9) + " " + z + "l18 -13l-18 -13";
  el("path", { d: "M" + (MX - 9) + " " + G + "V" + MT + "M" + (MX + 9) + " " + G + "V" + MT + zig, "stroke-width": 2 }, crane);
  var jz = ""; for (var q = MX + 20; q < JR - 10; q += 28) jz += "M" + q + " " + (MT + 16) + "l14 -16l14 16";
  el("path", { d: "M" + (MX - 110) + " " + (MT + 16) + "H" + JR + "M" + MX + " " + MT + "H" + JR + jz + "M" + MX + " " + (MT - 46) + "L" + JR + " " + MT + "M" + MX + " " + (MT - 46) + "L" + (MX - 110) + " " + (MT + 16) + "M" + MX + " " + (MT - 46) + "V" + MT, "stroke-width": 2 }, crane);
  el("rect", { x: MX - 110, y: MT + 16, width: 44, height: 26, fill: "#eb2027", stroke: "none" }, crane);
  el("rect", { x: MX - 14, y: MT + 18, width: 28, height: 26, fill: "#171b2a", stroke: "#eb2027", "stroke-width": 2 }, crane);
  el("circle", { cx: MX, cy: MT - 46, r: 5, fill: "#eb2027", stroke: "none", class: "cine-beacon" }, crane);
  var trolley = el("g", {}, crane);
  el("rect", { x: -9, y: MT + 16, width: 18, height: 8, fill: "#171b2a", stroke: "none" }, trolley);
  var cable = el("path", { d: "", stroke: "#171b2a", "stroke-width": 1.4 }, trolley);
  var load = el("g", {}, trolley);
  el("path", { d: "M0 0l-22 18M0 0l22 18", stroke: "#171b2a", "stroke-width": 1.2 }, load);
  el("rect", { x: -34, y: 18, width: 68, height: 10, fill: "#8e939d", stroke: "none" }, load);

  /* ---------- top-down floor plan ---------- */
  var plan = el("g", { opacity: 0, class: "cine-plan", fill: "none", stroke: "#9fd4ff", "stroke-linecap": "round", "stroke-linejoin": "round" });
  el("rect", { x: CX - 320, y: CY - 200, width: 640, height: 400, rx: 76, fill: "rgba(159,212,255,.07)", "stroke-width": 2.2, pathLength: 1, class: "pl" }, plan);
  el("rect", { x: CX - 296, y: CY - 176, width: 592, height: 352, rx: 58, "stroke-width": 1, pathLength: 1, class: "pl", opacity: 0.6 }, plan);
  el("rect", { x: CX - 78, y: CY - 64, width: 156, height: 128, "stroke-width": 2, pathLength: 1, class: "pl" }, plan);
  el("path", { d: "M" + (CX - 78) + " " + CY + "h156M" + CX + " " + (CY - 64) + "v128M" + (CX - 40) + " " + (CY - 64) + "v64M" + (CX + 40) + " " + CY + "v64", "stroke-width": 1.2, pathLength: 1, class: "pl" }, plan);
  el("path", {
    d: "M" + (CX - 296) + " " + (CY - 50) + "H" + (CX - 78) + "M" + (CX + 78) + " " + (CY - 50) + "H" + (CX + 296) + "M" + (CX - 296) + " " + (CY + 60) + "H" + (CX - 78) + "M" + (CX + 78) + " " + (CY + 60) + "H" + (CX + 296) +
      "M" + (CX - 180) + " " + (CY - 176) + "V" + (CY - 50) + "M" + (CX - 180) + " " + (CY + 60) + "V" + (CY + 176) + "M" + (CX + 180) + " " + (CY - 176) + "V" + (CY - 50) + "M" + (CX + 180) + " " + (CY + 60) + "V" + (CY + 176) +
      "M" + (CX - 40) + " " + (CY - 176) + "V" + (CY - 64) + "M" + (CX + 60) + " " + (CY + 64) + "V" + (CY + 176) + "M" + (CX - 240) + " " + (CY - 50) + "V" + (CY + 60) + "M" + (CX + 240) + " " + (CY - 50) + "V" + (CY + 60),
    "stroke-width": 1.6, pathLength: 1, class: "pl"
  }, plan);
  // door swings
  el("path", { d: "M" + (CX - 180) + " " + (CY - 80) + "a30 30 0 0 1 30 30M" + (CX + 180) + " " + (CY + 90) + "a30 30 0 0 0 -30 -30M" + (CX - 40) + " " + (CY - 100) + "a30 30 0 0 0 30 30M" + (CX + 60) + " " + (CY + 100) + "a30 30 0 0 1 -30 -30", "stroke-width": 1, pathLength: 1, class: "pl", opacity: 0.7 }, plan);
  var colsG = el("g", { fill: "#eb2027", stroke: "none", class: "cine-cols" }, plan);
  [[-240, -150], [-120, -150], [0, -150], [120, -150], [240, -150], [-270, 0], [270, 0], [-240, 150], [-120, 150], [0, 150], [120, 150], [240, 150]].forEach(function (c, i) {
    el("circle", { cx: CX + c[0], cy: CY + c[1], r: 6, style: "transition-delay:" + i * 40 + "ms" }, colsG);
  });
  // dimension lines + grid axes
  el("path", { d: "M" + (CX - 320) + " " + (CY - 240) + "h640M" + (CX - 320) + " " + (CY - 250) + "v20M" + (CX + 320) + " " + (CY - 250) + "v20M" + (CX - 366) + " " + (CY - 200) + "v400M" + (CX - 376) + " " + (CY - 200) + "h20M" + (CX - 376) + " " + (CY + 200) + "h20", stroke: "#eb2027", "stroke-width": 1.2, pathLength: 1, class: "pl" }, plan);
  ["A", "B", "C", "D", "E"].forEach(function (t, i) {
    var ax = CX - 240 + i * 120;
    el("circle", { cx: ax, cy: CY + 250, r: 13, "stroke-width": 1, pathLength: 1, class: "pl" }, plan);
    el("text", { x: ax, y: CY + 255, class: "cine-lbl", "text-anchor": "middle", stroke: "none" }, plan).textContent = t;
    el("path", { d: "M" + ax + " " + (CY + 237) + "V" + (CY + 206), "stroke-width": 0.8, pathLength: 1, class: "pl pl--dash" }, plan);
  });
  el("text", { x: CX + 336, y: CY - 232, class: "cine-lbl", stroke: "none" }, plan).textContent = "PLAN";
  var north = el("g", { transform: "translate(" + (CX + 380) + " " + (CY + 150) + ")", class: "cine-north" }, plan);
  el("circle", { r: 22, "stroke-width": 1, pathLength: 1, class: "pl" }, north);
  el("path", { d: "M0 -30L8 8L0 2L-8 8Z", fill: "#eb2027", stroke: "none" }, north);
  el("text", { x: 0, y: -36, class: "cine-lbl", "text-anchor": "middle", stroke: "none" }, north).textContent = "N";

  /* ---------- sizing: keep the towers in frame on any screen ---------- */
  function size() {
    var w = pin.clientWidth, h = pin.clientHeight, a = w / h, vh = 900, vw = vh * a, focus = a < 1 ? 0.5 : a < 1.35 ? 0.58 : 0.66;
    if (a < 0.8) { vw = 720; vh = vw / a; }           // portrait: fit towers by width
    var y0 = a < 0.8 ? G - vh * 0.8 : 0;
    svg.setAttribute("viewBox", (CX - vw * focus).toFixed(0) + " " + y0.toFixed(0) + " " + vw.toFixed(0) + " " + vh.toFixed(0));
  }
  size();
  window.addEventListener("resize", size);

  /* ---------- the timeline ---------- */
  var STAGE_AT = [0, 0.115, 0.3, 0.52, 0.78];           // where each caption takes over
  var STAGE_TO = [0, 0.2, 0.38, 0.66, 0.97];            // where a rail click scrolls to
  var lastStage = -1;
  function render(p) {
    var first = p < 0.5;
    var tBlue = seg(p, 0.08, 0.2), tDay = seg(p, 0.46, 0.55);
    var tPlan = seg(p, 0.26, 0.35) - seg(p, 0.44, 0.52);
    var pm = seg(p, 0.55, 0.77) * 1.0, ex = seg(p, 0.77, 0.92), dusk2 = seg(p, 0.86, 0.985);
    var duskO = first ? 1 - tBlue : dusk2, blueO = first ? tBlue : 1 - tDay;
    var wireO = first ? tBlue : 0.22 * (1 - ex), litBase = first ? 1 - seg(p, 0.04, 0.14) : dusk2;

    skyDusk.setAttribute("opacity", duskO.toFixed(3));
    stars.setAttribute("opacity", duskO.toFixed(3));
    skyBlue.setAttribute("opacity", blueO.toFixed(3));
    clouds.setAttribute("opacity", ((1 - duskO) * (1 - blueO) * 0.95).toFixed(3));
    sun.setAttribute("cy", lerp(260, 700, dusk2).toFixed(0));
    sun.setAttribute("opacity", ((1 - blueO) * (first ? 0 : 1)).toFixed(3));
    farDay.setAttribute("opacity", (0.55 * (1 - blueO)).toFixed(3));
    farDusk.setAttribute("opacity", (duskO * (1 - blueO)).toFixed(3));
    farWire.setAttribute("opacity", (0.3 * blueO * (1 - tPlan)).toFixed(3));
    groundDusk.setAttribute("opacity", duskO.toFixed(3));
    groundBlue.setAttribute("opacity", blueO.toFixed(3));

    for (var i = 0; i < floors.length; i++) {
      var f = floors[i];
      var gO = first ? 1 - tBlue : clamp(ex * (f.n + 2) - f.i);
      var sO = first ? 0 : clamp(pm * (f.n + 1.5) - f.i);
      f.glass.setAttribute("opacity", gO.toFixed(3));
      f.slab.setAttribute("opacity", (sO * (1 - gO)).toFixed(3));
      f.wire.setAttribute("opacity", wireO.toFixed(3));
      f.tint.setAttribute("opacity", duskO.toFixed(3));
      f.lit.setAttribute("opacity", (gO * clamp((litBase - f.r * 0.7) / 0.3)).toFixed(3));
      // each new floor drops into place
      var drop = first ? 0 : (1 - clamp(pm * (f.n + 1.5) - f.i)) * -14;
      f.g.setAttribute("transform", drop ? "translate(0 " + drop.toFixed(1) + ")" : "");
    }
    TOWERS.forEach(function (t) {
      t.crown.setAttribute("opacity", (first ? 1 - tBlue : seg(ex, 0.9, 1)).toFixed(3));
      t.crownWire.setAttribute("opacity", wireO.toFixed(3));
    });

    // elevation tilts away into the plan and back
    var sy = 1 - tPlan * 0.92;
    elev.setAttribute("transform", "translate(" + CX + " " + (CY + 110) + ") scale(" + (1 + tPlan * 0.25).toFixed(3) + " " + sy.toFixed(3) + ") translate(" + -CX + " " + -(CY + 110) + ")");
    elev.setAttribute("opacity", (1 - seg(tPlan, 0.25, 0.75)).toFixed(3));
    var pd = seg(tPlan, 0.25, 1);
    plan.setAttribute("opacity", seg(tPlan, 0.35, 0.85).toFixed(3));
    plan.setAttribute("transform", "translate(" + CX + " " + CY + ") scale(" + (0.82 + 0.18 * pd).toFixed(3) + " " + (0.25 + 0.75 * seg(tPlan, 0.1, 0.9)).toFixed(3) + ") rotate(" + ((1 - pd) * -7).toFixed(2) + ") translate(" + -CX + " " + -CY + ")");
    plan.style.setProperty("--pd", pd.toFixed(3));
    plan.classList.toggle("is-on", pd > 0.75);
    dims.setAttribute("opacity", (blueO * (1 - seg(tPlan, 0, 0.4)) * (first ? 1 : 0)).toFixed(3));
    dims.style.setProperty("--pd", (first ? seg(p, 0.12, 0.24) : 0).toFixed(3));

    // crane follows the build
    var cO = seg(p, 0.5, 0.57) * (1 - seg(p, 0.9, 0.96));
    crane.setAttribute("opacity", cO.toFixed(3));
    if (cO > 0) {
      var cyc = (pm * 9) % 1, tw = TOWERS[Math.floor(pm * 9) % 2], tx = lerp(MX + 40, tw.x + tw.w / 2, seg(cyc, 0, 0.5));
      var topY = G - Math.min(tw.n, pm * (tw.n + 1.5)) * FH, hy = lerp(MT + 60, Math.max(MT + 60, topY - 40), seg(cyc, 0.35, 0.9));
      if (pm >= 1) { tx = MX + 60; hy = MT + 70; }
      trolley.setAttribute("transform", "translate(" + tx.toFixed(1) + " 0)");
      cable.setAttribute("d", "M0 " + (MT + 24) + "V" + hy.toFixed(1));
      load.setAttribute("transform", "translate(0 " + hy.toFixed(1) + ")");
      load.setAttribute("opacity", pm >= 1 ? 0 : 1);
    }

    // captions + rail
    var st = 0;
    for (var s2 = 0; s2 < STAGE_AT.length; s2++) if (p >= STAGE_AT[s2]) st = s2;
    if (st !== lastStage) {
      lastStage = st;
      stages.forEach(function (e, n) { e.classList.toggle("is-on", n === st); e.classList.toggle("is-past", n < st); });
      rail.forEach(function (b, n) { b.classList.toggle("is-on", n + 1 <= st); b.classList.toggle("is-now", n + 1 === st); });
      root.setAttribute("data-stage-now", st);
    }
    if (railFill) railFill.style.setProperty("--p", clamp((p - 0.1) / 0.75).toFixed(3));
    root.style.setProperty("--cp", p.toFixed(3));
  }

  /* ---------- scroll scrubbing with easing ---------- */
  var target = 0, cur = -1;
  function measure() {
    var r = root.getBoundingClientRect(), span = r.height - window.innerHeight;
    target = span > 0 ? clamp(-r.top / span) : 0;
  }
  if (reduce) { render(0); return; }
  root.classList.add("is-live");
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure);
  measure();
  (function loop() {
    var next = cur < 0 ? target : cur + (target - cur) * 0.14;
    if (Math.abs(next - cur) > 0.0004) { cur = next; render(cur); }
    requestAnimationFrame(loop);
  })();
  rail.forEach(function (b, n) {
    b.addEventListener("click", function () {
      var span = root.offsetHeight - window.innerHeight;
      window.scrollTo({ top: root.offsetTop + span * STAGE_TO[n + 1], behavior: "smooth" });
    });
  });

  /* ---------- pointer parallax on the far skyline and clouds ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    pin.addEventListener("pointermove", function (e) {
      var mx = e.clientX / window.innerWidth - 0.5, my = e.clientY / window.innerHeight - 0.5;
      far.style.transform = "translate(" + (mx * -26).toFixed(1) + "px," + (my * -6).toFixed(1) + "px)";
      clouds.style.transform = "translate(" + (mx * -50).toFixed(1) + "px," + (my * -14).toFixed(1) + "px)";
      stars.style.transform = "translate(" + (mx * -12).toFixed(1) + "px," + (my * -6).toFixed(1) + "px)";
    });
  }
})();
