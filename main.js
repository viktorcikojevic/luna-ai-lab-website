/* Luna AI Lab — hero ensemble canvas + small page interactions.
   No dependencies. Every effect here is decorative; the page reads fine without it. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------ year */

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* --------------------------------------------------------- scroll reveal */

  var revealables = document.querySelectorAll('[data-reveal]');

  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    Array.prototype.forEach.call(revealables, function (el) {
      revealObserver.observe(el);
    });

    /* Safety net: content must never stay invisible because an observer was
       throttled or never fired. */
    window.setTimeout(function () {
      Array.prototype.forEach.call(revealables, function (el) {
        el.classList.add('is-visible');
      });
    }, 3000);
  }

  /* ------------------------------------------------------- ensemble canvas */

  var canvas = document.getElementById('ensemble');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var hero = canvas.parentElement;

  /* Deterministic PRNG (LCG) so the fan is identical on every load —
     a random-looking figure that never reshuffles reads as a diagram,
     not as decoration. */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  var TAU = Math.PI * 2;
  var members = [];
  var width = 0;
  var height = 0;
  var dpr = 1;
  var segments = 72;

  function buildMembers(count) {
    var rand = rng(20260724);
    var list = [];
    for (var i = 0; i < count; i++) {
      var harmonics = [];
      var total = 0;
      for (var k = 0; k < 3; k++) {
        var amp = (1 / (k + 1)) * (0.55 + rand() * 0.9);
        total += amp;
        harmonics.push({
          amp: amp,
          freq: (0.6 + k * 0.85) * (0.7 + rand() * 0.85),
          phase: rand() * TAU,
          drift: (rand() - 0.5) * 0.09
        });
      }
      for (var h = 0; h < harmonics.length; h++) harmonics[h].amp /= total;

      list.push({
        harmonics: harmonics,
        /* Bias keeps the fan from collapsing symmetrically around the mean. */
        bias: (rand() - 0.5) * 1.35,
        alpha: 0.075 + rand() * 0.095,
        growth: 1.1 + rand() * 0.35
      });
    }
    return list;
  }

  function resize() {
    var rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var narrow = width < 640;
    segments = narrow ? 48 : 72;
    var count = narrow ? 28 : 64;
    if (members.length !== count) members = buildMembers(count);
    return true;
  }

  function draw(time) {
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    /* On wide screens the fan is anchored in the right-hand negative space, so it
       never converges on top of the hero copy. Narrow screens have no side column
       left, so it spans the full width behind a stronger scrim instead. */
    var wide = width >= 900;
    var originX = wide ? width * 0.46 : width * 0.04;
    var originY = wide ? height * 0.3 : height * 0.5;
    var span = wide ? width * 0.62 : width * 1.05;
    var spread = Math.min(height * (wide ? 0.5 : 0.4), 340);

    /* Lead-time hairlines — the x axis of the diagram, barely there. */
    ctx.strokeStyle = 'rgba(143, 169, 255, 0.05)';
    ctx.lineWidth = 1;
    for (var g = 1; g <= 6; g++) {
      var gx = originX + span * (g / 6);
      ctx.beginPath();
      ctx.moveTo(gx, originY - spread * 1.1);
      ctx.lineTo(gx, originY + spread * 1.1);
      ctx.stroke();
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (var m = 0; m < members.length; m++) {
      var member = members[m];
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(143, 169, 255, ' + member.alpha.toFixed(3) + ')';
      ctx.lineWidth = 1;

      for (var s = 0; s <= segments; s++) {
        var t = s / segments;
        var envelope = Math.pow(t, member.growth);
        var offset = member.bias * 0.35;

        for (var h = 0; h < member.harmonics.length; h++) {
          var harm = member.harmonics[h];
          offset +=
            harm.amp *
            Math.sin(harm.freq * t * TAU + harm.phase + time * harm.drift);
        }

        var x = originX + span * t;
        var y = originY + offset * envelope * spread;

        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    /* The deterministic run through the middle of the spread. Faded on the left
       so it does not read as a rule struck through the hero copy. */
    var meanGrad = ctx.createLinearGradient(originX, 0, originX + span, 0);
    meanGrad.addColorStop(0, 'rgba(168, 188, 255, 0.36)');
    meanGrad.addColorStop(0.55, 'rgba(168, 188, 255, 0.2)');
    meanGrad.addColorStop(1, 'rgba(168, 188, 255, 0.04)');

    ctx.beginPath();
    ctx.strokeStyle = meanGrad;
    ctx.lineWidth = 1.2;
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + span, originY);
    ctx.stroke();

    /* Analysis point the ensemble is launched from. */
    ctx.beginPath();
    ctx.fillStyle = 'rgba(168, 188, 255, 0.85)';
    ctx.arc(originX, originY, 2.4, 0, TAU);
    ctx.fill();
  }

  /* --------------------------------------------------------- render loop -- */

  var running = false;
  var visible = true;
  var inView = true;
  var clock = 0;
  var last = 0;
  var frameId = 0;
  var FRAME_MS = 1000 / 30;

  function loop(now) {
    frameId = window.requestAnimationFrame(loop);
    if (now - last < FRAME_MS) return;
    clock += (now - last) / 1000;
    last = now;
    draw(clock);
  }

  function start() {
    if (running || reduceMotion.matches || !visible || !inView) return;
    running = true;
    last = window.performance ? window.performance.now() : Date.now();
    frameId = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (!running) return;
    running = false;
    window.cancelAnimationFrame(frameId);
  }

  function init() {
    if (!resize()) return;
    if (reduceMotion.matches) {
      stop();
      draw(0);
    } else {
      start();
    }
  }

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(init, 150);
  });

  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    if (visible) start();
    else stop();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0 }
    ).observe(hero);
  }

  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', init);
  }

  /* Fonts change the hero's height, which changes the canvas box. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init);
  }

  init();
})();
