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
| `id`                | INT           | Primary Key, AUTO_INCREMENT                       |
| `adSoyad`           | VARCHAR(255)  | NOT NULL                                          |
| `pozisyon`          | VARCHAR(100)  | NULL                                              |
| `gunlukUcret`       | DECIMAL(10,2) | NULL                                              |
| `saatlikUcret`      | DECIMAL(10,2) | NULL                                              |
| `paraBirimi`        | VARCHAR(10)   | NULL, (Örn: TL, USD, EUR)                       |
| `iseBaslamaTarihi`  | DATE          | NULL                                              |
| `aktif`             | TINYINT(1)    | DEFAULT 1                                         |
| `telefon`           | VARCHAR(30)   | NULL                                              |
| `email`             | VARCHAR(255)  | NULL                                              |
| `adres`             | TEXT          | NULL                                              |
| `notlar`            | TEXT          | NULL                                              |
| `created_at`        | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                         |
| `updated_at`        | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

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

### 7. `teklif_kalemleri`

Bir teklifin içerdiği malzeme ve işçilik kalemlerini detaylandırır. Her bir kalem, teklif oluşturulduğu andaki maliyet ve satış fiyatlarını kaydeder.

| Sütun Adı                           | Veri Türü     | Notlar                                                               |
|-------------------------------------|---------------|----------------------------------------------------------------------|
| `id`                                | INT           | Primary Key, AUTO_INCREMENT                                          |
| `teklif_id`                         | VARCHAR(64)   | NOT NULL, Foreign Key -> `teklifler.id`                              |
| `kalemTipi`                         | VARCHAR(20)   | NOT NULL, ('malzeme', 'iscilik')                                     |
| `malzeme_id`                        | INT           | NULL, Foreign Key -> `malzemeler.id` (Eğer `kalemTipi`='malzeme')      |
| `isci_id`                           | INT           | NULL, Foreign Key -> `isciler.id` (Eğer `kalemTipi`='iscilik')         |
| `aciklama`                          | VARCHAR(255)  | Kalem için ek açıklama                                               |
| `miktar`                            | DECIMAL(10,2) | NOT NULL                                                             |
| `birim`                             | VARCHAR(50)   | Kalemin birimi (örn: adet, saat, gün, kg, m²)                        |
| `kaydedilen_birim_maliyet`          | DECIMAL(15,2) | NULL, Teklif anındaki birim maliyet                                  |
| `kaydedilen_birim_satis_fiyati`   | DECIMAL(15,2) | NOT NULL, Teklif anındaki KDV hariç birim satış fiyatı             |
| `kdv_orani_kalem`                   | DECIMAL(5,2)  | DEFAULT 0.00, Bu kaleme özel KDV oranı (genelden farklıysa)        |
| `satir_toplam_maliyet`              | DECIMAL(15,2) | NULL, `miktar * kaydedilen_birim_maliyet`                            |
| `satir_toplam_satis_fiyati_kdv_haric` | DECIMAL(15,2) | NULL, `miktar * kaydedilen_birim_satis_fiyati`                       |
| `satir_kdv_tutari`                  | DECIMAL(15,2) | NULL, Bu satır için hesaplanan KDV tutarı                            |
| `satir_toplam_satis_fiyati_kdv_dahil`| DECIMAL(15,2) | NULL, KDV dahil satır toplamı                                        |
| `siraNo`                            | INT           | NULL, Teklif içindeki kalem sırası                                   |
| `created_at`                        | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                                            |
| `updated_at`                        | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP                |

### 8. `araclar`

Kullanıcı tanımlı araçların (örneğin hesaplama araçları, faydalı linkler vb.) bilgilerini tutar.

| Sütun Adı     | Veri Türü     | Notlar                                                                 |
|---------------|---------------|------------------------------------------------------------------------|
| `id`          | INT           | Primary Key, AUTO_INCREMENT                                            |
| `ad`          | VARCHAR(255)  | NOT NULL, Aracın kullanıcı dostu adı                                   |
| `yol`         | VARCHAR(1024) | NOT NULL, Araca ait dosya yolu veya URL'i                              |
| `aciklama`    | TEXT          | NULL, Araç hakkında kısa açıklama                                      |
| `icon`        | VARCHAR(50)   | NULL, Araç kartında gösterilecek ikon (örn: 'fas fa-calculator', '🔧') |
| `created_at`  | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                                              |
| `updated_at`  | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP                  |

## Önemli Notlar

*   **VARCHAR ID'ler:** `teklifler` tablosundaki `id` sütunu `VARCHAR(64)` olarak tanımlanmıştır. Bu, genellikle UUID (Universally Unique Identifier) veya benzeri benzersiz metin tabanlı anahtarlar kullanıldığını gösterir. API tarafında bu ID'lerin oluşturulması ve yönetilmesi gerekmektedir.
*   **AUTO_INCREMENT ID'ler:** `fiyatlar`, `isciler`, `malzemeler`, `tedarikciler`, `musteriler`, `teklif_kalemleri` tablolarındaki `id` sütunları `INT` olarak tanımlanmıştır ve `AUTO_INCREMENT PRIMARY KEY` özelliktedir.
*   **Denormalizasyon:** `teklifler` tablosundaki `musteriAdi` ve `musteriIletisim` gibi alanlar, `musteriler` tablosundan da elde edilebilecek olmasına rağmen, teklif oluşturulduğu andaki bilgiyi saklamak veya sorgu performansını artırmak amacıyla denormalize edilmiş olabilir.
*   **Zaman Damgaları:** Çoğu tabloda `created_at` ve `updated_at` TIMESTAMP sütunları bulunmaktadır. Bunlar genellikle kaydın ne zaman oluşturulduğunu ve son güncellendiğini otomatik olarak izlemek için kullanılır.
*   **Finansal Veriler:** Fiyat, maliyet ve toplam gibi finansal veriler için `DECIMAL` veri tipi kullanılmıştır. Bu, ondalık sayılarda hassasiyet kaybını önlemek için doğru bir yaklaşımdır.
*   **Foreign Key İlişkileri:** `teklif_kalemleri.malzeme_id` -> `malzemeler.id`; `teklif_kalemleri.isci_id` -> `isciler.id` gibi foreign key ilişkilerinin veritabanında doğru kurulduğundan emin olunmalıdır.
*   **`teklif_kalemleri` Tablosu:** Bu tablo hem malzeme hem de işçilik kalemlerini `kalemTipi` alanı ile ayırt ederek saklar. `malzeme_id` alanı sadece `kalemTipi` 'malzeme' olduğunda, `isci_id` alanı ise sadece `kalemTipi` 'iscilik' olduğunda kullanılır.

Bu şema, gelecekteki geliştirmeler ve sorgular için bir referans noktası olacaktır.