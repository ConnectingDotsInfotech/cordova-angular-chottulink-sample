/**
 * Mirrors the plugin's `CLDynamicLinkBehaviour` wire values (1 / 2).
 *
 * The native enum only exists as a property on the native bridge object
 * (`window.ChottuLink.CLDynamicLinkBehaviour`), not as something importable
 * from the `cordova-plugin-chottulink-sdk` package at build time - the
 * package ships no runtime JS module, only ambient types. This local copy
 * lets the "Create link" form bind to a real value in every environment,
 * including a plain browser tab where the plugin bridge is not present.
 */
export enum DynamicLinkBehaviour {
  BROWSER = 1,
  APP = 2
}
