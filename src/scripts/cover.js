/**
 * The introduction module
 * Constructor function.
 */
class Cover extends H5P.EventDispatcher {
  constructor(params, titleText, readText, contentId, parent) {
    super();

    this.parent = parent;

    this.params = params;
    this.contentId = contentId;

    // Container
    this.container = this.createContainer();

    // Visual header
    if (params.coverMedium) {
      this.visuals = this.createVisualsElement(params.coverMedium);
      if (this.visuals) {
        this.container.appendChild(this.visuals);
      }
    }
    else {
      this.container.classList.add('h5p-cover-nographics');
    }

    // Title
    this.container.appendChild(this.createTitleElement(titleText));

    // Description text
    if (params.coverDescription) {
      this.container.appendChild(this.createDescriptionElement(params.coverDescription));
    }

    // Read button
    this.container.appendChild(this.createReadButton(readText));
  }

  /**
   * Create the top level element.
   *
   * @return {HTMLElement} Cover.
   */
  createContainer() {
    const container = document.createElement('div');
    container.classList.add('h5p-interactive-book-cover');
    return container;
  }

  /**
   * Create an element which contains both the cover image and a background bar.
   *
   * @param {object} coverImage Image object.
   */
  createVisualsElement(params) {
    if (!params || !params.params) {
      return null;
    }

    const visuals = document.createElement('div');
    visuals.classList.add('h5p-interactive-book-cover-graphics');

    return visuals;
  }

  /**
   * Initialize Media.
   * The YouTube handler requires the video wrapper to be attached to the DOM
   * already.
   */
  initMedia() {
    if (!this.visuals || !this.params.coverMedium) {
      return;
    }

    const coverMedium = this.params.coverMedium;

    // Preparation
    if ((coverMedium.library || '').split(' ')[0] === 'H5P.Video') {
      coverMedium.params.visuals.fit = false;
    }

    const instance = H5P.newRunnable(coverMedium, this.contentId, H5P.jQuery(this.visuals), false, { metadata: coverMedium.medatata } );

    // Resize parent when children resize
    this.bubbleUp(
      instance, 'resize', this.parent
    );

    // Resize children to fit inside parent
    this.bubbleDown(
      this.parent, 'resize', [instance]
    );

    // Postparation
    if ((coverMedium.library || '').split(' ')[0] === 'H5P.Image') {
      const image = this.visuals.querySelector('img') || this.visuals.querySelector('.h5p-placeholder');
      image.style.height = 'auto';
      image.style.width = 'auto';
    }

    this.visuals.appendChild(this.createCoverBar());
  }

  /**
   * Make it easy to bubble events from child to parent.
   * @param {object} origin Origin of event.
   * @param {string} eventName Name of event.
   * @param {object} target Target to trigger event on.
   */
  bubbleUp(origin, eventName, target) {
    origin.on(eventName, (event) => {
      // Prevent target from sending event back down
      target.bubblingUpwards = true;

      // Trigger event
      target.trigger(eventName, event);

      // Reset
      target.bubblingUpwards = false;
    });
  }

  /**
   * Make it easy to bubble events from parent to children.
   * @param {object} origin Origin of event.
   * @param {string} eventName Name of event.
   * @param {object[]} targets Targets to trigger event on.
   */
  bubbleDown(origin, eventName, targets) {
    origin.on(eventName, (event) => {
      if (origin.bubblingUpwards) {
        return; // Prevent send event back down.
      }

      targets.forEach((target) => {
        target.trigger(eventName, event);
      });
    });
  }

  /**
   * Create Image.
   *
   * @param {string} path Relative image path.
   * @param {number} contentId Content id.
   * @param {string|null} altText
   */
  createImage(path, contentId, altText) {
    const img = document.createElement('img');
    img.classList.add('h5p-interactive-book-cover-image');
    img.src = H5P.getPath(path, contentId);
    img.setAttribute('draggable', 'false');
    if (altText) {
      img.alt = altText;
    }

    return img;
  }

  /**
   * Create an element responsible for the bar behind an image.
   *
   * @return {HTMLElement} Horizontal bar in the background.
   */
  createCoverBar() {
    const coverBar = document.createElement('div');
    coverBar.classList.add('h5p-interactive-book-cover-bar');
    return coverBar;
  }

  /**
   * Create title.
   *
   * @param {string} titleText Text for title element.
   * @return {HTMLElement} Title element.
   */
  createTitleElement(titleText) {
    const title = document.createElement('p');
    title.innerHTML = titleText;

    const titleWrapper = document.createElement('div');
    titleWrapper.classList.add('h5p-interactive-book-cover-title');
    titleWrapper.appendChild(title);

    return titleWrapper;
  }

  /**
   * Create description.
   *
   * @param {string} descriptionText Text for description element.
   * @return {HTMLElement} Description element.
   */
  createDescriptionElement(descriptionText) {
    if (!descriptionText) {
      return null;
    }

    const descriptionElement = document.createElement('div');
    descriptionElement.classList.add('h5p-interactive-book-cover-description');
    descriptionElement.innerHTML = descriptionText;

    return descriptionElement;
  }

  /**
   * Create a button element.
   *
   * @param {string} buttonText Button text.
   * @return {HTMLElement} Read button element.
   */
  createReadButton(buttonText) {
    const button = document.createElement('button');
    button.innerHTML = buttonText;
    button.onclick = () => {
      this.removeCover(true);
    };

    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('h5p-interactive-book-cover-readbutton');
    buttonWrapper.appendChild(button);

    return buttonWrapper;
  }

  /**
   * Remove cover.
   */
  removeCover(focus = false) {
    if (this.container.parentElement) {
      this.container.parentElement.classList.remove('covered');
      this.container.parentElement.removeChild(this.container);
    }

    this.hidden = true;
    this.parent.trigger('coverRemoved', focus);
  }
}

export default Cover;
