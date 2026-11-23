// AlarmKit 알람 (ios/SlipperAlarmModule.swift). 설치판에만 있고, 없으면 null이에요(그때는 알림으로 대신 울려요, src/alarm.ts).
import { requireOptionalNativeModule } from 'expo';

type SlipperAlarm = {
  requestAuthorization(): Promise<boolean>;
  /** atMs 시각에 한 번 울려요. 만든 알람 id를 돌려줘요 */
  schedule(atMs: number, title: string, sound: string | null): Promise<string>;
  cancel(id: string): void;
  cancelAll(): void;
  /** 지금 울리고 있는 알람 id들 */
  alerting(): string[];
  stop(id: string): void;
};

export default requireOptionalNativeModule<SlipperAlarm>('SlipperAlarm');
