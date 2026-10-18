// 등록 사진을 앱 문서 폴더에 저장 (폰 안에만, 서버로 보내지 않아요)
import { File, Paths } from 'expo-file-system';

export async function keepPhoto(tempUri: string, name: string) {
  const dest = new File(Paths.document, name + '.jpg');
  await new File(tempUri).copy(dest);
  return dest.uri;
}

