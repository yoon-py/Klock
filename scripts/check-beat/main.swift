// 모노럴 비트 계산 확인 (폰 없이 맥에서). 1시간 동안 만들어 보고 "틱" 같은 튀는 곳이 없는지 봐요.
// 실행: swiftc -O modules/slipper-audio/ios/Beat.swift scripts/check-beat/main.swift -o /tmp/check-beat && /tmp/check-beat
import Foundation

let sr = 48000.0, chunk = 512, volume = 0.35
let b = Beat()
b.sampleRate = sr
b.ramp(to: volume, seconds: 3)

// 사인파 두 개가 한 샘플 사이에 움직일 수 있는 최대 크기 + 음량 변화. 이보다 크게 튀면 이음새·끊김이에요.
let maxJump = b.amp * 0.5 * 2 * Double.pi * (b.f1 + b.f2) / sr + b.step * b.amp
var buf = [Float](repeating: 0, count: chunk)
var prev: Float = 0, worst = 0.0, peakAfterFade = 0.0
var n = 0
let total = Int(sr * 3600)
while n < total {
  buf.withUnsafeMutableBufferPointer { b.render($0.baseAddress!, chunk) }
  for s in buf {
    worst = max(worst, Double(abs(s - prev)))
    if Double(n) > sr * 3 { peakAfterFade = max(peakAfterFade, Double(abs(s))) }
    prev = s; n += 1
  }
  if n == chunk * 290 { precondition(b.gain == volume, "3초 뒤 정한 음량까지 커져야 해요") } // 290*512 ≈ 3.09초
}
precondition(worst <= maxJump * 1.001, "튀는 곳이 있어요: \(worst) > \(maxJump)")
precondition(abs(peakAfterFade - b.amp * volume) < 0.001, "가장 큰 소리가 amplitude × 음량이어야 해요: \(peakAfterFade)")

b.ramp(to: 0, seconds: 0.1)
for _ in 0..<20 { buf.withUnsafeMutableBufferPointer { b.render($0.baseAddress!, chunk) } }
precondition(b.gain == 0 && buf.allSatisfy { $0 == 0 }, "끄면 0까지 줄어야 해요")
print("ok: 1시간, 가장 큰 변화 \(worst) (한도 \(maxJump)), 가장 큰 소리 \(peakAfterFade)")
