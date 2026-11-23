import ExpoModulesCore
import Vision

// 사진 미션 비교(Vision)와 스쿼트 카메라(MediaPipe, SquatView.swift). 모두 폰 안에서만 처리해요.
public class SlipperVisionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SlipperVision")

    // 두 사진의 특징 거리. 작을수록 같은 곳 (기준값은 src/config/thresholds.ts의 PHOTO)
    AsyncFunction("photoDistance") { (a: String, b: String) -> Double in
      var d: Float = 0
      try featurePrint(a).computeDistance(&d, to: featurePrint(b))
      return Double(d)
    }

    View(SquatView.self) {
      Events("onPose", "onRep")
      Prop("downAngle") { (v: SquatView, x: Double) in v.downAngle = x }
      Prop("upAngle") { (v: SquatView, x: Double) in v.upAngle = x }
      Prop("minVisibility") { (v: SquatView, x: Double) in v.minVisibility = x }
      Prop("minRepSec") { (v: SquatView, x: Double) in v.minRepSec = x }
      Prop("maxRepSec") { (v: SquatView, x: Double) in v.maxRepSec = x }
      Prop("active") { (v: SquatView, x: Bool) in v.active = x }
    }
  }
}

private func featurePrint(_ uri: String) throws -> VNFeaturePrintObservation {
  let url = uri.hasPrefix("file:") ? URL(string: uri)! : URL(fileURLWithPath: uri)
  let request = VNGenerateImageFeaturePrintRequest()
  try VNImageRequestHandler(url: url, options: [:]).perform([request])
  guard let print = request.results?.first else { throw Exception(name: "NoFeaturePrint", description: "사진에서 특징을 못 찾았어요") }
  return print
}
