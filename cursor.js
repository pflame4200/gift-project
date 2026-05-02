/* =============================================
   cursor.js — Sunflower Cursor Engine (Zero-Lag)
   Hardware-accelerated, zero-latency, external RAF driven.
   ============================================= */

(function(global) {
  'use strict';

  const SunflowerCursor = {
    el: null,
    trailEl: null,
    pool: [],
    poolIdx: 0,
    
    // Position tracking
    targetX: -100, targetY: -100,
    prevX: -100, prevY: -100,
    lastTrailX: -100, lastTrailY: -100,

    init() {
      // Hide system cursor
      document.documentElement.style.cursor = 'none';
      document.body.style.cursor = 'none';

      // Create cursor element
      this.el = document.createElement('div');
      this.el.id = 'sf-cursor';
      this.el.innerHTML = this._buildSVG();
      document.body.appendChild(this.el);

      // Trail container
      this.trailEl = document.createElement('div');
      this.trailEl.id = 'sf-trail';
      document.body.appendChild(this.trailEl);

      // Pre-allocate smaller object pool (reduced to 6)
      for (let i = 0; i < 6; i++) {
        const p = document.createElement('div');
        p.className = 'sf-trail-petal';
        // Use opacity instead of display
        p.style.opacity = '0';
        this.trailEl.appendChild(p);
        this.pool.push(p);
      }

      // ONLY update target coordinates in mousemove (no transform)
      document.addEventListener('mousemove', e => {
        this.targetX = e.clientX;
        this.targetY = e.clientY;
      }, { passive: true });

      document.addEventListener('mousedown', e => this._onClick(e), { passive: true });

      this.lastTrailX = this.targetX;
      this.lastTrailY = this.targetY;
      this.el.style.transition = 'none';
    },

    _buildSVG() {
      return `<svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(19,19)">
          <ellipse rx="5" ry="10" cy="-10" fill="rgba(255,210,60,0.88)" class="sf-petal"/>
          <ellipse rx="5" ry="10" cy="-10" fill="rgba(255,210,60,0.88)" class="sf-petal" transform="rotate(45)"/>
          <ellipse rx="5" ry="10" cy="-10" fill="rgba(255,210,60,0.88)" class="sf-petal" transform="rotate(90)"/>
          <ellipse rx="5" ry="10" cy="-10" fill="rgba(255,210,60,0.88)" class="sf-petal" transform="rotate(135)"/>
          <ellipse rx="5" ry="10" cy="-10" fill="rgba(255,195,50,0.82)" class="sf-petal" transform="rotate(180)"/>
          <ellipse rx="5" ry="10" cy="-10" fill="rgba(255,195,50,0.82)" class="sf-petal" transform="rotate(225)"/>
          <ellipse rx="5" ry="10" cy="-10" fill="rgba(255,195,50,0.82)" class="sf-petal" transform="rotate(270)"/>
          <ellipse rx="5" ry="10" cy="-10" fill="rgba(255,195,50,0.82)" class="sf-petal" transform="rotate(315)"/>
          <circle r="7.5" fill="rgba(60,35,10,0.92)"/>
          <circle cx="0" cy="-3.5" r="1" fill="rgba(120,70,20,0.7)"/>
          <circle cx="3" cy="1.5" r="1" fill="rgba(120,70,20,0.7)"/>
          <circle cx="-3" cy="1.5" r="1" fill="rgba(120,70,20,0.7)"/>
          <circle cx="1.5" cy="-1" r="0.8" fill="rgba(140,80,25,0.6)"/>
          <circle cx="-1.5" cy="-1" r="0.8" fill="rgba(140,80,25,0.6)"/>
          <circle cx="0" cy="3" r="0.8" fill="rgba(120,70,20,0.6)"/>
          <circle cx="-2" cy="-2" r="1.5" fill="rgba(255,255,200,0.12)"/>
        </g>
      </svg>`;
    },

    _onClick(e) {
      // Disable trail/burst completely in low perf mode
      if (!LOW_PERF_MODE) {
        // Reduced burst overload (3 instead of 4)
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist  = 20 + Math.random() * 50;
          this._spawnTrail(this.targetX, this.targetY, '🌻', Math.cos(angle) * dist, Math.sin(angle) * dist, 0.9, 0.7 + Math.random()*0.5);
        }
      }
      
      this.el.style.transform = `translate3d(${this.targetX - 19}px, ${this.targetY - 19}px, 0)`;
    },

    _spawnTrail(x, y, char, tx, ty, duration, size) {
      const p = this.pool[this.poolIdx];
      this.poolIdx = (this.poolIdx + 1) % this.pool.length;

      // Use opacity instead of display
      p.style.opacity = '0';
      
      // REMOVE animation reset, use class toggle
      p.classList.remove('active');

      // Lightened DOM Work (textContent and removed forced reflow)
      p.textContent = char;
      
      // FIX TRANSFORM CONFLICT
      // Use CSS variables so CSS animation handles translate3d(var(--x), var(--y), 0)
      p.style.setProperty('--x', x + 'px');
      p.style.setProperty('--y', y + 'px');
      
      p.style.fontSize = size + 'rem';
      p.style.setProperty('--tx', tx + 'px');
      p.style.setProperty('--ty', ty + 'px');

      // Use opacity instead of display
      p.style.opacity = '1';
      
      // Set duration var and add class to trigger CSS animation
      p.style.setProperty('--duration', duration + 's');
      p.classList.add('active');
    },

    update() {
      // ALWAYS update cursor every frame to eliminate micro-stutter
      this.el.style.transform = `translate3d(${this.targetX - 19}px, ${this.targetY - 19}px, 0)`;

      // Disable trail completely in low perf mode
      if (!LOW_PERF_MODE) {
        // Reduce trail frequency
        const dist = Math.hypot(this.targetX - this.lastTrailX, this.targetY - this.lastTrailY);
        if (dist > 320) {
          const char = ['🌻','✿','⋆','·'][Math.floor(Math.random() * 4)];
          this._spawnTrail(
            this.targetX + (Math.random()-0.5)*12, 
            this.targetY + (Math.random()-0.5)*12, 
            char, 
            (Math.random()-0.5)*30, 
            -(8 + Math.random()*20), 
            0.85, 
            0.5 + Math.random()*0.45
          );
          this.lastTrailX = this.targetX;
          this.lastTrailY = this.targetY;
        }
      }

      // Store positions
      this.prevX = this.targetX;
      this.prevY = this.targetY;
    }
  };

  global.SunflowerCursor = SunflowerCursor;

})(window);