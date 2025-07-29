/**
 * A component which helps in navigation
 * Constructor function.
 */
class SideBar extends H5P.EventDispatcher {
  constructor(config, contentId, mainTitle, parent, chapters) {
    super();

    this.id = contentId;
    this.parent = parent;
    this.behaviour = config.behaviour;
    this.content = document.createElement('ul');
    this.content.classList.add('navigation-list');
    this.container = this.addSideBar();
    this.l10n = config.l10n;

    this.chapters = this.findAllChapters(chapters);
    this.chapterNodes = this.getChapterNodes();

    if (mainTitle) {
      this.titleElem = this.addMainTitle(mainTitle);
      this.container.appendChild(this.titleElem);
    }

    this.chapterNodes.forEach(element => {
      this.content.appendChild(element);
    });

    if (this.chapters.length > 20) {
      this.content.classList.add('large-navigation-list');
    }

    this.container.appendChild(this.content);

    this.addTransformListener();
    this.initializeNavigationControls();
  }

  initializeNavigationControls() {
    const keyCodes = Object.freeze({
      'UP': 38,
      'DOWN': 40,
    });

    this.chapterNodes.forEach((chapter, i) => {
      const chapterButton = chapter.querySelector('.h5p-interactive-book-navigation-chapter-button');
      chapterButton.addEventListener('keydown', (e) => {
        switch (e.keyCode) {
          case keyCodes.UP:
            this.setFocusToChapterItem(i, -1);
            e.preventDefault();
            break;

          case keyCodes.DOWN:
            this.setFocusToChapterItem(i, 1);
            e.preventDefault();
            break;
        }
      });

      const sections = chapter.querySelectorAll('.h5p-interactive-book-navigation-section');
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
        const section = sections[sectionIndex];
        const sectionButton = section.querySelector('.section-button');
        sectionButton.addEventListener('keydown', e => {
          switch (e.keyCode) {
            case keyCodes.UP:
              this.setFocusToSectionItem(i, sectionIndex, -1);
              e.preventDefault();
              break;

            case keyCodes.DOWN:
              this.setFocusToSectionItem(i, sectionIndex, 1);
              e.preventDefault();
              break;
          }
        });
      }
    });
  }

  /**
   * Set focus on the first meny entry
   */
  focus() {
    this.content.querySelector('button').focus();
  }

  setFocusToChapterItem(index, direction = 0) {
    let nextIndex = index + direction;
    if (nextIndex < 0) {
      nextIndex = this.chapterNodes.length - 1;
    }
    else if (nextIndex > this.chapterNodes.length - 1) {
      nextIndex = 0;
    }

    // Check if we should navigate to a section
    if (direction) {
      const chapterIndex = direction > 0 ? index : nextIndex;
      const chapter = this.chapterNodes[chapterIndex];
      if (!chapter.classList.contains('h5p-interactive-book-navigation-closed')) {
        const sections = chapter.querySelectorAll('.h5p-interactive-book-navigation-section');
        if (sections.length) {
          const sectionItemIndex = direction > 0 ? 0 : sections.length - 1;
          this.setFocusToSectionItem(chapterIndex, sectionItemIndex);
          return;
        }
      }
    }

    const nextChapter = this.chapterNodes[nextIndex];
    const chapterButton = nextChapter.querySelector('.h5p-interactive-book-navigation-chapter-button');
    this.setFocusToItem(chapterButton, nextIndex);
  }

  setFocusToSectionItem(chapterIndex, index, direction = 0) {
    const chapter = this.chapterNodes[chapterIndex];
    const sections = chapter.querySelectorAll('.h5p-interactive-book-navigation-section');

    // Navigate chapter if outside of section bounds
    const nextIndex = index + direction;
    if (nextIndex > sections.length - 1) {
      this.setFocusToChapterItem(chapterIndex + 1);
      return;
    }
    else  if (nextIndex < 0) {
      this.setFocusToChapterItem(chapterIndex);
      return;
    }

    const section = sections[nextIndex];
    const sectionButton = section.querySelector('.section-button');
    this.setFocusToItem(sectionButton, chapterIndex);
  }

  setFocusToItem(element, chapterIndex, skipFocusing = false) {
    // Remove focus from all other elements
    this.chapterNodes.forEach((chapter, index) => {
      const chapterButton = chapter.querySelector('.h5p-interactive-book-navigation-chapter-button');

      // Highlight current chapter
      if (index === chapterIndex) {
        chapterButton.classList.add('h5p-interactive-book-navigation-current');
      }
      else {
        chapterButton.classList.remove('h5p-interactive-book-navigation-current');
      }
      chapterButton.setAttribute('tabindex', '-1');

      const sections = chapter.querySelectorAll('.h5p-interactive-book-navigation-section');
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionButton = section.querySelector('.section-button');
        sectionButton.setAttribute('tabindex', '-1');

      }
    });

    element.setAttribute('tabindex', '0');
    this.focusedChapter = chapterIndex;
    if (!skipFocusing) {
      element.focus();
    }
  }

  /**
   * Get sidebar DOM.
   *
   * @return {HTMLElement} DOM for sidebar.
   */
  addSideBar() {
    const container = document.createElement('div');
    container.id = 'h5p-interactive-book-navigation-menu';
    container.classList.add('h5p-interactive-book-navigation');

    return container;
  }

  /**
   * Get main title.
   *
   * @param {string} title Title.
   * @return {HTMLElement} Title element.
   */
  addMainTitle(titleText) {
    const title = document.createElement('h2');
    title.classList.add('navigation-title');
    title.innerHTML = titleText;
    title.setAttribute('title', titleText);

    const titleWrapper = document.createElement('div');
    titleWrapper.classList.add('h5p-interactive-book-navigation-maintitle');
    titleWrapper.appendChild(title);

    return titleWrapper;
  }

  /**
   * Find sections in chapter.
   *
   * @param {object} columnData Column data.
   * @return {object[]} Sections data.
   */
  findSectionsInChapter(columnData) {
    const sectionsData = [];
    const sections = columnData.sections;

    for (let j = 0; j < sections.length; j++) {
      const content = sections[j].content;

      let title = '';
      switch (content.library.split(' ')[0]) {
        case 'H5P.Link':
          if (content.params.title) {
            title = content.params.title;
          }
          else {
            title = 'New link';
          }
          break;
        default:
          title = content.metadata.title;
      }

      sectionsData.push({
        ...sections[j],
        title: title,
        id: content.subContentId ? `h5p-interactive-book-section-${content.subContentId}` : undefined
      });
    }

    return sectionsData;
  }

  /**
   * Find all chapters.
   *
   * @param {object[]} columnsData Columns data.
   * @return {object[]} Chapters data.
   */
  findAllChapters(columnsData) {
    const chapters = [];

    for (let i = 0; i < columnsData.length; i++) {
      chapters.push({
        ...columnsData[i],
        id: (columnsData[i].isSummary) ?
          `h5p-interactive-book-chapter-summary` :
          `h5p-interactive-book-chapter-${columnsData[i].instance.subContentId}`,
        sections: this.findSectionsInChapter(columnsData[i])
      });
    }

    return chapters;
  }

  /**
   * Toggle chapter menu.
   *
   * @param {HTMLElement} chapterNode Chapter.
   * @param {boolean} collapse If true, will collapse chapter.
   */
  toggleChapter(chapterNode, collapse) {
    collapse = (collapse !== undefined) ? collapse : !(chapterNode.classList.contains('h5p-interactive-book-navigation-closed'));

    const childNav = chapterNode.querySelector('.h5p-interactive-book-navigation-sectionlist');
    const arrow = chapterNode.getElementsByClassName('h5p-interactive-book-navigation-chapter-accordion')[0];
    const chapterButton = chapterNode.querySelector('.h5p-interactive-book-navigation-chapter-button');
    chapterButton.setAttribute('aria-expanded', (!collapse).toString());

    if (collapse === true) {
      chapterNode.classList.add('h5p-interactive-book-navigation-closed');
      if (arrow) {
        arrow.classList.remove('icon-expanded');
        arrow.classList.add('icon-collapsed');
        if (childNav) {
          childNav.setAttribute('aria-hidden', true);
          childNav.setAttribute('tabindex', '-1');
        }
      }
    }
    else {
      chapterNode.classList.remove('h5p-interactive-book-navigation-closed');
      if (arrow) {
        arrow.classList.remove('icon-collapsed');
        arrow.classList.add('icon-expanded');
        if (childNav) {
          childNav.removeAttribute('aria-hidden');
          childNav.removeAttribute('tabindex');
        }
      }
    }
  }

  /**
   * Fires whenever a redirect is happening in parent
   * All chapters will be collapsed except for the active
   *
   * @param {number} chapterId The chapter that should stay open in the menu.
   */
  redirectHandler(chapterId) {
    this.chapterNodes.forEach((node, index) => {
      this.toggleChapter(node, index !== chapterId);
    });
    // Trigger resize after toggling all chapters
    this.parent.trigger('resize');


    // Focus new chapter button if active chapter was closed
    if (chapterId !== this.focusedChapter) {
      const chapterButton = this.chapterNodes[chapterId].querySelector('.h5p-interactive-book-navigation-chapter-button');
      this.setFocusToItem(chapterButton, chapterId, true);
    }
  }

  /**
   * Reset indicators.
   */
  resetIndicators() {
    this.chapterNodes.forEach((node, index) => {
      // Reset chapter
      this.updateChapterProgressIndicator(index, 'BLANK');

      // Reset sections
      const sections = node.getElementsByClassName('h5p-interactive-book-navigation-section');
      for (let section of sections) {
        const icon = section.querySelector('.h5p-interactive-book-navigation-section-icon');
        if (icon) {
          icon.classList.remove('icon-question-answered');
          icon.classList.add('icon-chapter-blank');
        }
      }
    });
  }

  /**
   * Update the indicator on a specific chapter.
   *
   * @param {number} chapterId The chapter that should be updated.
   * @param {string} status Status.
   */
  updateChapterProgressIndicator(chapterId, status) {
    if (!this.behaviour.progressIndicators) {
      return;
    }

    const chapter = this.chapters[chapterId];
    if ( chapter.isSummary ) {
      return;
    }

    const progressIndicator = this.chapterNodes[chapterId]
      .getElementsByClassName('h5p-interactive-book-navigation-chapter-progress')[0];

    if (status === 'BLANK') {
      progressIndicator.classList.remove('icon-chapter-started');
      progressIndicator.classList.remove('icon-chapter-done');
      progressIndicator.classList.add('icon-chapter-blank');
    }
    else if (status === 'DONE') {
      progressIndicator.classList.remove('icon-chapter-blank');
      progressIndicator.classList.remove('icon-chapter-started');
      progressIndicator.classList.add('icon-chapter-done');
    }
    else if (status === 'STARTED') {
      progressIndicator.classList.remove('icon-chapter-blank');
      progressIndicator.classList.remove('icon-chapter-done');
      progressIndicator.classList.add('icon-chapter-started');
    }
  }

  /**
   * Set section marker.
   *
   * @param {number} chapterId Chapter Id.
   * @param {number} sectionId Section Id.
   */
  setSectionMarker(chapterId, sectionId) {
    const icon = this.chapterNodes[chapterId]
      .querySelector('.h5p-interactive-book-navigation-section-' + sectionId + ' .h5p-interactive-book-navigation-section-icon');

    if (icon) {
      icon.classList.remove('icon-chapter-blank');
      icon.classList.add('icon-question-answered');
    }
  }

  /**
   * Create chapter.
   *
   * @param {object} chapter Chapter data.
   * @param {number} chapterId Chapter Id.
   * @return {HTMLElement} Chapter node.
   */
  getNodesFromChapter(chapter, chapterId) {
    const chapterNode = document.createElement('li');
    const sectionsDivId = 'h5p-interactive-book-sectionlist-' + chapterId;
    chapterNode.classList.add('h5p-interactive-book-navigation-chapter');

    if (chapter.isSummary) {
      chapterNode.classList.add('h5p-interactive-book-navigation-summary-button');
      const summary = this.parent.chapters[chapterId];
      const summaryButton = summary.instance.summaryMenuButton;
      summaryButton.classList.add('h5p-interactive-book-navigation-chapter-button');
      chapterNode.appendChild(summaryButton);
      return chapterNode;
    }

    // TODO: Clean this up. Will require to receive chapter info from parent instead of building itself
    const chapterCollapseIcon = document.createElement('div');
    chapterCollapseIcon.classList.add('h5p-interactive-book-navigation-chapter-accordion');

    const chapterTitleText = document.createElement('div');
    chapterTitleText.classList.add('h5p-interactive-book-navigation-chapter-title-text');
    chapterTitleText.innerHTML = chapter.title;
    chapterTitleText.setAttribute('title', chapter.title);

    const chapterCompletionIcon = document.createElement('div');
    if (this.behaviour.progressIndicators) {
      chapterCompletionIcon.classList.add('icon-chapter-blank');
      chapterCompletionIcon.classList.add('h5p-interactive-book-navigation-chapter-progress');
    }

    const chapterNodeTitle = document.createElement('button');
    chapterNodeTitle.setAttribute('tabindex', chapterId === 0 ? '0' : '-1');
    chapterNodeTitle.classList.add('h5p-interactive-book-navigation-chapter-button');
    if (this.parent.activeChapter !== chapterId) {
      chapterCollapseIcon.classList.add('icon-collapsed');
      chapterNodeTitle.setAttribute('aria-expanded', 'false');
    }
    else {
      chapterCollapseIcon.classList.add('icon-expanded');
      chapterNodeTitle.setAttribute('aria-expanded', 'true');
    }
    chapterNodeTitle.setAttribute('aria-controls', sectionsDivId);
    chapterNodeTitle.onclick = (event) => {
      const accordion = event.currentTarget.querySelector('.h5p-interactive-book-navigation-chapter-accordion');

      const isExpandable = !accordion.classList.contains('hidden');
      const isExpanded = event.currentTarget.getAttribute('aria-expanded') === 'true';

      if (this.isOpenOnMobile()) {
        this.parent.trigger('toggleMenu');
      }

      // Open chapter in main content
      if (this.isOpenOnMobile() || !isExpandable || !isExpanded) {
        const newChapter = {
          h5pbookid: this.parent.contentId,
          chapter: this.chapters[chapterId].id,
          section: 0,
        };

        this.parent.trigger('newChapter', newChapter);
      }

      // Expand chapter in menu
      if (isExpandable) {
        this.toggleChapter(event.currentTarget.parentElement);
        this.parent.trigger('resize');
      }
    };
    chapterNodeTitle.appendChild(chapterCollapseIcon);
    chapterNodeTitle.appendChild(chapterTitleText);
    chapterNodeTitle.appendChild(chapterCompletionIcon);

    chapterNode.appendChild(chapterNodeTitle);

    // Collapse all but current chapters in menu and highlight current
    if (this.parent.activeChapter === chapterId) {
      chapterNode.querySelector('.h5p-interactive-book-navigation-chapter-button').classList.add('h5p-interactive-book-navigation-current');
    }
    else {
      this.toggleChapter(chapterNode, true);
    }

    const sectionsWrapper = document.createElement('ul');
    sectionsWrapper.classList.add('h5p-interactive-book-navigation-sectionlist');
    sectionsWrapper.id = sectionsDivId;

    const sectionLinks = [];
    // Add sections to the chapter
    for (let i = 0; i < this.chapters[chapterId].sections.length; i++) {
      // Non-tasks will only get section links if they have headers
      if (!this.parent.chapters[chapterId].sections[i].isTask) {

        // Check text content for headers
        const sectionParams = this.chapters[chapterId].sections[i].content;
        const isText = sectionParams.library.split(' ')[0] === 'H5P.AdvancedText';

        if (isText) {
          const text = document.createElement('div');
          text.innerHTML = sectionParams.params.text;
          const headers = text.querySelectorAll('h2, h3');
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const sectionNode = this.createSectionLink(chapterId, i, header.textContent, j);
            sectionLinks.push(sectionNode);
            sectionsWrapper.appendChild(sectionNode);
          }
        }
      }
      else {
        const sectionNode = this.createSectionLink(chapterId, i);
        sectionLinks.push(sectionNode);
        sectionsWrapper.appendChild(sectionNode);
      }
    }

    if (chapter.tasksLeft) {
      chapter.maxTasks = chapter.tasksLeft;
    }

    // Don't show collapse arrow if there are no sections or on mobile
    if (sectionLinks.length === 0) {
      const arrowIconElement = chapterNode.querySelector('.h5p-interactive-book-navigation-chapter-accordion');
      if (arrowIconElement) {
        arrowIconElement.classList.add('hidden');
      }
    }

    chapterNode.appendChild(sectionsWrapper);

    return chapterNode;
  }

  /**
   * Create a section link
   * @param chapterId
   * @param i Index of section
   * @param [title] Force title
   * @param [headerNumber] Set header index within section to link to.
   * @returns {Element} Section node containing the link
   */
  createSectionLink(chapterId, i, title = null, headerNumber = null) {
    const section = this.chapters[chapterId].sections[i];

    const sectionTitleText = document.createElement('div');
    sectionTitleText.innerHTML = title || section.title;
    sectionTitleText.setAttribute('title', title || section.title);
    sectionTitleText.classList.add('h5p-interactive-book-navigation-section-title');

    const sectionCompletionIcon = document.createElement('div');
    sectionCompletionIcon.classList.add('h5p-interactive-book-navigation-section-icon');
    sectionCompletionIcon.classList.add('icon-chapter-blank');
    if (this.parent.chapters[chapterId].sections[i].isTask) {
      sectionCompletionIcon.classList.add('h5p-interactive-book-navigation-section-task');
    }
    const sectionLink = document.createElement('button');
    sectionLink.classList.add('section-button');
    sectionLink.setAttribute('tabindex', '-1');
    sectionLink.onclick = (event) => {
      const newChapter = {
        h5pbookid: this.parent.contentId,
        chapter: this.chapters[chapterId].id,
        section: section.id,
      };
      if (headerNumber !== null) {
        newChapter.headerNumber = headerNumber;
      }

      this.parent.trigger('newChapter', newChapter);

      if (this.isOpenOnMobile()) {
        this.parent.trigger('toggleMenu');
      }

      event.preventDefault();
    };
    sectionLink.appendChild(sectionCompletionIcon);
    sectionLink.appendChild(sectionTitleText);

    const sectionNode = document.createElement('li');
    sectionNode.classList.add('h5p-interactive-book-navigation-section');
    sectionNode.classList.add('h5p-interactive-book-navigation-section-' + i);
    sectionNode.appendChild(sectionLink);

    return sectionNode;
  }

  /**
   * Get chapter elements.
   *
   * @return {HTMLElement[]} Chapter elements.
   */
  getChapterNodes() {
    return this.chapters.map((chapter, index) => this.getNodesFromChapter(chapter, index));
  }

  /**
   * Detect whether navigation is open on a small surface(pc or mobile).
   * @return {boolean} True, if navigation is open on mobile view.
   */
  isOpenOnMobile() {
    return this.parent.isMenuOpen() && this.parent.isSmallSurface();
  }

  /**
   * Add transform listener.
   */
  addTransformListener() {
    this.container.addEventListener('transitionend', (event) => {
      // propertyName is used trigger once, not for every property that has transitionend
      if (event.propertyName === 'flex-basis') {
        this.parent.trigger('resize');
      }
    });
  }
}
export default SideBar;
