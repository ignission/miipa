// SoloDay Service Worker
// Cache-First戦略で静的アセットをキャッシュし、ネットワークファーストでAPIリクエストを処理

var CACHE_NAME = "soloday-v1";

// キャッシュ対象の静的アセットパターン
var STATIC_EXTENSIONS = [
	".css",
	".js",
	".png",
	".jpg",
	".jpeg",
	".gif",
	".svg",
	".ico",
	".woff",
	".woff2",
];

// APIパスの判定
function isApiRequest(url) {
	return url.pathname.indexOf("/api/") === 0;
}

// 静的アセットの判定
function isStaticAsset(url) {
	for (var i = 0; i < STATIC_EXTENSIONS.length; i++) {
		if (url.pathname.indexOf(STATIC_EXTENSIONS[i]) !== -1) {
			return true;
		}
	}
	return false;
}

// installイベント: 初期キャッシュの作成
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			// 初期キャッシュとしてルートページをプリキャッシュ
			return cache.addAll(["/"]);
		}),
	);
	// 待機中の新しいService Workerを即座にアクティベート
	self.skipWaiting();
});

// activateイベント: 古いキャッシュの削除
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((name) => name !== CACHE_NAME)
						.map((name) => caches.delete(name)),
				),
			),
	);
	// 新しいService Workerで既存のクライアントを制御
	self.clients.claim();
});

// fetchイベント: リクエストの処理
self.addEventListener("fetch", (event) => {
	var url = new URL(event.request.url);

	// 同一オリジン以外のリクエストはスキップ
	if (url.origin !== self.location.origin) {
		return;
	}

	// APIリクエスト: ネットワークファースト
	if (isApiRequest(url)) {
		event.respondWith(
			fetch(event.request)
				.then((response) => response)
				.catch(() => caches.match(event.request)),
		);
		return;
	}

	// 静的アセット: キャッシュファースト
	if (isStaticAsset(url)) {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				if (cached) {
					return cached;
				}
				return fetch(event.request).then((response) => {
					// 正常なレスポンスのみキャッシュ
					if (response.status === 200) {
						var responseClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseClone);
						});
					}
					return response;
				});
			}),
		);
		return;
	}

	// その他のリクエスト: ネットワークファースト（フォールバックとしてキャッシュ）
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// ナビゲーションリクエストはキャッシュに保存
				if (response.status === 200 && event.request.mode === "navigate") {
					var responseClone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseClone);
					});
				}
				return response;
			})
			.catch(() => caches.match(event.request)),
	);
});
