// 따라 말하기 판정 (SPEC 6.15): 들은 말에서 문장의 단어를 앞에서부터 차례로 찾아요.
// 띄어쓰기·문장부호는 무시하고, 두 글자 이상인 단어는 한 글자가 달라도 맞은 걸로 봐요(비슷한 발음).
const norm = (s: string) => s.replace(/[\s.,!?~'"·…]/g, '');

function findFrom(hay: string, word: string, from: number) {
  const exact = hay.indexOf(word, from);
  if (exact >= 0) return exact + word.length;
  if (word.length < 2) return -1;
  for (let i = from; i + word.length <= hay.length; i++) {
    let diff = 0;
    for (let j = 0; j < word.length && diff <= 1; j++) if (hay[i + j] !== word[j]) diff++;
    if (diff <= 1) return i + word.length;
  }
  return -1;
}

/** 문장 단어 중 앞에서부터 몇 개를 말했는지 */
export function heardWords(words: string[], transcript: string) {
  const hay = norm(transcript);
  let pos = 0;
  for (let k = 0; k < words.length; k++) {
    const next = findFrom(hay, norm(words[k]), pos);
    if (next < 0) return k;
    pos = next;
  }
  return words.length;
}
