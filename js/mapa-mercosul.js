/**
 * Mapa interativo Brasil & Mercosul (amCharts 5 + southAmericaLow)
 */
(function () {
  const SERVICES = {
    BR: {
      name: 'Brasil',
      services: ['Fretamento', 'Excursões de compras', 'Pacotes turísticos', 'Romarias', 'Pescarias', 'Encomendas']
    },
    AR: {
      name: 'Argentina',
      services: ['Pacotes turísticos', 'Pescarias', 'Turismo internacional', 'Excursões em grupo']
    },
    CL: {
      name: 'Chile',
      services: ['Pacotes turísticos', 'Turismo internacional', 'Roteiros pelo Mercosul']
    },
    PE: {
      name: 'Peru',
      services: ['Pacotes turísticos', 'Turismo internacional', 'Roteiros personalizados']
    },
    UY: {
      name: 'Uruguai',
      services: ['Pacotes turísticos', 'Turismo internacional', 'Excursões em grupo']
    },
    BO: {
      name: 'Bolívia',
      services: ['Pacotes turísticos', 'Turismo internacional', 'Excursões em grupo']
    },
    CO: {
      name: 'Colômbia',
      services: ['Pacotes turísticos', 'Turismo internacional', 'Fretamento para grupos']
    }
  };

  const ACTIVE_IDS = Object.keys(SERVICES);

  function libsReady() {
    return (
      typeof am5 !== 'undefined' &&
      typeof am5map !== 'undefined' &&
      window.am5geodata_region_world_southAmericaLow
    );
  }

  function initRoot(wrap) {
    const chartEl = wrap.querySelector('.h2-map__chart');
    const tip = wrap.querySelector('.h2-map__tip');
    const tipName = tip && tip.querySelector('[data-tip-name]');
    const tipList = tip && tip.querySelector('[data-tip-list]');
    if (!chartEl || !tip || !tipName || !tipList || !libsReady()) return;
    if (chartEl.dataset.mapReady === '1') return;
    chartEl.dataset.mapReady = '1';

    const root = am5.Root.new(chartEl);
    if (window.am5themes_Animated) {
      root.setThemes([am5themes_Animated.new(root)]);
    }

    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: 'none',
        panY: 'none',
        wheelX: 'none',
        wheelY: 'none',
        projection: am5map.geoMercator(),
        homeZoomLevel: 1,
        maxZoomLevel: 1,
        minZoomLevel: 1
      })
    );

    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_region_world_southAmericaLow
      })
    );

    polygonSeries.mapPolygons.template.setAll({
      interactive: true,
      cursorOverStyle: 'pointer',
      stroke: am5.color(0xffffff),
      strokeWidth: 1.2,
      strokeOpacity: 0.55,
      fill: am5.color(0xffffff),
      fillOpacity: 0.16,
      tooltipText: ''
    });

    polygonSeries.mapPolygons.template.adapters.add('fillOpacity', (_opacity, target) => {
      const id = target.dataItem && target.dataItem.get('id');
      return ACTIVE_IDS.includes(id) ? 0.34 : 0.12;
    });

    polygonSeries.mapPolygons.template.states.create('hover', {
      fill: am5.color(0xf58220),
      fillOpacity: 1,
      stroke: am5.color(0xf9b233),
      strokeWidth: 1.6
    });

    polygonSeries.mapPolygons.template.states.create('active', {
      fill: am5.color(0xf58220),
      fillOpacity: 1,
      stroke: am5.color(0xf9b233),
      strokeWidth: 1.6
    });

    let activePoly = null;

    function showTip(id, clientX, clientY) {
      const info = SERVICES[id];
      if (!info) {
        hideTip();
        return;
      }
      tipName.textContent = info.name;
      tipList.innerHTML = info.services.map((s) => `<li>${s}</li>`).join('');
      tip.hidden = false;
      tip.setAttribute('aria-hidden', 'false');

      const pad = 16;
      tip.style.left = '0px';
      tip.style.top = '0px';
      const rect = tip.getBoundingClientRect();
      let left = clientX + 18;
      let top = clientY + 18;
      if (left + rect.width > window.innerWidth - pad) left = clientX - rect.width - 12;
      if (top + rect.height > window.innerHeight - pad) top = clientY - rect.height - 12;
      if (left < pad) left = pad;
      if (top < pad) top = pad;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    }

    function hideTip() {
      tip.hidden = true;
      tip.setAttribute('aria-hidden', 'true');
      if (activePoly) {
        activePoly.states.apply('default');
        activePoly = null;
      }
    }

    function activate(poly, id, x, y) {
      if (activePoly && activePoly !== poly) activePoly.states.apply('default');
      activePoly = poly;
      poly.states.apply('active');
      showTip(id, x, y);
    }

    function eventPoint(ev) {
      const oe = ev.originalEvent || ev;
      if (oe.clientX != null) return { x: oe.clientX, y: oe.clientY };
      const t = oe.changedTouches && oe.changedTouches[0];
      if (t) return { x: t.clientX, y: t.clientY };
      const box = chartEl.getBoundingClientRect();
      return { x: box.left + box.width * 0.55, y: box.top + box.height * 0.35 };
    }

    polygonSeries.mapPolygons.template.events.on('pointerover', (ev) => {
      const id = ev.target.dataItem && ev.target.dataItem.get('id');
      if (!SERVICES[id]) return;
      const p = eventPoint(ev);
      activate(ev.target, id, p.x, p.y);
    });

    polygonSeries.mapPolygons.template.events.on('pointerout', () => {
      hideTip();
    });

    polygonSeries.mapPolygons.template.events.on('click', (ev) => {
      const id = ev.target.dataItem && ev.target.dataItem.get('id');
      if (!SERVICES[id]) return;
      const p = eventPoint(ev);
      activate(ev.target, id, p.x, p.y);
    });

    function focusCountry(iso) {
      const di = polygonSeries.getDataItemById(iso);
      const poly = di && di.get('mapPolygon');
      if (!poly) return;
      const box = chartEl.getBoundingClientRect();
      activate(poly, iso, box.left + box.width * 0.55, box.top + box.height * 0.35);
    }

    wrap.querySelectorAll('[data-focus]').forEach((btn) => {
      const iso = btn.getAttribute('data-focus');
      btn.addEventListener('mouseenter', () => focusCountry(iso));
      btn.addEventListener('mouseleave', hideTip);
      btn.addEventListener('focus', () => focusCountry(iso));
      btn.addEventListener('blur', hideTip);
      btn.addEventListener('click', () => focusCountry(iso));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideTip();
    });
  }

  function boot() {
    if (!libsReady()) {
      setTimeout(boot, 50);
      return;
    }
    document.querySelectorAll('#h2Map, #mdaMap').forEach(initRoot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
