import AVFoundation
import ExpoModulesCore
import MediaPipeTasksVision
import UIKit

// 스쿼트 미션 카메라 (SPEC 6.15). 전면 카메라를 보여 주고, MediaPipe로 엉덩이·무릎·발목을 찾아
// 무릎 각도가 downAngle 아래로 내려갔다가 upAngle 위로 펴지면 1회. 영상은 저장하지 않아요.
final class SquatView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate, PoseLandmarkerLiveStreamDelegate {
  let onPose = EventDispatcher()
  let onRep = EventDispatcher()

  var downAngle = 100.0
  var upAngle = 160.0
  var minVisibility = 0.5
  var minRepSec = 0.8
  var maxRepSec = 6.0
  var active = true

  private let session = AVCaptureSession()
  private let queue = DispatchQueue(label: "slipper.squat")
  private let preview = AVCaptureVideoPreviewLayer()
  private var rotation: AVCaptureDevice.RotationCoordinator?
  private var landmarker: PoseLandmarker?
  private var frameW = 480.0, frameH = 640.0
  private var isDown = false, downAt = 0.0, lastPoseEvent = 0.0, lastVisible: Bool?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    preview.session = session
    preview.videoGravity = .resizeAspectFill
    layer.addSublayer(preview)
    queue.async { self.setUp() }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    preview.frame = bounds
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil { queue.async { self.session.stopRunning() } } // 미션 화면을 나가면 카메라를 꺼요
  }

  private func setUp() {
    guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
          let input = try? AVCaptureDeviceInput(device: device) else { return }
    session.beginConfiguration()
    session.sessionPreset = .vga640x480 // 자세 인식에는 이 정도면 충분하고 빨라요
    if session.canAddInput(input) { session.addInput(input) }
    let output = AVCaptureVideoDataOutput()
    output.alwaysDiscardsLateVideoFrames = true
    output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
    output.setSampleBufferDelegate(self, queue: queue)
    if session.canAddOutput(output) { session.addOutput(output) }
    let rc = AVCaptureDevice.RotationCoordinator(device: device, previewLayer: preview)
    rotation = rc
    if let c = output.connection(with: .video), c.isVideoRotationAngleSupported(rc.videoRotationAngleForHorizonLevelCapture) {
      c.videoRotationAngle = rc.videoRotationAngleForHorizonLevelCapture // 세로 화면 그대로 분석
    }
    session.commitConfiguration()
    DispatchQueue.main.async {
      if let c = self.preview.connection, c.isVideoRotationAngleSupported(rc.videoRotationAngleForHorizonLevelPreview) {
        c.videoRotationAngle = rc.videoRotationAngleForHorizonLevelPreview
      }
    }
    landmarker = makeLandmarker()
    session.startRunning()
  }

  private func makeLandmarker() -> PoseLandmarker? {
    let bundle = Bundle(for: SquatView.self)
    let path = bundle.url(forResource: "SlipperVision", withExtension: "bundle").flatMap { Bundle(url: $0) }?.path(forResource: "pose_landmarker_lite", ofType: "task")
      ?? bundle.path(forResource: "pose_landmarker_lite", ofType: "task")
      ?? Bundle.main.path(forResource: "pose_landmarker_lite", ofType: "task")
    guard let path else { return nil }
    let options = PoseLandmarkerOptions()
    options.baseOptions.modelAssetPath = path
    options.runningMode = .liveStream
    options.numPoses = 1
    options.poseLandmarkerLiveStreamDelegate = self
    return try? PoseLandmarker(options: options)
  }

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard let landmarker, let pixels = CMSampleBufferGetImageBuffer(sampleBuffer), let image = try? MPImage(sampleBuffer: sampleBuffer) else { return }
    frameW = Double(CVPixelBufferGetWidth(pixels))
    frameH = Double(CVPixelBufferGetHeight(pixels))
    let ms = Int(CMSampleBufferGetPresentationTimeStamp(sampleBuffer).seconds * 1000)
    try? landmarker.detectAsync(image: image, timestampInMilliseconds: ms)
  }

  func poseLandmarker(_ poseLandmarker: PoseLandmarker, didFinishDetection result: PoseLandmarkerResult?, timestampInMilliseconds: Int, error: Error?) {
    let now = Double(timestampInMilliseconds) / 1000
    // 23·24 엉덩이, 25·26 무릎, 27·28 발목 (MediaPipe 자세 점 번호)
    guard let pose = result?.landmarks.first, pose.count > 28,
          [23, 24, 25, 26, 27, 28].allSatisfy({ (pose[$0].visibility?.doubleValue ?? 0) >= minVisibility }) else {
      send(visible: false, angle: nil, now: now)
      return
    }
    let angle = (knee(pose[23], pose[25], pose[27]) + knee(pose[24], pose[26], pose[28])) / 2
    send(visible: true, angle: angle, now: now)
    guard active else { return }
    if !isDown, angle < downAngle {
      isDown = true
      downAt = now
    } else if isDown, angle > upAngle {
      isDown = false
      let took = now - downAt
      if took >= minRepSec, took <= maxRepSec { DispatchQueue.main.async { self.onRep() } }
    }
  }

  // 엉덩이-무릎-발목 사이 각도(도). 정규화 좌표라 화면 비율을 맞춰서 계산해요
  private func knee(_ hip: NormalizedLandmark, _ knee: NormalizedLandmark, _ ankle: NormalizedLandmark) -> Double {
    let ax = Double(hip.x - knee.x) * frameW, ay = Double(hip.y - knee.y) * frameH
    let bx = Double(ankle.x - knee.x) * frameW, by = Double(ankle.y - knee.y) * frameH
    let cos = (ax * bx + ay * by) / max(1e-6, (ax * ax + ay * ay).squareRoot() * (bx * bx + by * by).squareRoot())
    return acos(min(1, max(-1, cos))) * 180 / .pi
  }

  // 보이는지 바뀌었을 때는 바로, 그 외에는 초당 5번까지만 알려요
  private func send(visible: Bool, angle: Double?, now: Double) {
    guard visible != lastVisible || now - lastPoseEvent >= 0.2 else { return }
    lastVisible = visible
    lastPoseEvent = now
    var payload: [String: Any] = ["visible": visible]
    if let angle { payload["angle"] = angle }
    DispatchQueue.main.async { self.onPose(payload) }
  }
}
