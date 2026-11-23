// 몸 풀기 음성 가이드 파일 만들기 (SPEC 6.19). 개발할 때만 돌려요. 앱은 인터넷을 쓰지 않아요.
// 사용: node --env-file=.env.local scripts/make-guide-voice.mjs   (.env.local 에 OPENAI_API_KEY=...)
// 필요한 것: ffmpeg (brew install ffmpeg)
// ponytail: gpt-4o-mini-tts 는 2027-01-06 종료 예정. 그 뒤 다시 만들 때는 OpenAI 문서의 후속 방식으로 바꿔야 해요.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCRIPT = join(ROOT, 'scripts/guide/body_relax.txt');
const OUT = join(ROOT, 'assets/sounds/guide/body_relax.m4a');
const MODEL = 'gpt-4o-mini-tts';
const VOICE = 'marin'; // 여자 목소리, OpenAI 권장 품질
const INSTRUCTIONS =
  'Speak natural native Korean. Very calm, soft, low and slow, like gently guiding someone who is about to fall asleep. ' +
  'Warm but not cheerful, never an announcer or advertisement tone. Leave relaxed pauses between sentences.';
const GAP = 1.2; // 묶음 사이 기본 쉼(초)

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error('OPENAI_API_KEY 가 없어요. .env.local 에 넣고 node --env-file=.env.local 로 실행하세요.');
  process.exit(1);
}

// 대본 → [{ text }] | [{ pause }]
const parts = [];
let lines = [];
const flush = () => { if (lines.length) parts.push({ text: lines.join('\n') }); lines = []; };
for (const raw of readFileSync(SCRIPT, 'utf8').split('\n')) {
  const t = raw.trim();
  if (t.startsWith('#')) continue;
  const pause = t.match(/^\[쉼 (\d+(?:\.\d+)?)\]$/);
  if (pause) { flush(); parts.push({ pause: Number(pause[1]) }); }
  else if (!t) flush();
  else lines.push(t);
}
flush();

const ff = (...args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
const tmp = mkdtempSync(join(tmpdir(), 'slipper-guide-'));
const files = [];
const next = () => join(tmp, `${files.length}.wav`);
// 모든 조각을 같은 형식(24kHz 모노 16비트)으로 맞춰야 이어 붙일 수 있어요
const silence = (sec) => { const f = next(); ff('-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', String(sec), '-c:a', 'pcm_s16le', f); files.push(f); };

try {
  for (const p of parts) {
    if ('pause' in p) { silence(p.pause); continue; }
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, voice: VOICE, input: p.text, instructions: INSTRUCTIONS, response_format: 'wav' }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const rawFile = join(tmp, `raw-${files.length}.wav`);
    writeFileSync(rawFile, Buffer.from(await res.arrayBuffer()));
    const f = next();
    ff('-i', rawFile, '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', f);
    files.push(f);
    silence(GAP);
    console.log('done:', p.text.split('\n')[0]);
  }

  const list = join(tmp, 'list.txt');
  writeFileSync(list, files.map((f) => `file '${f}'`).join('\n'));
  mkdirSync(join(ROOT, 'assets/sounds/guide'), { recursive: true });
  // 2초 페이드인, 조용한 밤에 맞춰 작게(-20 LUFS)
  ff('-f', 'concat', '-safe', '0', '-i', list, '-af', 'afade=t=in:d=2,loudnorm=I=-20:TP=-2', '-ar', '44100', '-c:a', 'aac', '-b:a', '96k', OUT);
  const sec = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT]).toString().trim();
  console.log(`saved ${OUT} (${Math.round(Number(sec))}s)`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
