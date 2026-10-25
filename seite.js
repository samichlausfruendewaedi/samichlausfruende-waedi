/* Setzt Kopf, Navigation und Fusszeile ein und füllt die Jahresdaten aus daten.js.
   Muss normalerweise nicht angepasst werden. */
(function () {
  var D = window.DATEN || {};
  // Ab dem Anmeldedatum den Hinweis "Anmeldung ab ..." ausblenden und die Anmeldung zeigen
  if (D.anmeldungAbDatum) {
    var t = new Date(), heute = t.getFullYear() + "-" + ("0" + (t.getMonth() + 1)).slice(-2) + "-" + ("0" + t.getDate()).slice(-2);
    if (heute >= D.anmeldungAbDatum) D.anmeldungAb = "";
  }
  document.documentElement.classList.add("js");
  // Kopf und Fusszeile stehen fest in jeder Seite (Menü funktioniert so auch ohne JavaScript).
  // Hier kommt nur der Menüknopf für das Handy dazu.
  var kopf = document.getElementById("kopf");
  var menue = kopf && kopf.querySelector("nav");
  if (menue) {
    var knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "menueknopf";
    knopf.setAttribute("aria-expanded", "false");
    knopf.setAttribute("aria-controls", "hauptmenue");
    knopf.innerHTML = '<span class="balken" aria-hidden="true"></span><span class="menuetext">Menü</span>';
    menue.parentNode.insertBefore(knopf, menue);
    var setze = function (offen) {
      knopf.setAttribute("aria-expanded", offen ? "true" : "false");
      menue.classList.toggle("offen", offen);
      document.documentElement.classList.toggle("menue-offen", offen);
    };
    // Führt ein Eintrag auf eine andere Seite, bleibt das Menü offen, bis die neue Seite da ist
    // (so sieht man die alte Seite nicht noch kurz). Nur bei der aktuellen Seite schliessen.
    menue.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var ziel = new URL(a.href, location.href);
      if (ziel.pathname === location.pathname) { setze(false); return; }
      // Neue Seite soll mit offenem Menü starten und es dann sanft nach oben wegfahren
      if (menue.classList.contains("offen")) { try { sessionStorage.setItem("menueZu", "1"); } catch (err) {} }
    });
    // Kommt man über das Menü auf diese Seite: Menü zuerst offen zeigen, dann sanft schliessen
    var vomMenue = false;
    try { vomMenue = sessionStorage.getItem("menueZu") === "1"; sessionStorage.removeItem("menueZu"); } catch (err) {}
    if (vomMenue && window.innerWidth < 720) {
      var html = document.documentElement;
      html.classList.add("ohne-uebergang");
      setze(true);
      void menue.offsetHeight;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          html.classList.remove("ohne-uebergang");
          setTimeout(function () { setze(false); }, 120);
        });
      });
    }
    // Zurück-Taste: Seite kommt aus dem Zwischenspeicher, Menü dann geschlossen zeigen
    window.addEventListener("pageshow", function (e) { if (e.persisted) setze(false); });
    // Wird das Fenster breiter (Computeransicht), das Menü schliessen
    window.addEventListener("resize", function () { if (window.innerWidth >= 720) setze(false); });
    knopf.addEventListener("click", function () { setze(knopf.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setze(false); knopf.focus(); } });
  }

  // data-feld="name" -> Text ersetzen; data-link="name" -> href setzen
  document.querySelectorAll("[data-feld]").forEach(function (el) {
    var v = D[el.getAttribute("data-feld")];
    if (!v) return;
    if (v.indexOf("\n") === -1) { el.textContent = v; return; }
    // Mehrere Zeilen (z. B. Daten): Handy untereinander, Computer hintereinander mit «|»
    el.textContent = "";
    el.classList.add("zeilen");
    v.split("\n").forEach(function (z) {
      var s = document.createElement("span");
      s.className = "zeile";
      s.textContent = z;
      el.appendChild(s);
    });
  });
  document.querySelectorAll("[data-link]").forEach(function (el) {
    var v = D[el.getAttribute("data-link")];
    if (v) { el.href = v; } else { el.hidden = true; }
  });
  document.querySelectorAll("[data-mail]").forEach(function (el) {
    var v = D[el.getAttribute("data-mail")];
    if (v) { el.href = "mailto:" + v; el.textContent = v; }
  });
  document.querySelectorAll("[data-tel]").forEach(function (el) {
    if (D.telefon) { el.href = "tel:" + D.telefon.replace(/\s/g, ""); el.textContent = D.telefon; }
  });
  // Elemente nur zeigen, wenn die Anmeldung noch nicht läuft / ein Link existiert
  document.querySelectorAll("[data-nur-wenn-leer]").forEach(function (el) {
    if (D[el.getAttribute("data-nur-wenn-leer")]) el.hidden = true;
  });
  document.querySelectorAll("[data-nur-wenn]").forEach(function (el) {
    if (!D[el.getAttribute("data-nur-wenn")]) el.hidden = true;
  });

  // Weiterleitung nach dem Absenden: Web3Forms (Gratis-Version) erlaubt nur Seiten derselben Domain.
  // Darum wird die Adresse der Dankeseite aus der aktuellen Adresse gebildet.
  document.querySelectorAll("input[data-seite]").forEach(function (el) {
    try { el.value = new URL(el.getAttribute("data-seite"), location.href).href; } catch (e) {}
  });

  // Fotogalerien: Pfeile für den Computer (auf dem Handy wird gewischt)
  document.querySelectorAll(".galerie").forEach(function (g) {
    var wrap = document.createElement("div");
    wrap.className = "galerie-wrap";
    g.parentNode.insertBefore(wrap, g);
    wrap.appendChild(g);
    var mk = function (cls, text, label) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "gal-pfeil " + cls; b.textContent = text; b.setAttribute("aria-label", label);
      wrap.appendChild(b); return b;
    };
    var zu = mk("gal-zurueck", "\u2039", "Vorheriges Foto");
    var vor = mk("gal-weiter", "\u203A", "Nächstes Foto");
    var schritt = function () { var f = g.querySelector("figure"); return f ? f.offsetWidth + 10 : 300; };
    zu.addEventListener("click", function () { g.scrollBy({ left: -schritt(), behavior: "smooth" }); });
    vor.addEventListener("click", function () { g.scrollBy({ left: schritt(), behavior: "smooth" }); });
    var pruefe = function () {
      var max = g.scrollWidth - g.clientWidth - 2;
      zu.classList.toggle("aktiv", g.scrollLeft > 2);
      vor.classList.toggle("aktiv", g.scrollLeft < max);
    };
    g.addEventListener("scroll", pruefe, { passive: true });
    window.addEventListener("resize", pruefe);
    window.addEventListener("load", pruefe);
    pruefe();
  });

  // Pfeil «nach oben» (nur Handy): erscheint, wenn man ein gutes Stück nach unten gescrollt hat
  var hoch = document.createElement("button");
  hoch.type = "button";
  hoch.className = "nach-oben";
  hoch.setAttribute("aria-label", "Nach oben");
  hoch.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(hoch);
  hoch.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  var pruefeHoch = function () { hoch.classList.toggle("sichtbar", window.scrollY > window.innerHeight * 1.2); };
  window.addEventListener("scroll", pruefeHoch, { passive: true });
  pruefeHoch();

  // Karte erst laden, wenn sie im Sichtfeld ist. So springt die Seite nicht,
  // weil die eingebettete Karte den Fokus an sich zieht.
  document.querySelectorAll("iframe[data-src]").forEach(function (f) {
    function laden() { f.src = f.getAttribute("data-src"); f.removeAttribute("data-src"); }
    if (!("IntersectionObserver" in window)) { laden(); return; }
    var io = new IntersectionObserver(function (eintraege) {
      if (eintraege[0].isIntersecting) { io.disconnect(); laden(); }
    }, { rootMargin: "0px" });
    io.observe(f);
  });
})();
