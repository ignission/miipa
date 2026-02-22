require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SharedUserDefaults'
  s.version        = package['version']
  s.summary        = 'App Groups UserDefaults module for Expo'
  s.description    = 'Expo module to read/write App Groups UserDefaults for widget data sharing'
  s.author         = package['author']
  s.homepage       = 'https://github.com/ignission/miipa'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
