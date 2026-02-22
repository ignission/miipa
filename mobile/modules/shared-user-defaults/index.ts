import { requireOptionalNativeModule } from "expo";

interface SharedUserDefaultsNativeModule {
	setItem(key: string, value: string, suiteName: string): Promise<void>;
	getItem(key: string, suiteName: string): Promise<string | null>;
	removeItem(key: string, suiteName: string): Promise<void>;
}

// iOS のみで利用可能（見つからない場合は null）
const NativeModule =
	requireOptionalNativeModule<SharedUserDefaultsNativeModule>(
		"SharedUserDefaults",
	);

if (!NativeModule) {
	console.warn(
		"[SharedUserDefaults] NativeModule is null - not running on iOS or module not linked",
	);
}

export async function setItem(
	key: string,
	value: string,
	suiteName: string,
): Promise<void> {
	await NativeModule?.setItem(key, value, suiteName);
}

export async function getItem(
	key: string,
	suiteName: string,
): Promise<string | null> {
	return (await NativeModule?.getItem(key, suiteName)) ?? null;
}

export async function removeItem(
	key: string,
	suiteName: string,
): Promise<void> {
	await NativeModule?.removeItem(key, suiteName);
}
