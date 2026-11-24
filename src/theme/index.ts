import { DynamicColorIOS, Platform, type ColorValue } from 'react-native';

// iOS는 시스템/앱 화면 모드가 바뀌면 StyleSheet를 다시 만들지 않아도 색이 즉시 바뀌어요.
const dynamic = (light: string, dark: string): ColorValue => (
  Platform.OS === 'ios' ? DynamicColorIOS({ light, dark }) : dark
);

// 디자인 값 한 곳 (CLAUDE.md 디자인 규칙 + design/*.dc.html에서 뽑은 값)
export const color = {
  bg: dynamic('#F2F2F7', '#09090B'),
  card: dynamic('#FFFFFF', '#111113'),
  cardRaised: dynamic('#E9E9ED', '#1C1C1F'), // 시트 안 그룹 카드
  fill: dynamic('#DEDEE3', '#2C2C30'), // 다이얼 바탕, 빈 미션 칸
  separator: dynamic('rgba(60,60,67,0.20)', 'rgba(84,84,88,0.55)'),
  text: dynamic('#111113', '#F5F5F6'),
  textSecondary: dynamic('#63636A', '#A0A0A7'),
  textTertiary: dynamic('#85858C', '#6E6E74'),
  accent: dynamic('#8E8E93', '#F2F2F7'), // 콘텐츠를 방해하지 않는 중립 강조
  accentCyan: dynamic('#6E6E73', '#D1D1D6'),
  night: dynamic('#636366', '#E5E5EA'),
  nightText: dynamic('#1C1C1E', '#F2F2F7'),
  nightSecondary: dynamic('#717178', '#98989F'),
  goal: dynamic('#636366', '#D1D1D6'),
  danger: dynamic('#E54862', '#FF647C'),
  success: dynamic('#19A85A', '#43E07D'),
} as const;

// iOS 기본 글자 크기 (시스템 글꼴, 따로 글꼴 파일 없음)
export const font = {
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontSize: 22, fontWeight: '700' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17 },
  subhead: { fontSize: 15 },
  footnote: { fontSize: 13 },
} as const;

export const space = { xs: 4, s: 8, m: 16, l: 20, xl: 24 } as const;
export const radius = { group: 22, sheetCard: 26, button: 14 } as const;
