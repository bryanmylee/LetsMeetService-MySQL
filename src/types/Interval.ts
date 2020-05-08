import dayjs, { Dayjs } from 'dayjs';

// A class that represents an interval of time.
export default class Interval {
  start: Dayjs;
  end: Dayjs;
  private constructor(start: Dayjs, end: Dayjs) {
    this.start = start;
    this.end = end;
  }
  static fromISO(interval: {start: string, end: string}) {
    return new Interval(dayjs(interval.start), dayjs(interval.end));
  }
  static fromUnixTimestampSeconds(interval: {start: number, end: number}) {
    return new Interval(dayjs.unix(interval.start), dayjs.unix(interval.end));
  }
  static fromUnixTimestamp(interval: {start: number, end: number}) {
    return new Interval(dayjs(interval.start), dayjs(interval.end));
  }
  toISO(): {start: string, end: string} {
    return { start: this.start.toISOString(), end: this.end.toISOString() };
  }
  toSQL(): {start: string, end: string} {
    return ({
      start: this.start.format('YYYY-MM-DD HH:mm:ssZ'),
      end: this.end.format('YYYY-MM-DD HH:mm:ssZ'),
    });
  }
}