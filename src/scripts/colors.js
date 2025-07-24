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

    // Update the hue-shifted palette based on the new base color
    Colors.updateThemeAlternativesFromHue(Colors.colorBase);

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
    }, { contrast: 0 }).color;
  }

  /**
   * Get only the hue from a hex/color.
   * @param {string|Color} hex
   * @return {number}
   */
  static getHue(hex) {
    return Color(hex).hsl().object().h;
  }

  /**
   * Return a new Color where we keep S & L from the original, but replace H.
   * @param {string|Color} hex
   * @param {number} newHue
   * @return {Color}
   */
  static replaceHue(hex, newHue) {
    const { s, l } = Color(hex).hsl().object();
    return Color.hsl(newHue, s, l);
  }

  /**
   * Builds the 4 “theme alternative” colors using the user's hue.
   * @param {Color} baseColor
   */
  static updateThemeAlternativesFromHue(baseColor) {
    const hue = baseColor.hsl().object().h;

    Colors.themeAlternatives = Object.entries(Colors.DEFAULT_THEME_ALTERNATIVES)
      .reduce((acc, [key, hex]) => {
        acc[key] = Colors.replaceHue(hex, hue).hex().toLowerCase();
        return acc;
      }, {});
  }

  /**
   * Get the re-hued alternative color (already hex).
   * @param {'base'|'light'|'dark'|'darker'} which
   * @return {string}
   */
  static getAlternative(which) {
    return Colors.themeAlternatives?.[which] ?? Colors.DEFAULT_THEME_ALTERNATIVES[which];
  }

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
    const altBase   = Colors.getAlternative('base');
    const altLight  = Colors.getAlternative('light');
    const altDarker = Colors.getAlternative('darker');

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
      --h5p-theme-main-cta-base: ${altBase};
      --h5p-theme-contrast-cta-light: ${altLight};
      --h5p-theme-contrast-cta-white: ${altDarker};
    }`;
  }
}

/** @const {string} Preferred default color as defined in SCSS */
Colors.DEFAULT_COLOR_BASE = Color('#1768c4');
Colors.DEFAULT_COLOR_BG = Color('#ffffff');

/** @const {number} Minimum acceptable contrast for normal font size, cmp. https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-procedure */
Colors.MINIMUM_ACCEPTABLE_CONTRAST = 4.5;

Colors.DEFAULT_THEME_ALTERNATIVES = {
  base:   '#EEEFFA',
  light:  '#F8F9FE',
  darker: '#CED1EE'
};

// Start state
Colors.colorBase = Colors.DEFAULT_COLOR_BASE;
Colors.colorText = Colors.DEFAULT_COLOR_BG;
Colors.themeAlternatives = { ...Colors.DEFAULT_THEME_ALTERNATIVES };
