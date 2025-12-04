/** Class representing URL related functions */
class URLTools {
  /**
   * Extract fragments from browser URL.
   *
   * @return {object} Fragments.
   */
  static extractFragmentsFromURL(validate, hashWindow) {
    if (!hashWindow.location.hash) {
      return {};
    }

    // Convert fragment string to object with properties
    const fragments = {};
    hashWindow.location.hash.replace('#', '').split('&')
      .forEach((fragment) => {
        if (fragment.indexOf('=') === -1) {
          return; // Skip if incomplete pair
        }
        const argPair = fragment.split('=');
        fragments[argPair[0]] = argPair[1];
      });

    // Optionally validate and ignore fragments
    if (typeof validate === 'function' && !validate(fragments)) {
      return {};
    }

    return fragments;
  }

  /**
   * Create fragments string from fragments object.
   *
   * @param {object} fragments Fragments.
   * @return {string} Fragments string.
   */
  static createFragmentsString(fragments) {
    const parts = [];
    for (const fragment in fragments) {
      parts.push(`${fragment}=${fragments[fragment]}`);
    }
    return `#${parts.join('&')}`;
  }

  /**
   * Determine whether two fragment objects are equal.
   *
   * @param {object} fragment1 Fragment 1.
   * @param {object} fragment2 Fragment 2.
   * @param {string[]} [limitTo] Keys to limit equality check to.
   * @return {boolean} True, if fragments are equal.
   */
  static areFragmentsEqual(fragment1, fragment2, limitTo = []) {
    for (const key in fragment1) {
      if (fragment1.hasOwnProperty(key)) {
        if (limitTo.length > 0 && limitTo.indexOf(key) === -1) {
          continue;
        }
        if (!fragment2[key] || fragment1[key].toString() !== fragment2[key].toString()) {
          return false;
        }
      }
    }
    return true;
  }
}
export default URLTools;
