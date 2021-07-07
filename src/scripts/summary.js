import 'jquery-circle-progress';

class Summary extends H5P.EventDispatcher {

  /**
   * @constructor
   *
   * @param {object} config
   * @param {object} parent
   * @param {object} params
   */
  constructor(config, parent, chapters) {
    super();
    this.parent = parent;
    this.behaviour = config.behaviour;
    this.l10n = config.l10n;
    this.chapters = chapters || [];

    this.subContentId = 'summary';
    this.wrapper = null;
    this.summaryMenuButton = this.createSummaryButton();

    this.filterActionAll = 'all';
    this.filterActionUnanswered = 'unanswered';
    this.bookCompleted = false;

    parent.on('bookCompleted', event => this.setBookComplete(event.data.completed));
    parent.on('toggleMenu', () => {
      const footer = document.querySelector('.h5p-interactive-book-summary-footer');
      if ( footer && this.bookCompleted ) {
        if ( this.parent.isMenuOpen() ) {
          footer.classList.add('menu-open');
        }
        else {
          footer.classList.remove('menu-open');
        }
      }
    });
  }

  /**
   *
   * @param {boolean} complete
   */
  setBookComplete(complete) {
    let summaryFooter = this.parent.mainWrapper ?
      this.parent.mainWrapper[0].querySelector('.h5p-interactive-book-summary-footer') :
      null;
    if ( !summaryFooter && this.parent.isSmallSurface()) {
      summaryFooter = document.createElement("div");
      summaryFooter.classList.add('h5p-interactive-book-summary-footer');

      summaryFooter.appendChild(this.createSummaryButton());
      this.parent.mainWrapper.append(summaryFooter);
    }
    if (summaryFooter && complete) {
      setTimeout(() => summaryFooter.classList.add('show-footer'), 0);
    }

    this.bookCompleted = complete;
    Array.from(document.querySelectorAll('.h5p-interactive-book-summary-menu-button'))
      .forEach(button => button.setAttribute('data-book-completed', complete.toString()));
  }

  /**
   * Set chapters for the summary
   * @param chapters
   */
  setChapters(chapters) {
    this.chapters = Array.isArray(chapters) ? chapters : [];
  }

  /**
   * Enable/disable the summary button
   *
   * @param disabled
   */
  setSummaryMenuButtonDisabled(disabled = true) {
    this.summaryMenuButton.disabled = disabled;
  }

  /**
   * Apply the filter of resources in the summary
   *
   * @param filter
   */
  setFilter(filter) {
    const overviewList = this.wrapper.querySelector('.h5p-interactive-book-summary-overview-list');
    const sectionList = Array.from(overviewList.querySelectorAll('.h5p-interactive-book-summary-overview-section'));
    sectionList.forEach(section => {
      section.classList.remove('h5p-interactive-book-summary-top-section');
      section.classList.remove('h5p-interactive-book-summary-bottom-section');
    });

    const emptyContainer = overviewList.querySelector('.h5p-interactive-book-summary-overview-list-empty');
    emptyContainer.style.display = 'none';
    if (filter === this.filterActionUnanswered) {
      overviewList.classList.add('h5p-interactive-book-summary-overview-list-only-unanswered');
      const filteredSectionList = sectionList.filter(section => !section.classList.contains('h5p-interactive-book-summary-no-interactions'));
      if (filteredSectionList.length) {
        filteredSectionList[0].classList.add('h5p-interactive-book-summary-top-section');
        filteredSectionList[filteredSectionList.length-1].classList.add('h5p-interactive-book-summary-bottom-section');
      }
      else {
        emptyContainer.style.display = 'block';
      }
    }
    else if (filter === this.filterActionAll) {
      overviewList.classList.remove('h5p-interactive-book-summary-overview-list-only-unanswered');
    }
    setTimeout(() => this.trigger('resize'), 1);
  }

  /**
   *  Create a "Summary & Submit" button
   *
   * @return {HTMLButtonElement}
   */
  createSummaryButton() {
    const button = document.createElement('button');
    button.classList.add('h5p-interactive-book-summary-menu-button');
    button.onclick = () => {
      const newChapter = {
        h5pbookid: this.parent.contentId,
        chapter: `h5p-interactive-book-chapter-summary`,
        section: "top",
      };
      this.parent.trigger('newChapter', newChapter);
      if (this.parent.isMenuOpen() && this.parent.isSmallSurface()) {
        this.parent.trigger('toggleMenu');
      }
    };
    //button.disabled = true;

    const paperIcon = document.createElement('span');
    paperIcon.classList.add('h5p-interactive-book-summary-icon');
    paperIcon.classList.add('icon-paper');
    paperIcon.setAttribute('aria-hidden', "true");

    const text = document.createElement('span');
    text.classList.add('h5p-interactive-book-summary-text');
    text.innerHTML = this.l10n.summaryAndSubmit;

    const arrowIcon = document.createElement('span');
    arrowIcon.classList.add('h5p-interactive-book-summary-menu-button-arrow');
    arrowIcon.classList.add('icon-up');
    arrowIcon.setAttribute('aria-hidden', "true");

    button.appendChild(paperIcon);
    button.appendChild(text);
    button.appendChild(arrowIcon);

    return button;
  }

  /**
   * Create the process circle
   *
   * @param progress
   * @return {HTMLDivElement}
   */
  createCircle(progress) {
    const circleProgress = document.createElement("div");
    circleProgress.classList.add('h5p-interactive-book-summary-progress-circle');
    circleProgress.setAttribute('data-value', progress);
    circleProgress.setAttribute('data-start-angle', -Math.PI / 3);
    circleProgress.setAttribute('data-thickness', 13);
    circleProgress.setAttribute('data-empty-fill', "rgba(45, 122, 210, .1)");
    circleProgress.setAttribute('data-fill', JSON.stringify({color: '#2d7ad2'}));

    return circleProgress;
  }

  /**
   * Create a progress box used at the top of the summary
   *
   * @param title
   * @param smallText
   * @param progressCounter
   * @param progressTotal
   * @param {boolean} [isAbsoluteValues] Use absolute values for progress instead of percentage
   * @param {number} [smallProgress] Progress for small text if it differs from the progress counter
   * @param {number} [smallProgressTotal] Total progress for small text if it differs from the total progress counter
   * @return {HTMLDivElement}
   */
  createProgress(title, smallText, progressCounter, progressTotal, isAbsoluteValues = false, smallProgress, smallProgressTotal) {
    const box = document.createElement("div");

    const header = document.createElement("h3");
    header.innerHTML = title;

    const progressPercentage = progressCounter * 100 / progressTotal;
    if (smallProgress === undefined) {
      smallProgress = progressCounter;
    }

    if (smallProgressTotal === undefined) {
      smallProgressTotal = progressTotal;
    }

    const progressBigText = document.createElement("p");
    progressBigText.classList.add('h5p-interactive-book-summary-progressbox-bigtext');
    progressBigText.innerHTML = Math.round(progressPercentage) + '%';
    if (isAbsoluteValues) {
      const progress = document.createElement('span');
      progress.classList.add('absolute-value');
      progress.innerHTML = progressCounter;

      const separator = document.createElement('span');
      separator.classList.add('separator');
      separator.innerHTML = '/';

      const total = document.createElement('span');
      total.classList.add('absolute-value');
      total.innerHTML = progressTotal;

      progressBigText.innerHTML = '';
      progressBigText.appendChild(progress);
      progressBigText.appendChild(separator);
      progressBigText.appendChild(total);
    }

    const progressSmallText = document.createElement("span");
    progressSmallText.classList.add('h5p-interactive-book-summary-progressbox-smalltext');
    progressSmallText.innerHTML = smallText.replace('@count', smallProgress).replace('@total', smallProgressTotal);

    box.appendChild(header);
    box.appendChild(progressBigText);
    box.appendChild(progressSmallText);

    const container = document.createElement("div");
    container.appendChild(box);
    container.appendChild(this.createCircle(progressCounter/progressTotal));

    return container;
  }

  /**
   * Create total score progress container
   *
   * @returns {HTMLDivElement}
   */
  addScoreProgress() {
    let totalInteractions = 0, uncompletedInteractions = 0;
    for (const chapter of this.chapters) {
      totalInteractions += chapter.maxTasks;
      uncompletedInteractions += chapter.tasksLeft;
    }

    const box = this.createProgress(
      this.l10n.totalScoreLabel,
      this.l10n.interactionsProgressSubtext,
      this.parent.getScore(),
      this.parent.getMaxScore(),
      true,
      Math.max(totalInteractions - uncompletedInteractions, 0),
      totalInteractions
    );
    box.classList.add('h5p-interactive-book-summary-progress-container');
    box.classList.add('h5p-interactive-book-summary-score-progress');
    const circle = box.querySelector('.h5p-interactive-book-summary-progress-circle');
    circle.setAttribute('data-empty-fill', "rgb(198, 220, 212)");
    circle.setAttribute('data-fill', JSON.stringify({color: '#0e7c57'}));

    return box;
  }

  /**
   * Creates the book progress container
   *
   * @return {HTMLDivElement}
   */
  addBookProgress() {
    const box = this.createProgress(this.l10n.bookProgress, this.l10n.bookProgressSubtext, this.chapters.filter(chapter => chapter.completed).length, this.chapters.length);
    box.classList.add("h5p-interactive-book-summary-progress-container");
    box.classList.add("h5p-interactive-book-summary-book-progress");
    return box;
  }

  /**
   * Creates the interactions progress container
   *
   * @return {HTMLDivElement}
   */
  addInteractionsProgress() {
    let totalInteractions = 0, uncompletedInteractions = 0;
    for (const chapter of this.chapters) {
      totalInteractions += chapter.maxTasks;
      uncompletedInteractions += chapter.tasksLeft;
    }
    const box = this.createProgress(this.l10n.interactionsProgress, this.l10n.interactionsProgressSubtext, Math.max(totalInteractions - uncompletedInteractions, 0), totalInteractions);
    box.classList.add("h5p-interactive-book-summary-progress-container");
    box.classList.add("h5p-interactive-book-summary-interactions-progress");
    return box;
  }

  /**
   * Grouping function that creates all the progress containers, if the settings allow it
   */
  addProgressIndicators() {
    if (!this.behaviour.progressIndicators) {
      return;
    }
    const progressBox = document.createElement("div");
    progressBox.classList.add('h5p-interactive-box-summary-progress');
    progressBox.appendChild(this.addScoreProgress());
    progressBox.appendChild(this.addBookProgress());
    progressBox.appendChild(this.addInteractionsProgress());

    setTimeout(() => H5P.jQuery('.h5p-interactive-book-summary-progress-circle').circleProgress(), 100);
    this.wrapper.appendChild(progressBox);
  }

  /**
   * Add the container with the action buttons
   */
  addActionButtons() {
    const wrapper = document.createElement("div");
    wrapper.classList.add('h5p-interactive-book-summary-buttons');

    if (H5PIntegration.reportingIsEnabled) {
      const submitButton = this.addButton('icon-paper-pencil', this.l10n.submitReport);
      submitButton.classList.add('h5p-interactive-book-summary-submit');
      submitButton.onclick = () => {
        this.trigger('submitted');
        this.parent.triggerXAPIScored(this.parent.getScore(), this.parent.getMaxScore(), 'completed');
        wrapper.classList.add('submitted');
      };
      wrapper.appendChild(submitButton);
    }
    wrapper.appendChild(this.createRestartButton());
    wrapper.appendChild(this.createSubmittedConfirmation());

    this.wrapper.appendChild(wrapper);
  }

  /**
   * Create the restart button
   * @return {HTMLButtonElement}
   */
  createRestartButton() {
    const restartButton = this.addButton('icon-restart', this.l10n.restartLabel);
    restartButton.classList.add('h5p-interactive-book-summary-restart');
    restartButton.onclick = () => this.parent.resetTask();
    return restartButton;
  }

  /**
   * Create the confirmation box displayed after the user submits the report
   * @return {HTMLDivElement}
   */
  createSubmittedConfirmation() {
    const submittedContainer = document.createElement("div");
    submittedContainer.classList.add('h5p-interactive-book-summary-submitted');

    const icon = document.createElement("span");
    icon.classList.add('icon-chapter-done');
    icon.classList.add('icon-check-mark');
    submittedContainer.appendChild(icon);

    const text = document.createElement("p");
    text.innerHTML = this.l10n.yourAnswersAreSubmittedForReview;
    submittedContainer.appendChild(text);

    submittedContainer.appendChild(this.createRestartButton());

    return submittedContainer;
  }

  /**
   * Function to create the actual button element used for the action buttons
   *
   * @param iconClass
   * @param label
   * @return {HTMLButtonElement}
   */
  addButton(iconClass, label) {
    const buttonElement = document.createElement("button");
    buttonElement.type = 'button';
    buttonElement.classList.add('h5p-interactive-book-summary-button');
    buttonElement.innerHTML = label;

    const icon = document.createElement("span");
    icon.classList.add(iconClass);
    icon.setAttribute('aria-hidden', "true");
    buttonElement.appendChild(icon);

    return buttonElement;
  }

  /**
   * Create the overview of the sections
   *
   * @param sections
   * @param chapterId
   * @return {{hasUnansweredInteractions: boolean, sectionElements: []}}
   */
  createSectionList(sections, chapterId) {
    let sectionElements = [], hasUnansweredInteractions = false;
    for (const section of sections) {
      const sectionRow = document.createElement("li");
      sectionRow.classList.add('h5p-interactive-book-summary-overview-section-details');
      if (this.behaviour.progressIndicators) {
        const icon = document.createElement("span");
        icon.classList.add('h5p-interactive-book-summary-section-icon');
        icon.classList.add(section.taskDone ? 'icon-chapter-done' : 'icon-chapter-blank');
        sectionRow.appendChild(icon);
      }

      const title = document.createElement("button");
      title.type = "button";
      title.classList.add('h5p-interactive-book-summary-section-title');
      title.onclick = () => {
        const newChapter = {
          h5pbookid: this.parent.contentId,
          chapter: `h5p-interactive-book-chapter-${chapterId}`,
          section: `h5p-interactive-book-section-${section.instance.subContentId}`,
        };
        this.parent.trigger("newChapter", newChapter);
      };

      // We can't expect the content type to always have set contentData as a property on their instance
      const contentDataTitle = section.instance.contentData
        && section.instance.contentData.metadata
        && section.instance.contentData.metadata.title;
      // Try to get title from params
      const metadataTitle = section.content
        && section.content.metadata
        && section.content.metadata.title;
      title.innerHTML = contentDataTitle ? contentDataTitle
        : metadataTitle ? metadataTitle : 'Untitled';

      const score = document.createElement("div");
      score.classList.add('h5p-interactive-book-summary-section-score');
      score.innerHTML = '-';
      if ( typeof section.instance.getScore === 'function') {
        score.innerHTML = this.l10n.scoreText.replace('@score', section.instance.getScore()).replace('@maxscore', section.instance.getMaxScore());
      }

      if ( section.taskDone) {
        sectionRow.classList.add('h5p-interactive-book-summary-overview-section-details-task-done');
      }
      else {
        hasUnansweredInteractions = true;
      }
      sectionRow.appendChild(title);
      sectionRow.appendChild(score);
      sectionElements.push(sectionRow);
    }
    if ( sectionElements.length) {
      const sectionRow = document.createElement("div");
      sectionRow.classList.add('h5p-interactive-book-summary-overview-section-score-header');
      const scoreHeader = document.createElement("div");
      scoreHeader.innerHTML = this.l10n.score;
      sectionRow.appendChild(scoreHeader);
      sectionElements.unshift(sectionRow);
    }
    return {
      hasUnansweredInteractions,
      sectionElements
    };
  }

  /**
   * Create the chapter progress container
   *
   * @param chapter
   * @return {HTMLLIElement}
   */
  createChapterOverview(chapter) {
    const wrapper = document.createElement("li");
    wrapper.classList.add('h5p-interactive-book-summary-overview-section');
    const header = document.createElement("h4");
    header.onclick = () => {
      const newChapter = {
        h5pbookid: this.parent.contentId,
        chapter: `h5p-interactive-book-chapter-${chapter.instance.subContentId}`,
        section: `top`,
      };
      this.parent.trigger("newChapter", newChapter);

    };

    const chapterTitle = document.createElement("span");
    chapterTitle.innerHTML = chapter.title;
    header.appendChild(chapterTitle);

    if (this.behaviour.progressIndicators) {
      const chapterIcon = document.createElement("span");
      const chapterStatus = this.parent.getChapterStatus(chapter);
      chapterIcon.classList.add(`icon-chapter-${chapterStatus.toLowerCase()}`);
      header.appendChild(chapterIcon);
    }

    wrapper.appendChild(header);

    let {
      sectionElements: sections,
      hasUnansweredInteractions
    } = this.createSectionList(chapter.sections.filter(section => section.isTask), chapter.instance.subContentId);

    if ( hasUnansweredInteractions === false) {
      wrapper.classList.add('h5p-interactive-book-summary-no-interactions');
    }
    const sectionSubheader = document.createElement("div");
    sectionSubheader.classList.add('h5p-interactive-book-summary-chapter-subheader');
    if ( chapter.maxTasks ) {
      sectionSubheader.innerHTML = this.l10n.leftOutOfTotalCompleted.replace('@left', Math.max(chapter.maxTasks - chapter.tasksLeft, 0)).replace('@max', chapter.maxTasks);
    }
    else {
      sectionSubheader.innerHTML = this.l10n.noInteractions;
    }

    wrapper.appendChild(sectionSubheader);

    const sectionsContainer = document.createElement("ul");
    if ( sections.length ) {
      sections.map(section => sectionsContainer.appendChild(section));
    }
    wrapper.appendChild(sectionsContainer);

    return wrapper;
  }

  /**
   * Create the dropdown menu to filter sections by interactions
   *
   * @return {HTMLDivElement}
   */
  createFilterDropdown() {
    const createElement = (text, value)  => {
      const listElement = document.createElement("li");
      listElement.role = "menuitem";

      const actionButton = document.createElement("button");
      actionButton.textContent = text;
      actionButton.type = "button";
      actionButton.onclick = event => {
        this.setFilter(value);
        container.removeAttribute('active');
        selectButton.setAttribute('aria-expanded', "false");
        buttonText.textContent = event.currentTarget.innerHTML;
      };
      listElement.appendChild(actionButton);
      return listElement;
    };

    const container = document.createElement("div");
    container.classList.add('h5p-interactive-book-summary-dropdown');

    const selectButton = document.createElement("button");
    selectButton.setAttribute('aria-haspopup', "true");
    selectButton.setAttribute('aria-expanded', "false");
    selectButton.type = 'button';
    selectButton.onclick = () => {
      if (container.hasAttribute('active')) {
        container.removeAttribute('active');
        selectButton.setAttribute('aria-expanded', "false");
      }
      else {
        container.setAttribute('active', "");
        selectButton.setAttribute('aria-expanded', "true");
        selectButton.focus();
      }
    };

    const buttonText = document.createElement("span");
    buttonText.textContent = this.l10n.allInteractions;
    selectButton.appendChild(buttonText);

    const caretIcon = document.createElement("span");
    caretIcon.classList.add('h5p-interactive-book-summary-dropdown-icon');
    caretIcon.classList.add('icon-expanded');
    caretIcon.setAttribute('aria-hidden', "true");
    selectButton.appendChild(caretIcon);

    const dropdownMenu = document.createElement("ul");
    dropdownMenu.role = "menu";
    dropdownMenu.classList.add('h5p-interactive-book-summary-dropdown-menu');

    const allInteractions = createElement(this.l10n.allInteractions, this.filterActionAll);
    const unansweredInteractions = createElement(this.l10n.unansweredInteractions, this.filterActionUnanswered);
    dropdownMenu.appendChild(allInteractions);
    dropdownMenu.appendChild(unansweredInteractions);

    container.appendChild(selectButton);
    container.appendChild(dropdownMenu);

    return container;
  }

  /**
   * Add the container for the list of chapters and sections
   */
  addSummaryOverview() {
    const wrapper = document.createElement("ul");
    wrapper.classList.add('h5p-interactive-book-summary-list');
    const summaryHeader = document.createElement("li");
    summaryHeader.classList.add('h5p-interactive-book-summary-overview-header');

    const header = document.createElement("h3");
    header.innerHTML = this.l10n.summaryHeader;

    summaryHeader.appendChild(header);
    summaryHeader.appendChild(this.createFilterDropdown());

    wrapper.appendChild(summaryHeader);

    const summaryList = document.createElement("ol");
    summaryList.classList.add('h5p-interactive-book-summary-overview-list');
    for ( const chapter of this.chapters) {
      summaryList.appendChild(this.createChapterOverview(chapter));
    }
    const emptySummaryList = document.createElement("p");
    emptySummaryList.classList.add('h5p-interactive-book-summary-overview-list-empty');
    emptySummaryList.classList.add('h5p-interactive-book-summary-top-section');
    emptySummaryList.classList.add('h5p-interactive-book-summary-bottom-section');
    emptySummaryList.innerHTML = this.l10n.noInteractions;
    summaryList.appendChild(emptySummaryList);
    wrapper.appendChild(summaryList);

    this.wrapper.appendChild(wrapper);
  }

  /**
   * Add the score bar for the book
   */
  addScoreBar() {
    const scorebar = document.createElement("div");
    scorebar.classList.add('h5p-interactive-book-summary-score-bar');

    const scoreBar = H5P.JoubelUI.createScoreBar(this.parent.getMaxScore());
    scoreBar.setScore(this.parent.getScore());
    scoreBar.appendTo(scorebar);
    this.wrapper.appendChild(scorebar);
  }

  /**
   * Add a container to display when no interactions are made in the book
   */
  noChapterInteractions() {
    const wrapper = document.createElement("div");
    wrapper.classList.add('h5p-interactive-book-summary-no-chapter-interactions');
    const boldText = document.createElement('p');
    boldText.innerHTML = this.l10n.noChapterInteractionBoldText;

    const normalText = document.createElement('p');
    normalText.classList.add('h5p-interactive-book-summary-no-initialized-chapters');
    normalText.innerHTML = this.l10n.noChapterInteractionText;

    wrapper.appendChild(boldText);
    wrapper.appendChild(normalText);

    this.wrapper.appendChild(wrapper);
  }

  /**
   * Add the summary page to a container
   *
   * @param {jQuery} container
   * @return {jQuery}
   */
  addSummaryPage(container) {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('h5p-interactive-book-summary-page');

    if (
      this.chapters.filter(chapter => chapter.isInitialized).length > 0 ||
      this.chapters.some(chapter => {
        return chapter.sections.some(section => section.taskDone);
      })
    ) {
      this.addProgressIndicators();
      this.addActionButtons();
      this.addSummaryOverview();
      this.addScoreBar();
    }
    else {
      this.noChapterInteractions();
    }

    Array.from(document.querySelectorAll('.h5p-interactive-book-summary-footer')).forEach(element => element.remove());

    container.append(this.wrapper);

    return container;
  }
}

export default Summary;
