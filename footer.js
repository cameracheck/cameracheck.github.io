/**
 * CameraCheck — Footer Component
 * Injected into #footer-root
 */
(function () {
  const year = new Date().getFullYear();

  const footerHTML = `
    <footer class="site-footer" role="contentinfo">
      <div class="container">
        <div class="footer-main">
          <div class="footer-brand">
            <a href="/" class="logo" aria-label="CameraCheck Home">
              <div class="logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M15 10l4.553-2.07A1 1 0 0121 8.876V15.124a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                </svg>
              </div>
              Camera<span>Test</span>
            </a>
            <p>Free, private, browser-based camera and webcam testing tool. No downloads. No accounts. No data collected.</p>
          </div>

          <div class="footer-col">
            <h4>Tools</h4>
            <ul>
              <li><a href="#camera-tester">Webcam Test</a></li>
              <li><a href="#camera-tester">Phone Camera Test</a></li>
              <li><a href="#camera-tester">Microphone Test</a></li>
              <li><a href="#camera-tester">Camera FPS Test</a></li>
              <li><a href="#camera-tester">Resolution Checker</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Help</h4>
            <ul>
              <li><a href="#troubleshooting">Camera Not Working</a></li>
              <li><a href="#troubleshooting">Permission Denied</a></li>
              <li><a href="#troubleshooting">Black Screen Fix</a></li>
              <li><a href="#troubleshooting">Driver Issues</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Info</h4>
            <ul>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#devices">Supported Devices</a></li>
              <li><a href="#browsers">Browser Support</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#use-cases">Use Cases</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© ${year} CameraCheck · <a href="https://cameracheck.github.io/" style="color:var(--text-dim)">cameracheck.github.io</a> · All camera tests run 100% in your browser</p>
          <div class="footer-bottom-links">
            <a href="#privacy">Privacy</a>
            <a href="#faq">FAQ</a>
            <a href="#camera-tester">Test Camera</a>
          </div>
        </div>
      </div>
    </footer>
  `;

  const root = document.getElementById('footer-root');
  if (root) root.innerHTML = footerHTML;
})();
