/**
 * Expo config plugin: fix-watch-embed
 *
 * @bacons/apple-targets にはバグがあり、WatchOS アプリターゲットが自分自身を
 * "Embed Foundation Extensions" フェーズに埋め込んでしまう。
 * 本来はメインの iOS アプリターゲットの "Embed Watch Content" フェーズに
 * 埋め込まれるべき。
 *
 * このプラグインは @bacons/apple-targets の後に実行され、
 * 生成された project.pbxproj を修正する。
 *
 * 修正内容:
 * 1. MiipaWatch の自己埋め込みフェーズを分析し、自己参照と拡張機能を分離
 * 2. Watch拡張(.appex)はMiipaWatchの "Embed Foundation Extensions" フェーズに保持
 * 3. MiipaWatch.app はメインアプリの "Embed Watch Content" フェーズに移動
 * 4. メインアプリの依存関係に MiipaWatch を追加
 * 5. MiipaWatch の自己依存関係を削除
 *
 * 実装メモ:
 * @bacons/apple-targets は独自の mod チェーン (xcodeProjectBeta2) を使用しており、
 * withDangerousMod は xcodeProjectBeta2 の前に実行されるため使用できない。
 * withXcodeProjectBeta はプロバイダ登録済みエラーになる。
 * そこで、既存の xcodeProjectBeta2 プロバイダをラップして、
 * ファイル書き込み後に修正を適用する。
 */
const fs = require("node:fs");

const { PBXNativeTarget } = require("@bacons/xcode/build/api/PBXNativeTarget");
const {
	PBXCopyFilesBuildPhase,
} = require("@bacons/xcode/build/api/PBXSourcesBuildPhase");

/**
 * インメモリの XcodeProject オブジェクトを修正する
 */
function fixWatchEmbed(project) {
	// メインの iOS アプリターゲットを取得
	const mainAppTarget = project.rootObject.getMainAppTarget("ios");
	if (!mainAppTarget) {
		console.warn("[fix-watch-embed] Main iOS app target not found, skipping");
		return;
	}

	// WatchOS ターゲットを取得
	const watchTarget = project.rootObject.props.targets.find(
		(t) => PBXNativeTarget.is(t) && t.isWatchOSTarget(),
	);
	if (!watchTarget) {
		console.warn("[fix-watch-embed] WatchOS target not found, skipping");
		return;
	}

	console.log(
		`[fix-watch-embed] Found main app: ${mainAppTarget.props.name}, watch: ${watchTarget.props.name}`,
	);

	// --- Step 1: MiipaWatch の自己埋め込みフェーズを見つけて分析 ---
	const watchSelfEmbedPhaseIndex = watchTarget.props.buildPhases.findIndex(
		(phase) =>
			PBXCopyFilesBuildPhase.is(phase) &&
			(phase.props.name === "Embed Foundation Extensions" ||
				phase.props.name === "Embed Watch Content"),
	);

	const selfEmbedFiles = []; // Watch自身のプロダクト → メインアプリに移動
	const extensionFiles = []; // Watch拡張(.appex) → Watchに残す
	const watchProductRef = watchTarget.props.productReference;

	if (watchSelfEmbedPhaseIndex !== -1) {
		const selfEmbedPhase =
			watchTarget.props.buildPhases[watchSelfEmbedPhaseIndex];
		console.log(
			`[fix-watch-embed] Found self-embed phase "${selfEmbedPhase.props.name}" on ${watchTarget.props.name} with ${selfEmbedPhase.props.files.length} file(s)`,
		);

		// ビルドファイルを分類
		for (const buildFile of selfEmbedPhase.props.files) {
			const fileRef = buildFile.props.fileRef;
			if (watchProductRef && fileRef && fileRef.uuid === watchProductRef.uuid) {
				// Watch自身のプロダクト（自己埋め込み）→ メインアプリに移動
				selfEmbedFiles.push(buildFile);
				console.log(
					`[fix-watch-embed] Classified as self-embed: ${watchTarget.props.name} product`,
				);
			} else {
				// Watch拡張（.appex等）→ Watchターゲットに残す
				extensionFiles.push(buildFile);
				console.log(
					`[fix-watch-embed] Classified as extension: will keep in ${watchTarget.props.name}`,
				);
			}
		}

		// 自己埋め込みフェーズを削除
		watchTarget.props.buildPhases.splice(watchSelfEmbedPhaseIndex, 1);
		console.log(
			`[fix-watch-embed] Removed self-embed phase from ${watchTarget.props.name}`,
		);
	}

	// --- Step 2: Watch拡張をMiipaWatchの "Embed Foundation Extensions" に再追加 ---
	if (extensionFiles.length > 0) {
		let watchExtensionPhase = watchTarget.props.buildPhases.find(
			(phase) =>
				PBXCopyFilesBuildPhase.is(phase) &&
				phase.props.name === "Embed Foundation Extensions",
		);

		if (!watchExtensionPhase) {
			watchExtensionPhase = watchTarget.createBuildPhase(
				PBXCopyFilesBuildPhase,
				{
					name: "Embed Foundation Extensions",
					dstSubfolderSpec: 13,
					dstPath: "",
					files: [],
					buildActionMask: 2147483647,
					runOnlyForDeploymentPostprocessing: 0,
				},
			);
			console.log(
				`[fix-watch-embed] Created "Embed Foundation Extensions" phase on ${watchTarget.props.name}`,
			);
		}

		for (const buildFile of extensionFiles) {
			if (!watchExtensionPhase.getBuildFile(buildFile.props.fileRef)) {
				watchExtensionPhase.props.files.push(buildFile);
				console.log(
					`[fix-watch-embed] Kept extension in ${watchTarget.props.name}'s "Embed Foundation Extensions"`,
				);
			}
		}
	}

	// --- Step 3: メインアプリに "Embed Watch Content" フェーズを作成/更新 ---
	let mainEmbedWatchPhase = mainAppTarget.props.buildPhases.find(
		(phase) =>
			PBXCopyFilesBuildPhase.is(phase) &&
			phase.props.name === "Embed Watch Content",
	);

	if (!mainEmbedWatchPhase) {
		mainEmbedWatchPhase = mainAppTarget.createBuildPhase(
			PBXCopyFilesBuildPhase,
			{
				name: "Embed Watch Content",
				dstSubfolderSpec: 16,
				dstPath: "$(CONTENTS_FOLDER_PATH)/Watch",
				files: [],
				buildActionMask: 2147483647,
				runOnlyForDeploymentPostprocessing: 0,
			},
		);
		console.log(
			`[fix-watch-embed] Created "Embed Watch Content" phase on ${mainAppTarget.props.name}`,
		);
	}

	// 自己埋め込みファイル（Watch.app）をメインアプリに移動
	for (const buildFile of selfEmbedFiles) {
		if (!mainEmbedWatchPhase.getBuildFile(buildFile.props.fileRef)) {
			mainEmbedWatchPhase.props.files.push(buildFile);
			console.log(
				`[fix-watch-embed] Moved Watch app to main app's "Embed Watch Content"`,
			);
		}
	}

	// もし自己埋め込みフェーズが無かった場合でも、
	// MiipaWatch.app がメインアプリの埋め込みフェーズに無ければ追加する
	if (selfEmbedFiles.length === 0) {
		if (watchProductRef && !mainEmbedWatchPhase.getBuildFile(watchProductRef)) {
			mainEmbedWatchPhase.createFile({
				fileRef: watchProductRef,
				settings: { ATTRIBUTES: ["RemoveHeadersOnCopy"] },
			});
			console.log(
				`[fix-watch-embed] Added ${watchTarget.props.name} product to main app's "Embed Watch Content"`,
			);
		}
	}

	// --- Step 4: メインアプリの依存関係に MiipaWatch を追加 ---
	const hasDependencyOnWatch = mainAppTarget.props.dependencies.some(
		(dep) => dep.props.target && dep.props.target.uuid === watchTarget.uuid,
	);
	if (!hasDependencyOnWatch) {
		mainAppTarget.addDependency(watchTarget);
		console.log(
			`[fix-watch-embed] Added dependency: ${mainAppTarget.props.name} -> ${watchTarget.props.name}`,
		);
	}

	// --- Step 5: MiipaWatch の自己依存関係を削除 ---
	const selfDepIndex = watchTarget.props.dependencies.findIndex(
		(dep) => dep.props.target && dep.props.target.uuid === watchTarget.uuid,
	);
	if (selfDepIndex !== -1) {
		watchTarget.props.dependencies.splice(selfDepIndex, 1);
		console.log(
			`[fix-watch-embed] Removed self-dependency from ${watchTarget.props.name}`,
		);
	}

	console.log("[fix-watch-embed] Fix applied successfully");
}

/**
 * @bacons/apple-targets の xcodeProjectBeta2 mod チェーンのプロバイダをラップし、
 * プロバイダがファイルを読み込んだ後（= modResults が渡される時）に
 * インメモリ修正を挿入する。
 *
 * Expo の mod チェーンは逆順に実行される:
 *   最後に追加された mod (= チェーンの先頭) が最初に action を呼ばれ、
 *   nextMod 経由で次の mod に渡す。
 *   プロバイダは最後に実行され、ファイルを読み込んで modResults をセットし、
 *   戻り値を上流に返す。上流の mod は modResults を変更できる。
 *   全ての mod が完了した後、プロバイダの write() でファイルに書き戻す。
 *
 * しかし、プロバイダの後に mod を追加できないため、
 * プロバイダ自体をラップして修正を注入する。
 */
const withFixWatchEmbed = (config) => {
	// config.mods.ios.xcodeProjectBeta2 が存在するか確認
	if (!config.mods?.ios?.xcodeProjectBeta2) {
		console.warn(
			"[fix-watch-embed] xcodeProjectBeta2 mod not found, skipping. " +
				"Ensure this plugin is listed AFTER @bacons/apple-targets in the plugins array.",
		);
		return config;
	}

	const originalMod = config.mods.ios.xcodeProjectBeta2;

	// プロバイダをラップして、modResults (XcodeProject) に修正を適用する
	// 注意: プロバイダは内部で read() -> nextMod() -> write() を行うため、
	// プロバイダ実行後に修正した場合は再度ファイルに書き戻す必要がある。
	const wrappedMod = async (props) => {
		// 元のチェーンを実行（全ての mod + プロバイダの read/write が完了する）
		const result = await originalMod(props);

		// modResults に XcodeProject オブジェクトが含まれている
		if (result.modResults) {
			try {
				fixWatchEmbed(result.modResults);

				// プロバイダが既にファイルを書き込んだ後なので、
				// 修正した内容を再度ファイルに書き戻す
				const xcodeParse = require("@bacons/xcode/build/json");
				const { IOSConfig } = require("expo/config-plugins");
				const pbxprojPath = IOSConfig.Paths.getPBXProjectPath(
					result._internal?.projectRoot || props.modRequest?.projectRoot || "",
				);
				const contents = xcodeParse.build(result.modResults.toJSON());
				if (contents.trim().length) {
					fs.writeFileSync(pbxprojPath, contents, "utf8");
					console.log(
						`[fix-watch-embed] Re-wrote fixed pbxproj to ${pbxprojPath}`,
					);
				}
			} catch (error) {
				console.error(
					`[fix-watch-embed] Failed to fix watch embed: ${error.message}`,
				);
				console.error(error.stack);
			}
		}

		return result;
	};

	// プロバイダフラグを引き継ぐ
	wrappedMod.isProvider = originalMod.isProvider;
	wrappedMod.isIntrospective = originalMod.isIntrospective;

	config.mods.ios.xcodeProjectBeta2 = wrappedMod;

	return config;
};

module.exports = withFixWatchEmbed;
