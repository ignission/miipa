/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
	type: "watch",
	bundleIdentifier: "app.miipa.watchkitapp",
	deploymentTarget: "10.0",
	entitlements: {
		"com.apple.security.application-groups": ["group.app.miipa.shared"],
	},
	frameworks: ["WatchKit", "SwiftUI", "WatchConnectivity"],
};
