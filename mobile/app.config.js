// Google iOS Client IDからリバースClient IDを動的に生成
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
const reversedClientId = googleIosClientId
	? `com.googleusercontent.apps.${googleIosClientId.split(".")[0]}`
	: "";

/** @type {import('expo/config').ExpoConfig} */
const config = {
	name: "miipa",
	slug: "miipa",
	version: "1.0.0",
	orientation: "portrait",
	icon: "./assets/images/icon.png",
	scheme: "miipa",
	userInterfaceStyle: "automatic",
	newArchEnabled: true,
	splash: {
		image: "./assets/images/splash-icon.png",
		resizeMode: "contain",
		backgroundColor: "#ffffff",
	},
	ios: {
		supportsTablet: true,
		bundleIdentifier: "app.miipa",
		appleTeamId: "R5ZPX6N7L7",
		entitlements: {
			"com.apple.security.application-groups": ["group.app.miipa.shared"],
		},
		infoPlist: {
			CFBundleURLTypes: [
				{
					CFBundleURLSchemes: [reversedClientId, "miipa"].filter(Boolean),
				},
			],
			UIBackgroundModes: ["fetch"],
			ITSAppUsesNonExemptEncryption: false,
		},
	},
	android: {
		package: "app.miipa",
		adaptiveIcon: {
			foregroundImage: "./assets/images/adaptive-icon.png",
			backgroundColor: "#ffffff",
		},
		edgeToEdgeEnabled: true,
		predictiveBackGestureEnabled: false,
		permissions: [
			"android.permission.RECEIVE_BOOT_COMPLETED",
			"android.permission.WAKE_LOCK",
		],
	},
	web: {
		bundler: "metro",
		output: "static",
		favicon: "./assets/images/favicon.png",
	},
	plugins: [
		"expo-router",
		"expo-secure-store",
		"expo-web-browser",
		"expo-background-fetch",
		"expo-task-manager",
		"@bacons/apple-targets",
	],
	experiments: {
		typedRoutes: true,
	},
	extra: {
		router: {},
		eas: {
			build: {
				experimental: {
					ios: {
						appExtensions: [
							{
								bundleIdentifier: "app.miipa.widget",
								targetName: "MiipaWidget",
								entitlements: {
									"com.apple.security.application-groups": [
										"group.app.miipa.shared",
									],
								},
							},
							{
								bundleIdentifier: "app.miipa.watchkitapp",
								targetName: "MiipaWatch",
								entitlements: {
									"com.apple.security.application-groups": [
										"group.app.miipa.shared",
									],
								},
							},
						],
					},
				},
			},
			projectId: "5bb0a61d-f8be-4f33-b242-88e229c95dc4",
		},
	},
	owner: "ignission",
};

export default { expo: config };
