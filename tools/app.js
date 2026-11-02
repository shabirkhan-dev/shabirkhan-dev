// Vanilla replacement for the site's React islands: theme toggle, project dialog, carousel.
(function () {
  var HIGHLIGHTS = __HIGHLIGHTS__;
  var GITHUB = __GITHUB_SVG__;
  var COLORS = { dark: "#0d0d0c", light: "#fafaf8" };

  function icon(paths, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="' + (cls || "size-4") + '" aria-hidden="true">' + paths + "</svg>";
  }
  var X = icon('<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>');
  var GLOBE = icon('<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>');
  var UP_RIGHT = icon('<path d="M7 7h10v10"></path><path d="M7 17 17 7"></path>');
  var LEFT = icon('<path d="m15 18-6-6 6-6"></path>');
  var RIGHT = icon('<path d="m9 18 6-6-6-6"></path>');

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // Theme toggle
  var toggle = document.querySelector('button[aria-label="Switch colour theme"]');
  if (toggle) {
    toggle.addEventListener("click", function () {
      var root = document.documentElement;
      var next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", COLORS[next]);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // Project dialog
  var dialog = document.querySelector("dialog");
  var arrow = "absolute top-1/2 hidden size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-line bg-background/80 text-foreground transition-opacity disabled:pointer-events-none disabled:opacity-0 hover-capable:grid";
  var pill = "flex items-center justify-center gap-2 rounded-full py-2.5 pr-3.5 pl-4 text-sm leading-5 font-medium tracking-[-0.0064em] transition-opacity hover-capable:hover:opacity-85 max-md:flex-1";

  function render(p) {
    var many = p.images.length > 1;
    var shots = p.images.map(function (src, i) {
      return '<img src="' + src + '" alt="' + esc(p.name) + ", screen " + (i + 1) + " of " + p.images.length + '" class="aspect-[16/10] w-full shrink-0 snap-center object-cover object-left-top"/>';
    }).join("");
    var dots = many ? '<div class="flex justify-center gap-1.5">' + p.images.map(function (_, i) {
      return '<button type="button" data-dot="' + i + '" aria-label="Show screen ' + (i + 1) + " of " + p.images.length + '" class="h-1.5 cursor-pointer rounded-full transition-[width,background-color] w-1.5 bg-line"></button>';
    }).join("") + "</div>" : "";
    var arrows = many
      ? '<button type="button" data-prev aria-label="Previous screen" class="' + arrow + ' left-3">' + LEFT + "</button>" +
        '<button type="button" data-next aria-label="Next screen" class="' + arrow + ' right-3">' + RIGHT + "</button>"
      : "";
    var badge = p.isNew ? '<span class="rounded-full border border-new px-[7px] pb-px font-hand text-[15px] leading-4 text-new">New</span>' : "";
    var about = p.about.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
    var facts = p.facts.map(function (f) {
      return '<div class="flex gap-4 border-t border-line py-2.5 last:border-b"><dt class="w-[72px] shrink-0 text-muted md:w-24">' + esc(f[0]) + '</dt><dd class="text-foreground">' + esc(f[1]) + "</dd></div>";
    }).join("");
    var href = p.live || p.github;
    var cta = href
      ? '<div class="flex gap-2"><a href="' + href + '" target="_blank" rel="noopener noreferrer" class="' + pill + ' bg-foreground text-background">' +
        (p.live ? GLOBE : GITHUB) + (p.live ? "Open live site" : "View on GitHub") + UP_RIGHT + "</a></div>"
      : "";

    dialog.innerHTML =
      '<div class="flex flex-col items-center gap-2 md:gap-0">' +
      '<span class="h-1 w-9 rounded-full bg-line md:hidden" aria-hidden="true"></span>' +
      '<div class="relative w-full"><div class="flex w-full flex-col gap-2.5"><div class="relative">' +
      '<div data-track ' + (many ? 'tabindex="0" role="region" aria-label="' + esc(p.name) + ' screens, use the arrow keys to move" ' : "") +
      'class="flex snap-x snap-mandatory overflow-x-auto rounded-[14px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-foreground border border-line [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden">' +
      shots + "</div>" + arrows + "</div>" + dots + "</div>" +
      '<form method="dialog"><button type="submit" aria-label="Close" class="absolute top-2.5 right-2.5 grid size-8 cursor-pointer place-items-center rounded-full border border-line bg-background/80 text-foreground md:top-3 md:right-3">' + X + "</button></form></div>" +
      '<div class="flex w-full flex-col gap-5 px-3 pt-1 md:px-4 md:pt-2 md:pb-4">' +
      '<div class="flex items-start gap-2"><div class="flex flex-1 flex-col gap-0.5"><div class="flex items-center gap-2">' +
      '<h2 id="project-title" class="text-xl leading-7 font-medium tracking-[-0.0064em]">' + esc(p.name) + "</h2>" + badge + "</div>" +
      '<p class="text-sm leading-5 tracking-[-0.0064em] text-muted">' + esc(p.label) + "</p></div>" +
      '<p class="font-mono text-[9px] leading-[14px] text-muted">' + esc(p.year) + "</p></div>" +
      '<div class="flex flex-col gap-3 text-sm leading-[22px] tracking-[-0.0064em] text-muted">' + about + "</div>" +
      '<dl class="flex flex-col text-sm leading-5 tracking-[-0.0064em]">' + facts + "</dl>" + cta + "</div></div>";

    if (many) wireCarousel(p.images.length);
  }

  function wireCarousel(count) {
    var track = dialog.querySelector("[data-track]");
    var prev = dialog.querySelector("[data-prev]");
    var next = dialog.querySelector("[data-next]");
    var dots = dialog.querySelectorAll("[data-dot]");
    var index = 0;
    function go(to) { track.scrollTo({ left: to * track.clientWidth, behavior: "smooth" }); }
    function paint() {
      prev.disabled = index === 0;
      next.disabled = index === count - 1;
      dots.forEach(function (d, i) {
        var on = i === index;
        d.className = "h-1.5 cursor-pointer rounded-full transition-[width,background-color] " + (on ? "w-4 bg-foreground" : "w-1.5 bg-line");
        if (on) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
      });
    }
    track.addEventListener("scroll", function () {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== index) { index = i; paint(); }
    });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" && index > 0) { e.preventDefault(); go(index - 1); }
      else if (e.key === "ArrowRight" && index < count - 1) { e.preventDefault(); go(index + 1); }
    });
    prev.addEventListener("click", function () { go(index - 1); });
    next.addEventListener("click", function () { go(index + 1); });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); }); });
    paint();
  }

  if (dialog) {
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    document.querySelectorAll('button[aria-haspopup="dialog"]').forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        render(HIGHLIGHTS[i]);
        dialog.showModal();
        var track = dialog.querySelector("[data-track]");
        if (track) track.scrollLeft = 0;
      });
    });
  }
})();
