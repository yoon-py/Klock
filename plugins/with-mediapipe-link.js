// MediaPipe는 정적 xcframework인데 CocoaPods가 앱 링크 설정에 -l"MediaPipeTasks..."로 넣어서 링크가 실패해요
// ("library 'MediaPipeTasksCommon' not found"). pod install이 설정 파일을 다 쓴 뒤(post_integrate) -framework로 바꿔 줘요.
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const MARK = '# with-mediapipe-link';
const HOOK = `
${MARK}
post_integrate do |installer|
  installer.aggregate_targets.each do |t|
    t.xcconfigs.each_key do |cfg|
      p = t.xcconfig_path(cfg)
      s = File.read(p).gsub(/-l"(MediaPipeTasks(?:Common|Vision))"/, '-framework "\\\\1"')
      s = s.sub(/^FRAMEWORK_SEARCH_PATHS = /, 'FRAMEWORK_SEARCH_PATHS = "\${PODS_XCFRAMEWORKS_BUILD_DIR}/MediaPipeTasksCommon" "\${PODS_XCFRAMEWORKS_BUILD_DIR}/MediaPipeTasksVision" ') unless s =~ /^FRAMEWORK_SEARCH_PATHS = .*XCFRAMEWORKS_BUILD_DIR\\}\\/MediaPipeTasksCommon/
      File.write(p, s)
    end
  end
end
`;

module.exports = (config) =>
  withDangerousMod(config, ['ios', (c) => {
    const file = path.join(c.modRequest.platformProjectRoot, 'Podfile');
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes(MARK)) fs.writeFileSync(file, src + HOOK);
    return c;
  }]);
