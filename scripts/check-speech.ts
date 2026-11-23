// 따라 말하기 판정 점검: npx tsx scripts/check-speech.ts
import assert from 'node:assert';
import { heardWords } from '../src/speech';

const w = '오늘도 상쾌한 아침이에요'.split(' ');
assert.equal(heardWords(w, '오늘도'), 1);
assert.equal(heardWords(w, '오늘도 상쾌한 아침이에요.'), 3);
assert.equal(heardWords(w, '오늘도상쾌한아침이예요'), 3); // 띄어쓰기 없음 + 한 글자 다름
assert.equal(heardWords(w, '상쾌한 아침'), 0); // 첫 단어부터 차례로
console.log('speech ok');
