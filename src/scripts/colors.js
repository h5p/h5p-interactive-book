import Color from 'color';
import './../styles/_color_overrides.scss';

/**
 * Color class.
 * @class
 */
export default class Colors {

  /**
   * Set new base color.
   * @param {string} color RGB color code in hex: #rrggbb.
   */
  static setBase(color) {
    if (!color) {
      return;
    }

    Colors.colorBase = Color(color);

    // Get contrast color with highest contrast
    Colors.colorText = [
      Colors.DEFAULT_COLOR_BG,
      Colors.computeContrastColor(Colors.colorBase),
      Colors.computeContrastColor(Colors.colorBase, Colors.DEFAULT_COLOR_BG)
    ].map(color => ({
      color: color,
      contrast: Colors.colorBase.contrast(color)
    })).reduce((result, current) => {
      return (current.contrast > result.contrast) ? current : result;
    }, {contrast: 0}).color;
  }

  /**
   * Get color.
   * @param {Color} color Base color.
   * @param {object} [params={}] Parameters.
   * @param {number} [params.opacity] Opacity value assuming white background.
   * @return {Color} Color with opacity figured in.
   */
  static getColor(color, params = {}) {
    if (
      typeof params.opacity === 'string' &&
      /^([0-9]|[1-8][0-9]|9[0-9]|100)(\.\d+)?\s?%$/.test(params.opacity)
    ) {
      params.opacity = parseInt(params.opacity) / 100;
    }

    if (
      typeof params.opacity !== 'number' ||
      params.opacity < 0 ||
      params.opacity > 1
    ) {
      return color;
    }

    const rgbBackground = Color('#ffffff').rgb().array();

    return Color.rgb(
      color.rgb().array().map((value, index) => {
        return params.opacity * value + (1 - params.opacity) * rgbBackground[index];
      })
    );
  }

  /**
   * Check whether color is default base color.
   * @param {string} color RGB color code in hex: #rrggbb.
   * @return {boolean} True, if color is default base color, else false.
   */
  static isBaseColor(color) {
    return Color(color).hex() === Colors.colorBase.hex();
  }

  /**
   * Compute contrast color to given color.
   * Tries to get contrast ratio of at least 4.5.
   * @compare https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-description
   * @param {Color} baseColor Color to compute contrast color for.
   * @param {Color} comparisonColor Color that the base color is compared to.
   * @return {Color} Contrast color.
   */
  static computeContrastColor(baseColor, comparisonColor) {
    comparisonColor = comparisonColor || baseColor;

    const luminance = comparisonColor.luminosity();

    let contrastColor;
    for (let diff = 0; diff <= 1; diff = diff + 0.05) {
      contrastColor = Color.rgb(baseColor.rgb().array().map(value => {
        return value * ((luminance > .5) ? (1 - diff) : (1 + diff));
      }));

      const contrast = contrastColor.contrast(comparisonColor);
      if (contrast >= Colors.MINIMUM_ACCEPTABLE_CONTRAST) {
        break;
      }
    }

    return contrastColor;
  }

  /**
   * Get CSS override for content type.
   * @param {string} machineName content types machine name.
   * @return {string} CSS override for content type.
   */
  static getContentTypeCSS(machineName) {
    if (!Colors.COLOR_OVERRIDES[machineName]) {
      return '';
    }

    return Colors.COLOR_OVERRIDES[machineName].getCSS();
  }

  /**
   * Get CSS overrides.
   * Color values are set in SCSS including pseudo elements, so we need to
   * override CSS.
   * @return {string} CSS overrides.
   */
  static getCSS() {
    return `:root{
      --color-base: ${Colors.colorBase};
      --color-base-5: ${Colors.getColor(Colors.colorBase, { opacity: .05 })};
      --color-base-10: ${Colors.getColor(Colors.colorBase, { opacity: .1 })};
      --color-base-20: ${Colors.getColor(Colors.colorBase, { opacity: .2 })};
      --color-base-75: ${Colors.getColor(Colors.colorBase, { opacity: .75 })};
      --color-base-80: ${Colors.getColor(Colors.colorBase, { opacity: .80 })};
      --color-base-85: ${Colors.getColor(Colors.colorBase, { opacity: .85 })};
      --color-base-90: ${Colors.getColor(Colors.colorBase, { opacity: .9 })};
      --color-base-95: ${Colors.getColor(Colors.colorBase, { opacity: .95 })};
      --color-text: ${Colors.colorText};
      --color-contrast: ${Colors.computeContrastColor(Colors.colorBase, Colors.DEFAULT_COLOR_BG)};
    }`;
  }

  /**
   * Compute a color that has a specific contrast ratio against another color.
   *
   * @param {string} hueSourceColor Color to adjust (hex).
   * @param {number} targetRatio Desired contrast ratio.
   * @param {string} contrastAgainstColor Color to compare contrast against (hex).
   * @returns {string} Hex color string with desired contrast.
   */
  static getColorWithContrastRatio(hueSourceColor, targetRatio, contrastAgainstColor) {
    const hueSource = Color(hueSourceColor);
    const against = Color(contrastAgainstColor || hueSourceColor);

    const hsl = hueSource.hsl().object();
    const isLight = against.luminosity() > 0.5;

    let low = 0;
    let high = 100;
    let bestColor = null;
    let bestRatioDiff = Infinity;

    while (high - low > 0.5) {
      const mid = (low + high) / 2;

      const testColor = Color({ h: hsl.h, s: hsl.s, l: mid });
      const ratio = testColor.contrast(against);
      const diff = Math.abs(ratio - targetRatio);

      if (diff < bestRatioDiff) {
        bestRatioDiff = diff;
        bestColor = testColor.hex();
        if (diff < 0.05) break;
      }

      if (ratio < targetRatio) {
        if (isLight) {
          high = mid;
        } else {
          low = mid;
        }
      } else {
        if (isLight) {
          low = mid;
        } else {
          high = mid;
        }
      }
    }

    if (!bestColor || bestRatioDiff > 1.0) {
      return Color({ h: hsl.h, s: hsl.s, l: isLight ? 15 : 85 }).hex();
    }

    return bestColor;
  }
}

/** @const {string} Preferred default color as defined in SCSS */
Colors.DEFAULT_COLOR_BASE = Color('#1768c4');
Colors.DEFAULT_COLOR_BG = Color('#ffffff');

/** @const {number} Minimum acceptable contrast for normal font size, cmp. https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-procedure */
Colors.MINIMUM_ACCEPTABLE_CONTRAST = 4.5;

// Relevant default colors defined in SCSS main class or derived from those
Colors.colorBase = Colors.DEFAULT_COLOR_BASE;
Colors.colorText = Colors.DEFAULT_COLOR_BG;
