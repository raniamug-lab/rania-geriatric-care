const homeView = document.querySelector('#home-view');
const guides = [...document.querySelectorAll('.guide')];
const navLinks = [...document.querySelectorAll('nav a')];
const siteName = 'מזדקנים בטוב עם ראניה';

function readSetting(key) {
  try {
    return localStorage.getItem('rania-' + key);
  } catch {
    return null;
  }
}

function saveSetting(key, value) {
  try {
    localStorage.setItem('rania-' + key, value);
  } catch {
    // Controls still work when the browser restricts local storage.
  }
}

function route(focusGuide = false) {
  const hash = location.hash;
  const wasShowingGuide = homeView.hidden;
  const activeGuide = guides.find((guide) => '#' + guide.id === hash);
  homeView.hidden = Boolean(activeGuide);
  guides.forEach((guide) => { guide.hidden = guide !== activeGuide; });

  const section = activeGuide || hash === '#guides' ? '#guides' : hash === '#about' ? '#about' : '#home';
  navLinks.forEach((link) => {
    if (link.hash === section) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });

  if (activeGuide) {
    const heading = activeGuide.querySelector('h1');
    document.title = heading.textContent + ' | ' + siteName;
    if (focusGuide) heading.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } else {
    document.title = siteName;
    const target = [...homeView.querySelectorAll('section')].find((item) => '#' + item.id === hash);
    if (target && wasShowingGuide && focusGuide) {
      const heading = target.querySelector('h1, h2');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    if (hash === '#home' || (!hash && focusGuide)) window.scrollTo(0, 0);
    else if (target) target.scrollIntoView();
  }
}

window.addEventListener('hashchange', () => route(true));
route();

const textSize = document.querySelector('.text-size');
function setTextSize(large) {
  document.documentElement.classList.toggle('large-text', large);
  textSize.setAttribute('aria-pressed', String(large));
}
setTextSize(readSetting('large-text') === 'true');
textSize.hidden = false;
textSize.addEventListener('click', () => {
  const large = textSize.getAttribute('aria-pressed') !== 'true';
  setTextSize(large);
  saveSetting('large-text', String(large));
});

const search = document.querySelector('.guide-search');
const query = document.querySelector('#guide-query');
const cards = [...document.querySelectorAll('.guide-card')];
const searchStatus = document.querySelector('#search-status');

function normalize(value) {
  return value.normalize('NFKD').replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '').toLocaleLowerCase('he');
}
const searchableCards = cards.map((card) => {
  const guide = guides.find((item) => '#' + item.id === card.querySelector('a').hash);
  const content = [...guide.querySelectorAll('.steps li, .help p')].map((item) => item.textContent).join(' ');
  return { card, text: normalize([card.dataset.keywords, card.textContent, content].join(' ')) };
});

function filterGuides() {
  const words = normalize(query.value).trim().split(/\s+/).filter(Boolean);
  let count = 0;
  searchableCards.forEach(({ card, text }) => {
    const matches = words.every((word) => text.includes(word));
    card.hidden = !matches;
    count += Number(matches);
  });
  searchStatus.textContent = words.length === 0 ? '' : count === 0
    ? 'לא נמצאו הדרכות. נסו מילת חיפוש אחרת.'
    : count === 1 ? 'נמצאה הדרכה אחת.' : 'נמצאו ' + count + ' הדרכות.';
}
search.hidden = false;
search.addEventListener('submit', (event) => event.preventDefault());
query.addEventListener('input', filterGuides);
filterGuides();

function copyFallback(url) {
  const field = document.createElement('textarea');
  field.value = url;
  field.readOnly = true;
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } finally { field.remove(); }
  return copied;
}

guides.forEach((guide) => {
  const link = new URL(location.href);
  link.hash = guide.id;
  const title = guide.querySelector('h1').textContent;
  guide.querySelector('[data-whatsapp]').href = 'https://wa.me/?text=' + encodeURIComponent(title + '\n' + link.href);
  guide.querySelector('[data-print]').addEventListener('click', () => window.print());
  const copy = guide.querySelector('[data-copy]');
  copy.addEventListener('click', async () => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(link.href);
      copied = true;
    } catch {
      try { copied = copyFallback(link.href); } catch { copied = false; }
    }
    if (document.activeElement === document.body) copy.focus();
    guide.querySelector('.copy-status').textContent = copied
      ? 'הקישור הועתק.'
      : 'אפשר להעתיק את הקישור משורת הכתובת בדפדפן.';
  });
  guide.querySelector('.guide-actions').hidden = false;

  guide.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    const key = 'check-' + checkbox.name;
    checkbox.checked = readSetting(key) === 'true';
    checkbox.addEventListener('change', () => saveSetting(key, String(checkbox.checked)));
  });
});
