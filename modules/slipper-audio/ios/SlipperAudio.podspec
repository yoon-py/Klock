Pod::Spec.new do |s|
  s.name           = 'SlipperAudio'
  s.version        = '1.0.0'
  s.summary        = 'Slipper monaural beat generator'
  s.description    = 'Generates one monaural beat (two sine waves summed in one channel) in real time.'
  s.author         = ''
  s.homepage       = 'https://example.invalid'
  s.platforms      = { :ios => '26.0' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
