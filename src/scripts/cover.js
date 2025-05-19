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
    this.container = H5P.Components.CoverPage({
      title: titleText,
      description: params.coverDescription,
      buttonLabel: readText,
      buttonOnClick: () => {
        this.removeCover(true);
      },
      icon: 'book',
      useMediaContainer: true,
    });

    this.visuals = this.container.querySelector('.h5p-theme-cover-img');
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
