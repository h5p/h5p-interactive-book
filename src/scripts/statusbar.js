/**
 * Constructor function.
 */
class StatusBar extends H5P.EventDispatcher {
  constructor(contentId, totalChapters, parent, params, styleClassName) {
    super();
    this.id = contentId;
    this.parent = parent;

    this.params = params || {};

    this.params.l10n = Object.assign({
      page: 'Page',
      next: 'Next',
      previous: 'Previous'
    }, params.l10n || {});

    this.params.a11y = Object.assign({
      progress: 'Page @page of @total',
      menu: 'Toggle navigation menu',
    }, this.params.a11y || {});

    this.totalChapters = totalChapters;
    this.progressIndicator = this.createProgressIndicator();
    this.chapterTitle = this.createChapterTitle();

    /**
     * Top row initializer
     */

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add(styleClassName);
    this.wrapper.classList.add('h5p-interactive-book-status');
    this.wrapper.setAttribute('tabindex', '-1');

    // Pattern for summary screen when menu collapsed
    const collapsedPattern = document.createElement('div');
    collapsedPattern.classList.add('h5p-theme-pattern');
    this.wrapper.appendChild(collapsedPattern);

    // Make side section
    const sidebarWrapper = document.createElement('div');
    sidebarWrapper.classList.add('h5p-interactive-book-status-side');

    if (this.params.displayToTopButton) {
      sidebarWrapper.appendChild(this.createToTopButton());
    }

    this.menuToggleButton = this.createMenuToggleButton();
    if (this.params.displayMenuToggleButton) {
      sidebarWrapper.appendChild(this.menuToggleButton);
    }

    const sidebarTitle = document.createElement('div');
    sidebarTitle.classList.add('h5p-interactive-book-status-title');

    if (params.title) {
      const title = document.createElement('h2');
      title.textContent = params.title;
      sidebarTitle.appendChild(title);
    }

    this.progressBar = this.createProgressBar();
    sidebarTitle.appendChild(this.progressBar.wrapper);
    sidebarWrapper.appendChild(sidebarTitle);

    this.wrapper.appendChild(sidebarWrapper);

    // Create navigation using H5P.Components.Navigation
    this.navigationWrapper = this.createNavigation();
    this.wrapper.appendChild(this.navigationWrapper);

    if (this.params.displayFullScreenButton && H5P.fullscreenSupported) {
      this.fullscreenButton = this.createFullScreenButton();
      this.wrapper.appendChild(this.fullscreenButton);
    }

    this.on('updateStatusBar', this.updateStatusBar);

    /**
     * Sequential traversal of chapters
     * Event should be either 'next' or 'prev'
     */
    this.on('seqChapter', (event) => {
      const eventInput = {
        h5pbookid: this.parent.contentId,
      };
      if (event.data.toTop) {
        eventInput.section = 'top';
      }

      if (event.data.direction === 'next') {
        if (this.parent.activeChapter + 1 < this.parent.chapters.length) {
          eventInput.chapter = `h5p-interactive-book-chapter-${
            this.parent.chapters[this.parent.activeChapter + 1].instance
              .subContentId
          }`;
        } else if (
          this.parent.hasSummary() &&
          this.parent.activeChapter + 1 === this.parent.chapters.length
        ) {
          this.parent.trigger('viewSummary', eventInput);
        }
      }
      else if (event.data.direction === 'prev') {
        if (this.parent.activeChapter > 0) {
          eventInput.chapter = `h5p-interactive-book-chapter-${
            this.parent.chapters[this.parent.activeChapter - 1].instance
              .subContentId
          }`;
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
    const barWidth = `${(chapter / this.totalChapters) * 100}%`;

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
    this.navigationComponent.updateTitle(chapterTitle);

    this.progressIndicator.current.innerHTML = currentChapter;

    this.updateA11yProgress(currentChapter);
    this.updateProgressBar(currentChapter);

    this.navigationComponent.setCurrentIndex(this.parent.getActiveChapter());
  }

  /**
   * Create navigation using H5P.Components.Navigation
   * @returns {HTMLElement} The navigation component element
   */
  createNavigation() {
    const activeChapter = this.parent.getActiveChapter();
    const currentChapterTitle = this.parent.chapters[activeChapter] ? this.parent.chapters[activeChapter].title : '';

    const navigation = H5P.Components.Navigation({
      className: 'h5p-interactive-book-status-main',
      variant: '3-split',
      showDisabledButtons: true,
      handlePrevious: () => {
        this.trigger('seqChapter', {
          direction: 'prev',
          toTop: true,
        });
      },
      handleNext: () => {
        this.trigger('seqChapter', {
          direction: 'next',
          toTop: true,
        });
      },
      progressType: 'text',
      index: activeChapter,
      navigationLength: this.totalChapters,
      title: currentChapterTitle,
      texts: {
        previousButton: this.params.l10n.previous,
        nextButton: this.params.l10n.next,
        textualProgress: this.params.l10n.page + ' @current / @total',
      },
    });

    // Store reference to navigation component for API calls
    this.navigationComponent = navigation;

    return navigation;
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
      text,
    };
  }

  /**
   * Add a button which scrolls to the top of the page.
   *
   * @return {HTMLElement} Button.
   */
  createToTopButton() {
    const button = document.createElement('button');
    button.classList.add('icon-up');

    button.classList.add('h5p-interactive-book-status-to-top');
    button.classList.add('h5p-interactive-book-status-button');
    button.setAttribute('aria-label', this.params.l10n.navigateToTop);
    button.addEventListener('click', () => {
      this.parent.trigger('scrollToTop');
      document.querySelector('.h5p-interactive-book-status-menu').focus();
    });

    return button;
  }

  /**
   * Add a status-button which shows current and total chapters.
   *
   * @return {object} Progress elements.
   */
  createProgressIndicator() {
    const label = document.createElement('span');
    label.textContent = this.params.l10n.page;
    label.setAttribute('aria-hidden', 'true');

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
    progressText.classList.add('h5p-theme-progress');
    progressText.appendChild(label);
    progressText.appendChild(current);
    progressText.appendChild(divider);
    progressText.appendChild(total);
    progressText.appendChild(hiddenButRead);

    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-interactive-book-status-progress');
    wrapper.appendChild(progressText);

    return {
      wrapper,
      current,
      total,
      divider,
      progressText,
      hiddenButRead,
    };
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
    });

    this.parent.on('exitFullScreen', () => {
      this.parent.isFullscreen = false;
      fullScreenButton.classList.remove('h5p-interactive-book-exit-fullscreen');
      fullScreenButton.classList.add('h5p-interactive-book-enter-fullscreen');
      fullScreenButton.setAttribute('title', this.params.l10n.fullscreen);
      fullScreenButton.setAttribute('aria-label', this.params.l10n.fullscreen);
    });

    return fullScreenButton;
  }

}
export default StatusBar;
