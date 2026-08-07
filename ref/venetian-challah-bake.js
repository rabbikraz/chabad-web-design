/* =========================================================
   Chabad of the Venetian & Sunset Islands
   Pre Rosh Hashanah Mega Challah Bake — Event ID 23333
   Injects sponsorship levels into the Summary step and
   writes the chosen amount into the Additional Donation field.
   ========================================================= */

(function () {
  const EVENT_ID = '23333';
  if (!location.href.includes('/eventid/' + EVENT_ID)) return;

  const CSS_HREF =
    'https://assets.webmk.co/chabadvenetian/events/challah-bake-sep-2026.css';

  const TIERS = [
    { label: 'Presenting Sponsor', amount: 5000 },
    { label: 'Diamond Sponsor', amount: 2500 },
    { label: 'Gold Sponsor', amount: 1800 },
    { label: 'Silver Sponsor', amount: 500 },
    { label: 'Community Sponsor', amount: 360 },
    { label: 'Friend of The Gathering', amount: 180 },
  ];

  const HEADING = 'Sponsorship Opportunities';
  const BLURB =
    "Sponsors help cover the evening's program.";

  const donationField = () => document.getElementById('TotalDonation');
  const section = () => document.getElementById('vsp-sponsorship');

  /* ── Assets ───────────────────────────────────────────── */

  const loadCSS = () => {
    if (document.querySelector('link[data-vsp-event]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    link.setAttribute('data-vsp-event', EVENT_ID);
    document.head.appendChild(link);
  };

  /* ── Donation field <-> tier sync ─────────────────────── */

  // Fires the Event App's own Events.updateDonation() so the Total recalculates.
  const setDonation = (value) => {
    const field = donationField();
    if (!field) return;
    field.value = value;
    ['input', 'change'].forEach((type) => {
      field.dispatchEvent(new Event(type, { bubbles: true }));
    });
  };

  const paint = (amount) => {
    const root = section();
    if (!root) return;
    root.querySelectorAll('.vsp-tier').forEach((tier) => {
      const on = Number(tier.dataset.amount) === amount;
      tier.classList.toggle('vsp-on', on);
      tier.setAttribute('aria-checked', String(on));
    });
  };

  const choose = (amount) => {
    const current = section().querySelector('.vsp-tier.vsp-on');
    // Clicking the selected level again clears it.
    if (current && Number(current.dataset.amount) === amount) {
      setDonation('');
      paint(null);
      return;
    }
    setDonation(amount);
    paint(amount);
  };

  // Someone typing their own amount should drop any highlighted level.
  const syncFromField = () => {
    const field = donationField();
    if (!field) return;
    const typed = parseFloat(String(field.value).replace(/[^0-9.]/g, ''));
    paint(TIERS.some((t) => t.amount === typed) ? typed : null);
  };

  // Supports deep links from email, e.g. ...?sponsor=1800
  const presetFromURL = () => {
    const raw = new URLSearchParams(location.search).get('sponsor');
    if (!raw) return null;
    const amount = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    return TIERS.some((t) => t.amount === amount) ? amount : null;
  };

  /* ── Markup ───────────────────────────────────────────── */

  const tierHTML = (tier) => `
    <button type="button" class="vsp-tier" role="radio" aria-checked="false"
            data-amount="${tier.amount}">
      <span class="vsp-amt">$${tier.amount.toLocaleString('en-US')}</span>
      <span class="vsp-name">${tier.label}</span>
    </button>`;

  const build = () => {
    const field = donationField();
    if (!field) return false;
    if (section()) return true;

    // The Additional Donation row — the section goes directly above it.
    const anchor = field.closest('.clearfix');
    if (!anchor || !anchor.parentNode) return false;

    const root = document.createElement('div');
    root.id = 'vsp-sponsorship';
    root.innerHTML = `
      <h3 class="vsp-head">${HEADING}</h3>
      <p class="vsp-blurb">${BLURB}</p>
      <div class="vsp-list" role="radiogroup" aria-label="${HEADING}">
        ${TIERS.map(tierHTML).join('')}
      </div>`;

    root.addEventListener('click', (event) => {
      const tier = event.target.closest('.vsp-tier');
      if (tier) choose(Number(tier.dataset.amount));
    });

    anchor.parentNode.insertBefore(root, anchor);

    field.addEventListener('input', syncFromField);
    field.addEventListener('change', syncFromField);

    const preset = presetFromURL();
    if (preset) choose(preset);
    else syncFromField();

    return true;
  };

  /* ── Boot ─────────────────────────────────────────────── */

  // The Summary step is rendered only after a category is chosen and
  // Continue is pressed, so watch for it and re-insert if it is replaced.
  const watch = () => {
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        if (!section() || !section().isConnected) build();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  const boot = () => {
    if (!document.getElementById('RegisterSinglePage')) return;
    loadCSS();
    build();
    watch();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
