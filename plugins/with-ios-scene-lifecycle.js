const { withAppDelegate } = require('expo/config-plugins');

/**
 * Expo SDK 57 ships ExpoAppSceneDelegate for iOS 27, but its project template
 * still starts React Native from the legacy application delegate. Connect the
 * generated AppDelegate to Expo's scene delegate so iOS 27 does not terminate
 * the app at launch. Remove this plugin once the upstream template does this.
 */
module.exports = (config) =>
  withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') {
      throw new Error('with-ios-scene-lifecycle requires a Swift AppDelegate');
    }

    let source = mod.modResults.contents;
    source = source.replace(
      'class AppDelegate: ExpoAppDelegate {',
      'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
    );

    source = source.replace(
      /\n#if os\(iOS\) \|\| os\(tvOS\)\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\n#endif\n/,
      '\n'
    );

    if (!source.includes('class SceneDelegate: ExpoAppSceneDelegate')) {
      source += '\nclass SceneDelegate: ExpoAppSceneDelegate {}\n';
    }

    mod.modResults.contents = source;
    return mod;
  });
