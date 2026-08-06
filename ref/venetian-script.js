(function () {
const PAGE_RULES = [
  {
    aid: '7258329',
    href: 'https://assets.webmk.co/chabadvenetian/siyum.css',
    type: 'style',
  },
  {
    aid: '22750',
    href: 'https://assets.webmk.co/chabadvenetian/events/funday-may-2026.js',
    type: 'script',
  },
  {
    aid: '23333',
    href: 'https://assets.webmk.co/chabadvenetian/events/challah-bake-sep-2026.js',
    type: 'script',
  },
];

// Minisites whose own bundle script injects its own article-header breadcrumb
// (e.g. the High Holidays bundle's shofar-header + hh-home-link) -- skip the
// generic .custom-breadcrumb here so the two don't fight over the same header.
const BREADCRUMB_EXCLUDED_SECTIONS = [6560428]; // High Holidays minisite

const SECTION_RULES = [
  {
    sectionId: 1037505,
    href: 'https://cdn.webmk.co/general/cdo-gallery-icons.js?v3=true',
    type: 'script',
    aidExclusions: ['1037505'],
  },
  {
    sectionId: 1037505,
    href: 'https://assets.webmk.co/chabadvenetian/photo-galleries.css',
    type: 'style',
    aidExclusions: ['1037505'],
  },
];

const pageSpecificStyling = (url) => {
  const styles = document.createElement('link');
  styles.rel = 'stylesheet';
  styles.type = 'text/css';
  styles.media = 'screen';
  styles.href = url;
  document.head.appendChild(styles);
};

const pageSpecificJs = (url) => {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  document.head.appendChild(script);
};

const injectAsset = (rule) => {
  if (rule.type === 'script') {
    pageSpecificJs(rule.href);
  } else if (rule.type === 'style') {
    pageSpecificStyling(rule.href);
  } else if (rule.type === 'redirect') {
    window.location.href = rule.href;
  }
};

const ruleCheck = (rule) => {
  if (Array.isArray(rule.aid)) {
    return rule.aid.some((aid) => window.location.href.includes(aid));
  } else {
    return window.location.href.includes(rule.aid);
  }
};

PAGE_RULES.forEach((rule) => {
  if (ruleCheck(rule)) {
    injectAsset(rule);
  }
});

const sectionRuleInjection = () => {
  const scopeAids = document.querySelector("meta[name='scope-aids']")?.content;
  SECTION_RULES.forEach((rule) => {
    const isInSection = scopeAids?.includes(rule.sectionId.toString());
    const isAidExcluded = rule.aidExclusions?.some((aid) => window.location.href.includes(aid));
    if (isInSection && !isAidExcluded) {
      injectAsset(rule);
    }
  });
};


// Menu hamburger JS
document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.querySelector(".cs-mobile-menu-open");
  if (!menuBtn) return;

  const icon = menuBtn.querySelector("i");
  if (icon) icon.remove();

  // Inject bars only once
  if (!menuBtn.querySelector(".bar")) {
    for (let i = 0; i < 3; i++) {
      const bar = document.createElement("span");
      bar.className = "bar";
      menuBtn.appendChild(bar);
    }
  }

  menuBtn.addEventListener("click", function () {
    menuBtn.classList.toggle("active");

    setTimeout(() => {
      if (menuBtn.classList.contains("active")) {
        document.body.classList.add("menu-open");
      } else {
        document.body.classList.remove("menu-open");
      }
    }, 0);
  });
});

/* =================================
   SNEAK PEEK GRID WRAP
================================= */
function wrapSneakItems() {
  const container = document.querySelector(".sneak-peek-container");
  if (!container) return;

  const items = Array.from(container.querySelectorAll(".sneak-peek-item"));

  if (!items.length) return;

  const grid = document.createElement("div");
  grid.className = "flexbox-grid";

  container.insertBefore(grid, items[0]);
  items.forEach((item) => grid.appendChild(item));

  container.querySelectorAll(".clear").forEach((el) => el.remove());
}

/* =================================
   HERO SECTION
================================= */
function updateHeroSection() {
  const slider = document.querySelector(".slider");
  if (!slider) return;

  slider.innerHTML = `
    <div class="hero-inner">

      <div class="hero-content-left">
        <h1 class="hero-heading">
          <span class="hero-title-teal">Chabad of the</span> Venetian &amp; Sunset Islands
        </h1>
        <p class="hero-subtitle">A welcoming home for Jewish life, learning, and connection on the Venetian &amp; Sunset Islands.</p>
        <div class="hero-body">
          <p>
            Chabad of the Venetian & Sunset Islands is a vibrant Jewish center offering meaningful experiences for individuals and families of all ages. From prayer and education to holidays, programs, and community gatherings, Chabad provides a warm, inclusive space where Jewish life is lived with purpose and joy.
            <!--<span class="hero-body-more"> Guided by Rabbi Shmuel and Tzippy Mann, together with Rabbi Menachem and Mushka Rapoport, Chabad blends timeless Jewish values with a modern, approachable spirit. Every Jew is welcomed with respect — regardless of background, affiliation, or level of observance — creating a place where tradition feels relevant, alive, and deeply personal.</span>-->
          </p>
          <!--<button class="hero-see-more-btn">... see more</button>-->
        </div>
        <a class="hero-cta" href="/about">Learn More</a>
      </div>

      <div class="hero-image-block">
        <img
          class="hero-building-img"
          src="/media/images/1365/nuVu13654947.png"
          alt="Chabad of the Venetian & Sunset Islands"
        />
      </div>

    </div>
  `;

  // See more toggle
  const btn = slider.querySelector(".hero-see-more-btn");
  const more = slider.querySelector(".hero-body-more");

  if (btn && more) {
    more.style.display = "none";
    btn.addEventListener("click", () => {
      more.style.display = "inline";
      btn.style.display = "none";
    });
  }
}

/* =================================
   CARD RESTRUCTURE
================================= */
function restructureEventCards() {
  const cards = document.querySelectorAll(".widget_content.index_format .item");

  cards.forEach((card) => {
    // skip if already restructured
    if (card.querySelector(".card_content")) return;

    const title = card.querySelector(".title");
    const desc = card.querySelector(".subtitle");
    const date = card.querySelector(".readMore");

    // bail only if ALL fields missing — card has nothing to show
    if (!title && !desc && !date) return;

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "card_content";

    if (date) {
      const dateEl = document.createElement("div");
      dateEl.className = "card_date";
      dateEl.textContent = date.textContent.trim();
      contentWrapper.appendChild(dateEl);
      date.remove();
    }

    if (title) {
      const titleEl = document.createElement("div");
      titleEl.className = "card_title";
      titleEl.innerHTML = title.innerHTML;
      contentWrapper.appendChild(titleEl);
      title.remove();
    }

    if (desc) {
      const descText = desc.textContent.trim();
      if (descText) {
        const descEl = document.createElement("div");
        descEl.className = "card_desc";
        descEl.textContent = descText;
        contentWrapper.appendChild(descEl);
      }
      desc.remove();
    }

    card.appendChild(contentWrapper);
  });
}

function initEventsCarousel() {
  const widget = document.querySelector(".widget_content.index_format");
  if (!widget) return;

  const items = Array.from(widget.querySelectorAll(".item"));
  if (!items.length) return;

  const container = document.createElement("div");
  container.className = "carousel_container";

  /* ======================
      HEADER
  ====================== */

  const header = document.createElement("div");
  header.className = "carousel_header";

  const heading = document.createElement("div");
  heading.className = "carousel_heading";
  heading.textContent = "Upcoming Events";

  const controls = document.createElement("div");
  controls.className = "controls_group";

  const pagination = document.createElement("div");
  pagination.className = "swiper-pagination";

  const btnNext = document.createElement("button");
  btnNext.className = "swiper-button-next";
  btnNext.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d="M8 5L16 12L8 19"
            stroke="currentColor"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"/>
    </svg>
  `;

  controls.appendChild(pagination);
  controls.appendChild(btnNext);

  header.appendChild(heading);
  header.appendChild(controls);

  /* ======================
      SWIPER
  ====================== */

  const swiperContainer = document.createElement("div");
  swiperContainer.className = "swiper events-swiper";

  const swiperWrapper = document.createElement("div");
  swiperWrapper.className = "swiper-wrapper";

  items.forEach((item) => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.appendChild(item);
    swiperWrapper.appendChild(slide);
  });

  swiperContainer.appendChild(swiperWrapper);

  const bottomControls = controls.cloneNode(true);
  bottomControls.classList.add("controls_group--bottom");

  const bottomPagination = bottomControls.querySelector(".swiper-pagination");
  const bottomNextBtn = bottomControls.querySelector(".swiper-button-next");

  container.appendChild(header);
  container.appendChild(swiperContainer);
  container.appendChild(bottomControls);

  widget.innerHTML = "";
  widget.appendChild(container);

  /* ======================
      INIT SWIPER
  ====================== */

  const swiper = new Swiper(".events-swiper", {
    slidesPerView: 1,
    centeredSlides: true,
    spaceBetween: 10,
    grabCursor: true,
    loop: false,

    pagination: {
      el: [pagination, bottomPagination],
      clickable: true,
    },

    navigation: {
      nextEl: [btnNext, bottomNextBtn],
    },

    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },

    breakpoints: {
      768: {
        slidesPerView: 2.2,
        centeredSlides: false,
        spaceBetween: 20,
      },
      1025: {
        slidesPerView: 3,
        centeredSlides: false,
        spaceBetween: 20,
      },
    },
  });

  // Don't autoplay while the carousel is below the fold — only start once it
  // scrolls into view, so visitors don't arrive mid-rotation.
  swiper.autoplay.stop();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        swiper.autoplay.start();
        io.disconnect(); // start once; don't restart on every scroll-by
      }
    });
  }, { threshold: 0.3 });

  io.observe(swiperContainer);
}


function buildSupportSection() {
  const section = document.querySelector('.hp-row .widget-4.message.custom');
  if (!section) return;

  const content = section.querySelector('.widget_content .bottom_padding');
  const button = section.querySelector('.readMore');

  if (!content || !button) return;

  const description = content.innerText;

  const buttonHTML = button.outerHTML;

  const customHeading = `
    <h2 class="support_heading">
      <span class="highlight">Support</span> Chabad Of Venetian & Sunset Islands
    </h2>
  `;

  const newHTML = `
    <div class="support_section">
      <div class="support_left">
        <p class="support_tagline">Your support helps Jewish life thrive.</p>
        ${customHeading}
        ${buttonHTML}
      </div>
      <div class="support_right">
        <p class="support_desc">${description}</p>
      </div>
    </div>
  `;

  const wrapper = section.querySelector('.wrapper');
  wrapper.innerHTML = newHTML;
}


function buildFeaturedPhotos() {
  let attempts = 0;
  const section = document.querySelector('.hp-row .latest_photos.custom');
  console.log('section', section);
  if (!section) return;

  const wrapper = section.querySelector('.wrapper');
  const header = section.querySelector('.widget_header h5');
  const listItems = section.querySelectorAll('.widget_content ul li');
  const button = section.querySelector('.readMore');

  console.log({wrapper, header, listItems, button});
  if (!wrapper || !header || !listItems.length || !button) {
    if (attempts < 5) {
      attempts += 1;
      setTimeout(buildFeaturedPhotos, 500);
    }
    return;
  }
  console.log('did not return early');
  const headingText = header.innerText;

  const items = Array.from(listItems).slice(0, 4);

  const getItemHTML = (index) => {
    return items[index]?.querySelector('a')?.outerHTML || '';
  };
  console.log('secure');

  const img1 = getItemHTML(0);
  const img2 = getItemHTML(1);
  const img3 = getItemHTML(2);
  const img4 = getItemHTML(3);

  const buttonText = button.textContent.trim();
  const buttonLink = button.getAttribute('href') || '#';

  const cleanButton = `
    <a href="${buttonLink}" class="featured_btn">
      ${buttonText}
    </a>
  `;

  const newHTML = `
    <div class="featured_section">

      <div class="featured_header">
        <h2 class="featured_heading">${headingText}</h2>
        ${cleanButton}
      </div>

      <div class="featured_layout">

        <div class="left_big">
          ${img1}
        </div>

        <div class="middle_stack">
          <div class="small">${img2}</div>
          <div class="small">${img3}</div>
        </div>

        <div class="right_big">
          ${img4}
        </div>

      </div>

      ${cleanButton} <!-- 👈 duplicated button here -->

    </div>
  `;

  wrapper.innerHTML = newHTML;
}

function injectBreadcrumb() {
  const header = document.querySelector('.article-header');
  const title = header?.querySelector('.article-header__title');

  if (!header || !title) return;

  const scopeAids = document.querySelector("meta[name='scope-aids']")?.content;
  if (BREADCRUMB_EXCLUDED_SECTIONS.some((id) => scopeAids?.includes(id.toString()))) return;

  // Prevent duplicate injection
  if (header.querySelector('.custom-breadcrumb')) return;

  const breadcrumbs = [
    '<a href="/">Home</a>',
  ];

  const existingBreadcrumbContainer = document.querySelector('.breadcrumbs');

  if (existingBreadcrumbContainer) {
    const existingBreadcrumbs = existingBreadcrumbContainer.querySelectorAll('a');
    console.log(existingBreadcrumbs);
    existingBreadcrumbs.forEach(el => {
      breadcrumbs.push(el.outerHTML);
      console.log(el.outerHTML);
    });
    existingBreadcrumbContainer.style.display = 'none';
  }


  const breadcrumbHTML = `
    <div class="custom-breadcrumb">
      ${breadcrumbs.join('<span> / </span>')}
    </div>
  `;

  title.insertAdjacentHTML('beforebegin', breadcrumbHTML);
}

/* =================================
   DYNAMIC UPCOMING EVENTS FETCH
================================= */

// Fetch the full upcoming-events list from the ChabadOne template page so
// events never need to be hardcoded as homepage banners.
async function fetchUpcomingEvents() {
  const cacheKey = 'venetian_upcoming_events';
  const cacheTime = 'venetian_upcoming_events_time';
  const TTL = 5 * 60 * 1000;

  const cachedData = sessionStorage.getItem(cacheKey);
  const cachedTime = sessionStorage.getItem(cacheTime);

  if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime)) < TTL) {
    return JSON.parse(cachedData);
  }

  const res = await fetch('/templates/articlecco_cdo/aid/7409502/jewish/Upcoming.htm');
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const items = Array.from(doc.querySelectorAll('.article_index_container .item'));

  const events = items.map((item) => ({
    imgSrc: item.querySelector('.synopsis_icon img')?.getAttribute('src') || '',
    title:  item.querySelector('.title a')?.textContent?.trim() || '',
    href:   item.querySelector('.title a')?.getAttribute('href') || '#',
    date:   item.querySelector('.subtitle')?.textContent?.trim() || '',
    desc:   item.querySelector('.synopsis')?.textContent?.trim() || '',
  }));

  sessionStorage.setItem(cacheKey, JSON.stringify(events));
  sessionStorage.setItem(cacheTime, Date.now().toString());

  return events;
}

// Emit a homepage-shaped raw .item so the existing restructureEventCards()
// consumes it unchanged (date -> .readMore, desc -> .subtitle).
function buildEventItemHTML({ imgSrc, title, href, date, desc }) {
  return `
    <div class="item">
      <div class="icon"><a href="${href}"><img src="${imgSrc}" alt="${title}"></a></div>
      <div class="title"><a href="${href}">${title}</a></div>
      <div class="readMore">${date}</div>
      <div class="subtitle">${desc}</div>
    </div>
  `;
}

// Replace the homepage widget's items with the fetched events, then run the
// existing restructure + carousel pipeline. Falls back to the on-page CMS
// banners if the fetch fails or returns nothing.
async function loadEvents() {
  const widget = document.querySelector(".widget_content.index_format");
  if (!widget) return;

  try {
    const events = await fetchUpcomingEvents();
    if (events.length) {
      widget.innerHTML = events.map(buildEventItemHTML).join('');
    }
  } catch (err) {
    console.warn('Could not fetch upcoming events, falling back to banners.', err);
  }

  restructureEventCards();
  initEventsCarousel();
}

const setupHomepage = () => {
  if (window.location.pathname !== "/") return;
  console.log('init');
  updateHeroSection();
  wrapSneakItems();
  loadEvents();
  buildSupportSection();
  console.log('build photos');
  buildFeaturedPhotos();
  injectBreadcrumb() 
};

const addFooterCredit = () => {
  jQuery('.footer3').append('<div style="font-size: 13px;margin-top: 20px; font-style: italic;">100% of all donations benefit Chabad of Venetian & Sunset Islands - EIN 65-0860163.</div>')
  const credit = document.createElement('p');
  credit.id = 'd-and-d';
  credit.innerHTML = 'Design+Development: <a href="mailto:mk@webmk.co">WebMK</a>';
  document.querySelector('.footer_container').appendChild(credit);
}



const init = () => {
  setupHomepage();
  sectionRuleInjection();
  injectBreadcrumb();
  addFooterCredit();
}

if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
};
})();
