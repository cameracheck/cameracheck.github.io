/**
 * CameraCheck — Main Application
 * WebRTC-powered camera and microphone tester
 */
(function () {
  'use strict';

  // ── DOM refs ──────────────────────────────────────────────────────
  const startBtn       = document.getElementById('startBtn');
  const stopBtn        = document.getElementById('stopBtn');
  const screenshotBtn  = document.getElementById('screenshotBtn');
  const mirrorBtn      = document.getElementById('mirrorBtn');
  const cameraSelect   = document.getElementById('cameraSelect');
  const cameraFeed     = document.getElementById('cameraFeed');
  const cameraCanvas   = document.getElementById('cameraCanvas');
  const videoOverlay   = document.getElementById('videoOverlay');
  const videoHud       = document.getElementById('videoHud');
  const mirrorBadge    = document.getElementById('mirrorBadge');
  const hudFps         = document.getElementById('hudFps');
  const micTestBtn     = document.getElementById('micTestBtn');
  const micBar         = document.getElementById('micBar');
  const micDb          = document.getElementById('micDb');
  const screenshotArea = document.getElementById('screenshotArea');
  const ssImg          = document.getElementById('ssImg');
  const ssDownload     = document.getElementById('ssDownload');
  const ssTime         = document.getElementById('ssTime');
  const statusBadge    = document.getElementById('statusBadge');
  const errorCard      = document.getElementById('errorCard');
  const errorMsg       = document.getElementById('errorMsg');

  const stats = {
    resolution: document.getElementById('statResolution'),
    fps:        document.getElementById('statFps'),
    aspect:     document.getElementById('statAspect'),
    facing:     document.getElementById('statFacing'),
    device:     document.getElementById('statDevice'),
    cameras:    document.getElementById('statCameras'),
  };

  const perms = {
    camera:  document.getElementById('permCamera'),
    mic:     document.getElementById('permMic'),
    browser: document.getElementById('permBrowser'),
  };

  // ── State ─────────────────────────────────────────────────────────
  let stream          = null;
  let micStream       = null;
  let audioCtx        = null;
  let analyser        = null;
  let micAnimFrame    = null;
  let fpsInterval     = null;
  let frameCount      = 0;
  let lastFpsTime     = performance.now();
  let isMirrored      = false;
  let micActive       = false;

  // ── Init ──────────────────────────────────────────────────────────
  checkBrowserSupport();
  initFAQ();
  setupFAQ();

  // ── Browser support check ─────────────────────────────────────────
  function checkBrowserSupport() {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (supported) {
      setPermStatus(perms.browser, 'Supported', 'perm-supported');
    } else {
      setPermStatus(perms.browser, 'Not Supported', 'perm-not-supported');
      showError('Your browser does not support camera access (WebRTC/MediaDevices API). Try Chrome, Firefox, or Edge.');
      startBtn.disabled = true;
    }
  }

  // ── Start camera ──────────────────────────────────────────────────
  async function startCamera(deviceId) {
    stopCamera();
    hideError();

    const constraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 3840 }, height: { ideal: 2160 } }
        : { width: { ideal: 3840 }, height: { ideal: 2160 } },
      audio: false,
    };

    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraFeed.srcObject = stream;
      cameraFeed.onloadedmetadata = () => {
        cameraFeed.play();
        videoOverlay.style.display = 'none';
        videoHud.style.display = 'flex';
        startFpsCounter();
        updateStats();
        setStatus('Live', 'active');
        setPermStatus(perms.camera, 'Granted', 'perm-granted');
      };

      startBtn.disabled = true;
      stopBtn.disabled = false;
      screenshotBtn.disabled = false;
      mirrorBtn.disabled = false;
      cameraSelect.disabled = false;

      await enumerateDevices();

    } catch (err) {
      handleCameraError(err);
    }
  }

  // ── Stop camera ───────────────────────────────────────────────────
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    cameraFeed.srcObject = null;
    videoOverlay.style.display = 'flex';
    videoHud.style.display = 'none';
    stopFpsCounter();
    resetStats();
    setStatus('Idle', '');
    startBtn.disabled = false;
    stopBtn.disabled = true;
    screenshotBtn.disabled = true;
    mirrorBtn.disabled = true;
  }

  // ── Enumerate devices ─────────────────────────────────────────────
  async function enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoCameras = devices.filter(d => d.kind === 'videoinput');

      cameraSelect.innerHTML = '';
      videoCameras.forEach((cam, i) => {
        const opt = document.createElement('option');
        opt.value = cam.deviceId;
        opt.textContent = cam.label || `Camera ${i + 1}`;
        cameraSelect.appendChild(opt);
      });

      // Select current
      if (stream) {
        const currentId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
        if (currentId) cameraSelect.value = currentId;
      }

      updateStat(stats.cameras, videoCameras.length + (videoCameras.length === 1 ? ' camera' : ' cameras'), 'sc-cameras');

    } catch (e) {
      console.warn('Device enumeration failed:', e);
    }
  }

  // ── FPS counter ───────────────────────────────────────────────────
  function startFpsCounter() {
    frameCount = 0;
    lastFpsTime = performance.now();

    const countFrame = () => {
      frameCount++;
      fpsAnimId = requestAnimationFrame(countFrame);
    };
    fpsAnimId = requestAnimationFrame(countFrame);

    fpsInterval = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - lastFpsTime) / 1000;
      const fps = Math.round(frameCount / elapsed);
      frameCount = 0;
      lastFpsTime = now;
      hudFps.textContent = fps + ' FPS';
      updateStat(stats.fps, fps + ' FPS', 'sc-fps');
    }, 1000);
  }

  let fpsAnimId = null;
  function stopFpsCounter() {
    if (fpsAnimId) cancelAnimationFrame(fpsAnimId);
    if (fpsInterval) clearInterval(fpsInterval);
    fpsInterval = null;
    hudFps.textContent = '-- FPS';
  }

  // ── Update stat cards ─────────────────────────────────────────────
  function updateStats() {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const settings = track.getSettings();
    const w = settings.width  || cameraFeed.videoWidth  || 0;
    const h = settings.height || cameraFeed.videoHeight || 0;

    updateStat(stats.resolution, w && h ? `${w} × ${h}` : '—', 'sc-resolution');
    updateStat(stats.aspect, w && h ? calcAspect(w, h) : '—', 'sc-aspect');
    updateStat(stats.facing, capitalize(settings.facingMode || 'user'), 'sc-facing');

    const deviceName = track.label || 'Unknown device';
    updateStat(stats.device, deviceName, 'sc-device');
  }

  function updateStat(el, value, cardId) {
    if (!el) return;
    el.textContent = value;
    const card = document.getElementById(cardId);
    if (card) {
      card.classList.remove('updated');
      void card.offsetWidth;
      card.classList.add('updated');
    }
  }

  function resetStats() {
    Object.values(stats).forEach(el => { if (el) el.textContent = '—'; });
  }

  function calcAspect(w, h) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const d = gcd(w, h);
    const rw = w / d, rh = h / d;
    const known = { '16:9': '16:9', '4:3': '4:3', '1:1': '1:1', '21:9': '21:9', '3:2': '3:2' };
    const ratio = `${rw}:${rh}`;
    return known[ratio] || ratio;
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // ── Screenshot ────────────────────────────────────────────────────
  function takeScreenshot() {
    if (!stream) return;
    const w = cameraFeed.videoWidth;
    const h = cameraFeed.videoHeight;
    cameraCanvas.width = w;
    cameraCanvas.height = h;
    const ctx = cameraCanvas.getContext('2d');
    if (isMirrored) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(cameraFeed, 0, 0, w, h);
    const dataUrl = cameraCanvas.toDataURL('image/png');
    ssImg.src = dataUrl;
    ssDownload.href = dataUrl;
    const now = new Date();
    ssTime.textContent = now.toLocaleTimeString();
    screenshotArea.style.display = 'block';
  }

  // ── Mirror ────────────────────────────────────────────────────────
  function toggleMirror() {
    isMirrored = !isMirrored;
    cameraFeed.style.transform = isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
    mirrorBadge.style.display = isMirrored ? 'block' : 'none';
  }

  // ── Microphone test ───────────────────────────────────────────────
  async function toggleMic() {
    if (micActive) {
      stopMic();
      micTestBtn.textContent = 'Test Microphone';
      return;
    }

    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      micActive = true;
      micTestBtn.textContent = 'Stop Mic Test';
      setPermStatus(perms.mic, 'Granted', 'perm-granted');
      drawMic();
    } catch (err) {
      setPermStatus(perms.mic, 'Denied', 'perm-denied');
      showError('Microphone access denied. Check browser permissions.');
    }
  }

  function drawMic() {
    if (!analyser || !micActive) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const pct = Math.min(100, (avg / 128) * 100 * 2.5);
    micBar.style.width = pct + '%';
    const db = avg > 0 ? Math.round(20 * Math.log10(avg / 255)) : -Infinity;
    micDb.textContent = isFinite(db) ? db + ' dB' : '— dB';
    micAnimFrame = requestAnimationFrame(drawMic);
  }

  function stopMic() {
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    if (micAnimFrame) cancelAnimationFrame(micAnimFrame);
    micActive = false;
    micBar.style.width = '0%';
    micDb.textContent = '—';
  }

  // ── Error handling ────────────────────────────────────────────────
  function handleCameraError(err) {
    console.error('Camera error:', err);
    let msg = 'Could not access camera. ';

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      msg += 'Camera permission was denied. Click the camera icon in your address bar and select "Allow."';
      setPermStatus(perms.camera, 'Denied', 'perm-denied');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      msg += 'No camera device was found. Please connect a camera and try again.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      msg += 'Camera is in use by another application. Close Zoom, Teams, or other apps and retry.';
    } else if (err.name === 'OverconstrainedError') {
      msg += 'Requested camera constraints could not be satisfied. Trying with default settings…';
      startCamera(null);
      return;
    } else {
      msg += err.message || 'An unknown error occurred.';
    }

    showError(msg);
    setStatus('Error', 'error');
    startBtn.disabled = false;
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorCard.style.display = 'flex';
  }
  function hideError() {
    errorCard.style.display = 'none';
  }

  function setStatus(text, cls) {
    statusBadge.textContent = text;
    statusBadge.className = 'status-badge';
    if (cls) statusBadge.classList.add(cls);
  }

  function setPermStatus(el, text, cls) {
    el.textContent = text;
    el.className = 'perm-status ' + cls;
  }

  // ── Event listeners ───────────────────────────────────────────────
  startBtn.addEventListener('click', () => {
    const deviceId = cameraSelect.value || null;
    startCamera(deviceId);
  });

  stopBtn.addEventListener('click', stopCamera);
  screenshotBtn.addEventListener('click', takeScreenshot);
  mirrorBtn.addEventListener('click', toggleMirror);
  micTestBtn.addEventListener('click', toggleMic);

  cameraSelect.addEventListener('change', () => {
    if (stream) startCamera(cameraSelect.value);
  });

  // Update stats on resize/metadata
  cameraFeed.addEventListener('loadedmetadata', updateStats);
  window.addEventListener('resize', () => { if (stream) updateStats(); });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── FAQ accordion ─────────────────────────────────────────────────
  function initFAQ() {}

  function setupFAQ() {
    document.querySelectorAll('.faq-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        // Close all
        document.querySelectorAll('.faq-q').forEach(b => {
          b.setAttribute('aria-expanded', 'false');
          const a = b.nextElementSibling;
          if (a) a.classList.remove('open');
        });
        // Toggle clicked
        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          const answer = btn.nextElementSibling;
          if (answer) answer.classList.add('open');
        }
      });
    });
  }

  // ── Intersection observer: entrance animations ────────────────────
  const observerOpts = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOpts);

  const animTargets = document.querySelectorAll(
    '.feat-card, .device-card, .trouble-card, .browser-item, .usecase-item, .hiw-step'
  );
  animTargets.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.04}s, transform 0.5s ease ${i * 0.04}s`;
    observer.observe(el);
  });

  // ── Cleanup on page unload ────────────────────────────────────────
  window.addEventListener('beforeunload', () => {
    stopCamera();
    stopMic();
  });

  // Fix -Infinity reference
  const negInf = -Infinity;

})();
