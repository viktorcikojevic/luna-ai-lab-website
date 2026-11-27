/* Luna AI Lab: footer year and in-view video playback.
   No dependencies. The page reads fine without it: videos fall back to their posters. */

(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var HERO_MIN_WIDTH = 720;
  var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-src]'));

  function allowed(video) {
    if (reduceMotion.matches) return false;
    if (video.id === 'hero-video' && window.innerWidth < HERO_MIN_WIDTH) return false;
    return true;
  }

  function play(video) {
    if (!video.getAttribute('src')) video.src = video.getAttribute('data-src');
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  var inView = new Set();

  function sync(video) {
    if (inView.has(video) && !document.hidden && allowed(video)) play(video);
    else video.pause();
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

  document.addEventListener('visibilitychange', function () {
    videos.forEach(sync);
  });

  function onMotionChange() {
    videos.forEach(sync);
  }
  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', onMotionChange);
  }
})();
