#!/usr/bin/env python3
"""Static site generator for the Krishna BuildSpace Ltd. website.

Run from the repository root:  python3 tools/build.py
Writes the eight .html pages into the repository root. Shared header/footer
live here so every page stays in sync; project tables and the investors
accordion are rendered from tools/data/.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "tools" / "data"
SITE = "https://krishna.build"
esc = html.escape

# ------------------------------------------------------------------ ICONS
# One stroke-icon set (24px grid) shared by every page through an SVG sprite.
# Every shape gets pathLength="1" so icons can "draw" themselves on reveal.
ICONS = {
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "up": '<path d="M12 19V5M6 11l6-6 6 6"/>',
    "caret": '<path d="M6 9l6 6 6-6"/>',
    "chevron": '<path d="M9 6l6 6-6 6"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    "home": '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/>',
    "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.6c2.4.3 4 1.9 4.500 4.400"/>',
    "user": '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.600-6 7-6s6.200 2 7 6"/>',
    "crane": '<path d="M4 21h16"/><path d="M7 21V4"/><path d="M7 4l12 3H7"/><path d="M16 6.500V11"/><path d="M14.500 11h3v3h-3z"/><path d="M5 21v-3h4v3"/>',
    "city": '<path d="M3 21h18"/><path d="M5 21V7l6-4v18"/><path d="M11 9h8v12"/><path d="M8 9v.01M8 13v.01M8 17v.01M15 13v.01M15 17v.01"/>',
    "progress": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "check": '<circle cx="12" cy="12" r="9"/><path d="M8 12.500l2.800 2.800L16 9.500"/>',
    "chart": '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4"/><path d="M12 16V8"/><path d="M16 16v-6"/>',
    "briefcase": '<rect x="3" y="7" width="18" height="13" rx="1"/><path d="M9 7V4h6v3"/><path d="M3 13h18"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/>',
    "phone": '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1C10.700 20 4 13.300 4 5a1 1 0 011-1z"/>',
    "pin": '<path d="M12 21s-7-6.200-7-11.500a7 7 0 0114 0C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
    "doc": '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 13h6"/><path d="M9 17h6"/>',
    "folder": '<path d="M3 6h6l2 2h10v11H3z"/>',
    "eye": '<path d="M2 12s3.600-6.500 10-6.500S22 12 22 12s-3.600 6.500-10 6.500S2 12 2 12z"/><circle cx="12" cy="12" r="2.800"/>',
    "play": '<circle cx="12" cy="12" r="9"/><path d="M10 8.500l5.500 3.500-5.500 3.500z"/>',
    "compass": '<circle cx="12" cy="12" r="9"/><path d="M15.500 8.500l-2 5-5 2 2-5z"/>',
    "clipboard": '<path d="M9 4h6v3H9z"/><path d="M7 5.500H5V21h14V5.500h-2"/><path d="M8.500 12l1.500 1.500 3-3"/><path d="M8.500 17h7"/>',
    "gantt": '<path d="M4 4v16h16"/><path d="M8 8h7"/><path d="M10 12h8"/><path d="M8 16h5"/>',
    "hardhat": '<path d="M3 18h18"/><path d="M5 18v-3a7 7 0 0114 0v3"/><path d="M10 8.500V5h4v3.500"/>',
    "rupee": '<path d="M7 5h10"/><path d="M7 9h10"/><path d="M7 5c6 0 6 8 0 8l7 7"/>',
    "calendar": '<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16"/><path d="M8 3v4"/><path d="M16 3v4"/>',
    "layers": '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    "hash": '<path d="M5 9h14"/><path d="M5 15h14"/><path d="M10 4L8 20"/><path d="M16 4l-2 16"/>',
    "landmark": '<path d="M3 9l9-5 9 5"/><path d="M5 9v9"/><path d="M10 9v9"/><path d="M14 9v9"/><path d="M19 9v9"/><path d="M3 20h18"/>',
    "shield": '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    "target": '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    "siren": '<path d="M7 18v-5a5 5 0 0110 0v5"/><path d="M5 21h14"/><path d="M12 3v2"/><path d="M4.500 6.500L6 8"/><path d="M19.500 6.500L18 8"/>',
    "refresh": '<path d="M4 12a8 8 0 0114-5l2 2"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 01-14 5l-2-2"/><path d="M4 20v-5h5"/>',
    "copy": '<rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V4H4v12h4"/>',
    "send": '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
    "gear": '<circle cx="12" cy="12" r="3.200"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M5.300 18.700l2.100-2.100M16.600 7.400l2.100-2.100"/>',
    "wallet": '<rect x="3" y="6" width="18" height="13" rx="1"/><path d="M3 10h18"/><path d="M16 14.500h2"/>',
    "award": '<circle cx="12" cy="9" r="5"/><path d="M9 13.500L7.500 21l4.500-2.500 4.500 2.500L15 13.500"/>',
    "map": '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
}


def sprite():
    out = []
    for name, body in ICONS.items():
        body = re.sub(r"<(path|circle|rect)\b", r'<\1 pathLength="1"', body)
        out.append(f'<symbol id="i-{name}" viewBox="0 0 24 24">{body}</symbol>')
    return f'<svg class="sprite" aria-hidden="true" focusable="false">{"".join(out)}</svg>'


def ico(name, cls=""):
    return f'<svg class="ico{" " + cls if cls else ""}" aria-hidden="true"><use href="#i-{name}"/></svg>'


ARROW = ico("arrow", "arr")

NAV = [
    ("Home", "index.html", "home", None),
    ("About Us", "about-us.html", "info", None),
    ("Our Team", "our-team.html", "users", None),
    ("Projects", None, "crane", [("Ongoing Projects", "ongoing-projects.html", "progress"), ("Completed Projects", "completed-projects.html", "check")]),
    ("Investors", "investors.html", "chart", None),
    ("Career", "career.html", "briefcase", None),
]


def roll(label):
    return f'<span class="roll" data-t="{label}"><span>{label}</span></span>'


def header(current):
    items, mobile = [], []
    for label, href, icon, sub in NAV:
        if sub:
            active = " is-active" if current in [h for _, h, _ in sub] else ""
            subs = "".join(
                f'<li style="--i:{i}"><a href="{h}"{" aria-current=\"page\"" if h == current else ""}>{ico(ic)}{l}</a></li>'
                for i, (l, h, ic) in enumerate(sub)
            )
            items.append(f'<li class="has-sub{active}"><button type="button" aria-haspopup="true">{roll(label)} {ico("caret", "caret")}</button><ul class="sub">{subs}</ul></li>')
            for l, h, ic in sub:
                mobile.append(f'<li><a href="{h}"{" aria-current=\"page\"" if h == current else ""}>{ico(ic)}{l}</a></li>')
        else:
            cur = ' aria-current="page"' if href == current else ""
            items.append(f'<li class="{"is-active" if href == current else ""}"><a href="{href}"{cur}>{roll(label)}</a></li>')
            mobile.append(f'<li><a href="{href}"{cur}>{ico(icon)}{label}</a></li>')
    cur = ' aria-current="page"' if current == "contact-us.html" else ""
    items.append(f'<li class="nav-cta"><a href="contact-us.html"{cur}>{ico("mail")}Contact us</a></li>')
    mobile.append(f'<li><a href="contact-us.html"{cur}>{ico("mail")}Contact us</a></li>')
    return f"""
{sprite()}
<div class="preloader" aria-hidden="true">
  <i class="preloader__panel"></i><i class="preloader__panel"></i>
  <div class="preloader__in">
    <div class="preloader__build"><i></i><i></i><i></i><i></i><i></i></div>
    <img src="assets/images/logo-white.png" alt="">
    <div class="preloader__bar"><i></i></div>
    <div class="preloader__pct"><b>0</b>%</div>
  </div>
</div>
<div class="page-veil" aria-hidden="true"><img src="assets/images/logo-white.png" alt=""></div>
<div class="scroll-bar" aria-hidden="true"></div>
<header class="header">
  <div class="wrap header__in">
    <a class="logo" href="index.html" aria-label="Krishna BuildSpace Ltd. — Home"><img src="assets/images/logo-white.png" alt="Krishna BuildSpace Ltd." width="351" height="90"></a>
    <nav aria-label="Main"><ul class="nav">{''.join(items)}</ul></nav>
    <button class="burger" type="button" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>
  </div>
</header>
<nav class="mobile-menu" aria-label="Mobile"><ul>{''.join(mobile)}</ul></nav>
"""


def flink(href, label):
    return f'<li><a href="{href}">{ico("chevron")}{label}</a></li>'


FOOTER = f"""
<footer class="footer">
  <div class="footer__word" aria-hidden="true"><span data-scrollx="-0.35">Krishna BuildSpace Ltd. &nbsp;·&nbsp; Building Beyond Boundaries. &nbsp;·&nbsp; Krishna BuildSpace Ltd.</span></div>
  <div class="footer__sky" aria-hidden="true"></div>
  <div class="wrap footer__in" data-stagger="up">
    <div>
      <img src="assets/images/logo-white.png" alt="Krishna BuildSpace Ltd." width="351" height="90">
      <p>Krishna BuildSpace Ltd. offers a wide range of services, such as design &amp; architectural, pre-construction planning, project management &amp; execution.</p>
    </div>
    <div>
      <h4>Quick Links</h4>
      <ul>{flink("about-us.html", "About Us")}{flink("our-team.html", "Our Team")}{flink("career.html", "Career")}{flink("contact-us.html", "Contact Us")}</ul>
    </div>
    <div>
      <h4>Quick Links</h4>
      <ul>{flink("investors.html", "Investors")}{flink("ongoing-projects.html", "Ongoing Projects")}{flink("completed-projects.html", "Completed Projects")}</ul>
    </div>
    <div>
      <h4>Contact Us</h4>
      <address>
        <span class="footer__row">{ico("pin")}<span>510, Zion Prime,<br>Before Shilaj Railway Crossing,<br>Thaltej-Shilaj Road, Thaltej,<br>Ahmedabad - 380059,<br>Gujarat, India.</span></span>
        <span class="footer__row">{ico("mail")}<a href="mailto:mail@krishna.build">mail@krishna.build</a></span>
      </address>
    </div>
  </div>
  <div class="footer__bar"><div class="wrap">Copyright &copy; 2025 <b>Krishna BuildSpace Ltd.</b> All Rights Reserved</div></div>
</footer>
<button class="to-top" type="button" aria-label="Back to top">
  <svg class="ring" viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="23"/></svg>
  {ico("up", "ar")}
</button>
<div class="toast" role="status" aria-live="polite"></div>
<script src="assets/js/site.js"></script>
<script src="assets/js/motion.js"></script>
"""

NOSCRIPT = (
    "[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}"
    ".preloader{display:none}.hero h1 .w>span,.page-title h1 span,.title .ch{transform:none!important;opacity:1!important}"
    ".crumbs{opacity:1!important}.accordion-content{height:auto!important}"
    ".projects tbody tr{opacity:1!important;transform:none!important}main{opacity:1!important;transform:none!important}"
)


def page(filename, title, body, cls=""):
    full = "Krishna BuildSpace Ltd." if not title else f"{title} | Krishna BuildSpace Ltd."
    doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{full}</title>
<meta name="author" content="Krishna BuildSpace Ltd. | Engineering &amp; Construction Management Company">
<meta name="keywords" content="Krishna BuildSpace Ltd. , Engineering &amp; Construction Management Company">
<meta name="description" content="Krishna BuildSpace Ltd. | Engineering &amp; Construction Management Company">
<meta name="robots" content="INDEX,FOLLOW">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="website">
<meta property="og:title" content="{full}">
<meta property="og:description" content="Krishna BuildSpace Ltd. | Engineering &amp; Construction Management Company">
<meta property="og:site_name" content="Krishna BuildSpace Ltd.">
<meta name="theme-color" content="#171b2a">
<link rel="icon" type="image/png" href="assets/images/favicon.png">
<link rel="apple-touch-icon" href="assets/images/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
<link rel="stylesheet" href="assets/css/motion.css">
<noscript><style>{NOSCRIPT}</style></noscript>
</head>
<body class="{cls}">
{header(filename)}
<main>
{body}
</main>
{FOOTER}
</body>
</html>
"""
    (ROOT / filename).write_text(doc, encoding="utf-8")
    print("wrote", filename)


def page_title(title, icon, crumb=None):
    marks = "".join(f'<i style="--x:{x}%;--y:{y}%;--t:{t}s;--s:{s}"></i>' for x, y, t, s in [(58, 22, 7, 1), (70, 62, 9, .7), (82, 30, 6, 1.2), (91, 70, 8, .8), (64, 80, 10, .6), (77, 12, 11, .9)])
    return f"""
<section class="page-title">
  <div class="page-title__bg" data-speed="0.25" aria-hidden="true"></div>
  <div class="page-title__marks" aria-hidden="true">{marks}</div>
  <div class="page-title__ico" aria-hidden="true">{ico(icon)}</div>
  <div class="wrap">
    <h1><span>{title}</span></h1>
    <div class="crumbs"><a href="index.html">{ico("home")}Home</a><i></i>{f'<span>{crumb}</span><i></i>' if crumb else ''}<span>{title}</span></div>
  </div>
  <div class="page-title__line" aria-hidden="true"></div>
</section>"""


def head(eyebrow, title, subtitle=None, centered=False):
    sub = f'<p class="subtitle">{subtitle}</p>' if subtitle else ""
    return f'<div class="sec-head{" centered" if centered else ""}" data-reveal="up"><span class="eyebrow">{eyebrow}</span><h2 class="title" data-chars>{title}</h2>{sub}</div>'


def stats():
    def ring(icon):
        return f'<span class="stat__ico"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="37" pathLength="1"/></svg><img src="assets/images/icons/{icon}.svg" alt="" width="44" height="44"></span>'
    return f"""<div class="stats stats--3" data-stagger="up">
      <div class="stat">{ring("blueprint")}<div><b><span data-count="150">150</span>+</b><span>Projects Delivered</span></div></div>
      <div class="stat">{ring("experience")}<div><b><span data-count="30">30</span>+ Years</b><span>of Experience</span></div></div>
      <div class="stat">{ring("pan-india")}<div><b>Pan-India</b><span>Presence</span></div></div>
    </div>"""


# --------------------------------------------------------------------- HOME
DISCIPLINES = [
    ("Infrastructure", "infrastructure"), ("Industrial", "industrial"), ("Hospitality", "hospitality"),
    ("Institutional", "institutional"), ("Residential", "residential"), ("Defence", "defense"),
    ("Health Care", "healthcare"), ("Commercial", "commercial"),
]
MARQUEE = ["Design &amp; Architectural", "Pre-Construction Planning", "Project Management", "Execution"]
SERVICES = [("Design &amp; Architectural", "compass"), ("Pre-Construction Planning", "clipboard"), ("Project Management", "gantt"), ("Execution", "hardhat")]


def home():
    cards = "".join(
        f'<article class="card" data-tilt><span class="card__num">{i:02d}</span>'
        f'<img class="card__icon" src="assets/images/icons/{icon}.svg" alt="" width="68" height="68">'
        f'<h3>{name}</h3><span class="card__bar"></span></article>'
        for i, (name, icon) in enumerate(DISCIPLINES, 1)
    )
    track = "".join(f"<span>{m}</span>" for m in MARQUEE * 4)
    steps = "".join(
        f'<li class="step"><span class="step__node">{ico(icon)}</span><span class="step__n">0{i}</span><h3>{name}</h3></li>'
        for i, (name, icon) in enumerate(SERVICES, 1)
    )
    return f"""
<section class="hero" data-nav="Home">
  <div class="hero__grid" aria-hidden="true"></div>
  <canvas class="hero__fx" aria-hidden="true"></canvas>
  <div class="hero__gear hero__gear--a" aria-hidden="true">{ico("gear")}</div>
  <div class="hero__gear hero__gear--b" aria-hidden="true">{ico("gear")}</div>
  <div class="wrap hero__in" data-herofade>
    <div>
      <div class="hero__tag" data-reveal="up"><span>{ico("city")}</span>Engineering &amp; Construction Management Company</div>
      <h1 data-split>Building Beyond <span class="accent">Boundaries.<svg class="scribble" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 9 C 60 2, 120 13, 180 6 S 270 4, 298 8"/></svg></span></h1>
      <p class="hero__text" data-reveal="up" style="--d:5">Krishna BuildSpace Ltd. offers a wide range of services, such as design &amp; architectural, pre-construction planning, project management &amp; execution.</p>
      <div class="hero__cta" data-reveal="up" style="--d:7">
        <a class="btn" href="ongoing-projects.html">Our Projects {ARROW}</a>
        <a class="btn btn--ghost" href="about-us.html">About Us</a>
      </div>
    </div>
    <div class="hero__art" data-reveal="zoom" style="--d:3">
      <div class="hero__disc" data-depth="-14" aria-hidden="true"></div>
      <div class="hero__ring" aria-hidden="true"></div>
      <i class="cloud cloud--a" aria-hidden="true"></i><i class="cloud cloud--b" aria-hidden="true"></i><i class="cloud cloud--c" aria-hidden="true"></i>
      <svg class="hero__dim" viewBox="0 0 400 400" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength="1" d="M14 60V340M6 60h16M6 340h16"/><path pathLength="1" d="M70 388H360M70 380v16M360 380v16"/>
      </svg>
      <span class="hero__dimlbl hero__dimlbl--v" aria-hidden="true">Since 1995</span>
      <span class="hero__dimlbl hero__dimlbl--h" aria-hidden="true">Building Beyond Boundaries</span>
      <div class="hero__img" data-depth="18">
        <img src="assets/images/img-slider.png" alt="Illustration of tower cranes constructing a building" width="2000" height="2000">
        <i class="beacon" aria-hidden="true"></i>
      </div>
      <div class="chip chip--a" data-depth="34">{ico("calendar")}<b>1995</b><small>Founded<br>in</small></div>
      <div class="chip chip--b" data-depth="-26">{ico("pin")}<b>Pan-India</b><small>Presence</small></div>
    </div>
  </div>
  <div class="hero__sky" aria-hidden="true"></div>
  <span class="scroll-cue" aria-hidden="true"></span>
</section>

<div class="marquee" aria-hidden="true"><div class="marquee__track">{track}</div></div>

<section class="sec sec--white" data-nav="About Us">
  <div class="wrap">
    <div class="split">
      <div class="about-wrap" data-reveal="left">
        <div class="about-art">
          <span class="about-art__ring" data-rotate="0.08" aria-hidden="true"></span>
          <svg class="about-art__crane" viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1" d="M60 196V30M52 196h16M60 30l110 22H60M60 30L30 46h30M150 48v40M142 88h16v14h-16zM60 60l12 12-12 12 12 12-12 12 12 12-12 12 12 12-12 12"/></svg>
          <span class="about-art__est">Founded in 1995</span>
          <div>
            <div class="about-art__num"><span data-count="30">30</span><sup>+</sup></div>
            <div class="about-art__lbl">Years of Experience</div>
          </div>
        </div>
        <span class="about-corner" aria-hidden="true"></span>
      </div>
      <div>
        {head("Since 1995", "About Us")}
        <p class="lead" data-reveal="up">Founded in 1995 Krishna BuildSpace Ltd. has established itself as a prominent and dependable force in construction industry. Over the past 30 years, the company has consistently delivered innovative and cutting-edge construction solutions across diverse sectors.</p>
        <p data-reveal="up" style="--d:1">With nearly three decades of experience, we have cultivated a distinguished reputation for our steadfast commitment to quality, precision, and efficiency. Our unwavering dedication to delivering value-driven solutions within stipulated time lines and budgets has been the foundation of our sustained growth. This resolute focus has earned us the trust and confidence of a diverse clientele, including government bodies, corporate organizations, private developers &amp; Industries.</p>
        <div data-reveal="up" style="--d:2"><a class="btn" href="about-us.html">Read More {ARROW}</a></div>
      </div>
    </div>
    {stats()}
  </div>
</section>

<section class="sec sec--navy services" data-nav="Services">
  <div class="wrap">
    {head("What We Offer", "Our Services", "Krishna BuildSpace Ltd. offers a wide range of services, such as design &amp; architectural, pre-construction planning, project management &amp; execution.", centered=True)}
    <ol class="steps"><li class="steps__line" aria-hidden="true"><i></i></li>{steps}</ol>
  </div>
</section>

<div class="bigword" aria-hidden="true"><span data-scrollx="-0.5">Building Beyond Boundaries. — Building Beyond Boundaries. — Building Beyond Boundaries.</span></div>

<section class="sec sec--dots" data-nav="Disciplines">
  <div class="wrap">
    {head("What We Build", "Business Disciplines", "We excel in diverse sectors, delivering tailored solutions with precision and excellence", centered=True)}
    <div class="cards" data-stagger="up">{cards}</div>
  </div>
</section>

<section class="sec sec--navy" data-nav="Projects">
  <div class="wrap">
    {head("Projects", "Our Projects")}
    <div class="panels" data-stagger="up">
      <a class="panel" href="ongoing-projects.html" data-cursor="View">{ico("progress", "panel__ico")}<small>Projects</small><h3>Ongoing Projects</h3><span class="panel__go">View <i>{ARROW}</i></span></a>
      <a class="panel" href="completed-projects.html" data-cursor="View">{ico("check", "panel__ico")}<small>Projects</small><h3>Completed Projects</h3><span class="panel__go">View <i>{ARROW}</i></span></a>
    </div>
  </div>
</section>

<section class="cta" data-nav="Contact">
  <div class="wrap cta__in">
    <div data-reveal="left"><h2>Get in touch</h2><p>{ico("pin")} 510, Zion Prime, Thaltej-Shilaj Road, Thaltej, Ahmedabad - 380059, Gujarat, India.</p></div>
    <div data-reveal="right"><a class="btn btn--light" href="contact-us.html">Contact us {ARROW}</a></div>
  </div>
</section>
"""


# -------------------------------------------------------------------- ABOUT
WHY = [
    ("Our Team", "users", "Our greatest strength lies in our people. Our team comprises over 200 highly skilled and experienced professionals, including architects, designers, civil engineers, and specialized workers, all of whom bring extensive expertise in civil engineering. Each division within our organization is led by experts with deep knowledge and proven proficiency in their respective fields, ensuring the highest standards of excellence across every facet of our work."),
    ("Safety &amp; Environment", "shield", "At Krishna BuildSpace, safety and sustainability are at the core of our mission. We uphold rigorous safety standards to ensure the well-being of our workforce, stakeholders, and the surrounding environment. Equally, we are dedicated to implementing eco-friendly practices that not only reduce our ecological footprint but also enhance the enduring value and impact of our projects."),
    ("Client Centric Approach", "target", "At the core of our operations is a deep understanding of each client’s unique needs. We collaborate closely with our clients to craft bespoke solutions that align seamlessly with their vision and goals. Through clear communication and a commitment to partnership, we ensure flawless project execution while fostering enduring relationships built on trust and excellence."),
]
ASPECTS = [
    ("Core", "Value", "value", ["Integrity", "Commitment", "Quality", "Safety", "Accountability"]),
    ("Core", "Competence", "competence", ["Project Management", "Good Governance", "Construction Expertise", "Flexibility", "EPC Excellence"]),
    ("Our", "Commitment", "commitment", ["In Leadership", "In Employees", "In Customers", "In Environment", "In Health &amp; Safety"]),
]
SAFETY = [
    ("Proactive Measures", "Comprehensive risk assessments and strict adherence to safety protocols.", "shield"),
    ("Precision in Execution", "Use of advanced tools, Techniques, and materials for accurate project delivery.", "target"),
    ("Well-Equipped Workforce", "Use of industry-standard Personal Protective Equipment (PPE) and ongoing safety training.", "hardhat"),
    ("Emergency Preparedness", "Robust plans for incident management and regular safety drills.", "siren"),
    ("Standards Compliance", "Adherence quality standards at every project stage. local and international.", "clipboard"),
    ("Continuous Improvement", "Regular audits and feedback systems to refine processes and exceed client expectations.", "refresh"),
]


def about():
    tabs = "".join(
        f'<div class="tab{" is-open" if i == 0 else ""}"><button class="tab__btn" type="button" aria-expanded="{"true" if i == 0 else "false"}"><b>0{i + 1}</b>{ico(icon)}{t}<i></i></button>'
        f'<div class="tab__body"><div><p>{p}</p></div></div><span class="tab__timer" aria-hidden="true"></span></div>'
        for i, (t, icon, p) in enumerate(WHY)
    )
    aspects = "".join(
        f'<article class="aspect"><img class="aspect__icon" src="assets/images/icons/{icon}.svg" alt="" width="62" height="62">'
        f'<h3><small>{pre}</small>{name}</h3><ul>{"".join(f"<li style=\"--i:{j}\">{x}</li>" for j, x in enumerate(items))}</ul></article>'
        for pre, name, icon, items in ASPECTS
    )
    safety = "".join(
        f'<article class="safety__item"><span class="safety__icon">{ico(icon)}</span><h3>{t}</h3><p>{p}</p></article>'
        for t, p, icon in SAFETY
    )
    return page_title("Who We Are", "info") + f"""
<section class="sec sec--white">
  <div class="wrap">
    {head("About Us", "Who we are")}
    <div class="split" style="align-items:start">
      <p class="lead" data-reveal="left">Krishna BuildSpace Ltd. has established itself as a prominent and dependable force in the construction industry, consistently delivering innovative and cutting-edge solutions across diverse sectors. With over 30 years of experience since its foundation in 1995, the company has built a strong reputation for quality, reliability, and timely execution.</p>
      <p data-reveal="right">With nearly three decades of experience, we have cultivated a distinguished reputation for our steadfast commitment to quality, precision, and efficiency. Our unwavering dedication to delivering value-driven solutions within stipulated time lines and budgets has been the foundation of our sustained growth. This resolute focus has earned us the trust and confidence of a diverse clientele, including government bodies, corporate organizations, private developers &amp; Industries.</p>
    </div>
    {stats()}
  </div>
</section>

<section class="sec sec--dots">
  <div class="wrap">
    <div class="why">
      <div class="why__art" data-reveal="left"><img src="assets/images/img-why-choose-us.png" alt="Engineers reviewing building plans on site" width="500" height="375"></div>
      <div>
        {head("Why Choose Us", "We deliver expertise you can trust our service")}
        <div class="tabs" data-auto data-reveal="up">{tabs}</div>
      </div>
    </div>
  </div>
</section>

<section class="sec sec--navy">
  <div class="wrap">
    {head("What Defines Us", "Our Major Aspects", centered=True)}
    <div class="aspects" data-stagger="up">{aspects}</div>
  </div>
</section>

<section class="sec sec--white">
  <div class="wrap">
    <div class="split" style="align-items:end">
      {head("Purpose", "Mission &amp; Vision")}
      <div data-reveal="right">
        <p class="lead">Krishna BuildSpace Ltd. is shaping India’s future through purpose-driven infrastructure. Every project is an effort to build value—empowering communities, embracing technology, and fostering sustainability.</p>
        <p>Our focus on innovation, quality, and meaningful partnerships helps us drive real progress and lasting transformation across sectors.</p>
      </div>
    </div>
    <div class="mv" data-stagger="up">
      <article class="mv__card" data-word="Vision"><img src="assets/images/icons/vision.svg" alt="" width="60" height="60"><h3>Our Vision</h3><p>Our vision is to create a forward-thinking ecosystem across infrastructure and allied sectors—driven by innovation, sustainability, and meaningful partnerships that deliver lasting value and transform how communities grow and connect.</p></article>
      <article class="mv__card" data-word="Mission"><img src="assets/images/icons/mission.svg" alt="" width="60" height="60"><h3>Our Mission</h3><p>To build a stronger, connected India through high-quality, sustainable infrastructure that empowers communities, ensures safety, and exceeds expectations. Driven by innovation and responsibility, we aim to set new benchmarks in construction.</p></article>
    </div>
  </div>
</section>

<section class="sec sec--dots">
  <div class="wrap">
    {head("Our Standards", "Construction Safety &amp; Quality", "At Krishna Buildspace Ltd. safety and quality are the cornerstones of our operations. We are committed to delivering excellence while ensuring the well-being of our workforce, clients, and stakeholders.", centered=True)}
    <div class="safety" data-stagger="up">{safety}</div>
  </div>
</section>
"""


# --------------------------------------------------------------------- TEAM
LEADERS = [
    ("Mr. Sandip Sorathia", "Managing Director", "1", "award", "With over 17 years of experience, he leads operations with a focus on innovation and excellence in construction. His dynamic leadership has propelled successful projects while ensuring high-quality standards."),
    ("Mr. Harsukh Bhanderi", "Director of Finance &amp; Purchase", "2", "wallet", "With over 30 years of experience in the construction industry, he ensures financial stability, manages procurement processes, and handles legal compliance, playing a key role in the company's growth and success."),
    ("Mr. Pankaj Bhanderi", "Director of Projects", "3", "crane", "With over 20 years of experience, he manages project management, tendering, and site execution. His expertise ensures timely project delivery, quality control, and effective resource management, strengthening KBPL's position in the industry."),
    ("Mr. Pravin Sorathia", "Director of Administration", "4", "gear", "He handles HR, administration, and asset management. His strong administrative background ensures efficient operations, effective talent management, and the smooth day-to-day functioning of the company."),
]
BOARD = [
    ("Mr. Sandip Sorathia", "Managing Director", "award"), ("Mr. Harsukh Bhanderi", "Director of Finance &amp; Purchase", "wallet"),
    ("Mr. Pankaj Bhanderi", "Director of Projects", "crane"), ("Mr. Pravin Sorathia", "Director of Administration", "gear"),
    ("Mr. Navneet Savaliya", "Independent Director", "shield"), ("Mr. Vinod Desai", "Independent Director", "shield"),
    ("Mrs. Upasana Patel", "Independent Director", "shield"), ("Mr. Jay Sorathia", "Independent Director", "shield"),
]


def team():
    members = "".join(
        f'<article class="member"><div class="member__photo" data-curtain><img src="assets/images/team/{img}.jpg" alt="{name}" width="450" height="450" loading="lazy"><span class="member__badge">{ico(icon)}</span></div>'
        f'<div class="member__body"><h3>{name}</h3><span class="member__role">{role}</span><p>{bio}</p></div></article>'
        for name, role, img, icon, bio in LEADERS
    )
    board = "".join(f'<div class="board__item">{ico(icon, "board__ico")}<i>{i:02d}</i><b>{n}</b><span>{r}</span></div>' for i, (n, r, icon) in enumerate(BOARD, 1))
    return page_title("Our Team", "users") + f"""
<section class="sec sec--white">
  <div class="wrap">
    {head("Leadership", "Leadership That Drives Performance", centered=True)}
    <div class="team" data-stagger="up">{members}</div>
  </div>
</section>
<section class="sec sec--navy">
  <div class="wrap">
    {head("Governance", "Board of Directors", centered=True)}
    <div class="board" data-stagger="zoom">{board}</div>
  </div>
</section>
"""


# ----------------------------------------------------------------- PROJECTS
def col_icon(c):
    if "Sr" in c: return "hash"
    if "Description" in c: return "doc"
    if "State" in c: return "pin"
    if "₹" in c: return "rupee"
    if "year" in c: return "calendar"
    if "Sector" in c: return "layers"
    return "landmark"


def projects(kind, title, icon, notes):
    data = json.loads((DATA / "projects.json").read_text(encoding="utf-8"))[kind]
    cols = data["head"]
    sector_i = next(i for i, c in enumerate(cols) if "Sector" in c)
    state_i = next(i for i, c in enumerate(cols) if c == "State")
    num_cols = [i for i, c in enumerate(cols) if "₹" in c]
    maxes = {i: max(float(r[i].replace(",", "")) for r in data["rows"]) for i in num_cols}
    sectors = []
    for r in data["rows"]:
        if r[sector_i] not in sectors:
            sectors.append(r[sector_i])
    thead = "".join(f'<th scope="col"><span>{ico(col_icon(c))}{esc(c)}</span></th>' for c in cols)
    body = []
    for r in data["rows"]:
        tds = []
        for i, v in enumerate(r):
            lab = f' data-label="{esc(cols[i])}"'
            if i == 1:
                tds.append(f'<td class="desc"{lab}>{esc(v)}</td>')
            elif i in num_cols:
                pct = float(v.replace(",", "")) / maxes[i] * 100
                tds.append(f'<td class="num"{lab}><span class="val" data-val="{esc(v)}">{esc(v)}</span><span class="meter" aria-hidden="true"><i style="--p:{pct:.1f}%"></i></span></td>')
            elif i == sector_i:
                tds.append(f'<td{lab}><span class="tagx">{esc(v)}</span></td>')
            elif i == state_i:
                tds.append(f'<td class="state"{lab}>{ico("pin")}{esc(v)}</td>')
            else:
                tds.append(f"<td{lab}>{esc(v)}</td>")
        body.append(f'<tr data-sector="{esc(r[sector_i])}">{"".join(tds)}</tr>')
    chips = '<button type="button" class="is-on" data-sector="" aria-pressed="true">All</button>' + "".join(
        f'<button type="button" data-sector="{esc(s)}" aria-pressed="false">{esc(s)}</button>' for s in sectors
    )
    notes_html = "".join(f"<p>{n}</p>" for n in notes)
    return page_title(title, icon, "Projects") + f"""
<section class="sec">
  <div class="wrap">
    <div class="tools" data-reveal="up">
      <label class="search">{ico("search")}<input id="projectSearch" type="search" placeholder="Search projects…" aria-label="Search projects"></label>
      <div class="chips" role="group" aria-label="Filter by sector">{chips}</div>
      <div class="count"><b id="projectCount">{len(data["rows"])}</b> of {len(data["rows"])} projects</div>
    </div>
    <div class="table-wrap">
      <table class="projects">
        <thead><tr>{thead}</tr></thead>
        <tbody>
{chr(10).join(body)}
        </tbody>
      </table>
      <div class="empty">{ico("search")}No projects match your search.</div>
    </div>
    <div class="notes" data-reveal="up">{notes_html}</div>
  </div>
</section>
"""


NOTE_HASH = "# The name of the customer has not been included in this Draft Red Herring Prospectus due to non-receipt of consent from such customers to be named in the Offer Documents."


# ---------------------------------------------------------------- INVESTORS
def investors():
    frag = (DATA / "investors_fragment.html").read_text(encoding="utf-8")
    # The fragment is the live site's accordion, kept verbatim (document names,
    # links and the full DRHP disclaimer). Only the wrapper is trimmed; icons
    # are added at runtime by assets/js/motion.js.
    frag = frag.strip()
    frag = re.sub(r"(</div>\s*){2}$", "", frag)  # close of .container / .sec-investors
    return page_title("Investors", "chart") + f"""
<section class="sec">
  <div class="wrap" data-reveal="up">
{frag}
  </div>
</section>

<div class="modal" id="drhpConfiramationModal" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="modal__box">
    <span class="modal__ico">{ico("shield")}</span>
    <p>To access this information, you must confirm by pressing on the button marked <strong>"I Confirm"</strong> that, at the time of access you are located and resident in India. If you cannot make this confirmation, you must press the button marked <strong>"I Do Not Confirm"</strong>.</p>
    <p>The documentation contained in these pages is posted solely to comply with Indian legal and regulatory requirements. Making the information contained herein available in electronic format does not constitute an offer, or a solicitation of any offer, or a recommendation to buy or sell securities of the Company in the United States or in any other jurisdiction, including without limitation, India.</p>
    <div class="modal__foot">
      <button type="button" class="btn" id="btnConfirmDrhp" data-pdf="{SITE}/assets/docs/Krishna Buildspace Limited_DRHP.pdf">I Confirm</button>
      <button type="button" class="btn btn--ghost" id="btnDoNotConfirmDrhp">I Do Not Confirm</button>
    </div>
  </div>
</div>
<div class="modal" id="drhpDoNotConfirmModal" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="modal__box">
    <span class="modal__ico">{ico("info")}</span>
    <p>You are not permitted to view the materials in this section of the website.</p>
    <div class="modal__foot"><button type="button" class="btn btn--ghost" data-close>Close</button></div>
  </div>
</div>
"""


# ------------------------------------------------------------------- CAREER
def career():
    return page_title("Join Our Team", "briefcase") + f"""
<section class="sec sec--white">
  <div class="wrap">
    <div class="career">
      <div>
        {head("Career", "Join Our Team")}
        <p class="lead" data-reveal="up">Becoming a part of our team means engaging in dynamic and rewarding projects, working alongside a talented and committed group of professionals, and playing a vital role in our continued growth. We appreciate the distinct expertise and viewpoint you bring, and we believe your presence will help enhance our commitment to excellence and productivity. We’re excited about the prospect of collaborating and reaching new milestones together in the construction field.</p>
      </div>
      <div class="mail-card" data-reveal="right">
        <span class="mail-card__plane" aria-hidden="true">{ico("send")}</span>
        {ico("mail", "mail-card__ico")}
        <small>Send us your resume on :</small>
        <a href="mailto:hr@krishna.build" data-type>hr@krishna.build</a>
        <button class="copy" type="button" data-copy="hr@krishna.build">{ico("copy")}Copy email</button>
      </div>
    </div>
  </div>
</section>
"""


# ------------------------------------------------------------------ CONTACT
MAP = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d636.2623677961222!2d72.49216603260518!3d23.051382489505315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e9b6199ef2577%3A0x32ec5eca5fb17d9f!2sZION%20PRIME!5e1!3m2!1sen!2sin!4v1743571036680!5m2!1sen!2sin"


def contact():
    return page_title("Contact Us", "mail") + f"""
<section class="sec">
  <div class="wrap">
    <div class="contact">
      <div class="info" data-reveal="left">
        <h2>Contact Details</h2>
        <div class="info__row"><span class="info__ico"><img src="assets/images/icons/map.svg" alt=""></span><div><h3>Office Address</h3><p>510, Zion Prime,<br>Before Shilaj Railway Crossing,<br>Thaltej-Shilaj Road, Thaltej,<br>Ahmedabad - 380059,<br>Gujarat, India.</p></div></div>
        <div class="info__row"><span class="info__ico"><img src="assets/images/icons/email.svg" alt=""></span><div><h3>Email Us</h3><a href="mailto:mail@krishna.build">mail@krishna.build</a></div></div>
      </div>
      <form class="form" id="contactForm" action="{SITE}/contact-form.php" method="post" data-reveal="right">
        <h2>Get in touch</h2>
        <div class="form__grid">
          <div class="field">{ico("user")}<input id="ip_name" name="c_name" type="text" placeholder=" " required autocomplete="name"><label for="ip_name">Name</label></div>
          <div class="field">{ico("mail")}<input id="ip_email" name="c_email" type="email" placeholder=" " required autocomplete="email"><label for="ip_email">Email Address</label></div>
          <div class="field field--full">{ico("phone")}<input id="ip_contact_number" name="c_mobile" type="tel" placeholder=" " required autocomplete="tel"><label for="ip_contact_number">Contact Number</label></div>
          <div class="field field--full">{ico("doc")}<textarea id="ip_message" name="c_message" placeholder=" " required></textarea><label for="ip_message">Message</label></div>
        </div>
        <div class="form__foot"><button class="btn" id="btnSend" type="submit">Send Now {ico("send", "arr")}</button><span class="form-msg" id="form-messages" role="status"></span></div>
      </form>
    </div>
  </div>
</section>

<section class="sec sec--white">
  <div class="wrap">
    {head("Location", "Find Us Here")}
    <div class="map" data-reveal="up" data-curtain>
      <iframe src="{MAP}" title="Map — Zion Prime, Thaltej, Ahmedabad" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
      <div class="map__card"><span class="map__pin">{ico("pin")}</span><div><b>Office Address</b>510, Zion Prime, Thaltej, Ahmedabad - 380059</div></div>
    </div>
  </div>
</section>

<section class="sec sec--dots">
  <div class="wrap">
    {head("Investors", "Investor Grievance", centered=True)}
    <div class="griev" data-stagger="up">
      <article class="griev__card">
        <span class="griev__ico">{ico("user")}</span>
        <h3>Nutan Lohar</h3><span class="role">Company Secretary and Compliance Officer</span>
        <dl>
          <dt>{ico("pin")}Meet her at:</dt><dd>510-Zion Prime, Thaltej Shilaj Road,<br>Before Shilaj Railway Crossing, Thaltej,<br>Ahmedabad, Gujarat- 380059</dd>
          <dt>{ico("phone")}Contact No:</dt><dd><a href="tel:+917935188376">+91 79 3518 8376</a></dd>
          <dt>{ico("mail")}Email:</dt><dd><a href="mailto:cs@krishna.build">cs@krishna.build</a></dd>
        </dl>
      </article>
      <article class="griev__card">
        <span class="griev__ico">{ico("award")}</span>
        <h3>Sandip Mohanbhai Sorathia</h3><span class="role">Chairman &amp; Managing Director</span>
        <dl>
          <dt>{ico("pin")}Meet him at:</dt><dd>510-Zion Prime, Thaltej Shilaj Road,<br>Before Shilaj Railway Crossing, Thaltej,<br>Ahmedabad, Gujarat- 380059</dd>
          <dt>{ico("phone")}Contact No:</dt><dd><a href="tel:+917935188376">+91 79 3518 8376</a></dd>
          <dt>{ico("mail")}Email:</dt><dd><a href="mailto:cs@krishna.build">cs@krishna.build</a></dd>
        </dl>
      </article>
      <article class="griev__card">
        <span class="griev__ico">{ico("landmark")}</span>
        <span class="role" style="margin-top:0">Registrar and Share Transfer Agent</span>
        <h3>MUFG Intime India Private Limited</h3><span class="sub">Formerly Link Intime India Private Limited</span>
        <dl>
          <dt>{ico("pin")}Meet us at:</dt><dd>C-101, Embassy 247,<br>L.B.S. Marg, Vikhroli (West),<br>Mumbai – 400 083.</dd>
          <dt>{ico("user")}Contact Person:</dt><dd>Shanti Gopalkrishnan</dd>
          <dt>{ico("phone")}Contact No:</dt><dd><a href="tel:+918108114949">+91 810 811 4949</a></dd>
          <dt>{ico("mail")}Email:</dt><dd><a href="mailto:krishnabuildspace@in.mpms.mufg.com">krishnabuildspace@in.mpms.mufg.com</a></dd>
        </dl>
      </article>
    </div>
  </div>
</section>
"""


if __name__ == "__main__":
    page("index.html", "", home(), "is-home")
    page("about-us.html", "About Us", about())
    page("our-team.html", "Our Team", team())
    page("ongoing-projects.html", "Ongoing Projects", projects("ongoing", "Ongoing Projects", "progress", [NOTE_HASH]))
    page("completed-projects.html", "Completed Projects", projects("completed", "Completed Projects", "check", ["* Total billed amount.", NOTE_HASH]))
    page("investors.html", "Investors", investors())
    page("career.html", "Career", career())
    page("contact-us.html", "Contact Us", contact())
