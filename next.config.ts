import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// keytarはネイティブモジュールのため、バンドルから除外
	serverExternalPackages: ["keytar"],
};

export default nextConfig;
