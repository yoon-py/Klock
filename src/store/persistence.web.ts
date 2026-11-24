import type { NightRecord } from './types';

const NIGHT_KEY = 'slipper.nights';

export const readSetting = (key: string) => globalThis.localStorage?.getItem(`slipper.${key}`) ?? null;
export const writeSetting = (key: string, value: string) => globalThis.localStorage?.setItem(`slipper.${key}`, value);

function readAllNights(): NightRecord[] {
  const raw = globalThis.localStorage?.getItem(NIGHT_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveNightRecord(night: NightRecord) {
  const nights = readAllNights().filter((item) => item.date !== night.date);
  nights.push(night);
  globalThis.localStorage?.setItem(NIGHT_KEY, JSON.stringify(nights));
}

export function readNightRecords(limit: number): NightRecord[] {
  return readAllNights()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
