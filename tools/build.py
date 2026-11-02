"""Build a single-file static clone of shabirkhan.rabtx.dev.

Inputs (in this folder): live.html, site.css (downloaded from the live site), feed.xml.
Images come from rabtx-web apps/portfolio/public. Output: out/index.html (+ CV pdf).
"""
import base64, html, json, os, re, shutil, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = "/home/user/rabtx-web/apps/portfolio/public"
SITE = "https://shabirkhan.rabtx.dev"
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)


def data_uri(path, mime):
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()


def img(rel):  # rel like /projects/cards/x.webp
    return data_uri(PUB + rel, "image/webp" if rel.endswith(".webp") else "image/png")


def fetch(url):
    with urllib.request.urlopen(url) as r:
        return r.read()


# ---------- CSS: keep latin font faces only, inline them ----------
css = open(os.path.join(HERE, "site.css")).read()


def font_face(m):
    block = m.group(0)
    if "src:local(" in block:  # metric-matched fallbacks
        return block
    rng = re.search(r"unicode-range:([^;}]*)", block)
    if rng and not rng.group(1).startswith("U+??"):
        return ""
    url = re.search(r"url\(\.\./media/([^)]+)\)", block).group(1)
    b64 = base64.b64encode(fetch(f"{SITE}/_next/static/immutable/media/{url}")).decode()
    return block.replace(f"url(../media/{url})", f"url(data:font/woff2;base64,{b64})")


css = re.sub(r"@font-face\{[^}]*\}", font_face, css)

# ---------- Body: server-rendered markup without Next's scripts ----------
live = open(os.path.join(HERE, "live.html")).read()
html_open = re.search(r"<html[^>]*>", live).group(0)
body = live[live.find("<body>") + 6 : live.find("</body>")]
body = re.sub(r"<script.*?</script>", "", body, flags=re.S)
body = re.sub(r'<div hidden="">.*?</div>', "", body, count=1, flags=re.S)
body = body.replace("<!-- -->", "")

# Writing: rebuild from the current feed so new posts appear, with the live row markup.
feed = open(os.path.join(HERE, "feed.xml")).read()
items = re.findall(r"<item>(.*?)</item>", feed, re.S)
w_start = body.find('<section id="writing"')
w_end = body.find("</section>", w_start) + len("</section>")
section = body[w_start:w_end]
row = re.search(r'<a href="https://rabtx.dev/writing/[^"]+" class="group.*?</a>', section, re.S).group(0)
head = section[: section.find("<a ")]


def tag(item, name):
    m = re.search(rf"<{name}>(.*?)</{name}>", item, re.S)
    return html.unescape(m.group(1).strip()) if m else ""


rows = []
for it in items:
    url, title, desc = tag(it, "link"), tag(it, "title"), tag(it, "description")
    slug = url.rstrip("/").split("/")[-1]
    r = re.sub(r'href="[^"]+"', f'href="{url}"', row, count=1)
    r = re.sub(r'alt="[^"]*"', f'alt="Cover image for {html.escape(title)}"', r, count=1)
    r = re.sub(r'src="[^"]+"', f'src="/writing/{slug}.webp"', r, count=1)
    r = re.sub(r'(<p class="font-medium text-foreground">).*?(</p>)', lambda m: m.group(1) + html.escape(title) + m.group(2), r, count=1)
    r = re.sub(r'(<p class="max-w-\[400px\] text-muted">).*?(</p>)', lambda m: m.group(1) + html.escape(desc) + m.group(2), r, count=1)
    rows.append(r)
body = body[:w_start] + head + "".join(rows) + "</section>" + body[w_end:]

# Inline every local image; point the CV at the copy that sits next to index.html.
body = re.sub(r'src="(/[^"]+\.(?:webp|png))"', lambda m: f'src="{img(m.group(1))}"', body)
body = body.replace('href="/shabir-khan-cv.pdf"', 'href="shabir-khan-cv.pdf"')
body = body.replace(' fetchPriority=', ' fetchpriority=')
shutil.copy(PUB + "/shabir-khan-cv.pdf", OUT)

# ---------- Data for the project dialog ----------
src = open("/home/user/rabtx-web/apps/portfolio/src/data/profile.ts").read()
block = src[src.find("export const highlights"): src.find("export type Project")]
highlights = []
for h in re.split(r"\n  \{\n", block)[1:]:
    get = lambda k: (re.search(rf'\b{k}: "([^"]*)"', h) or [None, None])[1]
    screens = re.findall(r'"(/projects/[^"]+)"', (re.search(r"screens: \[(.*?)\]", h, re.S) or [None, ""])[1] if "screens:" in h else "")
    about = re.findall(r'"((?:[^"\\]|\\.)*)"', re.search(r"about: \[(.*?)\]", h, re.S).group(1))
    facts = re.findall(r'\["([^"]+)", "([^"]+)"\]', h)
    image = get("image")
    highlights.append({
        "name": get("name"), "label": get("label"), "year": get("year"),
        "isNew": "isNew: true" in h, "about": about, "facts": facts,
        "github": get("github"), "live": get("live"),
        "images": [img(p) for p in [image] + screens],
    })
assert len(highlights) == 4, highlights

GH = re.search(r'<svg[^>]*class="size-4"><path d="M15 22v-4.*?</svg>', body, re.S).group(0)

script = open(os.path.join(HERE, "app.js")).read()
script = script.replace("__HIGHLIGHTS__", json.dumps(highlights)).replace("__GITHUB_SVG__", json.dumps(GH))

title = re.search(r"<title>.*?</title>", live).group(0)
desc = re.search(r'<meta name="description"[^>]*/>', live).group(0)
og = "".join(re.findall(r'<meta (?:property="og:[^"]+"|name="twitter:[^"]+")[^>]*/>', live))

theme = ('try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}'
         'document.addEventListener("DOMContentLoaded",function(){var m=document.querySelector(\'meta[name="theme-color"]\');'
         'if(m)m.setAttribute("content",document.documentElement.dataset.theme==="light"?"#fafaf8":"#0d0d0c")})')

page = f"""<!DOCTYPE html>
{html_open}<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#0d0d0c"/>{title}{desc}{og}
<link rel="icon" href="{data_uri('/home/user/rabtx-web/apps/portfolio/src/app/icon.png', 'image/png')}"/>
<script>{theme}</script>
<style>{css}</style>
</head><body>{body}
<script>{script}</script>
</body></html>
"""
open(os.path.join(OUT, "index.html"), "w").write(page)
print("wrote", len(page) // 1024, "KB")
