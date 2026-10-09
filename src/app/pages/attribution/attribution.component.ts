import { AttributionAction } from '../../models/attribution-action';
import { ChottuLinkService } from '../../services/chottulink.service';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UtilityService } from '../../shared/utility.service';

@Component({
  selector: 'app-attribution',
  imports: [FormsModule],
  templateUrl: './attribution.component.html',
  styleUrl: './attribution.component.scss'
})
export class AttributionComponent {
  actions: AttributionAction[] = [
    this.buildAction({
      key: 'getAttributionData',
      title: 'getAttributionData',
      description:
        'Returns attributionType ("ORGANIC" or "ATTRIBUTED"), matchFound, the clicked link, destination and UTM values, or null. No input.',
      run: () => this.chottuLink.getAttributionData()
    }),
    this.buildAction({
      key: 'identify',
      title: 'identify',
      description:
        'Links this device to a known customer. Required: id. Optional: name, email, phone, and emailSha256 / phoneSha256 (send those instead of email / phone when you cannot send them in clear). Passed flat - no "customer" wrapper. A random user is generated on load and on Reset.',
      required: ['id'],
      sample: () => this.createRandomCustomer(),
      run: (payload) => {
        if (typeof payload.id !== 'string') {
          throw new Error('id must be a string.');
        }
        return this.chottuLink.identify(payload);
      }
    }),
    this.buildAction({
      key: 'trackLead',
      title: 'trackLead',
      description:
        'Records a lead. Everything is optional: eventName, metadata is free-form. Use {} to send a bare lead with defaults.',
      sample: {
        eventName: 'trial_started',
        metadata: { plan: 'pro', referral_code: 'FRIEND25' }
      },
      run: (payload) => this.chottuLink.trackLead(payload)
    }),
    this.buildAction({
      key: 'trackConversion',
      title: 'trackConversion',
      description:
        'Records a purchase / revenue event. Required: revenue (number, > 0). Optional: currency (ISO 4217), eventName, productId, transactionId, metadata. The server drops conversions whose transactionId it has already seen, so a new random one is generated on load, on Reset and after every successful run.',
      required: ['revenue'],
      sample: () => ({
        revenue: 29.99,
        currency: 'USD',
        eventName: 'subscription',
        productId: 'pro_monthly',
        transactionId: this.createTransactionId(),
        metadata: { trial_converted: true, promo_code: 'SUMMER25' }
      }),
      nextPayload: (payload) => ({ ...payload, transactionId: this.createTransactionId() }),
      run: (payload) => {
        if (typeof payload.revenue !== 'number' || payload.revenue <= 0) {
          throw new Error('revenue must be a number greater than 0.');
        }
        return this.chottuLink.trackConversion(payload);
      }
    }),
    this.buildAction({
      key: 'trackEvent',
      title: 'trackEvent',
      description:
        'Sends a custom event. Required: name. Optional: data (free-form key-value object). The SDK takes name and data as two separate arguments.',
      required: ['name'],
      sample: {
        name: 'feature_used',
        data: { feature: 'qr_code_scanner', duration_seconds: 45, success: true }
      },
      run: (payload) => this.chottuLink.trackEvent(payload.name, payload.data)
    }),
    this.buildAction({
      key: 'flush',
      title: 'flush',
      description: 'Sends any queued events immediately. No input.',
      run: () => this.chottuLink.flush()
    }),
    this.buildAction({
      key: 'logout',
      title: 'logout',
      description: 'Clears the identified customer and resets the session. No input.',
      run: () => this.chottuLink.logout()
    }),
    this.buildAction({
      key: 'optOut',
      title: 'optOut',
      description: 'Opts the device out of tracking (true) or re-enables it (false). Required: enabled (boolean).',
      required: ['enabled'],
      sample: { enabled: true },
      run: (payload) => {
        if (typeof payload.enabled !== 'boolean') {
          throw new Error('enabled must be true or false.');
        }
        return this.chottuLink.optOut(payload.enabled);
      }
    }),
    this.buildAction({
      key: 'isOptedOut',
      title: 'isOptedOut',
      description: 'Returns { isOptedOut: boolean }. No input.',
      run: () => this.chottuLink.isOptedOut()
    })
  ];

  copiedKey: string | null = null;

  constructor(private chottuLink: ChottuLinkService) {}

  /**
   * Runs one SDK method: parses and validates the JSON, calls the SDK and shows the result.
   *
   * @param { AttributionAction } action - Card that was submitted.
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  async execute(action: AttributionAction): Promise<void> {
    action.error = null;
    action.result = null;

    let payload: any = null;
    if (action.json !== null) {
      try {
        payload = JSON.parse(action.json);
      } catch (error) {
        action.error = `Invalid JSON - ${UtilityService.getErrorMessage(error)}`;
        return;
      }
      const missing = action.required.filter((path) => {
        const value = UtilityService.getByPath(payload, path);
        return value === undefined || value === null || value === '';
      });
      if (missing.length) {
        action.error = `Missing required field(s): ${missing.join(', ')}`;
        return;
      }
      action.json = UtilityService.prettyJson(payload);
    }

    action.busy = true;
    try {
      const result = await action.run(payload);
      action.result = UtilityService.prettyJson(result ?? { status: 'ok' });
      if (action.nextPayload) {
        action.json = UtilityService.prettyJson(action.nextPayload(payload));
      }
    } catch (error) {
      action.error = UtilityService.getErrorMessage(error);
    } finally {
      action.busy = false;
    }
  }

  /**
   * Re-indents the JSON text, or shows a parse error when it is invalid.
   *
   * @param { AttributionAction } action - Card being edited.
   * @return { void }
   * ----------------------------------------------------------------
   */
  format(action: AttributionAction): void {
    if (action.json === null) {
      return;
    }
    try {
      action.json = UtilityService.prettyJson(JSON.parse(action.json));
      action.error = null;
    } catch (error) {
      action.error = `Invalid JSON - ${UtilityService.getErrorMessage(error)}`;
    }
  }

  /**
   * Replaces the JSON with a freshly generated sample (new random values where the card uses them).
   *
   * @param { AttributionAction } action - Card to reset.
   * @return { void }
   * ----------------------------------------------------------------
   */
  reset(action: AttributionAction): void {
    action.json = action.createSample ? UtilityService.prettyJson(action.createSample()) : null;
    action.error = null;
  }

  /**
   * Copies the JSON input (or the result when `fromResult` is true) to the clipboard.
   *
   * @param { AttributionAction } action - Card to copy from.
   * @param { boolean } fromResult - Copy the result instead of the input.
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  async copy(action: AttributionAction, fromResult: boolean = false): Promise<void> {
    const text = fromResult ? action.result : action.json;
    if (text && (await UtilityService.copyToClipboard(text))) {
      this.copiedKey = action.key + (fromResult ? ':result' : ':input');
      setTimeout(() => (this.copiedKey = null), 1500);
    }
  }

  /**
   * Creates an action card from a compact definition.
   *
   * @param { object } def - Card definition; `sample` is a fixed object or a function that builds a fresh one.
   * @return { AttributionAction } Ready to render.
   * ----------------------------------------------------------------
   */
  private buildAction(def: {
    key: string;
    title: string;
    description: string;
    required?: string[];
    sample?: object | (() => object);
    nextPayload?: (payload: any) => object;
    run: (payload: any) => Promise<unknown>;
  }): AttributionAction {
    const sample = def.sample;
    const action = new AttributionAction();
    action.key = def.key;
    action.title = def.title;
    action.description = def.description;
    action.required = def.required ?? [];
    action.createSample =
      sample === undefined
        ? null
        : typeof sample === 'function'
          ? (sample as () => object)
          : () => structuredClone(sample);
    action.nextPayload = def.nextPayload ?? null;
    action.json = action.createSample ? UtilityService.prettyJson(action.createSample()) : null;
    action.run = def.run;
    return action;
  }

  /**
   * Builds a random customer so each `identify` test registers a distinct user.
   *
   * @return { object } Customer with a random id, name, email and phone.
   * ----------------------------------------------------------------
   */
  private createRandomCustomer(): object {
    const firstNames = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Sara', 'Vihaan', 'Zoya'];
    const lastNames = ['Sharma', 'Patel', 'Iyer', 'Khan', 'Gupta', 'Reddy', 'Das', 'Mehta'];
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const suffix = crypto.randomUUID().slice(0, 8);
    const phoneDigits = String(Math.floor(Math.random() * 10_000_000_000)).padStart(10, '0');

    return {
      id: `user_${suffix}`,
      name: `${first} ${last}`,
      email: `${first}.${last}.${suffix}@example.com`.toLowerCase(),
      phone: `+91${phoneDigits}`
    };
  }

  /**
   * Builds a unique transaction id so the server does not discard a test conversion as a duplicate.
   *
   * @return { string } Transaction id such as `txn_1a2b3c4d5e6f`.
   * ----------------------------------------------------------------
   */
  private createTransactionId(): string {
    return `txn_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
}
