# Borç Defteri — Proje Rehberi (Claude Code için)

Bu dosya Claude Code'a projenin bağlamını verir. Claude Code, çalıştığın klasördeki
CLAUDE.md dosyasını otomatik okur.

## Proje nedir
Tek dosyalık, tamamen çevrimdışı çalışan bir "borç defteri" uygulaması.
Kim kime hangi ürünü verdi, onu not eder; otomatik zaman damgası uygular; kaydın
kapanmasını (tahsil/teslim) ayrı bir zaman damgasıyla "kapandı" olarak işaretler.
İleride KuyumHUB'ın bir parçası olacak; şimdilik standalone ve çevrimdışı gelişir.

Her kayıt: kimden (veren) → kime (alan), ürün, miktar (ürün kuralına göre küsürlü gramaj ya da
tam sayı), (opsiyonel) not, durum (Açık/Kapandı/Silindi), zaman damgaları ve düzenleme sürümlerini
tutar. Arayüz kaydı tek cümle olarak gösterir: **"Hasan'dan Ayşen'e 1,5 gram 24 Ayar Külçe"**.
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
- `borc-defteri:entries` — kayıtlar: `{ id, fromId, fromName, toId, toName,
  productId, productName, unit, decimal, qty, note, status:"acik"|"kapandi"|"silindi", createdAt,
  settledAt?, updatedAt?, deletedAt?, history? }`. `fromName/toName/productName/unit/decimal`
  snapshot olarak saklanır; böylece ilgili kişi/ürün silinse bile kayıt doğru görüntülenir.
  - `history` — önceki sürümler, eskiden yeniye: `[{ at, ...VERSION_FIELDS }]`. `at` o sürümün
    oluştuğu an (ilk sürümde `createdAt`, sonrakilerde düzenleme zamanı). Her düzenlemede mevcut
    hal buraya eklenir; sürüm sınırı yok, hiçbir sürüm silinmez.
- `borc-defteri:people` — kişiler: `{ id, name, phone }`
- `borc-defteri:products` — ürünler: `{ id, name, unit, decimal }`. `decimal=true` küsürlü
  gramaja (virgülden sonra en fazla 2 basamak, `QTY_DECIMALS`), `decimal=false` tam sayıya karşılık gelir.

Taraflar: `fromId`/`toId` bir kişi id'sidir; veren ve alan aynı olamaz. Hazır kişi/ürün YOK —
her kurulum boş başlar ("Ben" gibi yerleşik bir taraf da yok).

Eski kayıtlar (`direction:"verdim"|"aldim"` + `personId/personName`) `normalizeEntry` ile
yüklenirken ve JSON içe aktarılırken çevrilir: **verdim → Ben'den kişiye**, **aldim → kişiden Ben'e**.
`ME_ID` (`"me"`, adı "Ben") yalnızca bu eski kayıtlar için vardır; seçicilerde çıkmaz.

Cümle: `whoText`/`whoHTML` + `trSuffix` Türkçe ayrılma/yönelme eklerini üretir
(Hasan'dan, Mehmet'ten, Ayşen'e, Ali'ye; eski kayıtlarda "Benden"/"bana"). `sentenceText` tüm çıktılarda kullanılır.

Kayıt kuralları:
- **Kalıcı silme yok.** Sil → `status:"silindi"` + `deletedAt`. Silinen kayıt Defter/Liste'de
  görünmez (`liveEntries`), okunabilir çıktıda "Silindi" olarak bütün sürümleriyle kalır.
  Numara (#N / "Kayıt N") tüm kayıtlar içindeki sıradır, silinenler de sayılır.
- **Kapatma nihaidir:** kapanan kayıt yeniden açılamaz ve düzenlenemez (silinen de düzenlenemez).
  Düğmeler gizli, `startEdit`/`addOrUpdate`/`doSettle` da engeller. Geri alınamayan Kapat ve Sil
  önce onay satırı gösterir (`state.confirm`, `actionsHTML`/`wireActions`).
- Önceki sürümler yalnızca okunabilir çıktıda (metin, yazdırma, PDF) görünür; üçü de `recordDoc`'tan beslenir.
- Kişi ve ürün adları tekildir (`findByName`: boşluk sadeleştirilir, büyük/küçük harf farkı sayılmaz).
  JSON içe aktarmada aynı adlı kişi/ürün eklenmez, kayıtlar mevcut olana bağlanır.
- Yeni sekmesinde kaydın sonucu büyük bildirimle (`popup`) gösterilir: yeşil tik ya da nedenleriyle
  kırmızı çarpı. Başarılı kayıttan sonra form tamamen sıfırlanır.

## Önemli kurallar (Claude Code bunlara uymalı)
- Tüm uygulama mantığı `www/index.html` içindedir; değişiklikleri orada yap.
- Saf JS kullan. Build adımı / framework / paketleyici YOK.
- Dış CDN, script ya da npm paketi EKLEME — uygulama çevrimdışı kalmalı.
- Veri yalnızca `localStorage`'ta saklanır (yukarıdaki üç anahtar).
- Arayüz dili Türkçe. Mevcut tasarım dilini (koyu tema + altın vurgu) koru.
- Bir kayda yeni bir alan eklerken şu yerleri birlikte güncelle: (1) form `renderYeni` +
  `wireYeni` (+ önizleme `previewHTML`, `blankForm`), (2) doğrulama + `addOrUpdate` (+`startEdit`),
  düzenlenebilir bir alansa `VERSION_FIELDS`, (3) Defter sayfası `paintPage`,
  (4) Liste kartı + arama `getFiltered`/`renderListItems`, (5) okunabilir çıktının ortak içeriği
  `recordDoc` (metin `toReadableText`, yazdırma `refreshPrintArea`, PDF `recordsToPdfImages`) ve JSON `doImport`.
- Ürün/kişi kurallarını değiştirirken `renderAyarlar`/`wireAyarlar`/`addPerson`/`addProduct`'ı gözden geçir.
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
- Eski kayıtlar yeni alanlar olmadan da çalışmalı (alanlar opsiyonel ele alınmalı). Eski kayıtlarda
  3 ondalık basamak olabilir; gösterimde yuvarlanmaz, düzenlenirken 2 basamağa indirilmesi istenir.
- İlk açılışta hiçbir şey seed edilmez; kişiler ve ürünler Ayarlar'dan eklenir.
