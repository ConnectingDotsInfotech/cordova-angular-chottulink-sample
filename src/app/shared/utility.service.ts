import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UtilityService {
  /**
   * Serialises a value as indented JSON so it is easy to read.
   *
   * @param { unknown } value - Any JSON compatible value.
   * @return { string } Pretty printed JSON.
   * ----------------------------------------------------------------
   */
  static prettyJson(value: unknown): string {
    return JSON.stringify(value ?? null, null, 2);
  }

  /**
   * Extracts a readable message from anything thrown by the SDK.
   *
   * @param { unknown } error - Thrown value.
   * @return { string } Message text.
   * ----------------------------------------------------------------
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    const message = (error as { message?: string } | null)?.message;
    return message ?? UtilityService.prettyJson(error);
  }

  /**
   * Reads a value from an object using a dot separated path.
   *
   * @param { unknown } source - Object to read from.
   * @param { string } path - Dot path such as `customer.id`.
   * @return { unknown } Value at the path or `undefined`.
   * ----------------------------------------------------------------
   */
  static getByPath(source: unknown, path: string): unknown {
    return path
      .split('.')
      .reduce<any>((current, key) => (current == null ? undefined : current[key]), source);
  }

  /**
   * Copies text to the clipboard, falling back to `execCommand` on older WebViews.
   *
   * @param { string } text - Text to copy.
   * @return { Promise<boolean> } `true` when the copy succeeded.
   * ----------------------------------------------------------------
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    }
  }

  /**
   * Validator that accepts empty values and otherwise requires an http(s) URL.
   *
   * @return { ValidatorFn } Angular validator.
   * ----------------------------------------------------------------
   */
  static urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value ?? '').toString().trim();
      if (!value) {
        return null;
      }
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:' ? null : { url: true };
      } catch {
        return { url: true };
      }
    };
  }

  /**
   * Validator for a bare domain such as `myapp.chottu.link` (no protocol, no path).
   *
   * @return { ValidatorFn } Angular validator.
   * ----------------------------------------------------------------
   */
  static domainValidator(): ValidatorFn {
    const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value ?? '').toString().trim();
      return !value || pattern.test(value) ? null : { domain: true };
    };
  }
}
