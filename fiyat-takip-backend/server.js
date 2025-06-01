// server.js
require('dotenv').config(); // .env dosyasındaki değişkenleri yükler
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // .env dosyasındaki PORT'u kullan, yoksa 3000

// Middleware
app.use(cors()); // Farklı kaynaklardan (örneğin frontend'den) gelen isteklere izin ver
app.use(express.json()); // Gelen isteklerdeki JSON body'lerini parse et

// MySQL Bağlantı Havuzu (Connection Pool)
// .env dosyasındaki veritabanı bilgilerini kullanır
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10, // Aynı anda açılabilecek maksimum bağlantı sayısı
    queueLimit: 0 // Bağlantı limiti dolduğunda bekleyecek istek kuyruğu limiti (0 = sınırsız)
});

// Basit bir test endpoint'i
app.get('/', (req, res) => {
    res.send('Fiyat Takip Backend API Çalışıyor!');
});

// --- API Endpoints (Uç Noktalar) Buraya Eklenecek ---

// Örneğin, tüm malzemeleri getiren bir endpoint:
app.get('/api/malzemeler', async (req, res) => {
    try {
        // Veritabanı bağlantısını test etmek için bir sorgu (opsiyonel, havuz zaten bağlantıyı yönetir)
        // const connection = await pool.getConnection();
        // console.log('MySQL veritabanına /api/malzemeler için geçici bağlantı başarılı!');
        // connection.release(); 

        const [rows] = await pool.query('SELECT * FROM malzemeler ORDER BY ad ASC');
        res.json(rows);
    } catch (error) {
        console.error('Malzemeler getirilirken hata:', error);
        // İstemciye daha genel bir hata mesajı gönder, detayı logla
        res.status(500).json({ message: 'Sunucu hatası: Malzemeler getirilemedi.' });
    }
});

// Tüm tedarikçileri getiren endpoint
app.get('/api/tedarikciler', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tedarikciler ORDER BY ad ASC');
        res.json(rows);
    } catch (error) {
        console.error('Tedarikçiler getirilirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Tedarikçiler getirilemedi.' });
    }
});

// Yeni tedarikçi ekleyen endpoint
app.post('/api/tedarikciler', async (req, res) => {
    try {
        const { ad, yetkili_kisi, telefon, email, adres } = req.body;
        if (!ad) {
            return res.status(400).json({ message: 'Tedarikçi adı gereklidir.' });
        }
        const [result] = await pool.query(
            'INSERT INTO tedarikciler (ad, yetkili_kisi, telefon, email, adres) VALUES (?, ?, ?, ?, ?)',
            [ad, yetkili_kisi || null, telefon || null, email || null, adres || null]
        );
        res.status(201).json({ id: result.insertId, ad, yetkili_kisi, telefon, email, adres });
    } catch (error) {
        console.error('Tedarikçi eklenirken hata:', error);
        res.status(500).json({ message: 'Sunucu hatası: Tedarikçi eklenemedi.' });
    }
});

// Tedarikçi güncelleme endpoint'i
app.put('/api/tedarikciler/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ad, yetkili_kisi, telefon, email, adres } = req.body;

        if (!ad) {
            return res.status(400).json({ message: 'Tedarikçi adı gereklidir.' });
        }

        const [result] = await pool.query(
            'UPDATE tedarikciler SET ad = ?, yetkili_kisi = ?, telefon = ?, email = ?, adres = ? WHERE id = ?',
            [ad, yetkili_kisi || null, telefon || null, email || null, adres || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Güncellenecek tedarikçi bulunamadı.' });
        }
        res.json({ id: id, ad, yetkili_kisi, telefon, email, adres });
    } catch (error) {
        console.error(`Tedarikçi güncellenirken hata (ID: ${req.params.id}):`, error);
        res.status(500).json({ message: 'Sunucu hatası: Tedarikçi güncellenemedi.' });
    }
});

// Tedarikçi silme endpoint'i
app.delete('/api/tedarikciler/:id', async (req, res) => {
    const connection = await pool.getConnection(); // Transaction için bağlantı al
    try {
        const { id } = req.params;
        await connection.beginTransaction(); // Transaction başlat

        // ÖNEMLİ: İlişkili fiyatları sil (eğer DB'de ON DELETE CASCADE yoksa)
        // Bu adım, fiyatlar tablonuzda tedarikci_id'ye göre bir foreign key olduğunu varsayar.
        // Eğer tablonuzda tedarikçi ID'si farklı bir isimle (örn: tedarikciId) tutuluyorsa, sorguyu güncelleyin.
        await connection.query('DELETE FROM fiyatlar WHERE tedarikci_id = ?', [id]);
        
        // Tedarikçiyi sil
        const [result] = await connection.query('DELETE FROM tedarikciler WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Değişiklikleri geri al
            return res.status(404).json({ message: 'Silinecek tedarikçi bulunamadı.' });
        }

        await connection.commit(); // Transaction'ı onayla
        res.json({ message: 'Tedarikçi ve ilişkili fiyatları başarıyla silindi.' });
    } catch (error) {
        if (connection) await connection.rollback(); // Hata durumunda değişiklikleri geri al
        console.error(`Tedarikçi silinirken hata (ID: ${req.params.id}):`, error);
        res.status(500).json({ message: 'Sunucu hatası: Tedarikçi silinemedi.' });
    } finally {
        if (connection) connection.release(); // Bağlantıyı serbest bırak
    }
});

// Sunucuyu dinlemeye başla
app.listen(port, () => {
    console.log(`Backend sunucusu http://localhost:${port} adresinde başarıyla başlatıldı.`);
    // Veritabanı bağlantısını başlangıçta test edelim (isteğe bağlı ama iyi bir pratik)
    pool.query('SELECT 1 AS solution') // Basit bir sorgu
        .then(([rows, fields]) => {
            if (rows && rows.length > 0 && rows[0].solution === 1) {
                console.log('MySQL veritabanına bağlantı başarılı bir şekilde doğrulandı!');
            } else {
                console.warn('MySQL veritabanına bağlantı kuruldu ancak doğrulama sorgusu beklenmedik sonuç döndürdü.');
            }
        })
        .catch(err => {
            console.error('MySQL veritabanına BAĞLANAMADI! Lütfen .env dosyasındaki bağlantı ayarlarınızı ve MySQL sunucunuzun durumunu kontrol edin.');
            console.error(err); // Hatanın detayını logla
        });
}); 