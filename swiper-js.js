(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.Swiper = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const Utils = {
    renderFrame: function (callback) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          callback();
        });
      });
    }
  };

  class Swiper {
    constructor(options) {
      let that = this;

      that.classes = {
        container: 'swiper',
        track: 'swiper-track',
        item: 'swiper-item',
        nav: 'swiper-nav',
        btn: 'swiper-btn',
        btnPrev: 'swiper-prev',
        btnNext: 'swiper-next'
      };

      that.defaults = {
        height: 500,
        startIndex: 0,
        nav: true,
        navText: [ 'Prev', 'Next' ],
        changeDelay: 0,
        afterChangeDelay: 0,
        autoHeight: false,
        autoplay: false,
        autoplayTimeout: 3000,
        onInit: function () {

        },
        beforeChange: function () {

        },
        afterChange: function (swiper) {

        }
      };

      that.options = {};
      that.calculation = {};
      that.slider = options.el;
      that.track = null;
      that.nav = null;
      that.slides = null;
      that.slidesCount = null;
      that.currentSlide = null;
      that.changing = false;
      that.autoplayTimerId = null;

      if ( ! that.slider) {
        return;
      }

      that.init(options);
    }

    init(options) {
      let that = this;

      that._initOptions(options);
      that._initHtml();
      that._calculateHeight();
      that.initSlides();
      that.initEvents();
      that.setCurrentSlide(false);

      if (that.options.autoplay) {
        that._startAutoplayTimer();
      }

      that.options.onInit.call(that);
    }

    _initOptions(options) {
      let that = this;

      Object.assign(that.options, that.defaults, options);
    }

    _initHtml() {
      let that = this;

      that.slider.classList.add(that.classes.container);
      that.slider.style.display = 'none';

      let html = '<div class="' + that.classes.track + '" style="position:relative;">';

      let children = that.slider.children;

      for (let i = 0; i < children.length; i++) {
        html += '<div class="' + that.classes.item + '" style="position:absolute; left:0; top:0; width:100%; height:100%;">' + children[i].outerHTML + '</div>';
      }

      html += '</div>';

      if (that.options.nav) {
        html += '<div class="' + that.classes.nav + (children.length <= 1 ? ' disabled' : '') + '">';
        html += '<button class="' + that.classes.btn + ' ' + that.classes.btnPrev + '">' + that.options.navText[0] + '</button>';
        html += '<button class="' + that.classes.btn + ' ' + that.classes.btnNext + '">' + that.options.navText[1] + '</button>';
        html += '</div>';
      }

      that.slider.innerHTML = html;
      that.track = that.slider.querySelector('.' + that.classes.track);

      if (that.options.autoHeight) {
        that.track.style.transition = 'height ease-in .5s';
      }

      that.slider.style.display = 'block';
    }

    initSlides() {
      let that = this;

      that.slides = that.track.querySelectorAll('.' + that.classes.item);

      that.calculation.height = [];

      for (let i = 0; i < that.slides.length; i++) {
        that.calculation.height[i] = window.getComputedStyle(that.slides[i].children[0]).height;
      }

      that.slidesCount = that.slides.length;
      that.currentSlide = that.options.startIndex;
    }

    initEvents() {
      let that = this;

      if (that.options.nav) {

        that.nav = that.slider.querySelector('.' + that.classes.nav);

        that.nav.children[0].onclick = function (event) {
          that.changeSlide({
            message: 'prev'
          });
        };

        that.nav.children[1].onclick = function (event) {
          that.changeSlide({
            message: 'next'
          });
        };

      }

      window.addEventListener('resize', function () {
        that._calculateHeight();
      });
    }

    _startAutoplayTimer() {
      if (this.autoplayTimerId) {
        clearInterval(this.autoplayTimerId);
      }

      this.autoplayTimerId = setInterval(() => {

        this.changeSlide({
          message: 'next'
        });

      }, this.options.autoplayTimeout);
    }

    _calculateHeight() {
      let height;

      if (typeof this.options.height === 'object') {
        for (let media in this.options.height) {
          if (this.options.height.hasOwnProperty(media)) {
            if (window.innerWidth >= parseInt(media)) {
              height = this.options.height[media];
            }
          }
        }
      }
      else {
        height = this.options.height;
      }

      this.track.style.height = typeof height === 'number' ? height + 'px' : height;
    }

    updateAfterDrag(dragType) {
      let that = this;

      const movement = that.drag.endX - that.drag.startX;
      const movementDistance = Math.abs(movement);
      const threshold =
        dragType === 'mouse' ? 300 :
        dragType === 'touch' ?
        parseInt(window.innerWidth * 0.3) :
        0;

      if (movement > 0 && movementDistance > threshold) {
        that.changeSlide({
          message: 'prev'
        });
      }
      else if (movement < 0 && movementDistance > threshold) {
        that.changeSlide({
          message: 'next'
        });
      }
    }

    changeSlide(data) {
      let that = this;

      if (that.slides.length <= 1) {
        return;
      }

      if (that.changing) {
        return;
      }

      that.prevSlide = that.slides[that.currentSlide];
      if (data['message'] === 'next') {

        if (that.currentSlide + 1 >= that.slidesCount) {
          that.currentSlide = 0;
        }
        else {
          that.currentSlide++;
        }

      }
      else if (data['message'] === 'prev') {

        if (that.currentSlide - 1 < 0) {
          that.currentSlide = that.slidesCount - 1;
        }
        else {
          that.currentSlide--;
        }

      }

      if (that.options.autoplay) {
        that._startAutoplayTimer();
      }

      that.setCurrentSlide();
    }

    /**
     * @public
     *
     * Показывает следующий слайд
     * Для использования из вне
     */
    next() {
      this.changeSlide({
        message: 'next'
      });
    }

    /**
     * @public
     *
     * Показывает предыдущий слайд
     * Для использования из вне
     */
    prev() {
      this.changeSlide({
        message: 'prev'
      });
    }

    /**
     * @public
     *
     * Показывает слайд по индексу
     * Для использования из вне
     */
    slideTo(index) {
      if (this.changing) {
        return;
      }

      if (index >= this.slidesCount || index < 0) {
        return;
      }

      this.prevSlide = this.slides[this.currentSlide];
      this.currentSlide = parseInt(index);
      this.setCurrentSlide();
    }

    setCurrentSlide(animation) {
      let that = this;

      that.changing = true;

      if (typeof animation === 'undefined') {
        animation = true;
      }

      if (that.prevSlide) {
        that._setSlideZIndex(that.prevSlide, 5);
        that.prevSlide.classList.remove('active');
        that.prevSlide.classList.add('changing');
      }

      that.slides.forEach(function (slide, index) {

        if (index === that.currentSlide) {

          if (animation && that.options.changeDelay > 0) {
            setTimeout(function () {
              that._setSlideActive(slide);
            }, that.options.changeDelay);
          }
          else {
            that._setSlideActive(slide);
          }

        }
        else if (slide !== that.prevSlide) {
          that._setSlideInactive(slide);
        }

      });
    }

    _setSlideActive(slide) {
      this._redraw(() => {
        slide.style.zIndex = 10;

        if (this.options.autoHeight) {
          this.track.style.height = this.calculation.height[this.currentSlide];
        }
      });

      this._redraw(() => {
        slide.classList.add('active');

        if (this.options.afterChangeDelay) {
          setTimeout(() => {
            this.changing = false;

          }, this.options.afterChangeDelay);
        }
        else {
          this.changing = false;
        }

        this.options.afterChange(this);

        if (this.prevSlide) {
          this.prevSlide.classList.remove('changing');
          this._setSlideInactive(this.prevSlide);
        }
      });
    }

    _setSlideInactive(slide) {
      this._setSlideZIndex(slide, 1);
    }

    _setSlideZIndex(slide, zIndex, callback) {
      Utils.renderFrame(() => {
        slide.style.zIndex = zIndex;

        if (typeof callback === 'function') {
          callback.call();
        }
      });
    }

    _redraw(callback, delay) {
      let draw = function () {
        Utils.renderFrame(callback);
      };

      if (delay) {
        setTimeout(draw, delay);
      }
      else {
        draw();
      }
    }
  }

  return Swiper;
}));