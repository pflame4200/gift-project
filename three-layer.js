/* =============================================
   three-layer.js — 3D Cinematic Depth Engine
   Lightweight perspective system with smooth
   mouse-based camera movement.
   NO external libraries. Pure CSS 3D transforms.
   ============================================= */

(function(global) {
  'use strict';

  const ThreeLayer = {
    wrapper: null,
    enabled: true,

    // Current rotation values (interpolated)
    currentRotX: 0,
    currentRotY: 0,

    // Target rotation values (from mouse)
    targetRotX: 0,
    targetRotY: 0,

    // Lerp smoothing factor (lower = smoother/slower)
    lerpFactor: 0.12,

    // Intensity multipliers (adjust depth strength)
    intensityX: 14.0,  // Vertical tilt intensity
    intensityY: 14.0,  // Horizontal tilt intensity

    // Perspective distance (px)
    perspective: 1200,

    init(wrapperElement) {
      this.wrapper = wrapperElement;
      
      // Disable completely in low performance mode
      if (typeof LOW_PERF_MODE !== 'undefined' && LOW_PERF_MODE) {
        this.enabled = false;
        return;
      }

      // Apply perspective to wrapper
      this.wrapper.style.perspective = this.perspective + 'px';
      this.wrapper.style.transformStyle = 'preserve-3d';

      // Listen to mouse movement
      document.addEventListener('mousemove', (e) => this._onMouseMove(e), { passive: true });
    },

    _onMouseMove(e) {
      if (!this.enabled) return;

      // Normalize mouse position to -0.5 to 0.5 range
      const normalizedX = (e.clientX / window.innerWidth) - 0.5;
      const normalizedY = (e.clientY / window.innerHeight) - 0.5;

      // Calculate target rotation (inverted for natural feel)
      // Mouse right = rotate right, mouse down = rotate down
      this.targetRotX = -normalizedY * this.intensityX;
      this.targetRotY = normalizedX * this.intensityY;
    },

    update() {
      if (typeof LOW_PERF_MODE !== 'undefined' && LOW_PERF_MODE) return;
      if (!this.enabled || !this.wrapper) return;

      // Calculate interpolation deltas
      const deltaX = this.targetRotX - this.currentRotX;
      const deltaY = this.targetRotY - this.currentRotY;

      // Skip DOM write if change is negligible (performance optimization)
      if (Math.abs(deltaX) < 0.005 && Math.abs(deltaY) < 0.005) {
        return;
      }

      // Smooth interpolation (lerp)
      this.currentRotX += deltaX * this.lerpFactor;
      this.currentRotY += deltaY * this.lerpFactor;

      // Apply 3D transform
      this.wrapper.style.transform = 
        `perspective(${this.perspective}px) ` +
        `rotateX(${this.currentRotX}deg) ` +
        `rotateY(${this.currentRotY}deg)`;
    },

    // Reset to neutral position (for transitions)
    reset(animated = true) {
      if (!this.enabled) return;

      this.targetRotX = 0;
      this.targetRotY = 0;

      if (!animated) {
        this.currentRotX = 0;
        this.currentRotY = 0;
        if (this.wrapper) {
          this.wrapper.style.transform = 
            `perspective(${this.perspective}px) rotateX(0deg) rotateY(0deg)`;
        }
      }
    },

    // Disable/enable at runtime
    setEnabled(enabled) {
      this.enabled = enabled;
      if (!enabled && this.wrapper) {
        this.wrapper.style.transform = '';
      }
    }
  };

  global.ThreeLayer = ThreeLayer;

})(window);
