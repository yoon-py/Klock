import { MissionCount } from '../../../src/components/MissionCount';

const COUNTS = [5, 10, 15, 20, 25, 30] as const;

export default function SquatSettings() {
  return (
    <MissionCount
      title="스쿼트"
      headline={'아침에 스쿼트를 하면\n몸부터 잠이 깨요'}
      icon="figure.cross.training"
      values={COUNTS}
      unit="회"
      read={(m) => (m.type === 'squat' ? m.count : 10)}
      write={(count) => ({ type: 'squat', count })}
    />
  );
}
