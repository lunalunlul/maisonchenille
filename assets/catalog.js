/* Maison Chenille — catalogue
   Lit /products.json et remplit :
     [data-catalog="bouquet|kit"]  grille filtrable (page Bouquets / Kits)
     [data-filters="bouquet|kit"]  barre de filtres (couleur, occasion, prix)
     [data-featured="4"]           sélection de saison (accueil)
     [data-colors]                 pastilles de couleur (accueil)
   Filtres mémorisés dans l'URL : ?couleur=bordeaux&occasion=fetes&prix=30-60 */
(function () {
  'use strict';

  var ROSE = '/assets/rose-transparent.png';
  var LANG = (document.documentElement.lang || 'fr').slice(0, 2);
  var EN = LANG === 'en';
  var T = EN
    ? { soon: 'Coming soon', out: 'Sold out', price_tbd: 'Price to come', buy: 'Buy', colour: 'Colour', occasion: 'Occasion', price: 'Price', all: 'Show all', base: '/en/bouquets/' }
    : { soon: 'Bientôt', out: 'Épuisé', price_tbd: 'Prix à venir', buy: 'Acheter', colour: 'Couleur', occasion: 'Occasion', price: 'Prix', all: 'Tout voir', base: '/bouquets/' };
  function tx(obj, key) { return (EN && obj[key + '_en']) ? obj[key + '_en'] : obj[key]; }
  function occLabel(data, k) { return (EN && data.occasions_en && data.occasions_en[k]) || data.occasions[k]; }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtPrice(n) { var v = n.toLocaleString(EN ? 'en-GB' : 'fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0 }); return EN ? '€' + v : v + '\u00a0€'; }

  function card(p, data) {
    var sw = (p.colors || []).map(function (c) {
      var col = data.colors[c]; if (!col) return '';
      return '<i class="swatch" style="background:' + col.hex + '" title="' + esc(tx(col, 'label')) + '"></i>';
    }).join('');
    var media = p.image
      ? '<img src="' + esc(p.image) + '" alt="' + esc(tx(p, 'name')) + '" loading="lazy">'
      : '<img class="ph" src="' + ROSE + '" alt="" aria-hidden="true">';
    var badge = p.status === 'bientot' ? '<span class="badge">' + T.soon + '</span>'
              : p.status === 'epuise' ? '<span class="badge">' + T.out + '</span>' : '';
    var price, action = '';
    if (p.price == null) { price = '<span class="price soon">' + T.price_tbd + '</span>'; }
    else { price = '<span class="price">' + fmtPrice(p.price) + '</span>'; }
    if (p.stripe && p.status === 'dispo') { action = '<a class="btn small-btn" href="' + esc(p.stripe) + '">' + T.buy + '</a>'; }
    return '<article class="product" data-id="' + esc(p.id) + '">' +
      '<div class="media">' + media + badge + '</div>' +
      '<h3 class="name">' + esc(tx(p, 'name')) + '</h3>' +
      '<p class="tag">' + esc(tx(p, 'tagline') || '') + '</p>' +
      '<div class="meta">' + price + '<span class="swatches">' + sw + '</span></div>' +
      action + '</article>';
  }

  function chip(group, id, label, on) {
    return '<button type="button" class="chip" data-group="' + group + '" data-id="' + esc(id) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(label) + '</button>';
  }

  function readState() {
    var q = new URLSearchParams(location.search);
    return { couleur: q.get('couleur') || '', occasion: q.get('occasion') || '', prix: q.get('prix') || '' };
  }
  function writeState(st) {
    var q = new URLSearchParams();
    Object.keys(st).forEach(function (k) { if (st[k]) q.set(k, st[k]); });
    var s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  function matches(p, st, data) {
    if (st.couleur && (p.colors || []).indexOf(st.couleur) < 0) return false;
    if (st.occasion && (p.occasions || []).indexOf(st.occasion) < 0) return false;
    if (st.prix) {
      var band = (data.price_bands || []).filter(function (b) { return b.id === st.prix; })[0];
      if (!band) return true;
      if (p.price == null) return false;
      if (p.price < band.min) return false;
      if (band.max != null && p.price >= band.max) return false;
    }
    return true;
  }

  function renderCatalog(grid, data) {
    var kind = grid.getAttribute('data-catalog');
    var items = data.products.filter(function (p) { return p.type === kind; });
    var bar = document.querySelector('[data-filters="' + kind + '"]');
    var empty = document.querySelector('[data-empty]');
    var st = readState();

    function usedIn(key) {
      var set = {};
      items.forEach(function (p) { (p[key] || []).forEach(function (v) { set[v] = true; }); });
      return set;
    }

    function drawFilters() {
      if (!bar) return;
      var html = '';
      var cols = usedIn('colors');
      var colKeys = Object.keys(data.colors).filter(function (k) { return cols[k]; });
      if (colKeys.length) {
        html += '<div class="group"><span class="label">' + T.colour + '</span>' +
          colKeys.map(function (k) { return chip('couleur', k, tx(data.colors[k], 'label'), st.couleur === k); }).join('') + '</div>';
      }
      var occ = usedIn('occasions');
      var occKeys = Object.keys(data.occasions).filter(function (k) { return occ[k]; });
      if (occKeys.length) {
        html += '<div class="group"><span class="label">' + T.occasion + '</span>' +
          occKeys.map(function (k) { return chip('occasion', k, occLabel(data, k), st.occasion === k); }).join('') + '</div>';
      }
      var anyPrice = items.some(function (p) { return p.price != null; });
      if (anyPrice && data.price_bands) {
        html += '<div class="group"><span class="label">' + T.price + '</span>' +
          data.price_bands.map(function (b) { return chip('prix', b.id, tx(b, 'label'), st.prix === b.id); }).join('') + '</div>';
      }
      if (st.couleur || st.occasion || st.prix) {
        html += '<button type="button" class="chip reset" data-reset>' + T.all + '</button>';
      }
      bar.innerHTML = html;
    }

    function drawGrid() {
      var shown = items.filter(function (p) { return matches(p, st, data); });
      grid.innerHTML = shown.map(function (p) { return card(p, data); }).join('');
      if (empty) empty.hidden = shown.length > 0;
    }

    if (bar) {
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-reset')) { st = { couleur: '', occasion: '', prix: '' }; }
        else {
          var g = b.getAttribute('data-group'), id = b.getAttribute('data-id');
          st[g] = (st[g] === id) ? '' : id;
        }
        writeState(st); drawFilters(); drawGrid();
      });
    }
    drawFilters(); drawGrid();
  }

  function renderFeatured(el, data) {
    var n = parseInt(el.getAttribute('data-featured'), 10) || 4;
    var items = data.products.filter(function (p) { return p.featured; }).slice(0, n);
    el.innerHTML = items.map(function (p) { return card(p, data); }).join('');
  }

  function renderColors(el, data) {
    var base = el.getAttribute('data-base') || T.base;
    el.innerHTML = Object.keys(data.colors).map(function (k) {
      var c = data.colors[k];
      return '<a class="color" href="' + base + '?couleur=' + encodeURIComponent(k) + '"><i style="background:' + c.hex + '"></i>' + esc(tx(c, 'label')) + '</a>';
    }).join('');
  }

  function init() {
    var need = document.querySelector('[data-catalog],[data-featured],[data-colors]');
    if (!need) return;
    fetch('/products.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (data) {
      document.querySelectorAll('[data-catalog]').forEach(function (g) { renderCatalog(g, data); });
      document.querySelectorAll('[data-featured]').forEach(function (g) { renderFeatured(g, data); });
      document.querySelectorAll('[data-colors]').forEach(function (g) { renderColors(g, data); });
    }).catch(function (err) { console.error('catalogue :', err); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
