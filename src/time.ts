// "23:30" ↔ 분(1410) 변환과 한국어 표시
export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const pad = (n: number) => String(n).padStart(2, '0');
export const fromMin = (m: number) => {
  const v = ((m % 1440) + 1440) % 1440;
  return pad(Math.floor(v / 60)) + ':' + pad(v % 60);
};
/** "오후 11:30" */
export const fmtKo = (m: number) => {
  const v = ((m % 1440) + 1440) % 1440;
  return (v < 720 ? '오전 ' : '오후 ') + (Math.floor(v / 60) % 12 || 12) + ':' + pad(v % 60);
};
/** 오전/오후와 시각을 따로 (큰 시각 표시용) */
export const splitKo = (m: number) => {
  const [ap, t] = fmtKo(m).split(' ');
  return { ap, t };
};
/** "7시간 30분", "8시간" */
export const durKo = (m: number) => {
  const h = Math.floor(m / 60), r = m % 60;
  return (h ? h + '시간' : '') + (h && r ? ' ' : '') + (r || !h ? r + '분' : '');
};
/** 잠그는 시각 문구: 60 → "1시간 전" */
export const leadKo = (m: number) => durKo(m) + ' 전';

/** 받침 있으면 "을", 없으면 "를" */
export const eulReul = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c % 28 ? '을' : '를';
};

export const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
/** 반복 요일 요약: 매일 / 주중 / 주말 / 월, 수 */
export const repeatKo = (r: boolean[]) => {
  const on = r.flatMap((v, i) => (v ? [i] : []));
  if (on.length === 0) return '안 함';
  if (on.length === 7) return '매일';
  if (on.length === 5 && !r[0] && !r[6]) return '주중';
  if (on.length === 2 && r[0] && r[6]) return '주말';
  return on.map((i) => DAYS[i]).join(', ');
};
