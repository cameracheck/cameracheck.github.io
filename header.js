/**
 * CameraCheck — Header Component
 * Injected into #header-root
 */
(function () {
  const headerHTML = `
    <header class="site-header" role="banner">
      <div class="container header-inner">
        <a href="/" class="logo" aria-label="CameraCheck Home">
          <div class="logo-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M15 10l4.553-2.07A1 1 0 0121 8.876V15.124a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
            </svg>
          </div>
          Camera<span>Test</span>
        </a>

        <nav class="nav" aria-label="Primary navigation">
          <a href="#camera-tester">Test Camera</a>
          <a href="#features">Features</a>
          <a href="#devices">Devices</a>
          <a href="#troubleshooting">Fix Issues</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div class="header-cta">
          <a href="#camera-tester" class="btn btn-primary" aria-label="Start camera test">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Test Now
          </a>
          <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation" aria-expanded="false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <nav class="mobile-nav" id="mobileNav" aria-label="Mobile navigation" hidden>
        <a href="#camera-tester">🎥 Test Camera</a>
        <a href="#features">✨ Features</a>
        <a href="#devices">📱 Devices</a>
        <a href="#troubleshooting">🔧 Fix Issues</a>
        <a href="#faq">❓ FAQ</a>
        <a href="#camera-tester" class="btn btn-primary" style="margin-top:8px;text-align:center;justify-content:center;">Start Camera Test</a>
      </nav>
    </header>
  `;

  const root = document.getElementById('header-root');
  if (root) {
    root.innerHTML = headerHTML;

    // Mobile nav toggle
    const toggle = document.getElementById('navToggle');
    const mobileNav = document.getElementById('mobileNav');

    if (toggle && mobileNav) {
      toggle.addEventListener('click', () => {
        const isOpen = mobileNav.classList.contains('open');
        if (isOpen) {
          mobileNav.classList.remove('open');
          mobileNav.hidden = true;
          toggle.setAttribute('aria-expanded', 'false');
        } else {
          mobileNav.classList.add('open');
          mobileNav.hidden = false;
          toggle.setAttribute('aria-expanded', 'true');
        }
      });

      // Close mobile nav on link click
      mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileNav.classList.remove('open');
          mobileNav.hidden = true;
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Active nav highlighting on scroll
    const sections = ['camera-tester', 'features', 'devices', 'troubleshooting', 'faq'];
    const navLinks = document.querySelectorAll('.nav a');

    const onScroll = () => {
      let current = '';
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) current = id;
      });
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + current) {
          link.style.color = 'var(--accent)';
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
