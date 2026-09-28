# Borç Defteri — Proje Rehberi (Claude Code için)

Bu dosya Claude Code'a projenin bağlamını verir. Claude Code, çalıştığın klasördeki
CLAUDE.md dosyasını otomatik okur.

## Proje nedir
Tek dosyalık, tamamen çevrimdışı çalışan bir "borç defteri" uygulaması.
Kimden hangi ürünü/borcu aldığını ya da kime verdiğini not eder; otomatik zaman damgası
uygular; borcun tahsil/teslim edilmesini ayrı bir zaman damgasıyla "kapandı" olarak işaretler.

Her kayıt: yön (Verdim = Alacak / Aldım = Borç), kişi, ürün, miktar (ürün kuralına göre
küsürlü gramaj ya da tam sayı), (opsiyonel) not, durum (Açık/Kapandı) ve zaman damgaları tutar.
Capacitor ile tek kod tabanından Android ve iOS'a paketlenir. Aynı `www/` klasörü GitHub Pages'te
kurulabilir bir PWA olarak da yayınlanır: https://camperfire51.github.io/borc-defteri/

## Mimari / dosya yapısı
- `www/index.html` — UYGULAMANIN TAMAMI buradadır. Tek dosya: HTML + CSS + saf
  (vanilla) JavaScript. Dış bağımlılık ve ağ isteği YOK.
- `www/manifest.webmanifest`, `www/icons/` — PWA manifest'i ve ikonlar (`icon.svg` kaynaktır;
  PNG'ler ondan üretilir). `index.html` bunlara `<link>` ile bağlanır.
- `www/sw.js` — service worker; yalnızca tarayıcı/GitHub Pages sürümünde kaydedilir (Capacitor'da
  `isNative()` true olduğu için kaydedilmez). Sayfa ağ öncelikli, diğer dosyalar önbellekten gelir.
- `.github/workflows/pages.yml` — `main`'e push'ta `www/` klasörünü olduğu gibi Pages'e yayınlar.
- `capacitor.config.json` — appId, appName, webDir=www.
- `assets/` — (opsiyonel) ikon/splash kaynak görselleri (`capacitor-assets generate` kullanır).
- `android/`, `ios/` — `npx cap add` ile OLUŞAN native projeler. `www` içeriği bunlara
  `npx cap sync` ile kopyalanır. (Tek proje; iki ayrı proje DEĞİL.)

## Veri modeli
localStorage'ta üç anahtar:
- `borc-defteri:entries` — kayıtlar: `{ id, direction:"verdim"|"aldim", personId, personName,
  productId, productName, unit, decimal, qty, note, status:"acik"|"kapandi", createdAt,
  settledAt?, updatedAt? }`. `personName/productName/unit/decimal` snapshot olarak saklanır;
  böylece ilgili kişi/ürün silinse bile kayıt doğru görüntülenir.
- `borc-defteri:people` — kişiler: `{ id, name, phone }`
- `borc-defteri:products` — ürünler: `{ id, name, unit, decimal }`. `decimal=true` küsürlü
  gramaja (örn. bilezik), `decimal=false` tam sayı zorunluluğuna (örn. külçe altın) karşılık gelir.

Yön semantiği: **Verdim → Alacak (yeşil)**, **Aldım → Borç (kırmızı)**.

## Önemli kurallar (Claude Code bunlara uymalı)
- Tüm uygulama mantığı `www/index.html` içindedir; değişiklikleri orada yap.
- Saf JS kullan. Build adımı / framework / paketleyici YOK.
- Dış CDN, script ya da npm paketi EKLEME — uygulama çevrimdışı kalmalı.
- Veri yalnızca `localStorage`'ta saklanır (yukarıdaki üç anahtar).
- Arayüz dili Türkçe. Mevcut tasarım dilini (koyu tema + altın vurgu) koru.
- Bir kayda yeni bir alan eklerken şu yerleri birlikte güncelle: (1) form `renderYeni` +
  `wireYeni`, (2) doğrulama + `addOrUpdate` (+`startEdit`), (3) Defter sayfası `paintPage`,
  (4) Liste kartı + arama `getFiltered`/`renderListItems`, (5) okunabilir çıktı
  `toReadableText`, yazdırma `refreshPrintArea`, PDF `recordsToPdfImages` ve JSON `doImport`.
- Ürün/kişi kurallarını değiştirirken `renderAyarlar`/`wireAyarlar` ile `defaultProducts`'ı gözden geçir.
- Değişiklikten sonra native'e yansıtmak için `npx cap sync` çalıştır.
- Web sürümü `github.io/borc-defteri/` alt yolunda çalışır: `www/` içindeki tüm yollar GÖRELİ olmalı
  (`/icons/x.png` değil `icons/x.png`).
- `www/` içine yeni bir statik dosya eklersen `sw.js` içindeki `SHELL` listesine de ekle; önbellek
  yapısı değişirse `CACHE` adındaki sürümü artır (`borc-defteri-v2` …). Service worker kullanıcı
  verisine dokunmaz; veri yalnızca localStorage'ta kalır.

## Önkoşullar
- Node.js 18+ (Capacitor CLI için)
- Android: Android Studio + JDK 17 + Android SDK (API 23+)
- iOS (yalnızca Mac): Xcode + CocoaPods

## Kurulum (tek seferlik)
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android        # iOS için ayrıca: npm install @capacitor/ios
npx cap add android                   # iOS için ayrıca: npx cap add ios
npm install -D @capacitor/assets && npx capacitor-assets generate   # (opsiyonel, assets/ gerekir)
npx cap sync
```

## Geliştirme döngüsü
1. `www/index.html`'i düzenle
2. `npm run sync` (veya `npx cap sync`)
3. Android Studio'da aç/çalıştır: `npm run open:android`
4. Komut satırından debug APK: `npm run build:android`
   - Çıktı: `android/app/build/outputs/apk/debug/app-debug.apk`

## Notlar
- Bu uygulama ağ kullanmaz; istemediğin sürece ağ kodu ekletme. (Tek istisna: web sürümünde
  `sw.js` uygulamanın kendi dosyalarını önbelleğe alır.)
- Web'e yayın: `main` dalına push → GitHub Actions ~1 dk içinde siteyi günceller.
- Eski kayıtlar yeni alanlar olmadan da çalışmalı (alanlar opsiyonel ele alınmalı).
- İlk açılışta `products` anahtarı yoksa örnek ürünler (Bilezik, Çeyrek Altın, Külçe…) seed edilir.
