import Foundation

// 모노럴 비트 하나 (SPEC 8장): 두 사인파를 한 채널에 더해 맥박을 만들어요. 비트는 하나만 (특허 회피, 여러 개 섞지 않아요).
// 파일을 되감아 반복하는 게 아니라 계속 계산해서 이음새가 없어요.
// 확인: swiftc modules/slipper-audio/ios/Beat.swift scripts/check-beat/main.swift -o /tmp/check-beat && /tmp/check-beat
final class Beat {
  var f1 = 200.0, f2 = 203.0, amp = 0.7
  var gain = 0.0, target = 0.0, step = 0.0
  var p1 = 0.0, p2 = 0.0
  var sampleRate = 48000.0

  /// 음량을 seconds 동안 부드럽게 바꿔요 (갑자기 바꾸면 "툭"·지글 소리가 나요)
  func ramp(to v: Double, seconds: Double) {
    target = v
    step = max(abs(v - gain), 1e-9) / max(seconds * sampleRate, 1)
  }

  func render(_ out: UnsafeMutablePointer<Float>, _ count: Int) {
    let w1 = 2 * Double.pi * f1 / sampleRate, w2 = 2 * Double.pi * f2 / sampleRate
    for i in 0..<count {
      if gain < target { gain = min(target, gain + step) } else if gain > target { gain = max(target, gain - step) }
      out[i] = Float(0.5 * (sin(p1) + sin(p2)) * amp * gain)
      p1 += w1; if p1 > 2 * Double.pi { p1 -= 2 * Double.pi }
      p2 += w2; if p2 > 2 * Double.pi { p2 -= 2 * Double.pi }
    }
  }
}
