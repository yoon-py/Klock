import AVFoundation
import ExpoModulesCore

// 모노럴 비트를 재생해요 (소리 계산은 Beat.swift). 한 채널이라 이어폰이어도 양쪽 귀에 같은 소리예요(바이노럴 아님).
public class SlipperAudioModule: Module {
  private let engine = AVAudioEngine()
  private let beat = Beat()
  private var node: AVAudioSourceNode?
  private var playing = false
  private var stopToken = 0
  private var observers: [NSObjectProtocol] = []

  public func definition() -> ModuleDefinition {
    Name("SlipperAudio")

    OnCreate { self.observe() }
    OnDestroy { self.observers.forEach(NotificationCenter.default.removeObserver) }

    Function("start") { (carrierHz: Double, beatHz: Double, amplitude: Double, volume: Double, fadeInSec: Double) in
      try self.start(carrierHz: carrierHz, beatHz: beatHz, amplitude: amplitude, volume: volume, fadeInSec: fadeInSec)
    }
    Function("setVolume") { (volume: Double) in
      self.beat.ramp(to: volume, seconds: 0.05)
    }
    Function("stop") {
      self.stop()
    }
  }

  private func start(carrierHz: Double, beatHz: Double, amplitude: Double, volume: Double, fadeInSec: Double) throws {
    stopToken += 1 // 끄는 중이었다면 끄기를 취소해요
    try AVAudioSession.sharedInstance().setActive(true)
    if node == nil { attachNode() }
    beat.f1 = carrierHz
    beat.f2 = carrierHz + beatHz
    beat.amp = amplitude
    if !engine.isRunning { beat.gain = 0 }
    beat.ramp(to: volume, seconds: fadeInSec)
    if !engine.isRunning { try engine.start() }
    playing = true
  }

  private func stop() {
    playing = false
    beat.ramp(to: 0, seconds: 0.1)
    stopToken += 1
    let token = stopToken
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
      guard let self, self.stopToken == token else { return }
      self.engine.stop()
    }
  }

  private func attachNode() {
    let sr = engine.outputNode.outputFormat(forBus: 0).sampleRate
    beat.sampleRate = sr > 0 ? sr : 48000
    let format = AVAudioFormat(standardFormatWithSampleRate: beat.sampleRate, channels: 1)!
    let b = beat
    // ponytail: 소리 스레드와 값을 잠금 없이 나눠 써요. Double 하나씩 읽고 쓰는 거라 잠깐 옛 값을 읽어도 들리는 차이는 없어요.
    let n = AVAudioSourceNode(format: format) { _, _, frameCount, abl in
      b.render(UnsafeMutableAudioBufferListPointer(abl)[0].mData!.assumingMemoryBound(to: Float.self), Int(frameCount))
      return noErr
    }
    engine.attach(n)
    engine.connect(n, to: engine.mainMixerNode, format: format)
    node = n
  }

  /// 전화·시리가 끝났거나, 이어폰을 빼고 꽂아 소리 길이 바뀌면 다시 틀어요
  private func observe() {
    let center = NotificationCenter.default
    observers.append(center.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] n in
      guard let self, self.playing,
            let raw = n.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
            AVAudioSession.InterruptionType(rawValue: raw) == .ended else { return }
      self.resume()
    })
    observers.append(center.addObserver(forName: .AVAudioEngineConfigurationChange, object: engine, queue: .main) { [weak self] _ in
      guard let self, self.playing else { return }
      self.resume()
    })
  }

  private func resume() {
    try? AVAudioSession.sharedInstance().setActive(true)
    if !engine.isRunning { try? engine.start() }
  }
}
