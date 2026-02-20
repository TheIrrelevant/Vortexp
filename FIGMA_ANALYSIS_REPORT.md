# Figma.app Detaylı Analiz Raporu

## 1. TEKNİK MİMARİ ANALİZİ

### 1.1 Platform ve Teknoloji Stack'i

**Figma Electron Tabanlı Bir Uygulamadır**

| Özellik | Değer |
|---------|-------|
| **Platform** | Electron (Cross-platform Web App) |
| **Versiyon** | 126.1.2 |
| **Mimari** | arm64 (Apple Silicon native) |
| **Bundle ID** | com.figma.Desktop |
| **Boyut** | ~50+ MB (ASAR: 8.7 MB) |
| **Ana Sınıf** | AtomApplication (Electron) |

**Kanıtlar:**
- `CFBundleIconFile`: `electron.icns` → Electron'un varsayılan ikonu
- `NSPrincipalClass`: `AtomApplication` → Electron/Atom temel sınıfı
- `ElectronAsarIntegrity` → Electron ASAR bütünlük kontrolü
- `app.asar` (8.7 MB) → Tüm JS/HTML/CSS kodları

### 1.2 Framework ve Native Modüller

```
/Applications/Figma.app/Contents/Frameworks/
├── Electron Framework.framework     # Ana Electron framework
├── Mantle.framework                 # macOS model katmanı
├── ReactiveObjC.framework           # Reactive programlama
├── Squirrel.framework               # Otomatik güncelleme
├── Figma Helper.app                 # Ana helper
├── Figma Helper (GPU).app           # GPU işlemleri
├── Figma Helper (Plugin).app        # Plugin çalıştırma
└── Figma Helper (Renderer).app      # Sayfa render
```

**Native Modüller:**
- `desktop_rust.node` (2.6 MB) → Rust ile yazılmış native modül
- `bindings.node` → Node.js native bindings

### 1.3 Desteklenen Dosya Formatları

| Uzantı | Açıklama |
|--------|----------|
| `.fig` | Figma Dokümanı |
| `.jam` | FigJam Board |
| `.deck` | Figma Slides |
| URL Scheme | `figma://` |

---

## 2. FIGMA DESIGN - TÜM TOOLLAR

### 2.1 Temel Navigasyon ve View Tool'ları

| Shortcut | Tool | Açıklama |
|----------|------|----------|
| `V` | **Move** | Nesneleri seçme ve taşıma |
| `K` | **Scale** | Nesneleri ölçeklendirme |
| `F` | **Frame** | Çerçeve oluşturma (Artboard mantığı) |
| `Shift + S` | **Section** | Bölüm/organizasyon katmanı |
| `S` | **Slice** | Dışa aktarım için dilimleme |
| `H` | **Hand** | Tuvalde gezinme |
| `Space + Drag` | Pan | Tuvali kaydırma |
| `I` | **Eyedropper** | Renk seçici |

### 2.2 Şekil (Shape) Tool'ları

| Shortcut | Tool | Özellikler |
|----------|------|------------|
| `R` | **Rectangle** | Kare/dikdörtgen, radius desteği |
| `O` | **Ellipse** | Daire/elips |
| `L` | **Line** | Düz çizgi |
| `Shift + L` | **Arrow** | Ok çizgisi |
| `Alt/Opt + Click` | **Polygon** | Çokgen (3-60 kenar) |
| `Alt/Opt + Click` | **Star** | Yıldız şekli |

**Shape Özellikleri:**
- Fill (Solid, Gradient, Image)
- Stroke (solid, dash array)
- Corner Radius (tek tek veya tümü)
- Drop Shadow, Inner Shadow
- Blur efektleri

### 2.3 Vektör Tool'ları (Vector Networks)

| Shortcut | Tool | Açıklama |
|----------|------|----------|
| `P` | **Pen Tool** | Vektör ağları oluşturma |
| `Shift + P` | **Pencil Tool** | Serbest çizim |
| `Ctrl/Cmd + Click` | Add Point | Nokta ekleme |
| `Alt/Opt + Click` | Delete Point | Nokta silme |
| `Shift + Click` | Straight Point | Düz nokta |
| `Alt/Opt + Drag` | Convert Point | Bezier dönüştürme |

**Vector Networks Özellikleri:**
- Bükülebilir bağlantılar
- Çift yönlü çizgiler
- Açık ve kapalı path'ler
- Boolean operations ile birleştirme

### 2.4 Boolean Operations (4 Temel İşlem)

```
┌─────────────────────────────────────────────────────┐
│  UNION    │  SUBTRACT   │  INTERSECT  │  EXCLUDE   │
├─────────────────────────────────────────────────────┤
│  Birleştir│  Çıkar      │  Kesişim    │  XOR       │
│  (A ∪ B)  │  (A - B)    │  (A ∩ B)    │  (A ⊕ B)   │
└─────────────────────────────────────────────────────┘
```

**Kullanım:** Seçili shape'ler → Sağ panel → Boolean Groups

### 2.5 Tipografi Tool'ları

| Shortcut | Tool | Açıklama |
|----------|------|----------|
| `T` | **Text** | Metin ekleme |
| `Ctrl/Cmd + B` | Bold | Kalın yazı |
| `Ctrl/Cmd + I` | Italic | İtalik yazı |
| `Ctrl/Cmd + U` | Underline | Altı çizili |
| `Shift + Enter` | Line Break | Satır atlaması |

**Text Özellikleri:**
- Font family & weight
- Font size & line height
- Letter spacing
- Text alignment (left, center, right, justified)
- Paragraph spacing
- Text styles (colors, effects)
- Auto width/height/fixed

### 2.6 Auto Layout (Akıllı Düzen)

**Temel Özellikler:**
- Direction: Vertical / Horizontal
- Spacing: Aralık kontrolü
- Padding: İç boşluk
- Alignment: Hizalama
- Distribution: Dağılım (space between, center, etc.)

**Advanced:**
- Wrap: Satıra geçme
- Resizing: Hug contents, Fill container, Fixed

### 2.7 Component ve Variants Sistemi

| Özellik | Açıklama |
|---------|----------|
| **Component** | Tekrar kullanılabilir master |
| **Instance** | Component kopyası |
| **Variant** | Component durumları (default, hover, active) |
| **Properties** | Boolean, Text, Instance swap, Variant |

**Kısayollar:**
- `Ctrl/Cmd + Alt + K` → Component oluştur
- `Ctrl/Cmd + Shift + K` → Instance oluştur

### 2.8 Prototyping Tool'ları

| Özellik | Açıklama |
|---------|----------|
| **Prototype Mode** | Prototype paneli (Alt + 9) |
| **Connections** | Ekranlar arası bağlantı |
| **Interactions** | On click, On hover, On drag, etc. |
| **Animations** | Smart animate, Dissolve, Move, etc. |
| **Overlays** | Modal/popup davranışları |
| **Flows** | Kullanıcı akışları |

### 2.9 Efekt ve Stil Tool'ları

**Fill Types:**
- Solid (Düz renk)
- Linear Gradient (Doğrusal gradyan)
- Radial Gradient (Radyal gradyan)
- Angular Gradient (Açısal gradyan)
- Diamond Gradient (Elmas gradyan)
- Image (Görsel)

**Effects:**
- Drop Shadow
- Inner Shadow
- Layer Blur
- Background Blur

**Stil Sistemi:**
- Color Styles
- Text Styles
- Effect Styles
- Grid Styles

### 2.10 Export Tool'ları

| Format | Kullanım |
|--------|----------|
| PNG | Raster görsel |
| JPG | Sıkıştırılmış raster |
| SVG | Vektör |
| PDF | Belge |
| WebP | Modern web formatı |

**Export Özellikleri:**
- Scale (1x, 2x, 4x, custom)
- Suffix (dosya son eki)
- Quality (0-100%)
- Include bounding box
- Contents only

---

## 3. FIGJAM - BEYAZ TAHTA TOOLLARI

### 3.1 Temel Collabrasyon Tool'ları

| Tool | Açıklama |
|------|----------|
| **Sticky Notes** | Renkli yapışkan notlar |
| **Shapes** | Dikdörtgen, elmas, daire |
| **Text** | Serbest metin |
| **Draw** | Serbest çizim (kalem) |
| **Stamp** | Emoji/reaksiyon damgası |
| **Cursor Chat** | Gerçek zamanlı mesajlaşma |

### 3.2 Organizasyon Tool'ları

| Tool | Açıklama |
|------|----------|
| **Sections** | Bölümler/alanlar |
| **Connectors** | Bağlantı çizgileri |
| **Tables** | Basit tablolar |
| **Mind Maps** | Zihin haritaları |
| **Swimlanes** | Yüzme şeritleri |

### 3.3 Workshop Tool'ları

| Tool | Açıklama |
|------|----------|
| **Voting** | Toplu oylama sistemi |
| **Timer** | Geri sayım sayacı |
| **Audio** | Sesli sohbet |
| **Icebreaker** | Buz kırma aktiviteleri |

### 3.4 FigJam AI Özellikleri

- AI-generated sticky notes
- AI summarization
- AI action items extraction
- AI diagram generation

---

## 4. FIGMA DRAW - İLLÜSTRASYON TOOLLARI

### 4.1 Gelişmiş Vektör Tool'ları

**Brush Tool'ları:**
- Variable width paths
- Pressure sensitivity
- Vector eraser
- Smoothing options

**Advanced Features:**
- Variable stroke width
- Path simplification
- Corner rounding
- Node editing

---

## 5. DEV MODE - GELİŞTİRİCİ TOOLLARI

### 5.1 Inspection Tool'ları

| Özellik | Açıklama |
|---------|----------|
| **CSS** | Otomatik CSS çıktısı |
| **iOS** | Swift/SwiftUI kodu |
| **Android** | XML/Jetpack Compose |
| **React** | JSX/React components |
| **Variables** | Design token export |
| **Assets** | Otomatik asset export |

### 5.2 Comparison Tool'ları

- Design vs. Code karşılaştırma
- Version diff görüntüleme
- Change tracking

---

## 6. AI ve GELİŞMİŞ ÖZELLİKLER

### 6.1 Figma AI Tool'ları

| AI Feature | Açıklama |
|------------|----------|
| **Make Designs** | AI ile tasarım oluşturma |
| **Rename Layers** | Otomatik layer isimlendirme |
| **Search Assets** | Akıllı asset arama |
| **Generate Images** | AI görsel oluşturma |
| **Wireframe → Design** | Wireframe'den UI oluşturma |
| **Text Rewrite** | Metin yeniden yazma |
| **Translate** | Otomatik çeviri |

### 6.2 Plugin API

- **1000+ Community Plugin**
- **Custom Widgets**
- **API Endpoints:**
  - `figma.createRectangle()`
  - `figma.createEllipse()`
  - `figma.createVector()`
  - `figma.createText()`
  - `figma.union()` / `figma.subtract()` / `figma.intersect()` / `figma.exclude()`

---

## 7. KISAYOL REFERANSI

### 7.1 Temel Kısayollar

```
V → Move (Seçim)
K → Scale (Ölçeklendirme)
F → Frame
S → Slice
Shift + S → Section

R → Rectangle
O → Ellipse
L → Line
Shift + L → Arrow
P → Pen
Shift + P → Pencil
T → Text
I → Eyedropper

Ctrl/Cmd + D → Duplicate
Ctrl/Cmd + G → Group
Ctrl/Cmd + Shift + G → Ungroup
Ctrl/Cmd + Alt + K → Create Component
Ctrl/Cmd + Shift + K → Create Instance

Ctrl/Cmd + Plus (+) → Zoom In
Ctrl/Cmd + Minus (-) → Zoom Out
Shift + 1 → Zoom to Fit
Shift + 2 → Zoom to Selection
Shift + 0 → Zoom 100%
```

### 7.2 Panel Kısayolları

```
Alt + 1 → Layers Panel
Alt + 2 → Assets Panel
Alt + 8 → Design Panel
Alt + 9 → Prototype Panel
Alt + 0 → Inspect Panel
```

---

## 8. MİMARİ KARŞILAŞTIRMA: Figma vs Vortexp

| Özellik | Figma | Vortexp (Şu Anki) |
|---------|-------|-------------------|
| **Platform** | Electron (Web) | React + Vite (Web) |
| **Mimari** | Client-Server (Cloud) | Local-only |
| **Vector Engine** | Custom Vector Networks | SVG-based |
| **Boolean Ops** | ✅ Union, Subtract, Intersect, Exclude | ❌ Yok |
| **Pen Tool** | ✅ Advanced (Bezier) | ✅ Basic |
| **Pencil Tool** | ✅ ✅ Pressure-sensitive | ✅ Basic |
| **Auto Layout** | ✅ ✅ Mükemmel | ❌ Yok |
| **Components** | ✅ ✅ Master-Instance | ❌ Yok |
| **Prototyping** | ✅ ✅ Full | ❌ Yok |
| **Multiplayer** | ✅ Real-time | ❌ Yok |
| **Plugins** | ✅ 1000+ | ❌ Yok |
| **AI** | ✅ Figma AI | ❌ Yok |

---

## 9. SONUÇ ve ÖNERİLER

### 9.1 Figma'nın Güçlü Yönleri

1. **Vector Networks** → Benzersiz vektör sistemi
2. **Boolean Operations** → Güçlü shape manipülasyonu
3. **Auto Layout** → Akıllı responsive tasarım
4. **Component System** → Ölçeklenebilir tasarım
5. **Real-time Collaboration** → Multiplayer editör
6. **Plugin Ekosistemi** → Sonsuz genişletilebilirlik
7. **Dev Mode** → Seamless design-to-code
8. **AI Integration** → Üretken yapay zeka

### 9.2 Vortexp İçin Gelişim Önerileri

**Öncelik 1: Vektör Sistemi**
- [ ] Vector Networks benzeri sistem
- [ ] Advanced bezier curve editing
- [ ] Boolean operations implementasyonu

**Öncelik 2: Layer Management**
- [ ] Layers panel
- [ ] Groups ve nesting
- [ ] Lock/hide functionality

**Öncelik 3: Advanced Tools**
- [ ] Ellipse tool (yay ve dilim desteği)
- [ ] Star/Polygon tool
- [ ] Arrow tool (farklı başlık stilleri)

**Öncelik 4: Properties Panel**
- [ ] Fill & Stroke detaylı kontrol
- [ ] Effects (shadow, blur)
- [ ] Transform (rotate, flip)

**Öncelik 5: Export Sistemi**
- [ ] SVG export (native)
- [ ] PNG/JPG export
- [ ] Scale options

---

**Rapor Tarihi:** 18 Şubat 2026  
**Analiz Eden:** Claude (OpenCode)  
**Figma Versiyon:** 126.1.2 (Desktop)  
**Kaynak:** /Applications/Figma.app + Figma Documentation
