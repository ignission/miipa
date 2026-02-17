/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  name: "MiipaWidget",
  bundleIdentifier: "app.miipa.widget",
  entitlements: {
    "com.apple.security.application-groups": [
      "group.app.miipa.shared",
    ],
  },
  frameworks: ["SwiftUI", "WidgetKit"],
  deploymentTarget: "17.0",
};
