Pod::Spec.new do |s|
  s.name           = 'SlipperVision'
  s.version        = '1.0.0'
  s.summary        = 'Slipper photo compare (Vision) and squat camera (MediaPipe)'
  s.description    = 'On-device image feature-print distance and a front-camera squat counter using MediaPipe Pose Landmarker.'
  s.author         = ''
  s.homepage       = 'https://example.invalid'
  s.platforms      = { :ios => '26.0' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'MediaPipeTasksVision', '0.10.33'

  s.source_files = "**/*.{h,m,swift}"
  s.resource_bundles = { 'SlipperVision' => ['pose_landmarker_lite.task'] }
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    # MediaPipe는 정적 xcframework라 빌드 폴더에 복사된 곳을 직접 알려 줘야 import가 돼요
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "${PODS_XCFRAMEWORKS_BUILD_DIR}/MediaPipeTasksVision" "${PODS_XCFRAMEWORKS_BUILD_DIR}/MediaPipeTasksCommon"'
  }
end
