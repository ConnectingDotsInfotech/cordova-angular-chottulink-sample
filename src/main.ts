import { App } from './app/app';
import { appConfig } from './app/app.config';
import { bootstrapApplication } from '@angular/platform-browser';

/**
 * Starts the Angular app. Pulled out of the module body so it can be invoked
 * either immediately (plain browser) or after `deviceready` (device/emulator).
 *
 * @return { void }
 * ----------------------------------------------------------------
 */
function bootstrap(): void {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}

if ((window as any).cordova) {
  // On a real device/emulator, cordova.js is present and plugins (including
  // ChottuLink) are only safe to touch once `deviceready` has fired.
  document.addEventListener('deviceready', bootstrap, false);
} else {
  // `ng serve` / a plain browser tab - there is no Cordova runtime at all.
  bootstrap();
}
