// 24시간 링 (SPEC 6.3, 디자인 PlanEdit). 침대·알람 끝을 끌면 늘이고 줄이고, 가운데를 끌면 옮겨요.
import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { color } from '../theme';

const SIZE = 320, C = 160, R = 128, STEP = 5, MIN = 30, MAX = 1410;
export const GOAL_MIN = 480; // 수면 목표 8시간

const mod = (a: number, n: number) => ((a % n) + n) % n;
const pt = (m: number) => {
  const a = (m / 1440) * 2 * Math.PI;
  return [C + R * Math.sin(a), C - R * Math.cos(a)] as const;
};
const snap = (m: number) => Math.round(m / STEP) * STEP;
const clampD = (d: number) => Math.max(MIN, Math.min(MAX, d));

const TICKS = Array.from({ length: 96 }, (_, i) => {
  const a = (i / 96) * 2 * Math.PI, major = i % 4 === 0;
  const r1 = 98, r2 = major ? 90 : 94;
  return { x1: C + r1 * Math.sin(a), y1: C - r1 * Math.cos(a), x2: C + r2 * Math.sin(a), y2: C - r2 * Math.cos(a), major };
});
const LABELS = Array.from({ length: 12 }, (_, i) => {
  const h = i * 2, a = (h / 24) * 2 * Math.PI, main = h % 6 === 0;
  const r = main ? 64 : 71;
  const text = main ? ['오전12시', '오전6시', '오후12시', '오후6시'][h / 6] : String(h % 12 || 12);
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a), text, main };
});

export function SleepRing({ bed, wake, onChange, onDrag }: { bed: number; wake: number; onChange: (bed: number, wake: number) => void; onDrag?: (active: boolean) => void }) {
  const state = useRef({ bed, wake, onChange, onDrag });
  state.current = { bed, wake, onChange, onDrag };
  const drag = useRef<{ mode: 'bed' | 'wake' | 'all'; b0: number; w0: number; prev: number; acc: number } | null>(null);

  const angleAt = (x: number, y: number) => ({ m: mod((Math.atan2(x - C, -(y - C)) / (2 * Math.PI)) * 1440, 1440), d: Math.hypot(x - C, y - C) });
  const set = (b: number, w: number) => {
    b = mod(b, 1440); w = mod(w, 1440);
    const d = mod(w - b, 1440);
    if (d < MIN || d > MAX) return;
    if (b === state.current.bed && w === state.current.wake) return;
    Haptics.selectionAsync(); // 5분마다 가벼운 햅틱
    state.current.onChange(b, w);
  };

  const begin = (x: number, y: number) => {
    const p = angleAt(x, y);
    if (p.d < 96 || p.d > 166) return false;
    const { bed: b, wake: w } = state.current;
    const gap = (a: number, c: number) => Math.min(mod(a - c, 1440), mod(c - a, 1440));
    const nb = gap(p.m, b), nw = gap(p.m, w);
    let mode: 'bed' | 'wake' | 'all' | null = null;
    if (Math.min(nb, nw) <= 40) mode = nb <= nw ? 'bed' : 'wake';
    else if (mod(p.m - b, 1440) <= mod(w - b, 1440)) mode = 'all';
    if (!mode) return false;
    drag.current = { mode, b0: b, w0: w, prev: p.m, acc: 0 };
    state.current.onDrag?.(true);
    return true;
  };
  const move = (x: number, y: number) => {
    const g = drag.current;
    if (!g) return;
    const q = angleAt(x, y);
    let dm = q.m - g.prev;
    if (dm > 720) dm -= 1440;
    if (dm < -720) dm += 1440;
    g.prev = q.m;
    g.acc += dm;
    const d0 = mod(g.w0 - g.b0, 1440);
    if (g.mode === 'bed') set(g.w0 - clampD(d0 - snap(g.acc)), g.w0);
    else if (g.mode === 'wake') set(g.b0, g.b0 + clampD(d0 + snap(g.acc)));
    else set(snap(g.b0 + g.acc), snap(g.b0 + g.acc) + d0);
  };
  const end = () => { drag.current = null; state.current.onDrag?.(false); };

  // 링을 누르는 순간 바로 잡아요. 늦게 잡으면 위아래로 끌 때 바깥 스크롤이 손가락을 가져가요.
  const pan = useMemo(() => Gesture.Pan()
    .runOnJS(true)
    .manualActivation(true)
    .onTouchesDown((e, mgr) => {
      const t = e.allTouches[0];
      if (t && begin(t.x, t.y)) mgr.activate();
      else mgr.fail();
    })
    .onUpdate((e) => move(e.x, e.y))
    .onFinalize(end), []); // 안에서 ref만 읽어서 한 번만 만들어요

  const dur = mod(wake - bed, 1440), ok = dur >= GOAL_MIN;
  const tone = ok ? color.goal : color.textTertiary;
  const [x0, y0] = pt(bed), [x1, y1] = pt(wake);
  const arc = `M${x0} ${y0} A ${R} ${R} 0 ${dur > 720 ? 1 : 0} 1 ${x1} ${y1}`;
  const iconTint = ok ? '#041215' : '#E5E5EA';

  return (
    <GestureDetector gesture={pan}>
    <View style={{ width: SIZE, height: SIZE, alignSelf: 'center' }}>
      <Svg width={SIZE} height={SIZE} pointerEvents="none">
        <Circle cx={C} cy={C} r={152} fill={color.bg} />
        <Circle cx={C} cy={C} r={104} fill={color.cardRaised} />
        {TICKS.map((t, i) => (
          <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.major ? '#8E8E93' : '#545458'} strokeWidth={t.major ? 1.6 : 1} strokeLinecap="round" />
        ))}
        {LABELS.map((l, i) => (
          <SvgText key={i} x={l.x} y={l.y + (l.main ? 4 : 5)} textAnchor="middle" fill={l.main ? '#FFFFFF' : '#8E8E93'} fontSize={l.main ? 12.5 : 15} fontWeight={l.main ? '600' : '500'}>
            {l.text}
          </SvgText>
        ))}
        <Path d={arc} fill="none" stroke={tone} strokeWidth={40} strokeLinecap="round" />
        <Path d={arc} fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth={15} strokeDasharray="1.4 4.6" />
        <Circle cx={x0} cy={y0} r={18} fill={tone} />
        <Circle cx={x1} cy={y1} r={18} fill={tone} />
      </Svg>
      <Knob x={x0} y={y0} icon="bed.double.fill" tint={iconTint} />
      <Knob x={x1} y={y1} icon="alarm.fill" tint={iconTint} />
      <View pointerEvents="none" style={{ position: 'absolute', left: C - 8, top: 102 }}>
        <SymbolView name="moon.fill" size={16} tintColor={color.night} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: C - 10, top: 198 }}>
        <SymbolView name="sun.max.fill" size={20} tintColor={color.goal} />
      </View>
    </View>
    </GestureDetector>
  );
}

function Knob({ x, y, icon, tint }: { x: number; y: number; icon: 'bed.double.fill' | 'alarm.fill'; tint: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - 10, top: y - 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <SymbolView name={icon} size={16} tintColor={tint} />
    </View>
  );
}
