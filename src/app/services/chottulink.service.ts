import { CHOTTULINK_CONFIG, PLACEHOLDER_PREFIX } from '../constants/chottulink.config';
import type {
  CLAttributionData,
  CLConversionMeta,
  CLCustomerMeta,
  CLDynamicLinkBuilder,
  CLLeadMeta,
  CLResolvedLink,
  ChottuLinkPlugin
} from 'cordova-plugin-chottulink-sdk';
import { EventLogService } from './event-log.service';
import { Injectable } from '@angular/core';
import { LogType } from '../models/enums/log-type.enum';
import { UtilityService } from '../shared/utility.service';

@Injectable({ providedIn: 'root' })
export class ChottuLinkService {
  private initialized: boolean = false;

  constructor(private eventLog: EventLogService) {}

  /**
   * Registers the deep link listeners and initialises the SDK.
   * Listeners are registered first so a cold-start link is never missed.
   * Assumes `deviceready` has already fired - see `main.ts`.
   *
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (!this.isAvailable()) {
      this.eventLog.add(
        LogType.INFO,
        'ChottuLink plugin not found - run this app with `cordova run android|ios`, not `ng serve`',
        { platform: this.getPlatform() }
      );
      return;
    }
    if (CHOTTULINK_CONFIG.API_KEY.startsWith(PLACEHOLDER_PREFIX)) {
      this.eventLog.add(
        LogType.ERROR,
        'API key is still a placeholder - edit src/app/constants/chottulink.config.ts'
      );
      return;
    }

    await this.registerListeners();

    try {
      await this.plugin.initialize({ apiKey: CHOTTULINK_CONFIG.API_KEY });
      this.initialized = true;
      this.eventLog.add(LogType.INIT, 'SDK initialised', { platform: this.getPlatform() });
    } catch (error) {
      this.eventLog.add(LogType.ERROR, 'SDK initialisation failed', {
        error: UtilityService.getErrorMessage(error)
      });
    }
  }

  /**
   * [SDK]:- Creates a dynamic short link.
   *
   * @param { CLDynamicLinkBuilder } builder - Link configuration, passed flat to the plugin.
   * @return { Promise<{ shortURL: string | null }> } Created link.
   * ----------------------------------------------------------------
   */
  createDynamicLink(builder: CLDynamicLinkBuilder): Promise<{ shortURL: string | null }> {
    return this.call(LogType.LINK_CREATED, 'createDynamicLink', builder, () =>
      this.plugin.createDynamicLink(builder)
    );
  }

  /**
   * [SDK]:- Resolves a short URL into its original link data.
   *
   * @param { string } shortURL - Short link to resolve.
   * @return { Promise<CLResolvedLink | null> } Resolved data.
   * ----------------------------------------------------------------
   */
  getAppLinkDataFromUrl(shortURL: string): Promise<CLResolvedLink | null> {
    return this.call(LogType.LINK_RESOLVED, 'getAppLinkDataFromUrl', { shortURL }, () =>
      this.plugin.getAppLinkDataFromUrl({ shortURL })
    );
  }

  /**
   * [SDK]:- Fetches the install attribution data.
   *
   * @return { Promise<CLAttributionData | null> } Attribution payload.
   * ----------------------------------------------------------------
   */
  getAttributionData(): Promise<CLAttributionData | null> {
    return this.call(LogType.ATTRIBUTION, 'getAttributionData', null, () =>
      this.plugin.getAttributionData()
    );
  }

  /**
   * [SDK]:- Associates the device with a known customer.
   *
   * @param { CLCustomerMeta } customer - Customer details, passed directly (no wrapper key).
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  identify(customer: CLCustomerMeta): Promise<void> {
    return this.call(LogType.TRACKING, 'identify', customer, () => this.plugin.identify(customer));
  }

  /**
   * [SDK]:- Tracks a lead event.
   *
   * @param { CLLeadMeta } meta - Optional lead metadata, passed directly (no wrapper key).
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  trackLead(meta?: CLLeadMeta): Promise<void> {
    return this.call(LogType.TRACKING, 'trackLead', meta ?? null, () => this.plugin.trackLead(meta));
  }

  /**
   * [SDK]:- Tracks a conversion (purchase / revenue) event.
   *
   * @param { CLConversionMeta } meta - Conversion details, passed directly (no wrapper key).
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  trackConversion(meta: CLConversionMeta): Promise<void> {
    return this.call(LogType.TRACKING, 'trackConversion', meta, () =>
      this.plugin.trackConversion(meta)
    );
  }

  /**
   * [SDK]:- Tracks a custom event.
   *
   * @param { string } name - Event name.
   * @param { Record<string, any> } data - Optional event properties.
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  trackEvent(name: string, data?: Record<string, any>): Promise<void> {
    return this.call(LogType.TRACKING, 'trackEvent', { name, data }, () =>
      this.plugin.trackEvent(name, data)
    );
  }

  /**
   * [SDK]:- Sends any queued events immediately.
   *
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  flush(): Promise<void> {
    return this.call(LogType.TRACKING, 'flush', null, () => this.plugin.flush());
  }

  /**
   * [SDK]:- Clears the identified customer.
   *
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  logout(): Promise<void> {
    return this.call(LogType.TRACKING, 'logout', null, () => this.plugin.logout());
  }

  /**
   * [SDK]:- Enables or disables tracking for this device.
   *
   * @param { boolean } enabled - `true` to opt the user out.
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  optOut(enabled: boolean): Promise<void> {
    return this.call(LogType.TRACKING, 'optOut', { enabled }, () =>
      this.plugin.optOut({ enabled })
    );
  }

  /**
   * [SDK]:- Reads the current opt-out state.
   *
   * @return { Promise<{ isOptedOut: boolean }> }
   * ----------------------------------------------------------------
   */
  isOptedOut(): Promise<{ isOptedOut: boolean }> {
    return this.call(LogType.TRACKING, 'isOptedOut', null, () => this.plugin.isOptedOut());
  }

  /**
   * Subscribes to the SDK's deep link events and waits for both to resolve.
   * Safe to call before `initialize`, which is why it runs first (and is
   * awaited) in `initialize()` above - `addListener` only resolves once the
   * native event channel is actually open, so awaiting it here closes the
   * window where `initialize()` could otherwise race ahead of the channel
   * and emit a deferred-link result nothing is listening for yet.
   *
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  private async registerListeners(): Promise<void> {
    await Promise.all([
      this.plugin.addListener('onDeepLinkResolved', (data) =>
        this.eventLog.add(LogType.DEEPLINK_RESOLVED, `Deep link resolved: ${data.url}`, data)
      ),
      this.plugin.addListener('onDeepLinkFailed', (data) =>
        this.eventLog.add(LogType.DEEPLINK_FAILED, `Deep link not resolved: ${data.error}`, data)
      )
    ]);
  }

  /**
   * Runs an SDK call, logging the request and either the response or the error.
   * Errors are re-thrown so the calling screen can show them inline.
   *
   * @param { LogType } type - Log category used on success.
   * @param { string } method - SDK method name.
   * @param { unknown } request - Arguments sent to the SDK.
   * @param { () => Promise<T> } fn - The actual SDK call.
   * @return { Promise<T> } SDK response.
   * ----------------------------------------------------------------
   */
  private async call<T>(
    type: LogType,
    method: string,
    request: unknown,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      if (!this.isAvailable()) {
        throw new Error('The ChottuLink SDK is only available on a native iOS / Android build.');
      }
      const response = await fn();
      this.eventLog.add(type, method, { request, response: response ?? null });
      return response;
    } catch (error) {
      const message = UtilityService.getErrorMessage(error);
      this.eventLog.add(LogType.ERROR, `${method} failed: ${message}`, { request, error: message });
      throw error;
    }
  }

  /**
   * Returns the native plugin bridge exposed by `cordova.js`.
   *
   * @return { ChottuLinkPlugin }
   * ----------------------------------------------------------------
   */
  private get plugin(): ChottuLinkPlugin {
    return (window as any).ChottuLink;
  }

  /**
   * Whether the Cordova runtime and the plugin are both present - false in a
   * plain browser tab (e.g. `ng serve`).
   *
   * @return { boolean }
   * ----------------------------------------------------------------
   */
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).cordova && !!(window as any).ChottuLink;
  }

  /**
   * Reads the current Cordova platform id, for logging only.
   *
   * @return { string }
   * ----------------------------------------------------------------
   */
  private getPlatform(): string {
    return (window as any).cordova?.platformId ?? 'browser';
  }
}
