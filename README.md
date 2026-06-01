# Briefing

> **Toplantı notlarınızı yapay zeka ile analiz edin.** PDF, Word veya metin dosyanızı yükleyin — Briefing birkaç saniye içinde özet, kararlar, aksiyon maddeleri, katılımcılar ve duygu analizi çıkarır.

[![CI](https://github.com/AarontheGalaxy/briefing/actions/workflows/ci.yml/badge.svg)](https://github.com/AarontheGalaxy/briefing/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/python-3.12-blue)
![Node](https://img.shields.io/badge/node-20-green)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)

---

## İçindekiler

1. [Briefing Nedir?](#briefing-nedir)
2. [Özellikler](#özellikler)
3. [Desteklenen Platformlar](#desteklenen-platformlar)
4. [Mimari ve Çalışma Mantığı](#mimari-ve-çalışma-mantığı)
5. [Gereksinimler — Kurulmadan Önce Ne Lazım?](#gereksinimler--kurulmadan-önce-ne-lazım)
6. [Hızlı Başlangıç — Docker ile (Önerilen)](#hızlı-başlangıç--docker-ile-önerilen)
7. [Manuel Kurulum — Adım Adım](#manuel-kurulum--adım-adım)
   - [macOS](#macos)
   - [Windows](#windows)
   - [Linux (Ubuntu / Debian)](#linux-ubuntu--debian)
8. [LLM Sağlayıcı Kurulumu](#llm-sağlayıcı-kurulumu)
   - [Ollama — Ücretsiz, Yerel](#ollama--ücretsiz-yerel)
   - [OpenAI](#openai)
   - [Anthropic](#anthropic)
9. [Yapılandırma Referansı](#yapılandırma-referansı)
10. [Briefing'i Kullanmak — Adım Adım](#briefingi-kullanmak--adım-adım)
11. [API Referansı](#api-referansı)
12. [Webhook Entegrasyonu](#webhook-entegrasyonu)
13. [Testleri Çalıştırmak](#testleri-çalıştırmak)
14. [CI / CD](#ci--cd)
15. [Docker — Üretim Ortamı](#docker--üretim-ortamı)
16. [Proje Yapısı](#proje-yapısı)
17. [Teknik Yığın](#teknik-yığın)
18. [Sorun Giderme](#sorun-giderme)
19. [Güvenlik](#güvenlik)
20. [Katkıda Bulunmak](#katkıda-bulunmak)
21. [Lisans](#lisans)

---

## Briefing Nedir?

Briefing, ham toplantı transkriptlerini yapılandırılmış, eyleme dönüştürülebilir bilgiye çeviren bir web uygulamasıdır.

Şunları yapabilirsiniz:
- PDF, Word (DOCX), Markdown veya düz metin dosyası yükleyin
- Ya da notlarınızı doğrudan yapıştırın
- Bir LLM sağlayıcı seçin (ücretsiz yerel ya da bulut tabanlı)
- Saniyeler içinde aşağıdakileri alın:

| Çıktı | Açıklama |
|-------|---------|
| **Özet** | Toplantının 3-5 cümlelik özeti |
| **Temel Kararlar** | Alınan kararların numaralı listesi |
| **Aksiyon Maddeleri** | Görev, kişi, son tarih ve öncelik bilgisiyle |
| **Katılımcılar** | İsimler otomatik tanımlanır |
| **Konular** | Tartışılan konuların listesi |
| **Sonraki Toplantı** | Eğer metinde geçiyorsa tarih çıkarılır |
| **Duygu Analizi** | Pozitif / Nötr / Negatif |

Tüm sonuçlar yerel SQLite veritabanına kaydedilir. Verileriniz Ollama kullanıyorsanız bilgisayarınızdan hiç ayrılmaz.

---

## Özellikler

### Analiz
- **Çoklu format desteği:** PDF, DOCX, TXT, MD — 50 MB'a kadar (ayarlanabilir)
- **Metin yapıştırma:** 100.000 karaktere kadar doğrudan not veya transkript girişi
- **Toplu analiz (Batch):** Birden fazla dosyayı sıraya alın, tek tıkla hepsini analiz edin; başarısız olan dosyaları tek tek yeniden deneyin
- **Toplantı tipi şablonları:** Genel, Satış, 1:1, Sprint Review, Yönetim Kurulu — her format için farklı prompt
- **İptal butonu:** Analiz başladıktan sonra istediğiniz zaman iptal edin
- **İlerleme:** İşlem süresi ve kelime sayısı anlık gösterilir

### Geçmiş ve Organizasyon
- **Kalıcı geçmiş:** Her analiz SQLite'a kaydedilir, yeniden başlatmadan sonra kaybolmaz
- **Tam metin arama (FTS5):** Özet, dosya adı, kararlar, konular ve katılımcılarda arama — prefix matching ile
- **Etiket sistemi:** Analizlere etiket ekleyin; sidebar'da etikete tıklayarak filtreleme yapın
- **Aksiyon maddesi takibi:** Maddeleri işaretleyin; durum veritabanına kaydedilir
- **Katılımcı takibi:** Bir isme tıklayın — o kişinin katıldığı tüm toplantıları görün
- **Sayfalama:** Geçmiş 20'şer öğe yüklenir; "Daha Fazla Yükle" butonu ile devam
- **Silmeyi Geri Al:** Silme ikonu yerine 5 saniyelik "Geri Al" toast'u gösterilir

### Dışa Aktarma
- **Markdown export:** `.md` dosyası olarak indir
- **JSON export:** Ham veriyi `.json` olarak indir
- **Yazdır:** Temiz, yazıcı dostu HTML sayfası açılır
- **Panoya kopyala:** Özet, kararlar ve aksiyon maddelerini tek tıkla kopyala

### Ayarlar ve Entegrasyon
- **Üç LLM sağlayıcı:** Ollama (yerel, ücretsiz), OpenAI, Anthropic
- **Oturum bazlı API anahtarları:** Anahtarlar yalnızca sekme açıkken tutulur, hiçbir sunucuya gönderilmez
- **Webhook bildirimleri:** Her başarılı analizden sonra istediğiniz URL'ye POST gönderir
- **Bağlantı testi:** Sağlayıcı ve model ayarlarını kaydetmeden önce test edin

---

## Desteklenen Platformlar

| Platform | Sürüm | Durum |
|----------|-------|-------|
| **macOS** | 12 Monterey ve üzeri | ✅ Tam destek |
| **macOS** | 11 Big Sur | ⚠️ Çalışır ama test edilmedi |
| **Windows** | 10 (21H2+) | ✅ Tam destek |
| **Windows** | 11 | ✅ Tam destek |
| **Ubuntu** | 22.04 LTS | ✅ Tam destek |
| **Ubuntu** | 20.04 LTS | ✅ Çalışır |
| **Debian** | 11+ | ✅ Çalışır |
| **Fedora** | 38+ | ⚠️ Test edilmedi ama çalışmalı |
| **Windows** | 7 / 8 | ❌ Desteklenmiyor |
| **macOS** | 10.x | ❌ Desteklenmiyor |

### Tarayıcı Desteği

Briefing modern bir web uygulamasıdır. Aşağıdaki tarayıcılar desteklenmektedir:

| Tarayıcı | Minimum Sürüm |
|----------|--------------|
| Google Chrome | 90+ |
| Mozilla Firefox | 88+ |
| Microsoft Edge | 90+ |
| Safari | 14+ |
| Opera | 76+ |

> **Not:** Internet Explorer desteklenmemektedir.

### Donanım Gereksinimleri

| Bileşen | Minimum | Önerilen |
|---------|---------|---------|
| RAM | 4 GB | 8 GB+ |
| Disk | 2 GB boş alan | 5 GB+ (Ollama model için) |
| CPU | Herhangi modern işlemci | — |
| GPU | Gerekli değil | Ollama için hız artışı sağlar |

> Ollama ile büyük bir model (llama3.1 70B) çalıştırıyorsanız 32+ GB RAM gerekebilir. Küçük modeller (llama3.2:3b) 4 GB RAM ile çalışır.

---

## Mimari ve Çalışma Mantığı

```
Tarayıcınız (React + Vite)
       │
       │  HTTP istekleri (REST + JSON / multipart)
       ▼
  FastAPI (Python 3.12)
       ├── /api/upload     → PDF/DOCX/TXT metni çıkarır
       ├── /api/analyze    → LLM'e gönderir, cevabı işler
       ├── /api/history/*  → Geçmiş analizi yönetir
       └── /api/settings/* → Model listesi, bağlantı testi, webhook
              │
              ▼
        SQLite (meetings.db)
          ├── analyses       — analiz sonuçları
          ├── analyses_fts   — FTS5 arama indeksi
          └── app_settings   — webhook URL gibi ayarlar
```

**Bir analizin akışı:**
1. Dosya → `/api/upload` → metin çıkarılır
2. Metin → `/api/analyze` → LLM prompt'u oluşturulur
3. LLM → JSON cevabı döner → parse edilir → SQLite'a kaydedilir
4. FTS5 tetikleyiciler (trigger) yeni satırı otomatik indeksler
5. Webhook (varsa) arka planda, cevabı bloklamadan gönderilir
6. Sonuç tarayıcıya döner, sidebar güncellenir

---

## Gereksinimler — Kurulmadan Önce Ne Lazım?

### Docker kullanıyorsanız
Sadece **Docker Desktop** kurun — başka hiçbir şey gerekmez.

### Manuel kurulum için

| Yazılım | Neden Lazım? | İndirme Linki |
|---------|-------------|---------------|
| **Python 3.12** | Backend sunucuyu çalıştırmak için | [python.org/downloads](https://www.python.org/downloads/) |
| **Node.js 20** | Frontend arayüzü derlemek için | [nodejs.org](https://nodejs.org/) |
| **Git** | Projeyi indirmek için | [git-scm.com](https://git-scm.com/) |
| **Ollama** (opsiyonel) | Ücretsiz yerel AI modeli çalıştırmak için | [ollama.ai](https://ollama.ai) |

> **Python kurulurken dikkat (Windows):** "Add Python to PATH" kutucuğunu **mutlaka** işaretleyin. Yoksa `python` komutu çalışmaz.

> **Node.js kurulurken dikkat:** LTS (Long Term Support) sürümünü seçin.

Kurulumları doğrulamak için terminal/komut istemcisine şunları yazın:

```
python --version    → Python 3.12.x çıkmalı
node --version      → v20.x.x çıkmalı
npm --version       → 10.x.x çıkmalı
git --version       → git version 2.x.x çıkmalı
```

> **Terminal nerede?**
> - **macOS:** Spotlight'a (Cmd+Space) "Terminal" yazın
> - **Windows:** Başlat → "cmd" veya "PowerShell" yazın → Enter
> - **Linux:** Ctrl+Alt+T

---

## Hızlı Başlangıç — Docker ile (Önerilen)

Docker kullanıyorsanız tek bir komutla her şeyi çalıştırabilirsiniz.

### 1. Docker Desktop Kurun

- **macOS/Windows:** [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) adresinden indirin ve kurun
- **Ubuntu/Debian:**
  ```bash
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose-plugin
  sudo systemctl start docker
  sudo usermod -aG docker $USER
  # Oturumu kapatıp açın
  ```

### 2. Projeyi İndirin

```bash
git clone https://github.com/AarontheGalaxy/briefing.git
cd briefing
```

### 3. Başlatın

```bash
docker compose up --build
```

İlk seferde birkaç dakika sürebilir (görüntüler indirilir ve derlenir). Şunu görünce hazırdır:

```
frontend-1  | nginx started
backend-1   | Application startup complete.
```

### 4. Tarayıcıda Açın

- **Uygulama:** [http://localhost:5173](http://localhost:5173)
- **API Dokümantasyonu:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Durdurmak

Terminalde `Ctrl + C` tuşlarına basın. Veri kaybolmaz.

### Arka Planda Çalıştırmak

```bash
docker compose up --build -d   # arka planda başlat
docker compose down            # durdur (veri korunur)
docker compose down -v         # durdur VE tüm veriyi sil
docker compose logs -f         # logları takip et
```

---

## Manuel Kurulum — Adım Adım

### macOS

#### Terminal Açın

`Cmd + Space` → "Terminal" yazın → Enter

#### 1. Homebrew Kurun (Paket Yöneticisi)

Homebrew olmadan da yapılabilir ama çok daha kolaylaşır:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Kurulum sırasında şifrenizi girmeniz istenebilir (ekranda görünmez, bu normaldir).

#### 2. Python ve Node.js Kurun

```bash
brew install python@3.12 node@20
```

Doğrulayın:
```bash
python3 --version   # Python 3.12.x
node --version      # v20.x.x
npm --version       # 10.x.x
```

#### 3. Projeyi İndirin

```bash
git clone https://github.com/AarontheGalaxy/briefing.git
cd briefing
```

#### 4. Backend Kurulumu

```bash
cd backend

# Sanal ortam oluştur (projeyi diğer Python paketlerinden izole eder)
python3 -m venv venv

# Sanal ortamı etkinleştir
source venv/bin/activate
# Terminalde (venv) öneki görünmelidir

# Bağımlılıkları kur
pip install -r requirements.txt

# .env dosyasını oluştur (varsayılan ayarlar zaten çalışır)
cp .env.example .env
```

#### 5. Backend'i Başlatın

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Şunu görmelisiniz:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Bu terminal penceresini **açık bırakın**. Yeni bir terminal açın.

#### 6. Frontend Kurulumu (Yeni Terminalde)

```bash
cd briefing/frontend    # projeyi nereye indirdiyseniz o yol
npm install
```

#### 7. Frontend'i Başlatın

```bash
npm run dev
```

Şunu görmelisiniz:
```
  VITE v6.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

#### 8. Tarayıcıda Açın

[http://localhost:5173](http://localhost:5173)

---

### Windows

#### Komut İstemi Açın

`Windows Tuşu` → "cmd" yazın → Sağ tık → "Yönetici olarak çalıştır"

#### 1. Python Kurun

1. [python.org/downloads](https://www.python.org/downloads/) adresine gidin
2. "Download Python 3.12.x" butonuna tıklayın
3. İndirilen .exe dosyasını çalıştırın
4. **ÖNEMLİ:** "Add Python to PATH" kutucuğunu işaretleyin
5. "Install Now" tıklayın

Doğrulama (yeni bir cmd açın):
```
python --version    # Python 3.12.x görünmeli
```

#### 2. Node.js Kurun

1. [nodejs.org](https://nodejs.org/) adresine gidin
2. "20.x.x LTS" butonuna tıklayın
3. İndirilen .msi dosyasını çalıştırın, Next Next Finish
4. **"Automatically install the necessary tools"** kutucuğunu işaretleyin

Doğrulama (yeni bir cmd açın):
```
node --version      # v20.x.x görünmeli
npm --version       # 10.x.x görünmeli
```

#### 3. Git Kurun

1. [git-scm.com](https://git-scm.com/) → "Download for Windows"
2. Kurucuyu çalıştırın, tüm seçenekleri varsayılan bırakın

#### 4. Projeyi İndirin

```
git clone https://github.com/AarontheGalaxy/briefing.git
cd briefing
```

#### 5. Backend Kurulumu

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

#### 6. Backend'i Başlatın

```
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Şunu görmelisiniz:
```
INFO:     Application startup complete.
```

Bu pencereyi **açık bırakın**. Yeni bir cmd penceresi açın.

#### 7. Frontend Kurulumu (Yeni Pencerede)

```
cd briefing\frontend
npm install
```

#### 8. Frontend'i Başlatın

```
npm run dev
```

#### 9. Tarayıcıda Açın

[http://localhost:5173](http://localhost:5173)

> **Windows Güvenlik Duvarı Uyarısı:** Port 8000 için izin sorulursa "Özel Ağlar" için izin verin.

---

### Linux (Ubuntu / Debian)

#### Terminal Açın

`Ctrl + Alt + T`

#### 1. Sistemi Güncelleyin

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

#### 2. Python 3.12 Kurun

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt-get update
sudo apt-get install -y python3.12 python3.12-venv python3.12-pip
```

Doğrulama:
```bash
python3.12 --version   # Python 3.12.x
```

#### 3. Node.js 20 Kurun

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Doğrulama:
```bash
node --version   # v20.x.x
npm --version    # 10.x.x
```

#### 4. Git Kurun

```bash
sudo apt-get install -y git
```

#### 5. Projeyi İndirin

```bash
git clone https://github.com/AarontheGalaxy/briefing.git
cd briefing
```

#### 6. Backend Kurulumu

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

#### 7. Backend'i Başlatın

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Yeni terminal açın:

#### 8. Frontend Kurulumu

```bash
cd briefing/frontend
npm install
npm run dev
```

#### 9. Tarayıcıda Açın

[http://localhost:5173](http://localhost:5173)

---

## LLM Sağlayıcı Kurulumu

Briefing üç farklı yapay zeka sağlayıcısıyla çalışır. Birini seçin.

### Ollama — Ücretsiz, Yerel

Ollama modelleri bilgisayarınızda çalıştırır. İnternet bağlantısı veya API anahtarı gerektirmez. Verileriniz hiç dışarı çıkmaz.

#### macOS'a Ollama Kurulumu

1. [ollama.ai](https://ollama.ai) adresine gidin
2. "Download for Mac" butonuna tıklayın
3. İndirilen .dmg dosyasını açın, Ollama'yı Applications klasörüne sürükleyin
4. Uygulamayı başlatın — menü çubuğunda bir lama simgesi belirecektir

#### Windows'a Ollama Kurulumu

1. [ollama.ai](https://ollama.ai) adresine gidin
2. "Download for Windows (Preview)" butonuna tıklayın
3. İndirilen .exe dosyasını çalıştırın, kurulum tamamlanır

#### Linux'a Ollama Kurulumu

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Model İndirme

Ollama kurulunca bir model indirmeniz gerekir:

```bash
# Önerilen — çoğu bilgisayar için ideal (yaklaşık 4.7 GB)
ollama pull llama3.1

# Küçük bilgisayarlar için (yaklaşık 2.0 GB, 4 GB RAM yeterli)
ollama pull llama3.2:3b

# En küçük (yaklaşık 1.3 GB, 2 GB RAM yeterli ama kalite düşük)
ollama pull llama3.2:1b

# En yüksek kalite (yaklaşık 40 GB, 32+ GB RAM gerekir)
ollama pull llama3.1:70b
```

#### Ollama'nın Çalıştığını Doğrulama

```bash
curl http://localhost:11434/api/tags
```

Şuna benzer bir çıktı görmelisiniz:
```json
{"models":[{"name":"llama3.1","..."}]}
```

#### Briefing'de Ollama Kullanmak

1. Uygulamayı açın
2. Sol alttaki ⚙ (Settings) simgesine tıklayın
3. "Ollama (Local)" seçili olacaktır — değilse seçin
4. "Test Connection" butonuna tıklayın → "Connection successful" görmelisiniz
5. Model listesinden istediğiniz modeli seçin

---

### OpenAI

OpenAI'nin GPT modellerini kullanmak için bir API anahtarı gerekir. Kullandığınız kadar ücret ödersiniz.

#### API Anahtarı Almak

1. [platform.openai.com](https://platform.openai.com) adresine gidin
2. Hesap oluşturun veya giriş yapın
3. Sağ üstteki hesap simgesi → "View API Keys"
4. "+ Create new secret key" butonuna tıklayın
5. Anahtarı kopyalayın (tekrar gösterilemez, güvenli bir yere kaydedin)
6. Hesabınıza biraz kredi yükleyin (Billing bölümünden)

#### Briefing'de OpenAI Kullanmak

1. ⚙ Settings → "OpenAI" seçin
2. API Key alanına anahtarınızı yapıştırın
3. Model seçin: `gpt-4o-mini` çoğu kullanım için idealdir (hızlı ve uygun fiyatlı)
4. "Test Connection" → "Connection successful"

| Model | Kalite | Hız | Maliyet |
|-------|--------|-----|---------|
| gpt-4o | En yüksek | Orta | Yüksek |
| gpt-4o-mini | Yüksek | Hızlı | Düşük ⭐ |
| gpt-4-turbo | Yüksek | Orta | Orta |
| gpt-3.5-turbo | Orta | Çok hızlı | Çok düşük |

> **Güvenlik:** API anahtarınız yalnızca tarayıcı sekmesi açıkken tutulur (`sessionStorage`). Sekmeyi kapatınca silinir. Hiçbir Briefing sunucusuna gönderilmez — doğrudan tarayıcınızdan OpenAI'ye gider.

---

### Anthropic

Anthropic'in Claude modellerini kullanmak için API anahtarı gerekir.

#### API Anahtarı Almak

1. [console.anthropic.com](https://console.anthropic.com) adresine gidin
2. Hesap oluşturun
3. "API Keys" → "Create Key"
4. Anahtarı kopyalayın

#### Briefing'de Anthropic Kullanmak

1. ⚙ Settings → "Anthropic" seçin
2. API Key alanına anahtarınızı yapıştırın
3. Model seçin: `claude-sonnet-4-6` kalite ve hız dengesi açısından önerilir
4. "Test Connection" → "Connection successful"

| Model | Kalite | Hız | Maliyet |
|-------|--------|-----|---------|
| claude-opus-4-7 | En yüksek | Yavaş | Yüksek |
| claude-sonnet-4-6 | Çok yüksek | Orta | Orta ⭐ |
| claude-3-5-sonnet | Yüksek | Hızlı | Orta |
| claude-3-5-haiku | İyi | Çok hızlı | Düşük |

---

## Yapılandırma Referansı

### Backend `.env` Dosyası

`backend/.env.example` dosyasını `backend/.env` olarak kopyalayın ve düzenleyin.

| Değişken | Varsayılan | Açıklama |
|----------|-----------|---------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama'nın çalıştığı adres. Güvenlik nedeniyle yalnızca localhost adresleri geçerlidir. |
| `OLLAMA_MODEL` | `llama3.1` | Varsayılan Ollama modeli |
| `DEFAULT_PROVIDER` | `ollama` | Arayüz açıldığında hangi sağlayıcı seçili gelsin (`ollama`, `openai`, `anthropic`) |
| `DATABASE_URL` | `sqlite+aiosqlite:///./meetings.db` | Veritabanı dosya yolu. Docker'da otomatik değiştirilir. |
| `MAX_FILE_SIZE_MB` | `50` | Yüklenebilecek maksimum dosya boyutu (MB) |
| `CORS_ORIGINS` | `http://localhost:5173` | Hangi adreslerden bağlantıya izin verilsin. Virgülle ayrılmış liste. |

### Frontend `.env` Dosyası

`frontend/.env.example` dosyasını `frontend/.env` olarak kopyalayın.

| Değişken | Varsayılan | Açıklama |
|----------|-----------|---------|
| `VITE_API_URL` | `http://localhost:8000` | Backend sunucusunun adresi. Değiştirirseniz frontend'i yeniden build etmeniz gerekir. |

> **ÖNEMLİ:** `.env` dosyalarını asla git'e eklemeyin. `.env.example` dosyaları (gerçek değer içermeyen şablonlar) git'e eklenebilir.

---

## Briefing'i Kullanmak — Adım Adım

### İlk Kez Açıyorsanız

[http://localhost:5173](http://localhost:5173) adresini tarayıcınızda açın.

Sol tarafta **sidebar** (yan panel) görürsünüz:
- Üstte "New Analysis" butonu
- Ortada arama kutusu ve geçmiş listesi
- Altta ⚙ Settings butonu

Sağ tarafta **ana panel** bulunur — dosya yükleme veya metin yapıştırma alanı.

---

### Dosya Yükleyerek Analiz

1. Ana panelde **"Upload File"** sekmesi seçili olduğundan emin olun
2. PDF, DOCX, TXT veya MD dosyanızı sürükle-bırak alanına bırakın  
   — ya da alana tıklayın, dosya seçiciden seçin
3. Dosya adı ve kelime sayısı görünür → dosya sunucuya yüklenmiştir
4. **Meeting Type** (Toplantı Tipi) açılır listesinden toplantı türünü seçin:
   - **General:** Genel amaçlı, her toplantı türü için
   - **Sales:** Satış görüşmeleri, müşteri toplantıları
   - **1:1:** Birebir görüşmeler, bireysel geri bildirim
   - **Sprint Review:** Yazılım sprint değerlendirmeleri
   - **Board Meeting:** Yönetim kurulu toplantıları
5. Solda model seçiciyle istediğiniz modeli seçin
6. **"Analyze"** butonuna tıklayın
7. Analiz çalışırken "Analyzing…" görünür — **Cancel** butonu ile iptal edebilirsiniz
8. Birkaç saniye içinde sonuçlar sağda belirir

---

### Metin Yapıştırarak Analiz

1. **"Paste Text"** sekmesine tıklayın
2. Toplantı notlarınızı metin alanına yapıştırın veya yazın (max 100.000 karakter)
3. Adım 4-8'i yukarıdaki gibi izleyin

---

### Toplu Analiz (Batch)

Aynı anda birden fazla dosyayı analiz etmek için:

1. **"Batch"** sekmesine tıklayın
2. Birden fazla dosyayı sürükle-bırak alanına bırakın  
   — veya alana tıklayıp birden fazla dosya seçin (Ctrl/Cmd basılı tutarak)
3. Dosyalar sırayla listelenir, her biri "Pending" durumunda
4. **"Analyze N files"** butonuna tıklayın
5. Her dosya sırayla işlenir:
   - `Uploading…` → `Analyzing…` → `Done` veya `Failed`
6. Başarısız olan dosya varsa yanındaki **↺** (tekrar dene) simgesine tıklayın
7. İşlem bitince "Batch complete" bildirimi görünür
8. Tüm sonuçlar sol sidebar'da otomatik belirir

---

### Sonuçları İncelemek

Analiz tamamlanınca şunları göreceksiniz:

**Tags (Etiketler)**
- Analizin üstünde etiket giriş alanı
- Etiketi yazıp Enter veya virgül ile ekleyin
- Backspace ile son etiketi silin
- Etiketler veritabanına kaydedilir

**Summary (Özet)**
- Toplantının kısa özeti
- Duygu göstergesi: `positive` / `neutral` / `negative`
- İşlem süresi ve kelime sayısı
- Sağ köşedeki 📋 simgesiyle kopyalayın

**Action Items (Aksiyon Maddeleri)**
- Görev, atanan kişi, son tarih, öncelik
- Kutucukları işaretleyin — durum kaydedilir (yeniden açtığınızda korunur)
- 📋 simgesiyle tüm listeyi kopyalayın

**Participants (Katılımcılar)**
- İsme tıklayın → o kişinin katıldığı tüm toplantıları gösteren modal açılır
- Modalda bir toplantıya tıklayın → o analize geçiş yapılır

**Dışa Aktarma**
- **MD:** Markdown formatında indir
- **JSON:** Ham veri olarak indir
- **Print:** Yazdırmaya hazır sayfa açılır

---

### Geçmişte Arama

Sidebar'daki arama kutusuna yazmaya başlayın. Arama aşağıdakilerde yapılır:
- Özet metni
- Dosya adı
- Temel kararlar
- Konular
- Katılımcı isimleri

Arama 300 ms gecikmeyle (debounce) çalışır. Silerseniz tüm geçmiş geri gelir.

---

### Etiketle Filtreleme

Bir analize etiket ekledikten sonra, sidebar'da o etiketin üzerine tıklayın. Yalnızca o etiketi taşıyan analizler görünür. Mavi etiket chips'e (üstte belirir) tıklayarak filtreyi kaldırın.

---

### Analizi Silmek

Sidebar'da bir analizin üzerine gelin → sağda ✕ simgesi belirir → tıklayın.

5 saniyelik "Geri Al" toast'u görünür. İptal etmek için "Undo" tıklayın. Süre dolarsa analiz silinir.

---

## API Referansı

Tüm endpoint'ler `/api` prefixi ile başlar. Swagger dokümantasyonu: [http://localhost:8000/docs](http://localhost:8000/docs)

### `POST /api/upload`

Dosya yükler ve metni çıkarır.

**Rate limit:** Dakikada 20 istek (IP bazlı)

**İstek:** `multipart/form-data`

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|---------|
| `file` | binary | ✅ | PDF, DOCX, TXT veya MD |

**Başarılı Yanıt `200`:**
```json
{
  "text": "Toplantı 10:00'da başladı...",
  "word_count": 1243,
  "file_name": "q1-toplanti.pdf"
}
```

**Hata Yanıtları:**
| Kod | Anlam |
|-----|-------|
| 400 | Desteklenmeyen dosya türü |
| 413 | Dosya boyut limitini aştı |
| 429 | Rate limit aşıldı |

---

### `POST /api/analyze`

Metni LLM ile analiz eder.

**Rate limit:** Dakikada 10 istek (IP bazlı)

**İstek gövdesi:**
```json
{
  "text": "Toplantı transkripti...",
  "provider": "ollama",
  "model": "llama3.1",
  "api_key": null,
  "meeting_type": "general",
  "file_name": "opsiyonel-dosya-adi.pdf"
}
```

| Alan | Tip | Varsayılan | Açıklama |
|------|-----|-----------|---------|
| `text` | string | — | Transkript metni. Boş olamaz. |
| `provider` | string | `"ollama"` | `"ollama"`, `"openai"` veya `"anthropic"` |
| `model` | string | `"llama3.1"` | Sağlayıcıya özel model adı |
| `api_key` | string\|null | `null` | OpenAI ve Anthropic için gerekli |
| `meeting_type` | string | `"general"` | `"general"`, `"sales"`, `"one_on_one"`, `"sprint_review"`, `"board"` |
| `file_name` | string\|null | `null` | Kayıt için kaynak dosya adı |

**Başarılı Yanıt `200`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "summary": "Takım Q1 sonuçlarını değerlendirdi ve lansman tarihini 15 Mart'a taşıdı.",
  "key_decisions": ["15 Mart'ta lansman", "Alice demoyu yönetecek"],
  "action_items": [
    {
      "task": "Demo ortamını hazırla",
      "assignee": "Alice",
      "due_date": "2025-03-10",
      "priority": "high"
    }
  ],
  "participants": ["Alice", "Bob", "Carol"],
  "topics_discussed": ["Q1 Sonuçları", "Lansman Planı"],
  "next_meeting": "22 Mart 10:00",
  "sentiment": "positive",
  "created_at": "2025-03-01T14:32:11.000Z",
  "word_count": 1243,
  "processing_time_ms": 4312,
  "provider": "ollama",
  "model": "llama3.1",
  "file_name": "q1-toplanti.pdf",
  "completed_items": [],
  "tags": []
}
```

---

### `GET /api/history`

Geçmiş analizleri listeler.

**Query Parametreleri:**

| Parametre | Tip | Varsayılan | Açıklama |
|-----------|-----|-----------|---------|
| `page` | integer | `1` | Sayfa numarası |
| `limit` | integer | `20` | Sayfa başına öğe (maks 100) |
| `search` | string | `""` | FTS5 tam metin arama |
| `tag` | string | `""` | Tam eşleşme etiket filtresi |

---

### `GET /api/history/{id}`

Tek bir analizi getirir. `id` geçerli UUID olmalıdır.

---

### `DELETE /api/history/{id}`

Bir analizi siler.

---

### `PATCH /api/history/{id}/tags`

Etiketleri günceller.

```json
{ "tags": ["q1", "satis", "acil"] }
```

---

### `PATCH /api/history/{id}/actions`

Tamamlanan aksiyon maddelerini günceller.

```json
{ "completed": [0, 2] }
```

Dizi, sıfırdan başlayan indeksleri içerir.

---

### `GET /api/participants/{name}/analyses`

Belirli bir katılımcının geçmiş toplantılarını getirir.

---

### `GET /api/settings/models`

Bir sağlayıcı için mevcut modelleri listeler.

`?provider=ollama` / `?provider=openai` / `?provider=anthropic`

---

### `POST /api/settings/test`

Sağlayıcı bağlantısını test eder.

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "api_key": "sk-...",
  "ollama_url": null
}
```

---

### `GET /api/settings/webhook`

Mevcut webhook URL'sini getirir.

---

### `PUT /api/settings/webhook`

Webhook URL'sini ayarlar veya kaldırır.

```json
{ "url": "https://sunucunuz.com/webhook" }
```

`null` göndermek webhook'u kaldırır.

---

### `GET /health`

Sağlık kontrolü.

```json
{ "status": "ok" }
```

---

## Webhook Entegrasyonu

Webhook ile her analizden sonra otomatik bildirim gönderebilirsiniz (Slack, Notion, n8n, Zapier vb.).

### Kurulum

1. ⚙ Settings → "Webhook URL" alanını bulun
2. Endpoint URL'nizi girin (üretim için HTTPS önerilir)
3. **Save** tıklayın

### Gönderilen Veri

```json
{
  "id": "...",
  "summary": "...",
  "key_decisions": ["..."],
  "action_items": [{ "task": "...", "assignee": "...", "due_date": null, "priority": "high" }],
  "participants": ["Alice"],
  "sentiment": "positive",
  "created_at": "2025-03-01T14:32:11.000Z",
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

### Davranış

- Webhook **asenkron** gönderilir — API yanıtını bloklamaz
- Timeout: **10 saniye**
- Başarısız olursa server loguna yazılır, yeniden deneme yoktur
- Analiz başarısız olursa webhook gönderilmez

### Güvenlik

Webhook URL'si teslimattan önce doğrulanır:
- `http://` ve `https://` izinli
- `localhost`, `127.0.0.1`, `::1` **engellendi** (yerel servis taramasını önler)
- `10.x`, `172.16.x`, `192.168.x` özel ağ aralıkları **engellendi**
- AWS metadata endpoint (`169.254.169.254`) **engellendi**

---

## Testleri Çalıştırmak

### Backend Testleri

```bash
cd briefing/backend
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

pytest                         # tüm testler
pytest -v                      # detaylı çıktı
pytest tests/test_upload.py    # belirli dosya
pytest -k "test_analyze"       # isme göre filtrele
```

**17 test, 4 dosya:**

| Dosya | Test Sayısı | Kapsam |
|-------|------------|--------|
| test_health.py | 1 | Sağlık kontrolü |
| test_upload.py | 4 | TXT yükleme, desteklenmeyen uzantı, büyük dosya, UTF-8 olmayan encoding |
| test_analyze.py | 4 | Başarılı analiz (mock LLM), eksik API anahtarı, bilinmeyen sağlayıcı, geçmişe kaydetme |
| test_history.py | 8 | Listeleme, ID ile getirme, geçersiz UUID, 404, silme, arama, etiket güncelleme, tamamlanan maddeler |

LLM çağrıları mock'lanır — gerçek API çağrısı yapılmaz, anahtara gerek yoktur.

### Frontend Tip Kontrolü

```bash
cd briefing/frontend
npx tsc --noEmit    # tip kontrolü
npm run build       # tam derleme
```

---

## CI / CD

`.github/workflows/ci.yml` her push ve pull request'te çalışır.

### İş Akışı

```
secret-scan → backend → frontend
```

**secret-scan:** Git'e eklenen `.env`, `.pem`, `.key`, `.db` gibi dosyaları tespit eder ve pipeline'ı durdurur.

**backend:**
1. Python 3.12 kurulumu
2. `ruff check .` — kod kalitesi (E, F, W, I, UP, B, BLE, ARG, SIM kuralları)
3. `pip-audit` — bilinen CVE taraması
4. `pytest` — 17 test

**frontend:**
1. Node 20 kurulumu
2. `npm ci` — reproducible kurulum
3. `npx tsc --noEmit` — TypeScript strict tip kontrolü
4. `npm run build` — tam üretim derlemesi

---

## Docker — Üretim Ortamı

### Ortam Değişkenleri

`docker-compose.yml` yanında `.env` dosyası oluşturun:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
CORS_ORIGINS=https://alanadi.com
VITE_API_URL=https://api.alanadi.com
MAX_FILE_SIZE_MB=25
```

```bash
docker compose --env-file .env up --build -d
```

### Veritabanı Yönetimi

```bash
# Yedek alma
docker compose cp backend:/app/data/meetings.db ./yedek.db

# Yedekten geri yükleme
docker compose cp ./yedek.db backend:/app/data/meetings.db
docker compose restart backend

# Güncelleme
git pull && docker compose up --build -d
```

---

## Proje Yapısı

```
briefing/
├── .github/workflows/ci.yml        # CI pipeline
├── backend/
│   ├── routers/
│   │   ├── analyze.py              # POST /api/analyze
│   │   ├── history.py              # Geçmiş CRUD + arama
│   │   ├── settings.py             # Modeller, test, webhook
│   │   └── upload.py               # Dosya yükleme
│   ├── services/
│   │   ├── extractor.py            # PDF/DOCX/TXT metin çıkarma
│   │   ├── llm.py                  # Ollama/OpenAI/Anthropic bağdaştırıcıları
│   │   ├── parser.py               # Prompt oluşturma + LLM yanıt ayrıştırma
│   │   └── webhook.py              # Asenkron webhook gönderimi
│   ├── tests/                      # 17 pytest testi
│   ├── .env.example                # Tüm ayar şablonu
│   ├── config.py                   # Pydantic Settings
│   ├── database.py                 # Bağlantı yönetimi + şema migrasyonları
│   ├── Dockerfile
│   ├── main.py                     # FastAPI uygulaması
│   ├── models.py                   # Pydantic modelleri
│   ├── pytest.ini
│   ├── requirements.txt
│   └── ruff.toml                   # Linter ayarları
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── analysis/
│   │   │   │   ├── ActionItems.tsx      # Kalıcı aksiyon listesi
│   │   │   │   ├── AnalysisResult.tsx   # Sonuç konteyneri + dışa aktarma
│   │   │   │   ├── ParticipantModal.tsx # Kişi başına toplantı geçmişi
│   │   │   │   ├── Participants.tsx     # Katılımcılar, konular, kararlar
│   │   │   │   ├── Summary.tsx          # Özet + duygu + istatistikler
│   │   │   │   └── TagEditor.tsx        # Satır içi etiket düzenleyici
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   └── Sidebar.tsx          # Geçmiş, arama, etiket filtresi
│   │   │   ├── settings/
│   │   │   │   └── SettingsPanel.tsx    # Sağlayıcı, model, webhook
│   │   │   ├── upload/
│   │   │   │   ├── BatchUpload.tsx      # Toplu dosya kuyruğu
│   │   │   │   ├── ModelSelector.tsx    # Model açılır listesi
│   │   │   │   └── UploadZone.tsx       # Dosya/metin/toplu sekmeler
│   │   │   └── ErrorBoundary.tsx        # Hata sınırı
│   │   ├── hooks/
│   │   │   ├── useAnalysis.ts           # Mutation + abort controller
│   │   │   ├── useCopy.ts               # Pano kopyalama (HTTP fallback)
│   │   │   └── useHistory.ts            # Sayfalı geçmiş + silme
│   │   ├── lib/
│   │   │   ├── api.ts                   # Tüm API fonksiyonları
│   │   │   └── utils.ts                 # Tarih formatı, dışa aktarma
│   │   ├── store/settingsStore.ts       # Zustand + sessionStorage
│   │   ├── types/index.ts               # TypeScript arayüzleri
│   │   ├── App.tsx                      # Kök bileşen
│   │   ├── main.tsx                     # React giriş noktası
│   │   └── vite-env.d.ts               # Vite ortam tipi tanımları
│   ├── .env.example
│   ├── Dockerfile                       # Çok aşamalı: Node derle → nginx sun
│   ├── nginx.conf                       # SPA fallback + gzip + güvenlik başlıkları
│   ├── package.json
│   ├── tsconfig.json                    # Strict TypeScript yapılandırması
│   └── vite.config.ts
├── docker-compose.yml                   # Tek komutla tam kurulum
├── .gitignore                           # Kapsamlı gizli dosya dışlama listesi
└── README.md
```

---

## Teknik Yığın

### Backend
| Kütüphane | Sürüm | Amaç |
|-----------|-------|------|
| FastAPI | 0.136 | ASGI web çerçevesi |
| aiosqlite | 0.20 | Asenkron SQLite sürücüsü |
| Pydantic v2 | 2.9 | İstek/yanıt doğrulama |
| pydantic-settings | 2.6 | `.env` yapılandırma yükleme |
| pypdf | 6.12 | PDF metin çıkarma |
| python-docx | 1.2 | DOCX metin çıkarma |
| httpx | 0.27 | HTTP istemcisi |
| openai | 1.54 | OpenAI SDK |
| anthropic | 0.37 | Anthropic SDK |
| slowapi | 0.1.9 | Rate limiting |
| uvicorn | 0.30 | ASGI sunucusu |

### Frontend
| Kütüphane | Sürüm | Amaç |
|-----------|-------|------|
| React | 18 | UI çerçevesi |
| TypeScript | 5.7 | Tip güvenliği (strict mod) |
| Vite | 6 | Derleme aracı ve dev sunucu |
| TanStack Query | 5 | Sunucu durumu, önbellek, mutasyon |
| Zustand | 5 | İstemci ayarları durumu |
| Tailwind CSS | 3.4 | Yardımcı sınıf tabanlı stil |
| Axios | 1.7 | HTTP istemcisi |
| Sonner | 1.7 | Toast bildirimleri |
| Lucide React | 0.468 | İkon kütüphanesi |

---

## Sorun Giderme

### "Could not connect to Ollama" (Ollama'ya bağlanılamıyor)

**Kontrol 1:** Ollama çalışıyor mu?
- macOS/Windows: Menü çubuğunda/sistem tepsisinde lama simgesi var mı?
- Linux: `systemctl status ollama` veya `ollama serve` çalıştırın

**Kontrol 2:** Yanıt veriyor mu?
```bash
curl http://localhost:11434/api/tags
```
JSON dönmeli. Hata alıyorsanız Ollama başlatılmamıştır.

**Docker'da Ollama Kullanmak:**
Docker içindeki backend, host makinedeki Ollama'ya `host.docker.internal` adresiyle erişir. Linux'ta bu otomatik değildir — `docker-compose.yml` içindeki `extra_hosts` satırı bunu sağlar.

---

### "API key is invalid or quota is exhausted" (Geçersiz API anahtarı)

- Anahtarın başında veya sonunda boşluk olup olmadığını kontrol edin
- Anahtarın doğru sağlayıcıya ait olduğundan emin olun (OpenAI anahtarı `sk-` ile başlar, Anthropic anahtarı `sk-ant-` ile)
- Hesabınızda yeterli kredi/kota var mı kontrol edin
- **Önemli:** API anahtarları sekme kapanınca silinir. Tarayıcıyı veya sekmeyi kapattıysanız anahtarı yeniden girmeniz gerekir.

---

### Analiz boş veya anlamsız sonuç döndürüyor

- Daha büyük bir model deneyin (`llama3.1` yerine `llama3.1:13b`)
- Transkriptin İngilizce veya modelin desteklediği bir dilde olduğundan emin olun
- OpenAI veya Anthropic ile karşılaştırmayı deneyin

---

### Arayüzde "Something went wrong" (Bir şeyler yanlış gitti)

1. F12 → Console sekmesini açın → hata mesajını okuyun
2. Sayfayı yenileyin (F5)
3. "Try again" butonuna tıklayın
4. Sorun devam ederse bir bug raporu açın, console çıktısını ekleyin

---

### 413 Hatası (Dosya çok büyük)

`backend/.env` dosyasını düzenleyin:
```
MAX_FILE_SIZE_MB=100
```
Backend'i yeniden başlatın.

---

### Port zaten kullanımda hatası

```bash
# macOS / Linux
lsof -i :8000      # 8000 portunu kim kullanıyor?
kill -9 <PID>      # o süreci sonlandır

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

Frontend için aynısını port 5173 ile yapın.

---

### Arama sonuç döndürmüyor

FTS5 indeksi sunucu başlangıcında yenilenir. Eski bir sürümden geçiş yaptıysanız:
- Backend'i yeniden başlatın — bu yeterlidir
- FTS5 prefix eşleme kullanır: `top` → "toplantı" bulur, `lantı` → bulmaz

---

### Windows'ta `python` komutu bulunamıyor

Python kurulurken "Add Python to PATH" işaretlenmemiş demektir. Çözüm:
1. "Python 3.12" arayın → Modify → "Add Python to environment variables" kutucuğunu işaretleyin
2. Veya Python'u kaldırıp yeniden yükleyin, bu sefer kutucuğu işaretleyin
3. Yeni bir cmd penceresi açın

---

### `npm install` hata veriyor (Windows)

"node-gyp" hatası alıyorsanız Visual Studio Build Tools gerekir:
```
npm install --global windows-build-tools
```
Veya Node.js kurulurken "Automatically install necessary tools" seçeneğini işaretleyin.

---

## Güvenlik

| Alan | Uygulanan Koruma |
|------|----------------|
| **API Anahtarları** | Yalnızca `sessionStorage`'da tutulur (sekme kapanınca silinir), hiçbir sunucuya gönderilmez |
| **SSRF** | Ollama URL yalnızca localhost'a izin verir; webhook URL'si özel ağları ve metadata endpoint'lerini engeller |
| **Dosya Yükleme** | Boyut RAM'e yüklenmeden önce kontrol edilir; uzantı whitelist ile kısıtlanır |
| **SQL Injection** | Tüm veritabanı sorguları parametreli; hiçbir yerde SQL string birleştirme kullanılmaz |
| **Prompt Injection** | Transkript ile sistem talimatları sert bir ayırıcıyla ayrılır; transkript 80.000 karakterle sınırlandırılır |
| **Rate Limiting** | IP bazlı: Analiz 10 istek/dk, yükleme 20 istek/dk |
| **Body Boyutu** | Middleware JSON body'leri 10 MB ile sınırlar |
| **CORS** | Yalnızca yapılandırılan `CORS_ORIGINS` adreslerine izin verilir |
| **UUID Doğrulama** | History endpoint path parametreleri UUID tipinde; geçersiz değerler veritabanına ulaşmadan 422 döner |
| **CVE Taraması** | `pip-audit` her push'ta çalışır, bilinen güvenlik açığı tespit ederse pipeline durur |
| **Gizli Tarama** | CI, `.env`, özel anahtar veya veritabanı dosyalarının commit edilmesini engeller |
| **Bağımlılık Güncelliği** | `fastapi==0.136`, `python-dotenv==1.2.2`, `starlette==1.x` — tüm bilinen CVE'ler giderildi |

---

## Katkıda Bulunmak

1. Repoyu fork edin ve bir özellik branch'i oluşturun:
   ```bash
   git checkout -b feat/yeni-ozellik
   ```

2. Değişikliklerinizi yapın. Commit mesajları açıklayıcı olsun.

3. Push etmeden önce CI kontrollerini yerelde çalıştırın:
   ```bash
   # Backend
   cd backend
   ruff check .
   pip-audit -r requirements.txt
   pytest

   # Frontend
   cd ../frontend
   npx tsc --noEmit
   npm run build
   ```

4. Pull Request açın — ne değiştirdiğinizi ve neden değiştirdiğinizi açıklayın.

---

## Lisans

Dahili Proje — Tüm Hakları Saklıdır.

Bu yazılımın hiçbir parçası, yazarın açık yazılı izni olmaksızın çoğaltılamaz, dağıtılamaz veya kullanılamaz.
