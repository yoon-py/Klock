// 디자인 값 한 곳 (CLAUDE.md 디자인 규칙 + design/*.dc.html에서 뽑은 값)
export const color = {
  bg: '#000000',
  card: '#1C1C1E',
  cardRaised: '#2C2C2E', // 시트 안 그룹 카드
  fill: '#3A3A3C', // 다이얼 바탕, 빈 미션 칸
  separator: 'rgba(84,84,88,0.65)',
  text: '#FFFFFF',
  textSecondary: '#98989F',
  textTertiary: '#636366',
  accent: '#FF9F0A', // 낮 화면 강조
  night: '#A99DFF', // 수면 탭·수면 중 강조
  nightText: '#EEEFFA',
  nightSecondary: '#A3A7C2',
  goal: '#FFD60A', // 수면 목표 충족
  danger: '#FF453A',
  success: '#34C759',
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
