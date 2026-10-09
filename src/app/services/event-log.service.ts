import { EventLogEntry } from '../models/event-log-entry';
import { Injectable, signal } from '@angular/core';
import { LogType } from '../models/enums/log-type.enum';

@Injectable({ providedIn: 'root' })
export class EventLogService {
  readonly entries = signal<EventLogEntry[]>([]);

  /**
   * Adds an entry to the top of the log.
   *
   * @param { LogType } type - Category of the event.
   * @param { string } title - Short human readable summary.
   * @param { unknown } payload - Optional data shown as pretty JSON.
   * @return { void }
   * ----------------------------------------------------------------
   */
  add(type: LogType, title: string, payload: unknown = null): void {
    const entry = new EventLogEntry();
    entry.type = type;
    entry.title = title;
    entry.payload = payload;
    this.entries.update((list) => [entry, ...list]);
  }

  /**
   * Removes every entry from the log.
   *
   * @return { void }
   * ----------------------------------------------------------------
   */
  clear(): void {
    this.entries.set([]);
  }
}
