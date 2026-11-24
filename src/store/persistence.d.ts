import type { NightRecord } from './types';

export function readSetting(key: string): string | null;
export function writeSetting(key: string, value: string): void;
export function saveNightRecord(night: NightRecord): void;
export function readNightRecords(limit: number): NightRecord[];
