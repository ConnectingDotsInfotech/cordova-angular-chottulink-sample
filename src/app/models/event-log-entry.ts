import { LogType } from './enums/log-type.enum';

export class EventLogEntry {
  id: string = crypto.randomUUID();
  timestamp: Date = new Date();
  type: LogType = LogType.INFO;
  title: string = '';
  payload: unknown = null;
}
