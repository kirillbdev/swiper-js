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

  class Swiper
  {
    constructor(options)
    {
      let _ = this;

      _.classes = {
        container: 'swiper',
        track: 'swiper-track',
        item: 'swiper-item',
        nav: 'swiper-nav',
        btn: 'swiper-btn',
        btnPrev: 'swiper-prev',
        btnNext: 'swiper-next'
      };

      _.defaults = {
        height: 500,
        startIndex: 0,
        nav: true,
        navText: [ 'Prev', 'Next' ],
        changeDelay: 0,
        afterChangeDelay: 0,
        autoHeight: false,
        autoplay: false,
        autoplayTimeout: 3000,
        mouseDrag: false,
        touchDrag: false,
        onInit: function () {

        },
        beforeChange: function () {

        },
        afterChange: function (swiper) {

        }
      };

      _.options = {};
      _.calculation = {};
      _.slider = options.el;
      _.track = null;
      _.nav = null;
      _.slides = null;
      _.slidesCount = null;
      _.currentSlide = null;
      _.changing = false;

      _.mouseDown = false;
      _.touchStart = false;
      _.drag = {
        startX: 0,
        endX: 0
      };

      if ( ! _.slider) {
        return;
      }

      _.init(options);
    }

    init(options)
    {
      let _ = this;

      _._initOptions(options);
      _._initHtml();
      _.initSlides();
      _.initEvents();
      _.setCurrentSlide(false);

      if (_.options.autoplay) {

        setInterval(() => {

          _.changeSlide({
            message: 'next'
          });

        }, _.options.autoplayTimeout);

      }

      _.options.onInit.call(_);
    }

    _initOptions(options)
    {
      let _ = this;

      Object.assign(_.options, _.defaults, options);
    }

    _initHtml()
    {
      let _ = this;

      _.slider.classList.add(_.classes.container);
      _.slider.style.display = 'none';

      let html = '<div class="' + _.classes.track + '"' + ( ! _.options.autoHeight ? ' style="position:relative; height:' + _.options.height + 'px;"' : '') + '>';

      let children = _.slider.children;

      for (let i = 0; i < children.length; i++) {
        html += '<div class="' + _.classes.item + '" style="position:absolute; left:0; top:0; width:100%; height:100%;">' + children[i].outerHTML + '</div>';
      }

      html += '</div>';

      if (_.options.nav) {
        html += '<div class="' + _.classes.nav + (children.length <= 1 ? ' disabled' : '') + '">';
        html += '<button class="' + _.classes.btn + ' ' + _.classes.btnPrev + '">' + _.options.navText[0] + '</button>';
        html += '<button class="' + _.classes.btn + ' ' + _.classes.btnNext + '">' + _.options.navText[1] + '</button>';
        html += '</div>';
      }

      _.slider.innerHTML = html;
      _.track = _.slider.querySelector('.' + _.classes.track);

      if (_.options.autoHeight) {
        _.track.style.transition = 'height ease-in .5s';
      }

      _.slider.style.display = 'block';
    }

    initSlides()
    {
      let _ = this;

      _.slides = _.track.querySelectorAll('.' + _.classes.item);

      _.calculation.height = [];

      for (let i = 0; i < _.slides.length; i++) {
        _.calculation.height[i] = window.getComputedStyle(_.slides[i].children[0]).height;
      }

      _.slidesCount = _.slides.length;
      _.currentSlide = _.options.startIndex;
    }

    initEvents()
    {
      let _ = this;

      if (_.options.nav) {

        _.nav = _.slider.querySelector('.' + _.classes.nav);

        _.nav.children[0].onclick = function (event) {
          _.changeSlide({
            message: 'prev'
          });
        };

        _.nav.children[1].onclick = function (event) {
          _.changeSlide({
            message: 'next'
          });
        };

      }

      _._initMouseDragEvents();
      _._initTouchDragEvents();
    }

    _initMouseDragEvents()
    {
      let that = this;

      if ( ! that.options.mouseDrag) {
        return;
      }

      that.slider.addEventListener('mousedown', function (event) {
        that.mouseDown = true;
        that.drag.startX = event.clientX;
        document.body.style.cursor = 'grab';
      });

      that.slider.addEventListener('mouseup', function (event) {
        that.mouseDown = false;
        that.drag.endX = event.clientX;
        document.body.style.cursor = 'default';

        that.updateAfterDrag('mouse');
      });
    }

    _initTouchDragEvents()
    {
      let that = this;

      if ( ! that.options.touchDrag) {
        return;
      }

      that.slider.addEventListener('touchstart', function (event) {
        if (event.changedTouches.length > 1) {
          return;
        }

        that.touchStart = true;
        that.drag.startX = event.changedTouches[0].clientX;
      });

      that.slider.addEventListener('touchend', function (event) {
        if (that.touchStart) {
          that.touchStart = false;
          that.drag.endX = event.changedTouches[0].clientX;

          that.updateAfterDrag('touch');
        }
      });
    }

    updateAfterDrag(dragType)
    {
      let that = this;

      const movement = that.drag.endX - that.drag.startX;
      const movementDistance = Math.abs(movement);
      const threshold =
        dragType == 'mouse' ? 300 :
        dragType == 'touch' ?
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

    changeSlide(data)
    {
      let _ = this;

      if (_.slides.length <= 1) {
        return;
      }

      if (_.changing) {
        return;
      }

      _.prevSlide = _.slides[_.currentSlide];
      if (data['message'] == 'next') {

        if (_.currentSlide + 1 >= _.slidesCount) {
          _.currentSlide = 0;
        }
        else {
          _.currentSlide++;
        }

      }
      else if (data['message'] == 'prev') {

        if (_.currentSlide - 1 < 0) {
          _.currentSlide = _.slidesCount - 1;
        }
        else {
          _.currentSlide--;
        }

      }

      _.setCurrentSlide();
    }

    /**
     * @public
     *
     * Показывает следующий слайд
     * Для использования из вне
     */
    next()
    {
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
    prev()
    {
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
    slideTo(index)
    {
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

    setCurrentSlide(animation)
    {
      let _ = this;

      _.changing = true;

      if (typeof animation === 'undefined') {
        animation = true;
      }

      if (_.prevSlide) {
        _._setSlideZIndex(_.prevSlide, 5);
        _.prevSlide.classList.remove('active');
        _.prevSlide.classList.add('changing');
      }

      _.slides.forEach(function (slide, index) {

        if (index === _.currentSlide) {

          if (animation && _.options.changeDelay > 0) {
            setTimeout(function () {
              _._setSlideActive(slide);
            }, _.options.changeDelay);
          }
          else {
            _._setSlideActive(slide);
          }

        }
        else if (slide !== _.prevSlide) {
          _._setSlideInactive(slide);
        }

      });
    }

    _setSlideActive(slide)
    {
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

    _setSlideInactive(slide)
    {
      this._setSlideZIndex(slide, 1);
    }

    _setSlideZIndex(slide, zIndex, callback)
    {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
      slide.style.zIndex = zIndex;

      if (typeof callback === 'function') {
        callback.call();
      }

    });
    });
    }

    _redraw(callback, delay)
    {

      let draw = function () {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
          callback.call();
        });
      });
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