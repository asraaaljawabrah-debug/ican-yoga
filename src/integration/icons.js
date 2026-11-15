const paths = {
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  tag: '<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7.5" cy="7.5" r="1"/>',
  wind: '<path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h5a2 2 0 1 1-2 2"/>',
  body: '<circle cx="12" cy="4" r="2"/><path d="M4 8h16M12 6v8m0 0-5 7m5-7 5 7"/>',
  rest: '<path d="M4 12v9m0-3h17v3M4 15h17v3M13 15v-5h4a4 4 0 0 1 4 4v1"/><circle cx="8" cy="11" r="3"/>',
  cloud: '<path d="M6 18a5 5 0 1 1 1-10 6 6 0 0 1 11 2 4 4 0 1 1 0 8Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  wifi: '<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0"/><circle cx="12" cy="20" r=".5"/>'
};

export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round',
    'stroke-linejoin': 'round', class: 'icon', 'aria-hidden': 'true', focusable: 'false' })) {
    svg.setAttribute(key, value);
  }
  svg.innerHTML = paths[name] || paths.play;
  return svg;
}

export function mountIcons() {
  document.querySelectorAll('[data-icon]').forEach(element => {
    element.replaceChildren(icon(element.dataset.icon));
  });
}

export function exerciseIcon(exercise) {
  if (exercise.is_technical || exercise.id === 'b2-flower') return 'play';
  const label = `${exercise.title_sv} ${exercise.category_sv || ''}`.toLocaleLowerCase('sv');
  if (/andning|utandning/.test(label)) return 'wind';
  if (/sömn|vila|vilopaus/.test(label)) return 'rest';
  if (/avslappning|mindfulness/.test(label)) return 'cloud';
  return 'body';
}
