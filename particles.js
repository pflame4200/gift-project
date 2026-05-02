/* =============================================
   particles.js — Ambient Petal & Sparkle Engine
   Floating petals, golden rares, click bursts,
   bloom overlay bursts. (Performance Optimized)
   ============================================= */

(function(global) {
  'use strict';

  const MAX_PARTICLES = 28; // PERF FIX: Reduced from 45

  const Particles = {
    canvas: null,
    ctx:    null,
    list:   [],
    mouseX: 0,
    mouseY: 0,
    overlay: null,

    CHARS: ['🌸','🌺','🌷','✿','❀'],
    GOLD:  '✨',

    init(canvasEl, overlayEl) {
      this.canvas  = canvasEl;
      this.ctx     = canvasEl.getContext('2d');
      this.overlay = overlayEl;
      this.resize();
      window.addEventListener('resize', () => this.resize());
      document.addEventListener('mousemove', e => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      });
      document.addEventListener('click', e => {
        this.burst(e.clientX, e.clientY, 5);
      });
      // Seed initial particles spread top to bottom for immediate rain
      for (let i = 0; i < 12; i++) {
        const p = this._spawn(Math.random() * this.canvas.height);
        this.list.push(p);
      }
    },

    resize() {
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    _spawn(startY) {
      const isGold = Math.random() < 0.05;
      const size = isGold ? (2.5 + Math.random()*1.5) : (1.0 + Math.random()*1.8);
      return {
        x:        Math.random() * this.canvas.width,
        y:        startY !== undefined ? startY : -10,   // spawn at TOP
        vx:       (Math.random()-0.5) * 0.8,
        vy:       1.8 + Math.random() * 2.5,             // fall DOWN, rain speed
        alpha:    isGold ? 0.9 : (0.35 + Math.random()*0.45),
        size:     size,
        font:     (size * 5) + 'px serif',
        char:     isGold ? this.GOLD : this.CHARS[Math.floor(Math.random()*this.CHARS.length)],
        rot:      Math.random() * Math.PI * 2,
        rotSpeed: (Math.random()-0.5) * 0.03,
        life:     1,
      };
    },

    update() {
      const { ctx, canvas } = this;
      
      // Reset transform before clearing to ensure the whole canvas clears properly
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // PERF FIX: Reduced spawn rate from 0.09 to 0.05
      if (Math.random() < 0.05 && this.list.length < MAX_PARTICLES) this.list.push(this._spawn());

      // Remove particles that have exited the bottom via reverse loop
      for (let i = this.list.length - 1; i >= 0; i--) {
        if (this.list[i].y > canvas.height + 40) {
          this.list.splice(i, 1);
        }
      }

      if (this.list.length > MAX_PARTICLES) this.list.splice(0, this.list.length - MAX_PARTICLES);

      this.list.forEach(p => {
        // Gentle horizontal drift
        p.x += p.vx + Math.sin(p.rot) * 0.2;
        p.y += p.vy;
        p.rot += p.rotSpeed;

        ctx.globalAlpha = p.alpha;
        ctx.font        = p.font;
        // PERF FIX: Removed heavy rotation calculations, set simple transform
        ctx.setTransform(1, 0, 0, 1, p.x, p.y);
        ctx.fillText(p.char, 0, 0);
      });
    },

    // Click burst on the overlay
    burst(x, y, count) {
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'bloom-particle';
        el.textContent = this.CHARS[Math.floor(Math.random()*this.CHARS.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist  = 40 + Math.random() * 100;
        el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        el.style.setProperty('--rot', (Math.random()-0.5)*360 + 'deg');
        el.style.left             = x + 'px';
        el.style.top              = y + 'px';
        el.style.fontSize         = (0.6 + Math.random()*0.7) + 'rem';
        el.style.animationDuration= (1.0 + Math.random()*0.8) + 's';
        this.overlay.appendChild(el);
        setTimeout(() => el.remove(), 2000);
      }
    },

    // Grand burst for special moments
    grandBurst(x, y) {
      for (let i = 0; i < 45; i++) {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'bloom-particle';
          el.textContent = Math.random() > 0.3
            ? this.CHARS[Math.floor(Math.random()*this.CHARS.length)]
            : this.GOLD;
          const angle = Math.random() * Math.PI * 2;
          const dist  = 80 + Math.random() * 260;
          el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
          el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
          el.style.setProperty('--rot', (Math.random()-0.5)*720 + 'deg');
          el.style.left     = x + 'px';
          el.style.top      = y + 'px';
          el.style.fontSize = (0.8 + Math.random()*1.4) + 'rem';
          this.overlay.appendChild(el);
          setTimeout(() => el.remove(), 2200);
        }, i * 28);
      }
      // Sparkles
      for (let i = 0; i < 55; i++) {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'sparkle';
          const angle = Math.random() * Math.PI * 2;
          const dist  = 40 + Math.random() * 220;
          el.style.setProperty('--dx', Math.cos(angle)*dist + 'px');
          el.style.setProperty('--dy', Math.sin(angle)*dist + 'px');
          el.style.left       = (x + (Math.random()-0.5)*20) + 'px';
          el.style.top        = (y + (Math.random()-0.5)*20) + 'px';
          el.style.background = Math.random()>0.5
            ? 'rgba(212,169,106,0.9)' : 'rgba(255,240,200,0.9)';
          document.body.appendChild(el);
          setTimeout(() => el.remove(), 1500);
        }, i * 20);
      }
    },
  };

  global.Particles = Particles;

})(window);