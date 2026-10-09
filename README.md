# ChottuLink Cordova + Angular Sample

A sample app for testing the [ChottuLink Cordova SDK](https://github.com/ConnectingDotsInfotech/cordova-plugin-chottulink-sdk) (`cordova-plugin-chottulink-sdk`) from an **Angular 20** app packaged with **Apache Cordova**. It covers dynamic link creation, deep link handling, and attribution / event tracking.

## What the app shows

The app has three tabs.

| Tab | What it does |
| --- | --- |
| **Events** | Live log of everything the SDK does: init, deep link resolved / not resolved, attribution and tracking calls, and errors. Filter by type, expand a payload to see pretty JSON, and copy it. |
| **Create link** | Form for every `createDynamicLink` option, with validation. After submit, the created short link is shown with a copy button, and directly below it the result of resolving that same link with `getAppLinkDataFromUrl` (its `appLinkData`). A second card lets you resolve any other short URL on demand. |
| **Attribution** | One card per method: `getAttributionData`, `identify`, `trackLead`, `trackConversion`, `trackEvent`, `flush`, `logout`, `optOut`, `isOptedOut`. Each payload is editable, pretty-printed JSON with Format, Copy and Reset buttons, and required fields are checked before sending. |

> The SDK only works in a **native** iOS or Android build. In a plain browser tab (`ng serve`) the UI loads so you can preview the screens, but every SDK call is skipped with a message explaining why - run it with `cordova run` to actually exercise the plugin.

## Prerequisites

- Node.js 20.19+ and npm
- Apache Cordova CLI installed globally: `npm install -g cordova`
- A [ChottuLink account](https://docs.chottulink.com/onboarding) with an API key and a domain such as `myapp.chottu.link`
- **Android:** Android Studio (with an SDK, cmdline-tools, and Gradle) and JDK 17+. A device with USB debugging, or an emulator with Google Play.
- **iOS:** a Mac with Xcode 16.2+, an Apple Developer team, and a real device - Universal Links don't work reliably in the simulator, and the plugin's `.xcframework` may not ship an x86_64 (Intel) simulator slice.
- `cordova-plugin-chottulink-sdk` is installed straight from [npm](https://www.npmjs.com/package/cordova-plugin-chottulink-sdk) - no separate plugin checkout needed.

## 1. Replace the placeholders

Everything you need to change is marked `YOUR_...`. Run this to list every place:

```bash
grep -rn "YOUR_" src config.xml package.json
```

| # | What | Where | Replace with |
| --- | --- | --- | --- |
| 1 | API key | `API_KEY` in [src/app/constants/chottulink.config.ts](src/app/constants/chottulink.config.ts) | Your key from the ChottuLink dashboard |
| 2 | Domain | `DOMAIN` in the same file | Your domain, no protocol, e.g. `myapp.chottu.link` |
| 3 | Native domain | `CHOTTULINK_DOMAIN` under `cordova.plugins["cordova-plugin-chottulink-sdk"]` in [package.json](package.json) | The **same domain** as #2 |
| 4 | App identifier | `id` attribute on `<widget>` in [config.xml](config.xml) | Your own reverse-DNS app id. Default: `com.chottulink.cordovasample` |

Notes:

- **#1 and #2 are the only values the TypeScript code reads.** The form defaults for the Create link tab (destination URL, UTM values, etc.) are in the same file, under `DEFAULTS`.
- **#3 is native config.** `CHOTTULINK_DOMAIN` is written into the Android App Links intent filter and the iOS Associated Domains entitlement the moment you add the plugin (or run `cordova prepare`) - it must match #2 exactly, or links will open the browser instead of the app. To change the domain after the plugin is already added, edit it in `package.json` and re-run `cordova prepare`, or `cordova plugin remove cordova-plugin-chottulink-sdk` and re-add it with the new `--variable` value.
- **Dashboard:** in the ChottuLink dashboard, register your app's package name and SHA-256 signing fingerprint (Android), and bundle ID and Team ID (iOS). Without this, link verification fails even if everything above is correct.
- **Default values are fine if you only want to try link creation** - set #1 and #2 and skip deep link verification for now.

Don't commit your real key or domain. Keep the placeholders in git and use your real values only in your local copy.

## 2. Install

```bash
npm install
```

This installs `cordova-plugin-chottulink-sdk` from [npm](https://www.npmjs.com/package/cordova-plugin-chottulink-sdk) as a devDependency, including its TypeScript types (for editor autocomplete) - it does **not** install the native plugin into a platform yet, that happens in step 3.

## 3. Add platforms and the plugin

```bash
cordova platform add android
cordova platform add ios      # macOS only
```

`cordova-plugin-chottulink-sdk` is auto-installed for each platform straight from the `cordova.plugins` block in `package.json` (step 1, #3) - no separate `cordova plugin add` command needed. If you ever need to add it manually (e.g. after a `cordova plugin remove`):

```bash
cordova plugin add cordova-plugin-chottulink-sdk --variable CHOTTULINK_DOMAIN=yourapp.chottu.link
```

### iOS: deployment target & Associated Domains

`config.xml` already sets `<preference name="deployment-target" value="15.6" />` for you - required by the plugin's shipped `.xcframework`. You still need to enable the **Associated Domains** capability for your App ID in the Apple Developer portal and regenerate your provisioning profile, otherwise the entitlement is stripped at signing. See the [plugin README](https://github.com/ConnectingDotsInfotech/cordova-plugin-chottulink-sdk#ios-enable-associated-domains-on-your-app-id) for details.

### Android: `assetlinks.json`

`android:autoVerify="true"` is set for you by the plugin, but Android only skips the app-chooser dialog once it can fetch `https://yourapp.chottu.link/.well-known/assetlinks.json` and match your signing certificate. Confirm this in the ChottuLink dashboard after adding your app's SHA-256 fingerprint.

## 4. Run

```bash
npm run cordova:android     # build the Angular app into www/, then cordova run android
npm run cordova:ios         # same, for iOS (macOS only)
```

Or do it in two steps whenever you only changed native config (no need to rebuild Angular):

```bash
npm run cordova:prepare     # ng build + copy dist/.../browser into www/
cordova run android
```

### Browser (UI preview only, no plugin)

```bash
npm start                    # http://localhost:4200
```

**Run `npm run cordova:prepare` (or `cordova:android` / `cordova:ios`) again after every change** to the web code. `www/` is a build artifact, generated fresh each time - it is gitignored, same as `platforms/` and `plugins/`.

> **Opening the native project directly in Android Studio / Xcode?** Run `npm run cordova:prepare` (or `cordova prepare ios` / `cordova prepare android`) from the CLI **first**. Android Studio / Xcode just build whatever is already inside `platforms/<platform>/`; they do not re-run Cordova's prepare step, so a stale `platforms/ios/www/` (missing the latest plugin wiring or web changes) will silently build and run anyway. If the Events tab logs `"platform": "browser"` on a real device/simulator, that's the symptom - it means `window.cordova` itself never loaded, which means the build you launched was prepared before the plugin was fully added. Re-run `npm run cordova:prepare`, then in Xcode do **Product → Clean Build Folder** before running again (and make sure you opened `App.xcworkspace`, not `App.xcodeproj` - CocoaPods dependencies only link from the workspace).

## Useful commands

| Command | What it does |
| --- | --- |
| `npm start` | Run in the browser (UI preview only) |
| `npm run build` | Build the Angular app to `dist/` |
| `npm run cordova:prepare` | Build the Angular app and copy it into `www/` |
| `npm run cordova:android` / `npm run cordova:ios` | Prepare, then `cordova run <platform>` |
| `npm run cordova:build:android` / `npm run cordova:build:ios` | Prepare, then `cordova build <platform>` (no install/launch) |

## Powered by ChottuLink

Drop-in replacement for Firebase Dynamic Links with deferred deep linking, custom domains & real-time analytics.

→ [Visit chottulink.com](https://chottulink.com)  
→ [Get Started](https://app.chottulink.com/register)  
→ [Try free deep link tester tool](https://chottulink.com/tools/deep-link-tester/index.html)  
→ [Comparison with Branch](https://chottulink.com/blog/branch-io-vs-chottulink-which-deep-linking-platform-wins-in-2025-flexibility-vs-enterprise-lock-in-2/)

## Troubleshoot & Test Deep links

For more detailed troubleshooting steps and testing procedures, visit: [https://docs.chottulink.com/troubleshooting](https://docs.chottulink.com/troubleshooting)
