# Veritabanı Şeması

Bu belge, projenin kullandığı veritabanı tablolarının yapısını ve ilişkilerini tanımlar.

## Tablolar

### 1. `fiyatlar`

Malzeme fiyatlarının zaman içindeki değişimini kaydeder.

| Sütun Adı     | Veri Türü     | Notlar                                            |
|---------------|---------------|---------------------------------------------------|
| `id`          | INT           | Primary Key, AUTO_INCREMENT                       |
| `malzeme_id`  | INT           | Foreign Key -> `malzemeler.id`                    |
| `tedarikci_id`| INT           | Foreign Key -> `tedarikciler.id`                  |
| `fiyat`       | DECIMAL(10,2) |                                                   |
| `tarih`       | DATE          | Fiyatın geçerli olduğu tarih                      |
| `created_at`  | TIMESTAMP     | Kayıt oluşturulma zamanı                          |
| `updated_at`  | TIMESTAMP     | Kayıt güncellenme zamanı                          |

### 2. `isciler`

Çalışanların (işçilerin) bilgilerini ve ücretlerini tutar.

| Sütun Adı           | Veri Türü     | Notlar                                            |
|---------------------|---------------|---------------------------------------------------|
| `id`                | VARCHAR(64)   | Primary Key (Muhtemelen UUID)                   |
| `adSoyad`           | VARCHAR(255)  |                                                   |
| `pozisyon`          | VARCHAR(100)  |                                                   |
| `gunlukUcret`       | DECIMAL(10,2) |                                                   |
| `saatlikUcret`      | DECIMAL(10,2) |                                                   |
| `paraBirimi`        | VARCHAR(10)   | (Örn: TL, USD, EUR)                             |
| `iseBaslamaTarihi`  | DATE          |                                                   |
| `aktif`             | TINYINT(1)    | (1: Aktif, 0: Pasif)                            |
| `telefon`           | VARCHAR(30)   |                                                   |
| `email`             | VARCHAR(255)  |                                                   |
| `adres`             | TEXT          |                                                   |
| `notlar`            | TEXT          |                                                   |
| `created_at`        | TIMESTAMP     |                                                   |
| `updated_at`        | TIMESTAMP     |                                                   |

### 3. `malzemeler`

Satışa konu olan veya hizmetlerde kullanılan malzemeleri tanımlar.

| Sütun Adı    | Veri Türü     | Notlar                                            |
|--------------|---------------|---------------------------------------------------|
| `id`         | INT           | Primary Key, AUTO_INCREMENT                       |
| `ad`         | VARCHAR(255)  | Malzeme adı                                       |
| `birim_adi`  | VARCHAR(100)  | Malzemenin ölçü birimi (örn: adet, kg, m²)        |
| `created_at` | TIMESTAMP     |                                                   |
| `updated_at` | TIMESTAMP     |                                                   |

### 4. `tedarikciler`

Malzemelerin temin edildiği tedarikçi firmaların bilgilerini tutar.

| Sütun Adı      | Veri Türü     | Notlar                                            |
|----------------|---------------|---------------------------------------------------|
| `id`           | INT           | Primary Key, AUTO_INCREMENT                       |
| `ad`           | VARCHAR(255)  | Tedarikçi firma adı                               |
| `yetkili_kisi` | VARCHAR(255)  |                                                   |
| `telefon`      | VARCHAR(50)   |                                                   |
| `email`        | VARCHAR(255)  |                                                   |
| `adres`        | TEXT          |                                                   |
| `not_alani`    | TEXT          | Tedarikçi ile ilgili notlar                       |
| `created_at`   | TIMESTAMP     |                                                   |
| `updated_at`   | TIMESTAMP     |                                                   |

### 5. `musteriler`

Hizmet verilen veya ürün satılan müşterilerin bilgilerini tutar.

| Sütun Adı     | Veri Türü     | Notlar                                            |
|---------------|---------------|---------------------------------------------------|
| `id`          | INT           | Primary Key, AUTO_INCREMENT                       |
| `ad`          | VARCHAR(255)  | Müşteri adı veya firma adı                        |
| `yetkiliKisi` | VARCHAR(255)  |                                                   |
| `telefon`     | VARCHAR(30)   |                                                   |
| `email`       | VARCHAR(255)  |                                                   |
| `adres`       | TEXT          |                                                   |
| `vergiNo`     | VARCHAR(50)   | Vergi numarası veya TC Kimlik No                  |
| `notlar`      | TEXT          | Müşteri ile ilgili notlar                         |
| `created_at`  | TIMESTAMP     |                                                   |
| `updated_at`  | TIMESTAMP     |                                                   |

### 6. `teklifler`

Müşterilere sunulan fiyat tekliflerinin ana bilgilerini içerir.

| Sütun Adı             | Veri Türü     | Notlar                                            |
|-----------------------|---------------|---------------------------------------------------|
| `id`                  | VARCHAR(64)   | Primary Key (Muhtemelen UUID)                   |
| `teklifNo`            | VARCHAR(50)   | Teklife özel numara                               |
| `musteri_id`          | INT           | Foreign Key -> `musteriler.id`                    |
| `musteriAdi`          | VARCHAR(255)  | (Denormalize edilmiş olabilir, `musteriler` tablosundan da çekilebilir) |
| `musteriIletisim`     | VARCHAR(255)  | (Denormalize edilmiş)                             |
| `projeAdi`            | VARCHAR(255)  |                                                   |
| `teklifTarihi`        | DATE          |                                                   |
| `gecerlilikTarihi`    | DATE          |                                                   |
| `hazirlayan`          | VARCHAR(100)  | Teklifi hazırlayan kullanıcı/çalışan              |
| `paraBirimi`          | VARCHAR(10)   | (Örn: TL, USD, EUR)                             |
| `araToplamMaliyet`    | DECIMAL(15,2) | Teklif kalemlerinin toplam maliyeti               |
| `araToplamSatis`      | DECIMAL(15,2) | Teklif kalemlerinin KDV hariç toplam satış fiyatı |
| `indirimOrani`        | DECIMAL(5,2)  | Yüzdesel indirim oranı                            |
| `indirimTutari`       | DECIMAL(15,2) | Hesaplanmış indirim tutarı                        |
| `kdvOrani`            | DECIMAL(5,2)  | Genel KDV oranı                                   |
| `kdvTutari`           | DECIMAL(15,2) | Hesaplanmış KDV tutarı                            |
| `genelToplamSatis`    | DECIMAL(15,2) | KDV dahil genel toplam satış fiyatı               |
| `durum`               | VARCHAR(50)   | (Örn: Hazırlanıyor, Gönderildi, Onaylandı)        |
| `notlar`              | TEXT          | Teklifle ilgili genel notlar                      |
| `created_at`          | TIMESTAMP     |                                                   |
| `updated_at`          | TIMESTAMP     |                                                   |

### 7. `teklif_urunleri` (veya `teklif_kalemleri`)

Bir teklifin içerdiği malzeme ve işçilik kalemlerini detaylandırır. Her bir kalem, teklif oluşturulduğu andaki maliyet ve satış fiyatlarını kaydeder.

| Sütun Adı                           | Veri Türü     | Notlar                                            |
|-------------------------------------|---------------|---------------------------------------------------|
| `id`                                | INT           | Primary Key, AUTO_INCREMENT                       |
| `teklif_id`                         | VARCHAR(64)   | Foreign Key -> `teklifler.id`                     |
| `kalemTipi`                         | VARCHAR(20)   | 'malzeme' veya 'iscilik'                          |
| `referans_id`                       | VARCHAR(64)   | FK -> `malzemeler.id` (eğer `kalemTipi`='malzeme') veya `isciler.id` (eğer `kalemTipi`='iscilik') |
| `aciklama`                          | VARCHAR(255)  | Kalem için ek açıklama                            |
| `miktar`                            | DECIMAL(10,2) |                                                   |
| `birim`                             | VARCHAR(50)   | Kalemin birimi (örn: adet, saat, gün)             |
| `kaydedilen_birim_maliyet`          | DECIMAL(15,2) | Teklif anındaki birim maliyet                     |
| `kaydedilen_birim_satis_fiyati`   | DECIMAL(15,2) | Teklif anındaki KDV hariç birim satış fiyatı      |
| `kdv_orani_kalem`                   | DECIMAL(5,2)  | Bu kaleme özel KDV oranı (genelden farklıysa)   |
| `satir_toplam_maliyet`              | DECIMAL(15,2) | `miktar * kaydedilen_birim_maliyet`               |
| `satir_toplam_satis_fiyati_kdv_haric` | DECIMAL(15,2) | `miktar * kaydedilen_birim_satis_fiyati`          |
| `satir_kdv_tutari`                  | DECIMAL(15,2) | Bu satır için hesaplanan KDV tutarı               |
| `satir_toplam_satis_fiyati_kdv_dahil`| DECIMAL(15,2) | KDV dahil satır toplamı                           |
| `siraNo`                            | INT           | Teklif içindeki kalem sırası                      |
| `created_at`                        | TIMESTAMP     |                                                   |
| `updated_at`                        | TIMESTAMP     |                                                   |

## Önemli Notlar

*   **VARCHAR ID'ler:** `isciler`, `teklifler` tablolarındaki `id` sütunları `VARCHAR(64)` olarak tanımlanmıştır. Bu, genellikle UUID (Universally Unique Identifier) veya benzeri benzersiz metin tabanlı anahtarlar kullanıldığını gösterir. API tarafında bu ID'lerin oluşturulması ve yönetilmesi gerekmektedir.
*   **AUTO_INCREMENT ID'ler:** `fiyatlar`, `malzemeler`, `tedarikciler`, `musteriler`, `teklif_urunleri` tablolarındaki `id` sütunları `INT` olarak tanımlanmıştır ve büyük olasılıkla `AUTO_INCREMENT PRIMARY KEY` özelliktedir.
*   **Denormalizasyon:** `teklifler` tablosundaki `musteriAdi` ve `musteriIletisim` gibi alanlar, `musteriler` tablosundan da elde edilebilecek olmasına rağmen, teklif oluşturulduğu andaki bilgiyi saklamak veya sorgu performansını artırmak amacıyla denormalize edilmiş olabilir.
*   **Zaman Damgaları:** Çoğu tabloda `created_at` ve `updated_at` TIMESTAMP sütunları bulunmaktadır. Bunlar genellikle kaydın ne zaman oluşturulduğunu ve son güncellendiğini otomatik olarak izlemek için kullanılır (örn: `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).
*   **Finansal Veriler:** Fiyat, maliyet ve toplam gibi finansal veriler için `DECIMAL` veri tipi kullanılmıştır. Bu, ondalık sayılarda hassasiyet kaybını önlemek için doğru bir yaklaşımdır.

Bu şema, gelecekteki geliştirmeler ve sorgular için bir referans noktası olacaktır. 