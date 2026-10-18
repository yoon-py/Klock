import { MissionCount } from '../../../src/components/MissionCount';

const STEPS = [20, 30, 50, 70, 100, 150] as const;

export default function WalkSettings() {
  return (
    <MissionCount
      title="걷기"
      headline={'침대 밖으로 나와 걸으면\n더 확실히 깨어나요'}
      icon="figure.walk"
      values={STEPS}
      unit="걸음"
      read={(m) => (m.type === 'walk' ? m.steps : 50)}
      write={(steps) => ({ type: 'walk', steps })}
    />
  );
}
