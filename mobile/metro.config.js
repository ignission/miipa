const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, "../shared");

const config = getDefaultConfig(projectRoot);

// モノレポ対応: shared/ パッケージを監視対象に追加
config.watchFolders = [sharedRoot];

// shared/ パッケージの node_modules を解決対象に含める
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	path.resolve(projectRoot, "..", "node_modules"),
];

// React重複防止: mobile/node_modules のreactを優先して使用
config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (moduleName === "react" || moduleName === "react-dom") {
		return {
			filePath: require.resolve(moduleName, {
				paths: [path.resolve(projectRoot, "node_modules")],
			}),
			type: "sourceFile",
		};
	}
	return context.resolveRequest(context, moduleName, platform);
};

// NativeWind v4 対応: withNativeWind でラップ
module.exports = withNativeWind(config, {
	input: "./global.css",
});
