import AlarmKit
import ExpoModulesCore
import SwiftUI

struct SlipperAlarmData: AlarmMetadata {}

// AlarmKit 알람 (iOS 26+). 무음 모드·집중 모드에서도 울리고 잠금 화면에 크게 떠요.
// 정지 버튼은 시스템이 항상 넣어요(뺄 수 없음). 그래서 미션을 끝낼 때까지 뒤따르는 알람을 미리 예약해 두고, 끝내면 앱이 지워요(src/alarm.ts).
public class SlipperAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SlipperAlarm")

    AsyncFunction("requestAuthorization") { () async throws -> Bool in
      try await AlarmManager.shared.requestAuthorization() == .authorized
    }

    // atMs 시각에 한 번 울려요. 만든 알람 id를 돌려줘요. sound는 앱에 들어 있는 소리 파일 이름(예: classic.caf)
    AsyncFunction("schedule") { (atMs: Double, title: String, sound: String?) async throws -> String in
      let id = UUID()
      let label = LocalizedStringResource(stringLiteral: title)
      let alert: AlarmPresentation.Alert
      if #available(iOS 26.1, *) {
        alert = AlarmPresentation.Alert(title: label, secondaryButton: nil, secondaryButtonBehavior: nil)
      } else {
        // iOS 26.0은 정지 버튼 모양을 직접 넘겨야 해요
        alert = AlarmPresentation.Alert(title: label, stopButton: AlarmButton(text: "정지", textColor: .white, systemImageName: "stop.circle"), secondaryButton: nil, secondaryButtonBehavior: nil)
      }
      let attributes = AlarmAttributes<SlipperAlarmData>(
        presentation: AlarmPresentation(alert: alert, countdown: nil, paused: nil),
        metadata: nil,
        tintColor: Color(red: 1, green: 0.624, blue: 0.039) // #FF9F0A
      )
      let config = AlarmManager.AlarmConfiguration<SlipperAlarmData>.alarm(
        schedule: .fixed(Date(timeIntervalSince1970: atMs / 1000)),
        attributes: attributes,
        stopIntent: nil,
        secondaryIntent: nil,
        sound: sound.map { .named($0) } ?? .default
      )
      _ = try await AlarmManager.shared.schedule(id: id, configuration: config)
      return id.uuidString
    }

    Function("cancel") { (id: String) in
      if let uuid = UUID(uuidString: id) { try? AlarmManager.shared.cancel(id: uuid) }
    }

    Function("cancelAll") {
      for a in (try? AlarmManager.shared.alarms) ?? [] { try? AlarmManager.shared.cancel(id: a.id) }
    }

    // 지금 울리고 있는 알람 id들
    Function("alerting") { () -> [String] in
      ((try? AlarmManager.shared.alarms) ?? []).filter { $0.state == .alerting }.map { $0.id.uuidString }
    }

    Function("stop") { (id: String) in
      if let uuid = UUID(uuidString: id) { try? AlarmManager.shared.stop(id: uuid) }
    }
  }
}
