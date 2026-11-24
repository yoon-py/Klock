import Storage from 'expo-sqlite/kv-store';
import * as SQLite from 'expo-sqlite';
import type { NightRecord } from './types';

const db = SQLite.openDatabaseSync('slipper.db');
db.execSync('CREATE TABLE IF NOT EXISTS nights (date TEXT PRIMARY KEY, data TEXT NOT NULL)');

export const readSetting = (key: string) => Storage.getItemSync(key);
export const writeSetting = (key: string, value: string) => Storage.setItemSync(key, value);

export function saveNightRecord(night: NightRecord) {
  db.runSync('INSERT OR REPLACE INTO nights (date, data) VALUES (?, ?)', night.date, JSON.stringify(night));
}

export function readNightRecords(limit: number): NightRecord[] {
  return db
    .getAllSync<{ data: string }>('SELECT data FROM nights ORDER BY date DESC LIMIT ?', limit)
    .map((row) => JSON.parse(row.data));
}
