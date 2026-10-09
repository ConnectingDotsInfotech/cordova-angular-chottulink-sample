export class AttributionAction {
  key: string = '';
  title: string = '';
  description: string = '';

  /** Dot-paths that must be present in the JSON payload, e.g. `customer.id`. */
  required: string[] = [];

  /** Editable JSON text. `null` for methods that take no input. */
  json: string | null = null;

  /** Builds a fresh sample payload; called on load and by the reset button. `null` when there is no input. */
  createSample: (() => object) | null = null;

  /** Optional: payload to show after a successful run, e.g. with a new transaction id. */
  nextPayload: ((payload: any) => object) | null = null;

  busy: boolean = false;
  error: string | null = null;
  result: string | null = null;
  run: (payload: any) => Promise<unknown> = async () => null;
}
