/**
 * Constructor function.
 */
class StatusBar extends H5P.EventDispatcher {
  constructor(contentId, totalChapters, parent, params, styleClassName) {
    super();
    this.id = contentId;
    this.parent = parent;

    this.params = params || {};

    this.params.l10n = params.l10n;

    this.params.a11y = Object.assign({
      progress: 'Page @page of @total',
      menu: 'Toggle navigation menu',
    }, this.params.a11y || {});

    this.totalChapters = totalChapters;
    this.arrows = this.addArrows();

    /**
     * Top row initializer
     */
    this.progressBar = this.createProgressBar();
    this.progressIndicator = this.createProgressIndicator();
    this.chapterTitle = this.createChapterTitle();
    this.menuToggleButton = this.createMenuToggleButton();

    const wrapperInfo = document.createElement('div');
    wrapperInfo.classList.add('h5p-interactive-book-status');

    if (this.params.displayToTopButton) {
      wrapperInfo.appendChild(this.createToTopButton());
    }

    if (this.params.displayFullScreenButton && H5P.fullscreenSupported) {
      wrapperInfo.appendChild(this.createFullScreenButton());
    }

    wrapperInfo.appendChild(this.arrows.buttonWrapperNext);
    wrapperInfo.appendChild(this.arrows.buttonWrapperPrevious);

    if (this.params.displayMenuToggleButton) {
      wrapperInfo.appendChild(this.menuToggleButton);
    }

    wrapperInfo.appendChild(this.progressIndicator.wrapper);

    wrapperInfo.appendChild(this.chapterTitle.wrapper);

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add(styleClassName);
    this.wrapper.setAttribute('tabindex', '-1');
    this.wrapper.appendChild(this.progressBar.wrapper);
    this.wrapper.appendChild(wrapperInfo);

    this.on('updateStatusBar', this.updateStatusBar);

    /**
     * Sequential traversal of chapters
     * Event should be either 'next' or 'prev'
     */
    this.on('seqChapter', (event) => {
      const eventInput = {
        h5pbookid: this.parent.contentId
      };
      if (event.data.toTop) {
        eventInput.section = 'top';
      }

      if (event.data.direction === 'next') {
        if (this.parent.activeChapter + 1 < this.parent.chapters.length) {
          eventInput.chapter = `h5p-interactive-book-chapter-${this.parent.chapters[this.parent.activeChapter+1].instance.subContentId}`;
        }
        else if (this.parent.hasSummary() && this.parent.activeChapter + 1 === this.parent.chapters.length) {
          this.parent.trigger('viewSummary', eventInput);
        }
      }
      else if (event.data.direction === 'prev') {
        if (this.parent.activeChapter > 0) {
          eventInput.chapter = `h5p-interactive-book-chapter-${this.parent.chapters[this.parent.activeChapter-1].instance.subContentId}`;
        }
      }
      if (eventInput.chapter) {
        this.parent.trigger('newChapter', eventInput);
      }
    });
  }

  /**
   * Update progress bar.
   *
   * @param {number} chapterId Chapter Id.
   */
  updateProgressBar(chapter) {
    const barWidth = `${chapter / this.totalChapters * 100}%`;

    this.progressBar.progress.style.width = barWidth;
    const title = this.params.a11y.progress
      .replace('@page', chapter)
      .replace('@total', this.totalChapters);
    this.progressBar.progress.title = title;
  }

  /**
   * Update aria label of progress text
   * @param {number} chapterId Index of chapter
   */
  updateA11yProgress(chapterId) {
    this.progressIndicator.hiddenButRead.innerHTML = this.params.a11y.progress
      .replace('@page', chapterId)
      .replace('@total', this.totalChapters);
  }

  /**
   * Update status bar.
   */
  updateStatusBar() {
    const currentChapter = this.parent.getActiveChapter() + 1;

    const chapterTitle = this.parent.chapters[currentChapter - 1].title;

    this.progressIndicator.current.innerHTML = currentChapter;

    this.updateA11yProgress(currentChapter);
    this.updateProgressBar(currentChapter);

    this.chapterTitle.text.innerHTML = chapterTitle;

    this.chapterTitle.text.setAttribute('title', chapterTitle);

    //assure that the buttons are valid in terms of chapter edges
    if (this.parent.activeChapter <= 0) {
      this.setButtonStatus('Previous', true);
    }
    else {
      this.setButtonStatus('Previous', false);
    }

    const nextChapterIsRestricted = this.parent.chapters[this.parent.activeChapter + 1]?.isAccessRestricted;
    if ((this.parent.activeChapter + 1) >= this.totalChapters || nextChapterIsRestricted) {
      this.setButtonStatus('Next', true);
    }
    else {
      this.setButtonStatus('Next', false);
    }
  }

  /**
   * Add traversal buttons for sequential travel (next and previous chapter)
   */
  addArrows() {
    const acm = {};

    // Initialize elements
    acm.buttonPrevious = document.createElement('div');
    acm.buttonPrevious.classList.add('navigation-button', 'icon-previous');
    acm.buttonPrevious.setAttribute('title', this.params.l10n.previousPage);

    acm.buttonWrapperPrevious = document.createElement('button');
    acm.buttonWrapperPrevious.classList.add('h5p-interactive-book-status-arrow', 'h5p-interactive-book-status-button', 'previous');
    acm.buttonWrapperPrevious.setAttribute('aria-label', this.params.l10n.previousPage);
    acm.buttonWrapperPrevious.onclick = () => {
      this.trigger('seqChapter', {
        direction:'prev',
        toTop: true
      });
    };
    acm.buttonWrapperPrevious.appendChild(acm.buttonPrevious);

    acm.buttonNext = document.createElement('div');
    acm.buttonNext.classList.add('navigation-button', 'icon-next');
    acm.buttonNext.setAttribute('title', this.params.l10n.nextPage);

    acm.buttonWrapperNext = document.createElement('button');
    acm.buttonWrapperNext.classList.add('h5p-interactive-book-status-arrow', 'h5p-interactive-book-status-button', 'next');
    acm.buttonWrapperNext.setAttribute('aria-label', this.params.l10n.nextPage);
    acm.buttonWrapperNext.onclick = () => {
      this.trigger('seqChapter', {
        direction:'next',
        toTop: true
      });
    };
    acm.buttonWrapperNext.appendChild(acm.buttonNext);

    return acm;
  }

  /**
   * Add a menu button which hides and shows the navigation bar.
   *
   * @return {HTMLElement} Button node.
   */
  createMenuToggleButton() {
    const button = document.createElement('a');
    button.classList.add('icon-menu');

    const buttonWrapperMenu = document.createElement('button');
    buttonWrapperMenu.classList.add('h5p-interactive-book-status-menu');
    buttonWrapperMenu.classList.add('h5p-interactive-book-status-button');
    buttonWrapperMenu.setAttribute('aria-label', this.params.a11y.menu);
    buttonWrapperMenu.setAttribute('aria-expanded', 'false');
    buttonWrapperMenu.setAttribute('aria-controls', 'h5p-interactive-book-navigation-menu');
    buttonWrapperMenu.onclick = () => {
      this.parent.trigger('toggleMenu');
    };

    buttonWrapperMenu.appendChild(button);
    return buttonWrapperMenu;
  }

  /**
   * Check if menu is active/open
   *
   * @return {boolean}
   */
  isMenuOpen() {
    return this.menuToggleButton.classList.contains('h5p-interactive-book-status-menu-active');
  }

  /**
   * Add progress bar.
   *
   * @return {object} Progress bar elements.
   */
  createProgressBar() {
    const progress = document.createElement('div');
    progress.classList.add('h5p-interactive-book-status-progressbar-front');
    progress.setAttribute('tabindex', '-1');

    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-interactive-book-status-progressbar-back');
    wrapper.appendChild(progress);

    return {
      wrapper,
      progress
    };
  }

  /**
   * Add a paragraph which indicates which chapter is active.
   *
   * @return {object} Chapter title elements.
   */
  createChapterTitle() {
    const text = document.createElement('h1');
    text.classList.add('title');

    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-interactive-book-status-chapter');
    wrapper.appendChild(text);
    return {
      wrapper,
      text
    };
  }

  /**
   * Add a button which scrolls to the top of the page.
   *
   * @return {HTMLElement} Button.
   */
  createToTopButton() {
    const button = document.createElement('div');
    button.classList.add('icon-up');
    button.classList.add('navigation-button');

    const wrapper = document.createElement('button');
    wrapper.classList.add('h5p-interactive-book-status-to-top');
    wrapper.classList.add('h5p-interactive-book-status-button');
    wrapper.classList.add('h5p-interactive-book-status-arrow');
    wrapper.setAttribute('aria-label', this.params.l10n.navigateToTop);
    wrapper.addEventListener('click', () => {
      this.parent.trigger('scrollToTop');
      document.querySelector('.h5p-interactive-book-status-menu').focus();
    });

    wrapper.appendChild(button);

    return wrapper;
  }

  /**
   * Set the visibility.
   *
   * @param {boolean} hide True will hide the bar.
   */
  setVisibility(hide) {
    if (hide) {
      this.wrapper.classList.add('footer-hidden');
    }
    else {
      this.wrapper.classList.remove('footer-hidden');
    }
  }

  /**
   * Add a status-button which shows current and total chapters.
   *
   * @return {object} Progress elements.
   */
  createProgressIndicator() {
    const current = document.createElement('span');
    current.classList.add('h5p-interactive-book-status-progress-number');
    current.setAttribute('aria-hidden', 'true');

    const divider = document.createElement('span');
    divider.classList.add('h5p-interactive-book-status-progress-divider');
    divider.innerHTML = ' / ';
    divider.setAttribute('aria-hidden', 'true');

    const total = document.createElement('span');
    total.classList.add('h5p-interactive-book-status-progress-number');
    total.innerHTML = this.totalChapters;
    total.setAttribute('aria-hidden', 'true');

    const hiddenButRead = document.createElement('p');
    hiddenButRead.classList.add('hidden-but-read');

    const progressText = document.createElement('p');
    progressText.classList.add('h5p-interactive-book-status-progress');
    progressText.appendChild(current);
    progressText.appendChild(divider);
    progressText.appendChild(total);
    progressText.appendChild(hiddenButRead);

    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-interactive-book-status-progress-wrapper');
    wrapper.appendChild(progressText);

    return {
      wrapper,
      current,
      total,
      divider,
      progressText,
      hiddenButRead
    };
  }

  /**
   * Edit button state on both the top and bottom bar.
   *
   * @param {string} target Prev or Next.
   * @param {boolean} disable True will disable the target button.
   */
  setButtonStatus(target, disable) {
    if (disable) {
      this.arrows['buttonWrapper' + target].setAttribute('disabled', 'disabled');
      this.arrows['button' + target].classList.add('disabled');
    }
    else {
      this.arrows['buttonWrapper' + target].removeAttribute('disabled');
      this.arrows['button' + target].classList.remove('disabled');
    }
  }

  /**
   * Creates the fullscreen button.
   *
   * @returns {Element} The button dom element
   */
  createFullScreenButton() {
    const toggleFullScreen = () => {
      if (H5P.isFullscreen === true) {
        H5P.exitFullScreen();
      }
      else {
        H5P.fullScreen(this.parent.mainWrapper, this.parent);
      }
    };

    const fullScreenButton = document.createElement('button');
    fullScreenButton.classList.add('h5p-interactive-book-status-fullscreen');
    fullScreenButton.classList.add('h5p-interactive-book-status-button');
    fullScreenButton.classList.add('h5p-interactive-book-enter-fullscreen');
    fullScreenButton.setAttribute('title', this.params.l10n.fullscreen);
    fullScreenButton.setAttribute('aria-label', this.params.l10n.fullscreen);
    fullScreenButton.addEventListener('click', toggleFullScreen);
    fullScreenButton.addEventListener('keyPress', (event) => {
      if (event.which === 13 || event.which === 32) {
        toggleFullScreen();
        event.preventDefault();
      }
    });

    this.parent.on('enterFullScreen', () => {
      this.parent.isFullscreen = true;
      fullScreenButton.classList.remove('h5p-interactive-book-enter-fullscreen');
      fullScreenButton.classList.add('h5p-interactive-book-exit-fullscreen');
      fullScreenButton.setAttribute('title', this.params.l10n.exitFullscreen);
      fullScreenButton.setAttribute('aria-label', this.params.l10n.exitFullScreen);

      this.parent.pageContent.updateFooter();
    });

    this.parent.on('exitFullScreen', () => {
      this.parent.isFullscreen = false;
      fullScreenButton.classList.remove('h5p-interactive-book-exit-fullscreen');
      fullScreenButton.classList.add('h5p-interactive-book-enter-fullscreen');
      fullScreenButton.setAttribute('title', this.params.l10n.fullscreen);
      fullScreenButton.setAttribute('aria-label', this.params.l10n.fullscreen);

      this.parent.pageContent.updateFooter();
    });

    return fullScreenButton;
  }

}
export default StatusBar;
