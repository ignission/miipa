/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
	type: "watch",
	name: "MiipaWatch",
	displayName: "miipa",
	bundleIdentifier: "app.miipa.watchkitapp",
	deploymentTarget: "10.0",
	icon: "../../assets/images/icon.png",
	entitlements: {
		"com.apple.security.application-groups": ["group.app.miipa.shared"],
	},
	frameworks: ["WatchKit", "SwiftUI", "WatchConnectivity", "WidgetKit"],
};
