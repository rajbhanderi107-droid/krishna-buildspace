# krishna-buildspace

Enhanced, animated rebuild of the Krishna BuildSpace Ltd. website (https://krishna.build). Plain static HTML, CSS and JavaScript — no framework and no runtime dependencies.

## Pages

`index.html`, `about-us.html`, `our-team.html`, `ongoing-projects.html`, `completed-projects.html`, `investors.html`, `career.html`, `contact-us.html`

## Preview locally

```sh
python3 -m http.server 4173
# open http://localhost:4173
```

## Editing

The `.html` files are generated. Shared header/footer and all page content live in `tools/build.py`; the project tables and the investors accordion are rendered from `tools/data/`. After editing, regenerate:

```sh
python3 tools/build.py
```

- `assets/css/site.css` — design and animations (respects `prefers-reduced-motion`)
- `assets/js/site.js` — scroll reveals, counters, tilt cards, accordion, DRHP confirmation modal, project search/filter, contact form
- `assets/css/motion.css`, `assets/js/motion.js` — the motion design layer; the full list of 100 effects is in `MOTION.md`
- Line icons come from one SVG sprite defined in `tools/build.py` (`ICONS`); use `ico("name")` in a page

## Notes

- Investor documents still link to the PDFs hosted on `https://krishna.build/assets/docs/…`.
- The contact form posts to `https://krishna.build/contact-form.php` with the same field names as the live site.
