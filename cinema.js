/* =============================================
   cinema.js — Cinematic Text Reveal Engine
   ============================================= */

(function(global) {
  'use strict';

  const Cinema = {

    // Timing per scene (seconds per line)
    LINE_DELAYS: {
      0:  [0, 1.0, 2.0, 3.0, 4.4],
      1:  [0, 0.9, 1.8, 2.7],
      2:  [0, 0.9, 1.8, 2.7],
      3:  [0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4],
      4:  [0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4],
      5:  [0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4, 6.3],
      6:  [0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4, 6.3],
      7:  [0, 0.9, 1.8, 2.7, 3.6],
      8:  [0, 0.9, 1.8, 2.7, 3.6],
      9:  [0, 0.9, 1.8, 2.7, 3.6],
      10: [0, 0.9, 1.8, 2.7, 3.6],
      11: [0, 0.9, 1.8],
      12: [0, 0.9, 1.8, 2.7, 3.6],
      13: [0, 0.9, 1.8, 2.7, 3.6, 4.5],
      14: [0, 0.9],
    },

    SPOTLIGHTS: {
      1:  [1],
      2:  [3],
      7:  [0],
      10: [3],
      12: [3],
    },

    SILENCE_MS: 420,
    SHATTER_SCENE_SILENCE_MS: 900,

    onSceneEnd: null,

    _timers: [],
    _activeFlyingDucks: [],

    clearTimers() {
      this._timers.forEach(id => clearTimeout(id));
      this._timers = [];
      this.clearFlyingDucks();
    },

    clearFlyingDucks() {
      this._activeFlyingDucks.forEach(duck => {
        if (duck && duck.remove) duck.remove();
      });
      this._activeFlyingDucks = [];
    },

    _after(ms, fn) {
      const id = setTimeout(() => {
        fn();
        this._timers = this._timers.filter(t => t !== id);
      }, ms);
      this._timers.push(id);
      return id;
    },

    // ── FLYING DUCK DELIVERY (core new feature) ──
    _flyDuckToLine(lineEl, callback) {
      if (!lineEl) {
        if (callback) callback();
        return;
      }
      
      const rect = lineEl.getBoundingClientRect();
      if (!rect || rect.width === 0) {
        if (callback) callback();
        return;
      }

      const startX = window.innerWidth / 2;
      const startY = -40;
      const endX = rect.left + rect.width / 2;
      const endY = rect.top - 25; // hover slightly above text

      const duckDiv = document.createElement('div');
      duckDiv.className = 'flying-duck';
      duckDiv.textContent = '🦆';
      duckDiv.style.left = startX + 'px';
      duckDiv.style.top = startY + 'px';
      duckDiv.style.transform = 'translate(-50%, -50%) rotate(0deg)';
      document.body.appendChild(duckDiv);
      this._activeFlyingDucks.push(duckDiv);

      // Fly to target
      const flyAnim = duckDiv.animate([
        { transform: `translate(-50%, -50%) translate(0, 0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(-50%, -50%) translate(${endX - startX}px, ${endY - startY}px) rotate(8deg)`, opacity: 1 }
      ], {
        duration: 480,
        easing: 'cubic-bezier(0.2, 0.9, 0.4, 1.2)',
        fill: 'forwards'
      });

      flyAnim.onfinish = () => {
        // Deliver the line
        if (callback) callback();

        // Fly away upward/off-screen
        const awayX = (Math.random() - 0.5) * 180 + 80;
        const awayY = -180 - Math.random() * 100;
        duckDiv.animate([
          { transform: `translate(-50%, -50%) translate(${endX - startX}px, ${endY - startY}px) rotate(8deg)`, opacity: 1 },
          { transform: `translate(-50%, -50%) translate(${endX - startX + awayX}px, ${endY - startY + awayY}px) rotate(25deg)`, opacity: 0 }
        ], {
          duration: 620,
          easing: 'ease-in',
          fill: 'forwards'
        }).onfinish = () => {
          duckDiv.remove();
          this._activeFlyingDucks = this._activeFlyingDucks.filter(d => d !== duckDiv);
        };
      };
    },

    // ── REVEAL ONE SCENE ──
    revealScene(idx, sceneEl, onComplete) {
      this.clearTimers();
      const lines   = sceneEl.querySelectorAll('.line');
      const delays  = this.LINE_DELAYS[idx] || [];
      const spots   = new Set(this.SPOTLIGHTS[idx] || []);
      const wrapper = document.getElementById('sceneWrapper');
      
      let revealedCount = 0;
      const totalLines = lines.length;

      const onLineRevealed = (line, lineIndex) => {
        line.classList.add('revealed');

        if (spots.has(lineIndex)) {
          this._after(500, () => this._spotlight(line));
        }

        revealedCount++;
        if (revealedCount === totalLines && typeof onComplete === 'function') {
          onComplete(idx);
        }
      };

      lines.forEach((line, i) => {
        const ms = (delays[i] !== undefined ? delays[i] : i * 0.9) * 1000;
        this._after(ms, () => {
          onLineRevealed(line, i);
        });
      });
    },

    // ── SPOTLIGHT ────────────────────────────
    _spotlight(el) {
      el.style.transition   = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), text-shadow 0.6s ease';
      el.style.transform    = 'scale(1.07)';
      el.style.textShadow   = '0 0 45px rgba(212,169,106,0.6)';
      this._after(1900, () => {
        el.style.transform  = '';
        el.style.textShadow = '';
      });
    },

    // ── SILENCE MOMENT ───────────────────────
    silenceThen(sceneIdx, fn) {
      const ms = sceneIdx === 11
        ? this.SHATTER_SCENE_SILENCE_MS
        : this.SILENCE_MS;
      this._after(ms, fn);
    },

    // ── WRAP WORDS in glass spans ─────────────
    wrapWords(sceneEl) {
      // Regex to detect emoji characters
      const emojiRe = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;

      sceneEl.querySelectorAll('.line').forEach(line => {
        if (line.id === 'shatterText') return;
        if (line.dataset.wrapped) return;
        line.dataset.wrapped = '1';

        // Work on text nodes only, preserve child elements (em, etc.)
        const processNode = (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (!text.trim()) return node; // whitespace only, keep as-is

            // Split into emoji and non-emoji segments
            const frag = document.createDocumentFragment();
            let last = 0;
            let match;
            emojiRe.lastIndex = 0;

            // Rebuild: wrap non-emoji words, leave emoji as raw text nodes
            const segments = [];
            let m;
            const re2 = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
            while ((m = re2.exec(text)) !== null) {
              if (m.index > last) segments.push({ t: 'text', v: text.slice(last, m.index) });
              segments.push({ t: 'emoji', v: m[0] });
              last = re2.lastIndex;
            }
            if (last < text.length) segments.push({ t: 'text', v: text.slice(last) });

            segments.forEach(seg => {
              if (seg.t === 'emoji') {
                // Raw emoji — no span, no gradient
                frag.appendChild(document.createTextNode(seg.v));
              } else {
                // Split by whitespace and wrap words
                const parts = seg.v.split(/(\s+)/);
                parts.forEach(chunk => {
                  if (/^\s+$/.test(chunk)) {
                    frag.appendChild(document.createTextNode(chunk));
                  } else if (chunk) {
                    const span = document.createElement('span');
                    span.className = 'word-wrap';
                    span.textContent = chunk;
                    frag.appendChild(span);
                  }
                });
              }
            });

            return frag;
          }
          return null;
        };

        // Replace text nodes inside the line
        const walk = (el) => {
          const children = Array.from(el.childNodes);
          children.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              const replacement = processNode(child);
              if (replacement) el.replaceChild(replacement, child);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              walk(child);
            }
          });
        };

        walk(line);
      });
    },

    // ── WRAP ALL SCENES ───────────────────────
    wrapAllScenes() {
      document.querySelectorAll('.scene').forEach(s => this.wrapWords(s));
    },
  };

  global.Cinema = Cinema;

})(window);