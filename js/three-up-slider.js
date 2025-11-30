/* ThreeUpSlider
   - Shows 3 slides side-by-side, with a peek of the next slide
   - Buttons at top-right, white square with black arrow (SVG)
   - Responsive: recalculates sizes on resize
   - Basic touch/swipe support
*/
(function(){
  class ThreeUpSlider {
    constructor(root){
      this.root = typeof root === 'string' ? document.querySelector(root) : root;
      if(!this.root) return;

      this.view = this.root.querySelector('.slider-view');
      this.track = this.root.querySelector('.slider-track');
      this.prevBtn = this.root.querySelector('.slider-btn.prev');
      this.nextBtn = this.root.querySelector('.slider-btn.next');

      this.visible = 3;
      this.peek = 80; // px visible of the 4th slide
      this.gap = 16; // must match CSS gap

      this.onResize = this.onResize.bind(this);
      this.onPrev = this.onPrev.bind(this);
      this.onNext = this.onNext.bind(this);
      this.onTouchStart = this.onTouchStart.bind(this);
      this.onTouchMove = this.onTouchMove.bind(this);
      this.onTouchEnd = this.onTouchEnd.bind(this);
      this.onTransitionEnd = this.onTransitionEnd.bind(this);

      this.init();
    }

    init(){
      if(!this.track) return;

      // original slides
      const original = Array.from(this.track.querySelectorAll('.slide'));
      this.N = original.length;
      if(this.N === 0) return;

      // clones for seamless looping
      this.cloneCount = this.visible;
      // prepend clones (last cloneCount)
      const prepend = original.slice(-this.cloneCount).map(n => n.cloneNode(true));
      prepend.forEach(n => { n.classList.add('clone'); this.track.insertBefore(n, this.track.firstChild); });
      // append clones (first cloneCount)
      const append = original.slice(0, this.cloneCount).map(n => n.cloneNode(true));
      append.forEach(n => { n.classList.add('clone'); this.track.appendChild(n); });

      // refresh slides array
      this.slides = Array.from(this.track.querySelectorAll('.slide'));
      this.total = this.slides.length; // N + 2*cloneCount

      // start index at first real slide
      this.index = this.cloneCount;

      // listeners
      window.addEventListener('resize', this.onResize);
      if(this.prevBtn) this.prevBtn.addEventListener('click', this.onPrev);
      if(this.nextBtn) this.nextBtn.addEventListener('click', this.onNext);
      this.track.addEventListener('touchstart', this.onTouchStart, { passive: true });
      this.track.addEventListener('touchmove', this.onTouchMove, { passive: false });
      this.track.addEventListener('touchend', this.onTouchEnd);
      this.track.addEventListener('transitionend', this.onTransitionEnd);

      this.startX = 0; this.currentX = 0; this.dragging = false;

      this.updateSizes();
      this.updateControls();
    }

    updateSizes(){
      const containerWidth = this.view.clientWidth;
      const totalGap = this.gap * (this.visible - 1);
      const usable = containerWidth - this.peek - totalGap;
      this.slideWidth = Math.max(120, Math.floor(usable / this.visible));

      // set widths for all slides (including clones)
      this.slides.forEach(slide => { slide.style.width = this.slideWidth + 'px'; });

      this.track.style.paddingRight = this.peek + 'px';
      this.step = this.slideWidth + this.gap;

      // position to current index
      this.jumpToIndex(this.index, false);
    }

    onResize(){ this.updateSizes(); }

    onPrev(){ this.slideTo(this.index - 1); }
    onNext(){ this.slideTo(this.index + 1); }

    slideTo(newIndex){
      this.index = newIndex;
      this.track.style.transition = '';
      const offset = -this.index * this.step;
      this.track.style.transform = `translateX(${offset}px)`;
    }

    jumpToIndex(newIndex, animate = true){
      if(!animate) this.track.style.transition = 'none';
      else this.track.style.transition = '';
      this.index = newIndex;
      const offset = -this.index * this.step;
      this.track.style.transform = `translateX(${offset}px)`;
      if(!animate) setTimeout(()=>{ this.track.style.transition = ''; }, 20);
    }

    onTransitionEnd(){
      // if we've moved into clones, jump to the corresponding real slide without animation
      if(this.index >= this.cloneCount + this.N){
        // moved right into appended clones
        this.index = this.index - this.N;
        this.jumpToIndex(this.index, false);
      } else if(this.index < this.cloneCount){
        // moved left into prepended clones
        this.index = this.index + this.N;
        this.jumpToIndex(this.index, false);
      }
      // controls remain enabled in infinite mode
      this.updateControls();
    }

    updateControls(){
      // Infinite loop: buttons always enabled (but reflect disabled state briefly if no movement possible)
      if(this.prevBtn) this.prevBtn.disabled = false;
      if(this.nextBtn) this.nextBtn.disabled = false;
    }

    onTouchStart(e){
      this.dragging = true;
      this.startX = (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      this.currentX = this.startX;
      this.track.style.transition = 'none';
    }

    onTouchMove(e){
      if(!this.dragging) return;
      const x = (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      const moved = x - this.startX;
      if(Math.abs(moved) > 10) e.preventDefault();
      const base = -this.index * this.step;
      this.track.style.transform = `translateX(${base + moved}px)`;
      this.currentX = x;
    }

    onTouchEnd(){
      if(!this.dragging) return;
      this.dragging = false;
      const moved = this.currentX - this.startX;
      const threshold = Math.min(80, this.slideWidth * 0.25);
      if(moved > threshold) this.slideTo(this.index - 1);
      else if(moved < -threshold) this.slideTo(this.index + 1);
      else this.slideTo(this.index); // snap back
    }
  }

  // auto-init
  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('.three-up-slider').forEach(el=> new ThreeUpSlider(el));
  });

  window.ThreeUpSlider = ThreeUpSlider;
})();
