export default class Screenreader {

  /**
   * Get Live region DOM.
   * @returns {HTMLElement} Live region DOM.
   */
  static getDOM() {
    return Screenreader.dom;
  }

  /**
   * Set class if default CSS values do not suffice.
   * @param {string} className Class name to set. Add CSS elsewhere.
   */
  static setClass(className) {
    if (typeof className !== 'string') {
      return;
    }

    // Remove default values
    Screenreader.dom.style.height = '';
    Screenreader.dom.style.overflow = '';
    Screenreader.dom.style.position = '';
    Screenreader.dom.style.textIndent = '';
    Screenreader.dom.style.top = '';
    Screenreader.dom.style.width = '';

    Screenreader.dom.classList = className;
  }

  /**
   * Read text via aria live region.
   * @param {string} text Text to read.
   */
  static read(text) {
    if (Screenreader.readText) {
      const lastChar = Screenreader.readText
        .substring(Screenreader.readText.length - 1);

      Screenreader.readText = [
        `${Screenreader.readText}${lastChar === '.' ? '' : '.'}`,
        text
      ].join(' ');
    }
    else {
      Screenreader.readText = text;
    }

    Screenreader.dom.innerText = Screenreader.readText;

    window.clearTimeout(Screenreader.timeout);
    Screenreader.timeout = window.setTimeout(function () {
      Screenreader.readText = null;
      Screenreader.dom.innerText = '';
    }, 100);
  }
}

// Aria live region
Screenreader.dom = document.createElement('div');
Screenreader.dom.setAttribute('aria-live', 'polite');
Screenreader.dom.style.height = '1px';
Screenreader.dom.style.overflow = 'hidden';
Screenreader.dom.style.position = 'absolute';
Screenreader.dom.style.textIndent = '1px';
Screenreader.dom.style.top = '-1px';
Screenreader.dom.style.width = '1px';

// Text being read
Screenreader.readText = null;

// Timeout
Screenreader.timeout = null;
