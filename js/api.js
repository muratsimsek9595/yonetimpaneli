// js/api.js

export const API_BASE_URL = 'api'; // Base URL for your API endpoints

export async function fetchWrapper(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
            message: `API isteği başarısız: ${response.status} ${response.statusText} - ${url}` 
        }));
        throw new Error(errorData.message || `API Hatası: ${response.status} URL: ${url}`);
    }
    // If response is OK but has no content (e.g., for DELETE requests that return 204)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null; 
    }
    try {
        return await response.json();
    } catch (e) {
        console.error("JSON parse error for URL:", url, e);
        throw new Error(`API yanıtı geçerli JSON değil. URL: ${url}`);
    }
}

// Malzeme API Fonksiyonları
export async function getMalzemeler() {
    return fetchWrapper(`${API_BASE_URL}/malzemeler.php`);
}

export async function saveMalzeme(malzemeData, id = null) {
    const url = id ? `${API_BASE_URL}/malzemeler.php?id=${id}` : `${API_BASE_URL}/malzemeler.php`;
    const method = id ? 'PUT' : 'POST';
    return fetchWrapper(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(malzemeData),
    });
}

export async function deleteMalzeme(id) {
    return fetchWrapper(`${API_BASE_URL}/malzemeler.php?id=${id}`, { method: 'DELETE' });
}

// Tedarikçi API Fonksiyonları
export async function getTedarikciler() {
    return fetchWrapper(`${API_BASE_URL}/tedarikciler.php`);
}

export async function saveTedarikci(tedarikciData, id = null) {
    const url = id ? `${API_BASE_URL}/tedarikciler.php?id=${id}` : `${API_BASE_URL}/tedarikciler.php`;
    const method = id ? 'PUT' : 'POST';
    return fetchWrapper(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tedarikciData),
    });
}

export async function deleteTedarikci(id) {
    return fetchWrapper(`${API_BASE_URL}/tedarikciler.php?id=${id}`, { method: 'DELETE' });
}

// Fiyat API Fonksiyonları
export async function getFiyatlar() {
    return fetchWrapper(`${API_BASE_URL}/fiyatlar.php`);
}

export async function saveFiyat(fiyatData) {
    return fetchWrapper(`${API_BASE_URL}/fiyatlar.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fiyatData),
    });
}

export async function deleteFiyat(id) {
    return fetchWrapper(`${API_BASE_URL}/fiyatlar.php?id=${id}`, { method: 'DELETE' });
}

// Teklif API Fonksiyonları
export async function getTeklifler() {
    // return Promise.resolve(DUMMY_TEKLIFLER); // Test için doğrudan dummy data döndürebilir
    return fetchWrapper(`${API_BASE_URL}/teklifler.php`);
}

export async function saveTeklif(teklifData, id = null) {
    const url = id ? `${API_BASE_URL}/teklifler.php?id=${id}` : `${API_BASE_URL}/teklifler.php`;
    const method = id ? 'PUT' : 'POST';
    return fetchWrapper(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teklifData),
    });
}

export async function deleteTeklif(id) {
    return fetchWrapper(`${API_BASE_URL}/teklifler.php?id=${id}`, { method: 'DELETE' });
}

// Müşteri API Fonksiyonları
export async function getMusteriler() {
    return fetchWrapper(`${API_BASE_URL}/musteriler.php`);
}

export async function saveMusteri(musteriData, id = null) {
    const url = id ? `${API_BASE_URL}/musteriler.php?id=${id}` : `${API_BASE_URL}/musteriler.php`;
    const method = id ? 'PUT' : 'POST';
    return fetchWrapper(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(musteriData),
    });
}

export async function deleteMusteri(id) {
    return fetchWrapper(`${API_BASE_URL}/musteriler.php?id=${id}`, { method: 'DELETE' });
}

// İşçi API Fonksiyonları
export async function getIsciler() {
    return fetchWrapper(`${API_BASE_URL}/isciler.php`);
}

export async function saveIsci(isciData, id = null) {
    const url = id ? `${API_BASE_URL}/isciler.php?id=${id}` : `${API_BASE_URL}/isciler.php`;
    const method = id ? 'PUT' : 'POST';
    return fetchWrapper(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isciData),
    });
}

export async function deleteIsci(id) {
    return fetchWrapper(`${API_BASE_URL}/isciler.php?id=${id}`, { method: 'DELETE' });
}

// İşçileri Getirme
export async function fetchIsciler() {
    try {
        const response = await fetch(`${API_BASE_URL}/isciler.php`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Sunucu hatası, detay alınamadı.' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
            return result.data;
        } else {
            throw new Error(result.message || 'İşçi verileri alınamadı veya format hatalı.');
        }
    } catch (error) {
        console.error('fetchIsciler Hata:', error);
        throw error; // Hatanın yukarıya da iletilmesi için
    }
}

// İşçi Ekleme
export async function addIsciAPI(isciData) {
    try {
        const response = await fetch(`${API_BASE_URL}/isciler.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(isciData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Sunucu hatası, detay alınamadı.' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
         if (result.success && result.data && typeof result.data.id !== 'undefined') {
            return result.data; // Eklenen işçinin tam verisini döndürür (ID dahil)
        } else {
            throw new Error(result.message || 'İşçi eklenemedi veya sunucudan geçersiz yanıt alındı.');
        }
    } catch (error) {
        console.error('addIsciAPI Hata:', error);
        throw error;
    }
}

// İşçi Güncelleme
export async function updateIsciAPI(isciData) {
    if (!isciData.id) {
        throw new Error("Güncellenecek işçi için ID gereklidir.");
    }
    try {
        const response = await fetch(`${API_BASE_URL}/isciler.php`, { // PUT metodu için ID genellikle URL'de olmaz, body'de gider
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(isciData),
        });
        if (!response.ok) {
             const errorText = await response.text(); // Daha fazla detay için text olarak al
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            } catch (e) {
                // Eğer JSON parse edilemezse, text hatasını göster
                throw new Error(`HTTP error! status: ${response.status}. Mesaj: ${errorText}`);
            }
        }
        const result = await response.json();
        if (result.success && result.data && typeof result.data.id !== 'undefined') {
            return result.data; // Güncellenen işçinin tam verisini döndürür
        } else {
            throw new Error(result.message || 'İşçi güncellenemedi veya sunucudan geçersiz yanıt alındı.');
        }
    } catch (error) {
        console.error('updateIsciAPI Hata:', error);
        throw error;
    }
}

// İşçi Silme
export async function deleteIsciAPI(isciId) {
    try {
        const response = await fetch(`${API_BASE_URL}/isciler.php?id=${isciId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Sunucu hatası, detay alınamadı.' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
            return { id: isciId, message: result.message }; // Silme işlemi başarılı, ID'yi ve mesajı döndür
        } else {
            throw new Error(result.message || 'İşçi silinemedi.');
        }
    } catch (error) {
        console.error('deleteIsciAPI Hata:', error);
        throw error;
    }
}

// Araçlar API Fonksiyonları ÇIKARILDI - Bu bölüm silinecek 