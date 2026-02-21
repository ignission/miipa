/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
	type: "watch-widget",
	name: "MiipaWatchWidget",
	displayName: "miipa",
	bundleIdentifier: "app.miipa.watchkitapp.widget",
	deploymentTarget: "10.0",
	entitlements: {
		"com.apple.security.application-groups": ["group.app.miipa.shared"],
	},
	frameworks: ["WidgetKit", "SwiftUI"],
};
