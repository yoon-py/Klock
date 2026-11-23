Pod::Spec.new do |s|
  s.name           = 'SlipperAlarm'
  s.version        = '1.0.0'
  s.summary        = 'Slipper alarms via AlarmKit'
  s.description    = 'Schedules, cancels and inspects AlarmKit alarms (iOS 26+).'
  s.author         = ''
  s.homepage       = 'https://example.invalid'
  s.platforms      = { :ios => '26.0' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AlarmKit'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
