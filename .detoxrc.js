/**
 * Detox baseline config for Amber Stash.
 *
 * This file intentionally describes both an iOS simulator and an Android
 * emulator profile so contributors with either platform can run the E2E
 * smoke test. The harness itself does NOT run Detox — you need:
 *
 *   - macOS + Xcode + an installed simulator (for ios.sim.debug), or
 *   - Android Studio + a configured AVD (for android.emu.debug)
 *
 * After EAS Build / `expo prebuild` produces a native binary under
 * `ios/build/` or `android/app/build/`, update the `binaryPath` entries
 * below to match. See `e2e/README` for the full bootstrap instructions.
 *
 * Docs: https://wix.github.io/Detox/docs/config/overview
 */

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },

  apps: {
    'ios.debug': {
      type: 'ios.app',
      // After `npx expo prebuild --platform ios && xcodebuild ...`, the .app
      // lands here. Adjust the scheme / configuration if you customize the
      // generated Xcode workspace.
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/AmberStash.app',
      build:
        "xcodebuild -workspace ios/AmberStash.xcworkspace -scheme AmberStash -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet",
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew :app:assembleDebug :app:assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
  },

  devices: {
    'ios.simulator': {
      type: 'ios.simulator',
      device: {
        // Override via DETOX_DEVICE env if the simulator name differs locally.
        type: process.env.DETOX_DEVICE || 'iPhone 15',
      },
    },
    'android.emulator': {
      type: 'android.emulator',
      device: {
        avdName: process.env.DETOX_AVD || 'Pixel_7_API_34',
      },
    },
  },

  configurations: {
    'ios.sim.debug': {
      device: 'ios.simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'android.emulator',
      app: 'android.debug',
    },
  },
};
