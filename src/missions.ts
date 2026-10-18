// 미션 6종의 이름·아이콘·색·설정 화면 (SPEC 6.5, 디자인 MissionPick)
import type { SFSymbol } from 'sf-symbols-typescript';
import type { MissionConfig } from './store';
import { eulReul } from './time';

export type MissionType = MissionConfig['type'];

type Info = { name: string; icon: SFSymbol; fg: string; bg: string; settings?: string; make: () => MissionConfig };

export const MISSIONS: Record<MissionType, Info> = {
  squat: { name: '스쿼트', icon: 'figure.cross.training', fg: '#C3A6FF', bg: '#3A2F57', settings: '/mission/squat', make: () => ({ type: 'squat', count: 10 }) },
  walk: { name: '걷기', icon: 'shoeprints.fill', fg: '#C3A6FF', bg: '#3A2F57', settings: '/mission/walk', make: () => ({ type: 'walk', steps: 50 }) },
  photo: { name: '사진 찍기', icon: 'camera.fill', fg: '#FF7B86', bg: '#4A2229', settings: '/mission/photo', make: () => ({ type: 'photo', photoIds: [] }) },
  barcode: { name: '바코드 찍기', icon: 'barcode', fg: '#FF7B86', bg: '#4A2229', settings: '/mission/code', make: () => ({ type: 'barcode', codeIds: [] }) },
  repeat_sentence: { name: '따라 말하기', icon: 'mic.fill', fg: '#6AD0F5', bg: '#1F3A47', settings: '/mission/voice', make: () => ({ type: 'repeat_sentence', sentenceIds: [...VOICE_SENTENCES], count: 1 }) },
  rhythm: { name: '리듬 맞춰 말하기', icon: 'music.note', fg: '#6AD0F5', bg: '#1F3A47', settings: '/mission/rhythm', make: () => ({ type: 'rhythm', sentenceIds: RHYTHM_SENTENCES.slice(0, 9), rounds: 1, bgmLevel: 0 }) },
};

export const MISSION_GROUPS: { title: string; types: MissionType[] }[] = [
  { title: '몸부터 깨우는 미션', types: ['squat', 'walk'] },
  { title: '침대에서 멀어지는 미션', types: ['photo', 'barcode'] },
  { title: '입으로 깨우는 미션', types: ['repeat_sentence', 'rhythm'] },
];

// 리듬 미션 문장 10개 (디자인 MissionRhythmPick). 문장 자체를 id로 써요.
export const RHYTHM_SENTENCES = [
  '일어나자 힘을내자', '눈을뜨자 일어나자', '아침이다 일어나자', '지각금지 일어나자', '할수있다 해낼거야',
  '물한잔을 마셔보자', '기지개를 쭉켜보자', '오늘하루 화이팅해', '일어나서 운동하자', '이불밖은 안전해요',
];

// 따라 말하기 문장 10개. 문장 자체를 id로 써요.
export const VOICE_SENTENCES = [
  '오늘도 개운하게 하루를 시작해요', '나는 지금 침대에서 일어나요', '창문을 열고 크게 숨을 쉬어요', '물 한 잔 마시고 기지개를 켜요',
  '오늘 할 일을 하나씩 해낼 거예요', '아침 햇살이 나를 깨워요', '이불 밖으로 나와서 세수해요', '좋은 아침이에요 힘차게 일어나요',
  '오늘은 어제보다 조금 더 잘할 거예요', '천천히 일어나서 하루를 열어요',
];

/** 미션 칸 아래 설명: "스쿼트를 끝내야 알람이 꺼져요." */
export function missionLine(list: MissionConfig[]) {
  if (list.length === 0) return '미션이 없으면 알람 끄기 버튼으로 꺼요.';
  const names = list.map((m) => MISSIONS[m.type].name);
  if (names.length === 1) return `${names[0]}${eulReul(names[0])} 끝내야 알람이 꺼져요.`;
  return `${names.join(' → ')} 순서로 모두 끝내야 꺼져요.`;
}
/** 알람 카드 제목: "스쿼트 10회", "걷기 50걸음", "사진 찍기" */
export function missionTitle(m: MissionConfig) {
  if (m.type === 'squat') return `스쿼트 ${m.count}회`;
  if (m.type === 'walk') return `걷기 ${m.steps}걸음`;
  if (m.type === 'repeat_sentence' && m.count > 1) return `따라 말하기 ${m.count}문장`;
  return MISSIONS[m.type].name;
}
/** 수면 탭 요약: "스쿼트 10회", "스쿼트 외 1개" */
export function missionSummary(list: MissionConfig[]) {
  if (!list[0]) return '미션 없음';
  return list.length > 1 ? `${MISSIONS[list[0].type].name} 외 ${list.length - 1}개` : missionTitle(list[0]);
}

/** 읽을 수 있는 QR/바코드 종류 (등록·미션 둘 다) */
export const BARCODE_TYPES = ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14', 'datamatrix', 'pdf417', 'aztec'] as const;
