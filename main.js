/* Luna AI Lab: footer year and in-view video playback.
   No dependencies. The page reads fine without it: videos fall back to their posters. */

(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var HERO_MIN_WIDTH = 720;
  var hero = document.getElementById('hero-video');
  var heroPause = document.querySelector('.hero__pause');
  var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-src]'));

  var inView = new Set();
  /* Videos the visitor paused themselves; autoplay leaves them alone until they press play. */
  var userPaused = new Set();

  function heroAllowed() {
    return window.innerWidth >= HERO_MIN_WIDTH;
  }

  /* Whether autoplay wants this video running right now, ignoring the visitor's own pauses. */
  function wanted(video) {
    if (!inView.has(video) || document.hidden || reduceMotion.matches) return false;
    return video !== hero || heroAllowed();
  }

  function load(video) {
    if (!video.getAttribute('src')) video.src = video.getAttribute('data-src');
  }

  function sync(video) {
    if (wanted(video) && !userPaused.has(video)) {
      load(video);
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    } else if (!video.paused) {
      video.pause();
    }
  }

  function syncAll() {
    videos.forEach(sync);
    if (heroPause) heroPause.hidden = reduceMotion.matches || !heroAllowed();
  }

  /* Showcase videos have native controls, so they get a src up front (preload="none" keeps
     that free) and stay playable on request even when autoplay is off. */
  videos.forEach(function (video) {
    if (video !== hero) load(video);
    /* The pause event fires asynchronously, so tell a visitor's pause from ours by whether
       autoplay still wants the video running. */
    video.addEventListener('pause', function () {
      if (wanted(video)) userPaused.add(video);
    });
    video.addEventListener('play', function () {
      userPaused.delete(video);
    });
  });

  if (heroPause && hero) {
    heroPause.addEventListener('click', function () {
      if (userPaused.has(hero)) {
        userPaused.delete(hero);
      } else {
        userPaused.add(hero);
      }
      var paused = userPaused.has(hero);
      heroPause.setAttribute('aria-pressed', String(paused));
      heroPause.textContent = paused ? 'Play video' : 'Pause video';
      if (paused) hero.pause();
      else sync(hero);
    });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) inView.add(entry.target);
          else inView.delete(entry.target);
          sync(entry.target);
        });
      },
      { threshold: 0.25 }
    );
    videos.forEach(function (video) {
      observer.observe(video);
    });
  }

  document.addEventListener('visibilitychange', syncAll);

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(syncAll, 150);
  });

  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', syncAll);
  }

  syncAll();
})();
