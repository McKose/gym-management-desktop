# Gym Management System (Desktop)

Bu proje, spor salonları ve stüdyolar için geliştirilmiş modern bir yönetim sistemidir. Artık **Electron** altyapısı ile bağımsız bir masaüstü uygulaması olarak çalışmaktadır.

## 🚀 Başlangıç Rehberi

### 1. Gereksinimler
- **Node.js**: [İndirin](https://nodejs.org/) (LTS sürümü önerilir).

### 2. Kurulum
Terminalde aşağıdaki komutu çalıştırın:
```bash
npm install
```

### 3. Uygulamayı Çalıştırma

**Geliştirme Modu:**
```bash
npm run dev
```
*Bu komut hem Next.js sunucusunu hem de Electron penceresini açar.*

**Taşınabilir Sürümü Başlatma:**
Klasördeki `start_app_portable.bat` dosyasını çift tıklayarak çalıştırabilirsiniz.

### 4. Veri Saklama
Verileriniz otomatik olarak yerel dosya sisteminde saklanır:
- **Geliştirme aşamasında:** `data/` klasöründe JSON formatında.
- **Paketlendiğinde:** Kullanıcı uygulama verileri klasöründe (`%APPDATA%`).

---

## 🛠️ Yönetici Hesabı
Sisteme ilk girişte varsayılan yönetici bilgileri:
- **Kullanıcı:** Sistem otomatik olarak Admin rolüyle başlar.
- **Şifre (Gerekirse):** `1234`

## 📦 Uygulamayı Paketleme (.exe oluşturma)
Windows için kurulum dosyası oluşturmak için:
```bash
npm run dist
```
*Oluşturulan dosyalar `dist/` klasörüne kaydedilir.*
