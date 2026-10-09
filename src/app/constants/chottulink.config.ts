/**
 * Single place to configure the sample app.
 *
 * Replace every `YOUR_*` placeholder below before running on a device.
 * Native setup (Android intent filters / iOS Associated Domains) is driven by
 * the `CHOTTULINK_DOMAIN` variable in `config.xml` - it must match `DOMAIN` below.
 * See the README for details.
 * ----------------------------------------------------------------
 */
export const CHOTTULINK_CONFIG = {
  /** API key from the ChottuLink dashboard (Settings -> API Keys). */
  API_KEY: 'YOUR_CHOTTULINK_API_KEY',

  /** Your ChottuLink domain without protocol, e.g. `myapp.chottu.link`. Must match config.xml. */
  DOMAIN: 'YOUR_CHOTTULINK_DOMAIN',

  /** Prefilled values for the "Create link" form. */
  DEFAULTS: {
    DESTINATION_URL: 'https://example.com/product/123',
    LINK_NAME: 'sample-link',
    SOCIAL_TITLE: 'Check out this link',
    SOCIAL_DESCRIPTION: 'Created from the ChottuLink Cordova sample app',
    SOCIAL_IMAGE_URL: 'https://example.com/image.jpg',
    UTM_SOURCE: 'sample-app',
    UTM_MEDIUM: 'share',
    UTM_CAMPAIGN: 'demo'
  }
} as const;

/** Prefix used by the placeholders above, used to detect an unconfigured sample. */
export const PLACEHOLDER_PREFIX = 'YOUR_';
