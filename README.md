# Borç Defteri — Native Uygulama (Capacitor)

Bu klasör, hazır web arayüzünü (`www/index.html`) gerçek bir Android/iOS uygulamasına
dönüştürmek için hazırlanmış bir Capacitor projesidir. Uygulama **tamamen çevrimdışıdır**:
tüm dosyalar uygulamanın içine paketlenir, hiçbir sunucuya ya da internete bağlanmaz.
Veriler cihazda kalıcı olarak saklanır.

## Ne yapar
Kimden hangi ürünü/borcu **aldığınızı** ya da kime **verdiğinizi** kaydeder, otomatik zaman
damgası uygular. Borç tahsil/teslim edildiğinde tek dokunuşla **Kapandı** olarak işaretlenir
ve kapanış zamanı da kaydedilir.

- **Yeni:** Yön (Verdim = Alacak / Aldım = Borç) seç, kişi ve ürün seç, miktarı gir, kaydet.
- **Defter:** Kayıtları sayfa sayfa çevirerek gör; oradan da kapat/düzenle.
- **Liste:** Ara, duruma (Açık/Kapandı) ve yöne (Alacak/Borç) göre filtrele, tahsil et / sil.
- **Ayarlar:** Kişileri ve ürünleri yönet. Her ürün için miktar kuralı:
  **Küsürlü** (örn. bilezik → gram) ya da **Tam sayı** (örn. 24 ayar külçe → adet).
- **Yedek:** Okunabilir çıktı, PDF paylaş/indir, JSON yedekle/geri yükle.

## Web sürümü (GitHub Pages)
Aynı uygulama tarayıcıdan da açılır: **https://camperfire51.github.io/borc-defteri/**

- Telefonda açıp **Ana ekrana ekle** (Android: Chrome menüsü → *Uygulamayı yükle*,
  iPhone: Safari → *Paylaş* → *Ana Ekrana Ekle*) dersen uygulama gibi tam ekran açılır.
- İlk açılıştan sonra **internetsiz de çalışır** (service worker: `www/sw.js`).
- Kayıtlar sunucuya gitmez; **o tarayıcının** yerel deposunda kalır. Tarayıcı verilerini
  temizlemek kayıtları da siler → ara ara **Yedek** sekmesinden JSON yedeği al.
  Telefon ↔ bilgisayar aktarımı da bu JSON ile yapılır.

**Yayınlama:** `www/` altında bir değişikliği `main` dalına push'lamak yeterli;
`.github/workflows/pages.yml` siteyi ~1 dakikada günceller (build adımı yok).

## Önkoşullar
Ortak:
- Node.js 20+ ve npm (https://nodejs.org)

Android için: Android Studio (güncel) + JDK 17
iOS için (yalnızca Mac): Xcode + CocoaPods (`sudo gem install cocoapods`)

## Kurulum (tek seferlik)
Terminalde bu klasörün içine gir, sonra:

```bash
# 1) Capacitor çekirdeği
npm install @capacitor/core @capacitor/cli

# 2) Hedef platform(lar)
npm install @capacitor/android      # Android için
npm install @capacitor/ios          # iOS için (Mac)

# 3) Native projeleri oluştur
npx cap add android                 # android/ klasörü oluşur
npx cap add ios                     # ios/ klasörü oluşur (Mac)

# 4) (Opsiyonel) ikon/splash — assets/ klasörü gerektirir
npm install -D @capacitor/assets
npx capacitor-assets generate

# 5) Web dosyalarını native projelere kopyala
npx cap sync
```

appId / appName ayarları `capacitor.config.json` içindedir.

## Cihaza kurma / APK üretme

### Android
```bash
npx cap open android
```
Android Studio açılır. Telefonu USB ile bağlayıp **Run**, veya
**Build > Build Bundle(s) / APK(s) > Build APK(s)** ile `.apk` üret.
Komut satırından: `npm run build:android` → `android/app/build/outputs/apk/debug/app-debug.apk`

### iOS (Mac)
```bash
npx cap open ios
```
Xcode açılır. Kendi Apple hesabınla imzalayıp **Run**.

## Güncelleme
`www/index.html` dosyasını değiştirdikten sonra:
```bash
npx cap sync
```
Sonra Android Studio / Xcode'dan tekrar derle.

## Notlar
- **İnternet yok:** Uygulama hiçbir ağ isteği yapmaz; uçak modunda da çalışır.
- **Veri kalıcılığı:** Veriler cihazın yerel deposunda tutulur. Cihaz değiştirme/yedekleme
  için **Yedek** sekmesinden ara ara JSON yedeği almanı öneririz (kayıtlar + kişiler + ürünler).

## Klasör yapısı
```
borc-defteri-app/
├── .github/workflows/
│   └── pages.yml           # www/ → GitHub Pages otomatik yayın
├── capacitor.config.json   # uygulama kimliği, adı, web klasörü
├── package.json
├── www/
│   ├── index.html          # uygulamanın tamamı (tek dosya, çevrimdışı)
│   ├── manifest.webmanifest  # PWA bilgileri (ad, ikon, renk)
│   ├── sw.js               # service worker (yalnızca web sürümü)
│   └── icons/              # icon.svg + üretilmiş PNG ikonlar
├── android/                # (npx cap add android sonrası oluşur)
└── ios/                    # (npx cap add ios sonrası oluşur)
```
