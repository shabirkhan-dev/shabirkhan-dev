# Rebuilding index.html

`index.html` is a single-file copy of shabirkhan.rabtx.dev: the live page's markup and CSS,
with fonts and images inlined and a small vanilla script for the theme toggle and project dialog.

```bash
curl -sS https://shabirkhan.rabtx.dev/ -o tools/live.html
curl -sS https://shabirkhan.rabtx.dev/_next/static/immutable/chunks/<css-file>.css -o tools/site.css
curl -sS https://rabtx.dev/writing/feed.xml -o tools/feed.xml
python3 tools/build.py   # needs a rabtx-web checkout at /home/user/rabtx-web
```
