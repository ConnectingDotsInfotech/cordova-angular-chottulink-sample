import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EventLogEntry } from '../../models/event-log-entry';
import { EventLogService } from '../../services/event-log.service';
import { LogType } from '../../models/enums/log-type.enum';
import { UtilityService } from '../../shared/utility.service';

@Component({
  selector: 'app-events',
  imports: [DatePipe],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent {
  protected readonly LogType = LogType;
  protected readonly logTypes: LogType[] = Object.values(LogType);
  protected readonly prettyJson = UtilityService.prettyJson;

  activeFilter: LogType | null = null;
  copiedId: string | null = null;

  constructor(protected eventLog: EventLogService) {}

  /**
   * Returns the log entries matching the active filter chip.
   *
   * @return { EventLogEntry[] } Filtered entries, newest first.
   * ----------------------------------------------------------------
   */
  get visibleEntries(): EventLogEntry[] {
    const all = this.eventLog.entries();
    return this.activeFilter ? all.filter((e) => e.type === this.activeFilter) : all;
  }

  /**
   * Toggles a filter chip on or off.
   *
   * @param { LogType } type - Chip that was tapped.
   * @return { void }
   * ----------------------------------------------------------------
   */
  toggleFilter(type: LogType): void {
    this.activeFilter = this.activeFilter === type ? null : type;
  }

  /**
   * Copies an entry's payload to the clipboard and flashes a confirmation.
   *
   * @param { EventLogEntry } entry - Entry to copy.
   * @return { Promise<void> }
   * ----------------------------------------------------------------
   */
  async copyPayload(entry: EventLogEntry): Promise<void> {
    if (await UtilityService.copyToClipboard(UtilityService.prettyJson(entry.payload))) {
      this.copiedId = entry.id;
      setTimeout(() => (this.copiedId = null), 1500);
    }
  }

  /**
   * Maps a log type to its badge CSS modifier.
   *
   * @param { LogType } type - Log type.
   * @return { string } CSS class name.
   * ----------------------------------------------------------------
   */
  badgeClass(type: LogType): string {
    switch (type) {
      case LogType.ERROR:
      case LogType.DEEPLINK_FAILED:
        return 'badge-danger';
      case LogType.DEEPLINK_RESOLVED:
      case LogType.INIT:
      case LogType.LINK_CREATED:
        return 'badge-success';
      case LogType.ATTRIBUTION:
      case LogType.TRACKING:
        return 'badge-info';
      default:
        return 'badge-neutral';
    }
  }
}
