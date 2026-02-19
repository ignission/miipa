import { requireNativeModule } from "expo";
import { Platform } from "react-native";

interface SharedUserDefaultsNativeModule {
	setItem(key: string, value: string, suiteName: string): Promise<void>;
	getItem(key: string, suiteName: string): Promise<string | null>;
	removeItem(key: string, suiteName: string): Promise<void>;
}

// iOS のみで利用可能
const NativeModule: SharedUserDefaultsNativeModule | null =
	Platform.OS === "ios"
		? requireNativeModule<SharedUserDefaultsNativeModule>("SharedUserDefaults")
		: null;

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
