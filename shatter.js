/* =============================================
   shatter.js — Heart Shatter Effect Engine
   Letter-by-letter break with glow,
   screen shake, gravity fall.
   ============================================= */

(function(global) {
  'use strict';

  const Shatter = {
    done: false,

    trigger(elId) {
      if (this.done) return;
      this.done = true;

      const el = document.getElementById(elId);
      if (!el) return;

      // Rose glow pre-crack
      el.style.transition  = 'text-shadow 0.75s ease, color 0.75s ease';
      el.style.color       = 'rgba(230,150,170,0.98)';
      el.style.textShadow  = '0 0 55px rgba(200,80,110,0.75)';

      setTimeout(() => {
        // Split into individual letter spans
        const text = el.innerText;
        el.innerHTML = '';

        [...text].forEach((char, i, all) => {
          const span = document.createElement('span');
          span.textContent    = char === ' ' ? '\u00A0' : char;
          span.style.cssText  = `
            display: inline-block;
            color: rgba(230,150,170,0.98);
            transition: none;
          `;
          el.appendChild(span);
        });

        // Pause — let her read it once whole
        setTimeout(() => {
          // Screen shake
          document.body.classList.add('shake');
          setTimeout(() => document.body.classList.remove('shake'), 480);

          // Fly apart
          const spans = el.querySelectorAll('span');
          spans.forEach((span, i) => {
            const bias = i / spans.length - 0.5; // -0.5 to 0.5, center letters fall differently
            const dx   = bias * 160 + (Math.random()-0.5) * 80;
            const dy   = 110 + Math.random() * 180;
            const rot  = (Math.random()-0.5) * 520;

            span.animate([
              { transform: 'translate(0,0) rotate(0deg)', opacity: 1, filter: 'blur(0px)' },
              { transform: `translate(${dx*0.12}px, -18px) rotate(${rot*0.03}deg)`, opacity: 1, offset: 0.08 },
              { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0, filter: 'blur(4px)' },
            ], {
              duration: 1300 + Math.random() * 350,
              delay:    i * 18 + Math.random() * 60,
              easing:   'cubic-bezier(0.25,0.46,0.45,0.94)',
              fill:     'forwards',
            });
          });
        }, 340);
      }, 900);
    },

    reset() {
      this.done = false;
    },
  };

  global.Shatter = Shatter;

})(window);
