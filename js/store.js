const state = {
    _urunler: [],
    _tedarikciler: [],
    _fiyatlar: [],
    // Diğer state verileri buraya eklenebilir (örn: aktifFiltreler)
};

const listeners = {}; // { eventName: [callback1, callback2], ... }

/**
 * Belirli bir olaya abone olmak için kullanılır.
 * @param {string} eventName Dinlenecek olayın adı (örn: 'urunlerChanged').
 * @param {Function} callback Olay gerçekleştiğinde çağrılacak fonksiyon.
 */
export function subscribe(eventName, callback) {
    if (!listeners[eventName]) {
        listeners[eventName] = [];
    }
    listeners[eventName].push(callback);
    // console.log(`${eventName} için abone olundu:`, callback.name || 'anonim fonksiyon');
}

/**
 * Bir olaya olan aboneliği kaldırmak için kullanılır.
 * @param {string} eventName Aboneliği kaldırılacak olayın adı.
 * @param {Function} callback Kaldırılacak callback fonksiyonu.
 */
export function unsubscribe(eventName, callback) {
    if (listeners[eventName]) {
        listeners[eventName] = listeners[eventName].filter(listener => listener !== callback);
        // console.log(`${eventName} için abonelik kaldırıldı:`, callback.name || 'anonim fonksiyon');
    }
}

/**
 * Belirli bir olayı tetikler ve tüm aboneleri bilgilendirir.
 * @param {string} eventName Tetiklenecek olayın adı.
 * @param {*} data Abonelere gönderilecek veri.
 */
function notify(eventName, data) {
    if (listeners[eventName]) {
        listeners[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`'${eventName}' olayı için callback çalıştırılırken hata oluştu:`, error);
            }
        });
    }
}

// --- Getters ---
export function getUrunler() {
    return [...state._urunler]; // Kopyasını döndürerek dışarıdan doğrudan değiştirilmesini engelle
}

export function getTedarikciler() {
    return [...state._tedarikciler];
}

export function getFiyatlar() {
    return [...state._fiyatlar].sort((a, b) => new Date(b.tarih) - new Date(a.tarih)); // Her zaman sıralı döndür
}

export function getUrunById(id) {
    return state._urunler.find(u => String(u.id) === String(id));
}

export function getTedarikciById(id) {
    return state._tedarikciler.find(t => String(t.id) === String(id));
}

// --- Setters / Actions ---

/**
 * Ürün listesini günceller ve 'urunlerChanged' olayını tetikler.
 * @param {Array} urunler Yeni ürün listesi.
 */
export function setUrunler(urunler) {
    state._urunler = Array.isArray(urunler) ? [...urunler] : [];
    notify('urunlerChanged', getUrunler());
}

/**
 * Tek bir ürünü günceller veya ekler.
 * @param {object} urun Güncellenecek veya eklenecek ürün.
 */
export function setUrun(urun) {
    const index = state._urunler.findIndex(u => String(u.id) === String(urun.id));
    if (index > -1) {
        state._urunler[index] = { ...state._urunler[index], ...urun };
    } else {
        state._urunler.push(urun);
    }
    notify('urunlerChanged', getUrunler());
    // Eğer tek bir ürün değiştiğinde farklı bir olay da tetiklemek isterseniz:
    // notify('urunUpdated', urun); 
}

/**
 * ID'ye göre bir ürünü siler.
 * @param {string|number} urunId Silinecek ürünün ID'si.
 */
export function removeUrunById(urunId) {
    state._urunler = state._urunler.filter(u => String(u.id) !== String(urunId));
    notify('urunlerChanged', getUrunler());
    // Silinen ürünle ilgili fiyatları da temizlemek gerekebilir (fiyatlarChanged tetiklenir)
    const ilgiliFiyatlarKaldiMi = state._fiyatlar.some(f => String(f.malzeme_id) === String(urunId));
    if (ilgiliFiyatlarKaldiMi) {
        setFiyatlar(state._fiyatlar.filter(f => String(f.malzeme_id) !== String(urunId)));
    }
}


/**
 * Tedarikçi listesini günceller ve 'tedarikcilerChanged' olayını tetikler.
 * @param {Array} tedarikciler Yeni tedarikçi listesi.
 */
export function setTedarikciler(tedarikciler) {
    state._tedarikciler = Array.isArray(tedarikciler) ? [...tedarikciler] : [];
    notify('tedarikcilerChanged', getTedarikciler());
}

/**
 * Tek bir tedarikçiyi günceller veya ekler.
 * @param {object} tedarikci Güncellenecek veya eklenecek tedarikçi.
 */
export function setTedarikci(tedarikci) {
    const index = state._tedarikciler.findIndex(t => String(t.id) === String(tedarikci.id));
    if (index > -1) {
        state._tedarikciler[index] = { ...state._tedarikciler[index], ...tedarikci };
    } else {
        state._tedarikciler.push(tedarikci);
    }
    notify('tedarikcilerChanged', getTedarikciler());
}

/**
 * ID'ye göre bir tedarikçiyi siler.
 * @param {string|number} tedarikciId Silinecek tedarikçinin ID'si.
 */
export function removeTedarikciById(tedarikciId) {
    state._tedarikciler = state._tedarikciler.filter(t => String(t.id) !== String(tedarikciId));
    notify('tedarikcilerChanged', getTedarikciler());
    // Silinen tedarikçiyle ilgili fiyatları da temizlemek
    const ilgiliFiyatlarKaldiMi = state._fiyatlar.some(f => String(f.tedarikci_id) === String(tedarikciId));
    if (ilgiliFiyatlarKaldiMi) {
        setFiyatlar(state._fiyatlar.filter(f => String(f.tedarikci_id) !== String(tedarikciId)));
    }
}


/**
 * Fiyat listesini günceller ve 'fiyatlarChanged' olayını tetikler.
 * @param {Array} fiyatlar Yeni fiyat listesi.
 */
export function setFiyatlar(fiyatlar) {
    state._fiyatlar = Array.isArray(fiyatlar) ? [...fiyatlar] : [];
    notify('fiyatlarChanged', getFiyatlar());
}

/**
 * Yeni bir fiyat ekler veya mevcut bir fiyatı günceller (ID'ye göre).
 * API'den gelen ID'yi kullanır, bu yüzden eğer ID varsa güncelleme yapar.
 * @param {object} fiyat Eklenecek veya güncellenecek fiyat.
 */
export function saveFiyatStore(fiyat) {
    const index = state._fiyatlar.findIndex(f => String(f.id) === String(fiyat.id));
    if (index > -1) {
        state._fiyatlar[index] = { ...state._fiyatlar[index], ...fiyat };
    } else {
        // Yeni fiyat ekleniyorsa ve ID yoksa (API tarafından atanacaksa)
        // bu kısım API'den sonra ID ile tekrar çağrılmalı veya ID'siz geçici eklenip sonra güncellenmeli.
        // Şimdilik API'den gelen fiyatın ID'si olduğunu varsayalım.
        state._fiyatlar.push(fiyat);
    }
    notify('fiyatlarChanged', getFiyatlar());
}

/**
 * ID'ye göre bir fiyat kaydını siler.
 * @param {string|number} fiyatId Silinecek fiyatın ID'si.
 */
export function removeFiyatById(fiyatId) {
    state._fiyatlar = state._fiyatlar.filter(f => String(f.id) !== String(fiyatId));
    notify('fiyatlarChanged', getFiyatlar());
}

// Başlangıçta boş state ile olayları tetikleyebiliriz (opsiyonel)
// notify('urunlerChanged', getUrunler());
// notify('tedarikcilerChanged', getTedarikciler());
// notify('fiyatlarChanged', getFiyatlar());

console.log('Store modülü yüklendi.'); 