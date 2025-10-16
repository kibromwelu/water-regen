import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const KST = 'Asia/Seoul';

// Converts a Korea date/time string to UTC ISO string.
export function koreaToUtc(dateStr: string, timeStr?: string): string {
    //returns ISO string in UTC (e.g. "2025-05-11T17:00:00.000Z")

  // Normalize date (replace dots)
  const normalizedDate = dateStr.replace(/\./g, '-');

  // Normalize time (default 00:00)
  let normalizedTime = '00:00';
  if (timeStr) {
    if (/^\d{1,2}$/.test(timeStr)) {
      normalizedTime = `${timeStr.padStart(2, '0')}:00`;
    } else if (/^\d{1,2}:\d{1,2}$/.test(timeStr)) {
      const [h, m] = timeStr.split(':');
      normalizedTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }else if (/^\d{1,2}:\d{1,2}:\d{1,2}(\.\d{3})?$/.test(timeStr)) {
      // Validate and normalize HH:MM:SS[.mmm]
      const [time, ms] = timeStr.split('.'); // Split milliseconds if present
      const [h, m, s] = time.split(':');
      // Pad to two digits
      const hours = h.padStart(2, '0');
      const minutes = m.padStart(2, '0');
      const seconds = s.padStart(2, '0');
      // Validate ranges (optional)
      if (+hours > 23 || +minutes > 59 || +seconds > 59) {
        throw new Error('Invalid time values');
      }
      normalizedTime = `${hours}:${minutes}:${seconds}${ms ? '.' + ms : ''}`;
    } else {
      throw new Error('Invalid time format');
    }
  }

  // Parse as KST and convert to UTC
  const kstDateTime = dayjs.tz(`${normalizedDate} ${normalizedTime}`, KST);
  return kstDateTime.utc().format(); // ISO string
}

//Converts a UTC date/time string to Korea time ISO string.
export function utcToKorea(utcIsoStr: string): string {
  // Parse as UTC, then convert to Korea timezone
  const koreaDateTime = dayjs.utc(utcIsoStr).tz(KST);
  // Return ISO string with +09:00 offset
  return koreaDateTime.format('YYYY-MM-DDTHH:mm:ssZ');
}

//Get the hour (0–23) from a Korea time string.
export function getKoreaHour(koreaDateStr: string): number {
  // Remove timezone info
  const normalized = koreaDateStr.replace(/\./g, '-').replace(/\+09:00$/, '');
  const kst = dayjs.tz(normalized, KST);
  return kst.hour();
}

//Get the day of month (1–31) from a Korea time string.
export function getKoreaDay(koreaDateStr: string): number {
  // Remove timezone info
  const normalized = koreaDateStr.replace(/\./g, '-').replace(/\+09:00$/, '');
  const kst = dayjs.tz(normalized, KST);
  return kst.date(); // day of month
}

//Get the full date string (YYYY-MM-DD) in Korea time.
export function getKoreaDate(koreaDateStr: string): string {
  // Remove timezone info
  const normalized = koreaDateStr.replace(/\./g, '-').replace(/\+09:00$/, '');
  const kst = dayjs.tz(normalized, KST);
  return kst.format('YYYY-MM-DD');
}


// export function utcToKorea2(dateStr: string, timeStr?: string): string {
//     //returns ISO string in Korea time (e.g. "2025-05-12T09:00:00+09:00")

//   const normalizedDate = dateStr.replace(/\./g, '-');
//   let normalizedTime = '00:00';
//   if (timeStr) {
//     if (/^\d{1,2}$/.test(timeStr)) {
//       normalizedTime = `${timeStr.padStart(2, '0')}:00`;
//     } else if (/^\d{1,2}:\d{1,2}$/.test(timeStr)) {
//       const [h, m] = timeStr.split(':');
//       normalizedTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
//     } else {
//       throw new Error('Invalid time format');
//     }
//   }

//   // Parse as UTC and convert to KST
//   const utcDateTime = dayjs.utc(`${normalizedDate} ${normalizedTime}`);
//   return utcDateTime.tz(KST).format(); // ISO with +09:00
// }
