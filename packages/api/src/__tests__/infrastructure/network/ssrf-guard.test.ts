import { describe, expect, it } from "vitest";
import {
	isInternalHost,
	readResponseWithSizeLimit,
} from "@/lib/infrastructure/network/ssrf-guard";

describe("isInternalHost", () => {
	describe("ループバックアドレス", () => {
		it.each([
			"localhost",
			"::1",
			"127.0.0.1",
			"127.0.0.2",
			"127.255.255.255",
		])("%s を内部ホストとして検出する", (host) => {
			expect(isInternalHost(host)).toBe(true);
		});
	});

	describe("RFC 1918 プライベートアドレス", () => {
		it.each([
			"10.0.0.1",
			"10.255.255.255",
			"172.16.0.1",
			"172.31.255.255",
			"192.168.1.1",
			"192.168.0.0",
		])("%s を内部ホストとして検出する", (host) => {
			expect(isInternalHost(host)).toBe(true);
		});
	});

	describe("CGNAT (RFC 6598)", () => {
		it.each([
			"100.64.0.1",
			"100.127.255.255",
		])("%s を内部ホストとして検出する", (host) => {
			expect(isInternalHost(host)).toBe(true);
		});
	});

	describe("リンクローカル", () => {
		it("169.254.1.1 を内部ホストとして検出する", () => {
			expect(isInternalHost("169.254.1.1")).toBe(true);
		});
	});

	describe("IPv6 ULA", () => {
		it.each(["fc00::1", "fd00::1"])("%s を内部ホストとして検出する", (host) => {
			expect(isInternalHost(host)).toBe(true);
		});
	});

	describe("IPv6 リンクローカル", () => {
		it("fe80::1 を内部ホストとして検出する", () => {
			expect(isInternalHost("fe80::1")).toBe(true);
		});
	});

	describe("IPv6マッピングIPv4", () => {
		it.each([
			"::ffff:127.0.0.1",
			"::ffff:10.0.0.1",
			"::ffff:192.168.1.1",
		])("%s を内部ホストとして検出する", (host) => {
			expect(isInternalHost(host)).toBe(true);
		});
	});

	describe("IPエンコーディングバイパス", () => {
		it("16進数IP (0x7f000001) を内部ホストとして検出する", () => {
			expect(isInternalHost("0x7f000001")).toBe(true);
		});

		it("10進数IP (2130706433) を内部ホストとして検出する", () => {
			expect(isInternalHost("2130706433")).toBe(true);
		});

		it("8進数IP (0177.0.0.1) を内部ホストとして検出する", () => {
			expect(isInternalHost("0177.0.0.1")).toBe(true);
		});
	});

	describe("クラウドメタデータエンドポイント", () => {
		it("metadata.google.internal を内部ホストとして検出する", () => {
			expect(isInternalHost("metadata.google.internal")).toBe(true);
		});

		it("169.254.169.254 (AWS/GCPメタデータIP) を内部ホストとして検出する", () => {
			expect(isInternalHost("169.254.169.254")).toBe(true);
		});
	});

	describe("ブラケット付きIPv6", () => {
		it("[::1] を内部ホストとして検出する", () => {
			expect(isInternalHost("[::1]")).toBe(true);
		});
	});

	describe("正常な外部ホスト", () => {
		it.each([
			"google.com",
			"8.8.8.8",
			"1.1.1.1",
			"example.com",
			"203.0.113.1",
		])("%s を外部ホストとして許可する", (host) => {
			expect(isInternalHost(host)).toBe(false);
		});
	});
});

describe("readResponseWithSizeLimit", () => {
	it("通常サイズのレスポンスを読み取る", async () => {
		const body = "Hello, World!";
		const response = new Response(body, {
			headers: { "content-length": String(body.length) },
		});

		const result = await readResponseWithSizeLimit(response);
		expect(result).toBe(body);
	});

	it("Content-Lengthがリミット超過の場合nullを返す", async () => {
		const response = new Response("small body", {
			headers: { "content-length": "999999999" },
		});

		const result = await readResponseWithSizeLimit(response, 100);
		expect(result).toBeNull();
	});

	it("ストリーミングでリミット超過の場合nullを返す", async () => {
		// Content-Lengthなし、実際のボディが大きい
		const largeBody = "x".repeat(200);
		const response = new Response(largeBody);

		const result = await readResponseWithSizeLimit(response, 100);
		expect(result).toBeNull();
	});

	it("bodyがnullの場合nullを返す", async () => {
		const response = new Response(null);

		const result = await readResponseWithSizeLimit(response);
		expect(result).toBeNull();
	});

	it("空のレスポンスボディを正しく処理する", async () => {
		const response = new Response("", {
			headers: { "content-length": "0" },
		});

		const result = await readResponseWithSizeLimit(response);
		expect(result).toBe("");
	});

	it("デフォルトのリミット（5MB）以内のレスポンスを読み取る", async () => {
		const body = "test data";
		const response = new Response(body);

		const result = await readResponseWithSizeLimit(response);
		expect(result).toBe(body);
	});
});
