/* =============================================
   duck-vfx.js — Cinematic Duck Character Engine
   Constant walk speed, lower ground position,
   earlier & glowing emotional text.
   ============================================= */

(function(global) {
  'use strict';

  const c_body = '#fcdb5e';
  const c_wing = '#eab231';
  const c_beak = '#ff8800';
  const c_eye  = '#2a1a08';
  const c_gift = '#e65c5c';
  const c_ribb = '#f2d06b';

  const DuckVFX = {
    canvas: null,
    ctx: null,
    t: 0,
    phase: 'walking', 
    onLanded: null,

    duck: {},
    dust: [],

    init(canvasEl, onLanded) {
      this.canvas  = canvasEl;
      this.ctx     = canvasEl.getContext('2d');
      this.onLanded = onLanded || (() => {});
      this.resize();
      window.addEventListener('resize', () => this.resize());

      this.canvas.addEventListener('click', (e) => {
        if (this.phase !== 'idle') return;
        const pos = this.getPos();
        const dx  = e.clientX - pos.x;
        const dy  = e.clientY - pos.y;
        if (Math.sqrt(dx*dx + dy*dy) <= 130 * pos.scale) {
            this.duck.nodTimer = 1;
        }
      });
    },

    resize() {
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
      if (this.duck) {
        // reposition Y on resize
        this.duck.y = this.canvas.height * 0.68;
        this.duck.targetX = this.canvas.width * 0.5;
      }
    },

    start() {
      this.t = 0;
      this.phase = 'walking';
      
      this.duck = {
        x: -100,
        y: this.canvas.height * 0.68,
        targetX: this.canvas.width * 0.5,
        opacity: 0,
        scale: 0.9,
        
        walkPhase: 0,
        bodyY: 0,
        squishY: 1,
        sitOffset: 0,
        legOpacity: 1,
        wingAngle: 0,
        headTilt: 0,
        giftSwing: 0,
        isBlinking: false,
        textOpacity: 0,
        nodTimer: 0
      };

      this.dust = [];
      this.canvas.style.display = 'block';
    },

    update() {
      this._update();
      this._draw();
    },

    _update() {
      this.t++;
      const d = this.duck;

      if (Math.random() < 0.006) {
          d.isBlinking = true;
          setTimeout(() => d.isBlinking = false, 150);
      }

      if (d.nodTimer > 0) {
          d.nodTimer++;
          if (d.nodTimer < 12) {
              d.headTilt += 0.02;
              d.bodyY += 0.4;
          } else if (d.nodTimer < 30) {
              d.headTilt -= 0.012;
              d.bodyY -= 0.25;
          } else {
              d.nodTimer = 0;
          }
      }

      // --- STATE MACHINE ---
      if (this.phase === 'walking') {
        d.opacity = Math.min(d.opacity + 0.025, 1);
        // CONSTANT SPEED for confident walk
        const speed = 2.4;
        d.x += speed;
        
        // Clamp to target
        if (d.x >= d.targetX) {
          d.x = d.targetX;
          this.phase = 'stopping';
          this.t = 0;
        }
        
        // Walking animation (bob + wing flap)
        d.walkPhase += 0.18;
        d.bodyY = -Math.abs(Math.sin(d.walkPhase)) * 5;
        d.wingAngle = Math.sin(d.walkPhase) * 0.18;
        d.headTilt = Math.sin(d.walkPhase) * 0.06 + 0.05;
        d.giftSwing = Math.sin(d.walkPhase - 0.5) * 0.2;
      } 
      else if (this.phase === 'stopping') {
        d.bodyY += (0 - d.bodyY) * 0.2;
        d.wingAngle += (0 - d.wingAngle) * 0.2;
        d.headTilt += (0.15 - d.headTilt) * 0.1;
        d.giftSwing += (0 - d.giftSwing) * 0.2;

        if (this.t > 12) {
          this.phase = 'sitting';
          this.t = 0;
        }
      } 
      else if (this.phase === 'sitting') {
        const progress = Math.min(this.t / 35, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        d.sitOffset = ease * 12;
        d.bodyY = d.sitOffset;
        d.squishY = 1 - ease * 0.12;
        d.legOpacity = 1 - ease * 1.5;
        d.headTilt = 0.15 - ease * 0.05;

        if (progress >= 1) {
          this.phase = 'idle';
          this.t = 0;
          this.onLanded();
        }
      } 
      else if (this.phase === 'idle') {
        d.squishY = 0.88 + Math.sin(this.t * 0.035) * 0.015;
        d.bodyY = d.sitOffset + Math.sin(this.t * 0.035 + Math.PI) * 1.5;

        // EARLIER AND MORE PROMINENT TEXT
        if (this.t > 10 && d.textOpacity < 1) {
          d.textOpacity += 0.025;
        }
      }
    },

    _draw() {
      const { ctx, canvas, duck: d } = this;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.globalAlpha = d.opacity;
      ctx.translate(d.x, d.y);
      ctx.scale(d.scale, d.scale);

      // Glow Aura
      const grd = ctx.createRadialGradient(0, 0, 10, 0, 0, 80);
      grd.addColorStop(0, 'rgba(212,169,106,0.18)');
      grd.addColorStop(1, 'rgba(212,169,106,0)');
      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Shadow
      ctx.fillStyle = 'rgba(212,169,106,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 32 + d.sitOffset, 28 + d.sitOffset*1.2, 7, 0, 0, Math.PI*2);
      ctx.fill();

      // Legs (only visible when not fully seated)
      if (d.legOpacity > 0.2) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, d.legOpacity);
        ctx.strokeStyle = c_beak;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(5, 20);
        let bkX = 5 + Math.sin(d.walkPhase + Math.PI)*8;
        let bkY = 35 - Math.max(0, Math.cos(d.walkPhase + Math.PI)*10);
        ctx.lineTo(bkX, bkY);
        ctx.lineTo(bkX + 6, bkY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-5, 20);
        let ftX = -5 + Math.sin(d.walkPhase)*8;
        let ftY = 35 - Math.max(0, Math.cos(d.walkPhase)*10);
        ctx.lineTo(ftX, ftY);
        ctx.lineTo(ftX + 6, ftY);
        ctx.stroke();
        ctx.restore();
      }

      // Main Body
      ctx.fillStyle = c_body;
      ctx.beginPath();
      ctx.ellipse(0, d.bodyY, 30, 26 * d.squishY, 0, 0, Math.PI*2);
      ctx.fill();
      
      // Tail
      ctx.beginPath();
      ctx.moveTo(-28, d.bodyY + 5);
      ctx.quadraticCurveTo(-42, d.bodyY - 5, -28, d.bodyY + 14);
      ctx.fill();

      // Wing
      ctx.fillStyle = c_wing;
      ctx.beginPath();
      ctx.ellipse(-3, d.bodyY + 2, 18, 10, d.wingAngle, 0, Math.PI*2);
      ctx.fill();

      // Head System
      ctx.save();
      ctx.translate(18, d.bodyY - 20);
      ctx.rotate(d.headTilt);

      // Head
      ctx.fillStyle = c_body;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI*2);
      ctx.fill();

      // Eye
      ctx.fillStyle = c_eye;
      ctx.beginPath();
      if (d.isBlinking) {
        ctx.ellipse(6, -4, 3, 0.5, 0, 0, Math.PI*2);
      } else {
        ctx.arc(6, -4, 2.8, 0, Math.PI*2);
      }
      ctx.fill();
      if (!d.isBlinking) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(5, -5.5, 0.8, 0, Math.PI*2);
        ctx.fill();
      }

      // Beak
      ctx.fillStyle = c_beak;
      ctx.beginPath();
      ctx.ellipse(16, 2, 11, 4.5, Math.PI*0.08, 0, Math.PI*2);
      ctx.fill();

      // Gift
      ctx.save();
      ctx.translate(24, 5);
      ctx.rotate(d.giftSwing);
      
      ctx.fillStyle = c_gift;
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = c_ribb;
      ctx.fillRect(-2, -7, 4, 14);
      ctx.fillRect(-7, -2, 14, 4);
      
      ctx.beginPath();
      ctx.ellipse(-3.5, -8, 4, 3, -0.4, 0, Math.PI*2);
      ctx.ellipse(3.5, -8, 4, 3, 0.4, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      ctx.restore(); // end head

      // EMOTIONAL TEXT — bigger, glowing, earlier
      if (d.textOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = d.textOpacity;
        ctx.font = 'italic 600 34px "Cormorant Garamond", Georgia, serif';
        ctx.fillStyle = '#e6c27a';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(212,169,106,0.6)';
        
        const floatY = Math.sin(this.t * 0.05) * 4;
        ctx.fillText('hey vru, take this', 0, -65 + floatY);
        ctx.restore();
      }

      ctx.restore(); // end global duck transform
    },

    stop() {
      // Intentionally left blank as DuckVFX no longer manages its own RAF.
    },

    getPos() {
      return { x: this.duck.x, y: this.duck.y, scale: this.duck.scale };
    },
  };

  global.DuckVFX = DuckVFX;

})(window);