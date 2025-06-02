const state = {
    _urunler: [],
    _tedarikciler: [],
    _fiyatlar: [],
    _teklifler: [],
    _musteriler: [],
    _isciler: [],
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

export function getTeklifler() {
    return [...state._teklifler].sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
}

export function getUrunById(id) {
    return state._urunler.find(u => String(u.id) === String(id));
}

export function getTedarikciById(id) {
    return state._tedarikciler.find(t => String(t.id) === String(id));
}

export function getTeklifById(id) {
    return state._teklifler.find(t => String(t.id) === String(id));
}

export function getMusteriler() {
    return state._musteriler.map(m => ({...m}));
}

export function getMusteriById(id) {
    return state._musteriler.find(m => String(m.id) === String(id));
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

/**
 * Teklif listesini günceller ve 'tekliflerChanged' olayını tetikler.
 * @param {Array} teklifler Yeni teklif listesi.
 */
export function setTeklifler(teklifler) {
    state._teklifler = Array.isArray(teklifler) ? [...teklifler] : [];
    notify('tekliflerChanged', getTeklifler());
}

/**
 * Store'a yeni bir teklif ekler.
 * @param {object} teklif Eklenecek teklif.
 */
export function addTeklifToStore(teklif) {
    state._teklifler.push(teklif);
    notify('tekliflerChanged', getTeklifler());
}

/**
 * Store'daki mevcut bir teklifi günceller.
 * @param {object} teklif Güncellenecek teklif (ID içermeli).
 */
export function updateTeklifInStore(teklif) {
    const index = state._teklifler.findIndex(t => String(t.id) === String(teklif.id));
    if (index > -1) {
        state._teklifler[index] = { ...state._teklifler[index], ...teklif };
        notify('tekliflerChanged', getTeklifler());
    } else {
        console.warn(`Güncellenmek istenen teklif ID'si (${teklif.id}) store'da bulunamadı.`);
    }
}

/**
 * ID'ye göre bir teklifi store'dan siler.
 * @param {string|number} teklifId Silinecek teklifin ID'si.
 */
export function removeTeklifByIdFromStore(teklifId) {
    const initialLength = state._teklifler.length;
    state._teklifler = state._teklifler.filter(t => String(t.id) !== String(teklifId));
    if (state._teklifler.length < initialLength) {
        notify('tekliflerChanged', getTeklifler());
    }
}

/**
 * Müşteri listesini günceller ve 'musterilerChanged' olayını tetikler.
 * @param {Array} musteriler Yeni müşteri listesi.
 */
export function setMusteriler(musteriler) {
    state._musteriler = Array.isArray(musteriler) ? musteriler.map(m => ({...m})) : [];
    notify('musterilerChanged', getMusteriler());
}

/**
 * Müşteri ekleme fonksiyonu.
 * @param {object} yeniMusteri Eklenecek müşteri.
 */
export function addMusteriToStore(yeniMusteri) {
    // Backend'den ID gelmiyorsa burada basit bir ID oluşturulabilir (test amaçlı)
    if (!yeniMusteri.id) yeniMusteri.id = `musteri_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    state._musteriler.push(yeniMusteri);
    notify('musterilerChanged', getMusteriler());
}

/**
 * Müşteri güncelleme fonksiyonu.
 * @param {object} guncelMusteri Güncellenecek müşteri.
 */
export function updateMusteriInStore(guncelMusteri) {
    const index = state._musteriler.findIndex(m => String(m.id) === String(guncelMusteri.id));
    if (index !== -1) {
        state._musteriler[index] = {...state._musteriler[index], ...guncelMusteri};
        notify('musterilerChanged', getMusteriler());
    } else {
        console.warn('Güncellenecek müşteri storeda bulunamadı:', guncelMusteri.id);
    }
}

/**
 * Müşteri silme fonksiyonu.
 * @param {string|number} musteriId Silinecek müşterinin ID'si.
 */
export function removeMusteriByIdFromStore(musteriId) {
    const initialLength = state._musteriler.length;
    state._musteriler = state._musteriler.filter(m => String(m.id) !== String(musteriId));
    if (state._musteriler.length < initialLength) {
        notify('musterilerChanged', getMusteriler());
    }
}

// --- İşçiler ---
export function getIsciler() {
    return [...state._isciler];
}

export function getIsciById(id) {
    const isciId = parseInt(id, 10);
    return state._isciler.find(i => i.id === isciId);
}

export function setIsciler(iscilerData) {
    state._isciler = Array.isArray(iscilerData) ? [...iscilerData] : [];
    notify('iscilerChanged', getIsciler());
}

export function addIsci(isci) {
    if (!isci || typeof isci.id === 'undefined') {
        console.error("addIsci: Geçersiz işçi nesnesi veya ID eksik.", isci);
        return;
    }
    // Zaten var mı diye kontrol et (API'den gelen veri her zaman güncel olmalı)
    const existingIndex = state._isciler.findIndex(i => i.id === parseInt(isci.id, 10));
    if (existingIndex === -1) {
        state._isciler.push(isci);
    } else {
        // Genelde addIsci sadece yeni eklenenler için çağrılır.
        // Eğer güncelleme de buradan yapılacaksa updateIsci gibi davranmalı.
        // Şimdilik, API'den sonra eklendiği için var olanı güncelleyelim.
        state._isciler[existingIndex] = { ...state._isciler[existingIndex], ...isci };
        console.warn(`addIsci: İşçi ID ${isci.id} zaten store'da mevcuttu, üzerine yazıldı.`);
    }
    notify('iscilerChanged', getIsciler());
}

export function updateIsci(updatedIsci) {
    if (!updatedIsci || typeof updatedIsci.id === 'undefined') {
        console.error("updateIsci: Geçersiz işçi nesnesi veya ID eksik.", updatedIsci);
        return;
    }
    const isciId = parseInt(updatedIsci.id, 10);
    const index = state._isciler.findIndex(i => i.id === isciId);
    if (index > -1) {
        state._isciler[index] = { ...state._isciler[index], ...updatedIsci };
        notify('iscilerChanged', getIsciler());
    } else {
        console.warn(`updateIsci: Güncellenmek istenen işçi ID'si (${isciId}) store'da bulunamadı.`);
        // İsteğe bağlı olarak yeni işçi olarak eklenebilir:
        // state._isciler.push(updatedIsci);
        // notify('iscilerChanged', getIsciler());
    }
}

export function removeIsciById(isciId) {
    const idToRemove = parseInt(isciId, 10);
    const initialLength = state._isciler.length;
    state._isciler = state._isciler.filter(i => i.id !== idToRemove);
    if (state._isciler.length < initialLength) {
        notify('iscilerChanged', getIsciler());
    }
}

// Başlangıçta boş state ile olayları tetikleyebiliriz (opsiyonel)
// Örneğin, uygulama ilk yüklendiğinde boş listelerle ilgili olayları tetiklemek için:
// document.addEventListener('DOMContentLoaded', () => {
//     notify('urunlerChanged', getUrunler());
//     notify('tedarikcilerChanged', getTedarikciler());
//     notify('fiyatlarChanged', getFiyatlar());
//     notify('tekliflerChanged', getTeklifler());
//     notify('musterilerChanged', getMusteriler());
// });

// console.log('Store modülü yüklendi.'); // Bu satır geçici olarak kaldırıldı 