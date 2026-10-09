import { CHOTTULINK_CONFIG } from '../../constants/chottulink.config';
import type { CLDynamicLinkBuilder, CLResolvedLink } from 'cordova-plugin-chottulink-sdk';
import { ChottuLinkService } from '../../services/chottulink.service';
import { Component, inject } from '@angular/core';
import { DynamicLinkBehaviour } from '../../models/enums/dynamic-link-behaviour.enum';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UtilityService } from '../../shared/utility.service';

@Component({
  selector: 'app-create-link',
  imports: [ReactiveFormsModule],
  templateUrl: './create-link.component.html',
  styleUrl: './create-link.component.scss'
})
export class CreateLinkComponent {
  protected readonly DynamicLinkBehaviour = DynamicLinkBehaviour;
  protected readonly prettyJson = UtilityService.prettyJson;

  private formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    destinationURL: [
      CHOTTULINK_CONFIG.DEFAULTS.DESTINATION_URL,
      [Validators.required, UtilityService.urlValidator()]
    ],
    domain: [CHOTTULINK_CONFIG.DOMAIN, [Validators.required, UtilityService.domainValidator()]],
    linkName: [CHOTTULINK_CONFIG.DEFAULTS.LINK_NAME],
    androidBehaviour: [DynamicLinkBehaviour.APP],
    iosBehaviour: [DynamicLinkBehaviour.APP],
    selectedPath: [''],
    socialTitle: [CHOTTULINK_CONFIG.DEFAULTS.SOCIAL_TITLE],
    socialDescription: [CHOTTULINK_CONFIG.DEFAULTS.SOCIAL_DESCRIPTION],
    socialImageUrl: [CHOTTULINK_CONFIG.DEFAULTS.SOCIAL_IMAGE_URL, [UtilityService.urlValidator()]],
    utmSource: [CHOTTULINK_CONFIG.DEFAULTS.UTM_SOURCE],
    utmMedium: [CHOTTULINK_CONFIG.DEFAULTS.UTM_MEDIUM],
    utmCampaign: [CHOTTULINK_CONFIG.DEFAULTS.UTM_CAMPAIGN],
    utmContent: [''],
    utmTerm: ['']
  });

  spinner: boolean = false;
  submitted: boolean = false;
  shortUrl: string | null = null;
  error: string | null = null;
  copied: boolean = false;

  /** `getAppLinkDataFromUrl` result for the just-created link, shown below it. */
  appLinkData: CLResolvedLink | null = null;
  appLinkDataSpinner: boolean = false;
  appLinkDataError: string | null = null;

  resolveInput: string = '';
  resolveSpinner: boolean = false;
  resolveResult: CLResolvedLink | null = null;
  resolveError: string | null = null;

  constructor(private chottuLink: ChottuLinkService) {}

  /**
   * Validates the form, creates the dynamic link through the SDK, then
   * immediately resolves it so its `appLinkData` can be shown underneath.
   *
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  async createLink(): Promise<void> {
    this.submitted = true;
    this.error = null;
    this.copied = false;
    this.appLinkData = null;
    this.appLinkDataError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.spinner = true;
    try {
      const result = await this.chottuLink.createDynamicLink(this.buildPayload());
      this.shortUrl = result.shortURL;
      this.resolveInput = result.shortURL ?? this.resolveInput;
    } catch (error) {
      this.shortUrl = null;
      this.error = UtilityService.getErrorMessage(error);
      return;
    } finally {
      this.spinner = false;
    }

    if (this.shortUrl) {
      await this.fetchAppLinkData(this.shortUrl);
    }
  }

  /**
   * Copies the created short link to the clipboard.
   *
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  async copyShortUrl(): Promise<void> {
    if (this.shortUrl && (await UtilityService.copyToClipboard(this.shortUrl))) {
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
    }
  }

  /**
   * Resolves the manually entered short URL using `getAppLinkDataFromUrl`.
   *
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  async resolveLink(): Promise<void> {
    const shortURL = this.resolveInput.trim();
    this.resolveError = null;
    this.resolveResult = null;
    if (!shortURL) {
      this.resolveError = 'Enter a short URL to resolve.';
      return;
    }

    this.resolveSpinner = true;
    try {
      this.resolveResult = await this.chottuLink.getAppLinkDataFromUrl(shortURL);
      if (!this.resolveResult) {
        this.resolveError = 'No data returned for this link.';
      }
    } catch (error) {
      this.resolveError = UtilityService.getErrorMessage(error);
    } finally {
      this.resolveSpinner = false;
    }
  }

  /**
   * Fetches `appLinkData` for a freshly created short URL.
   *
   * @param { string } shortURL - Link returned by `createDynamicLink`.
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  private async fetchAppLinkData(shortURL: string): Promise<void> {
    this.appLinkDataSpinner = true;
    try {
      this.appLinkData = await this.chottuLink.getAppLinkDataFromUrl(shortURL);
      if (!this.appLinkData) {
        this.appLinkDataError = 'No app link data returned for this link.';
      }
    } catch (error) {
      this.appLinkDataError = UtilityService.getErrorMessage(error);
    } finally {
      this.appLinkDataSpinner = false;
    }
  }

  /**
   * Returns true when a control should show its validation message.
   *
   * @param { string } name - Form control name.
   * @return { boolean }
   * ----------------------------------------------------------------
   */
  showError(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted);
  }

  /**
   * Builds the SDK payload, dropping empty optional fields. The Cordova plugin
   * takes the builder fields flat - there is no wrapping `builder` key.
   *
   * @return { CLDynamicLinkBuilder } Builder ready for the SDK.
   * ----------------------------------------------------------------
   */
  private buildPayload(): CLDynamicLinkBuilder {
    const raw = this.form.getRawValue();
    const optional = Object.fromEntries(
      Object.entries(raw)
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
        .filter(([, value]) => value !== '')
    );
    return optional as unknown as CLDynamicLinkBuilder;
  }
}
