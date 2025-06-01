/** 
 * Ürün ekleme/güncelleme formunu temizler.
 */
export function temizleUrunFormu(urunForm, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton) {
    if (urunForm) urunForm.reset();
    if (urunIdInput) urunIdInput.value = '';
    if (urunBirimSecimi) {
        urunBirimSecimi.value = ''; 
    }
    if (ozelBirimContainer) ozelBirimContainer.style.display = 'none'; 
    if (urunBirimAdiInput) urunBirimAdiInput.value = ''; 
    if (formTemizleButton) formTemizleButton.style.display = 'none';
    if (urunAdiInput) urunAdiInput.focus();
}

/**
 * Tedarikçi ekleme/güncelleme formunu temizler.
 */
export function temizleTedarikciFormu(tedarikciForm, tedarikciIdInput, tedarikciAdiInput, tedarikciYetkiliKisiInput, tedarikciTelefonInput, tedarikciEmailInput, tedarikciAdresInput, tedarikciNotInput, tedarikciFormTemizleButton) {
    if (tedarikciForm) tedarikciForm.reset();
    if (tedarikciIdInput) tedarikciIdInput.value = '';
    if (tedarikciAdiInput) tedarikciAdiInput.value = '';
    if (tedarikciYetkiliKisiInput) tedarikciYetkiliKisiInput.value = '';
    if (tedarikciTelefonInput) tedarikciTelefonInput.value = '';
    if (tedarikciEmailInput) tedarikciEmailInput.value = '';
    if (tedarikciAdresInput) tedarikciAdresInput.value = '';
    if (tedarikciNotInput) tedarikciNotInput.value = '';
    if (tedarikciFormTemizleButton) tedarikciFormTemizleButton.style.display = 'none';
    if (tedarikciAdiInput) tedarikciAdiInput.focus();
}

/**
 * Verilen fiyat listesini "Son Fiyatlar" tablosunda gösterir.
 * @param {Array} fiyatlarListesi - Gösterilecek fiyat kayıtları dizisi.
 * @param {HTMLElement} tabloBodyElementi - Fiyatların ekleneceği tbody HTML elementi.
 * @param {Array} urunlerListesi - Ürün adlarını ve birimlerini almak için ürünler dizisi.
 * @param {Array} tedarikcilerListesi - Tedarikçi adlarını almak için tedarikçiler dizisi.
 * @param {number} limit - Tabloda gösterilecek maksimum kayıt sayısı.
 */
export function gosterSonFiyatlarTablosu(fiyatlarListesi, tabloBodyElementi, urunlerListesi, tedarikcilerListesi, limit = 5) {
    if (!tabloBodyElementi) return;
    tabloBodyElementi.innerHTML = ''; // Mevcut satırları temizle

    const gosterilecekFiyatlar = fiyatlarListesi.slice(0, limit);

    if (gosterilecekFiyatlar.length === 0) {
        tabloBodyElementi.innerHTML = '<tr><td colspan="6">Kayıtlı fiyat girişi bulunamadı.</td></tr>';
    } else {
        gosterilecekFiyatlar.forEach(fiyat => {
            const urun = urunlerListesi.find(u => String(u.id) === String(fiyat.malzeme_id));
            const tedarikci = tedarikcilerListesi.find(t => String(t.id) === String(fiyat.tedarikci_id));

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${urun ? urun.ad : 'Bilinmeyen Malzeme'}</td>
                <td>${parseFloat(fiyat.fiyat).toFixed(2)}</td>
                <td>${urun ? (urun.birim_adi || '-') : '-'}</td>
                <td>${new Date(fiyat.tarih).toLocaleDateString('tr-TR')}</td>
                <td>${tedarikci ? tedarikci.ad : 'Bilinmeyen Tedarikçi'}</td>
                <td class="actions">
                    <button class="delete-fiyat-btn" data-id="${fiyat.id}">Sil</button>
                </td>
            `;
            tabloBodyElementi.appendChild(tr);
        });
    }
}

/**
 * Ürün listesi tablosunu günceller.
 * @param {Array} urunlerListesi - Gösterilecek ürünler dizisi.
 * @param {HTMLElement} tabloBodyElementi - Ürünlerin ekleneceği tbody HTML elementi.
 */
export function guncelleUrunListesiTablosu(urunlerListesi, tabloBodyElementi) {
    if (!tabloBodyElementi) return;
    tabloBodyElementi.innerHTML = ''; 
    if (!Array.isArray(urunlerListesi) || urunlerListesi.length === 0) {
        tabloBodyElementi.innerHTML = '<tr><td colspan="3">Kayıtlı malzeme bulunamadı.</td></tr>';
    } else {
        urunlerListesi.forEach(urun => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${urun.ad}</td>
                <td>${urun.birim_adi || '-'}</td> 
                <td class="actions">
                    <button class="edit-btn" data-id="${urun.id}">Düzenle</button>
                    <button class="delete-btn" data-id="${urun.id}">Sil</button>
                </td>
            `;
            tabloBodyElementi.appendChild(tr);
        });
    }
}

/**
 * Tedarikçi listesi tablosunu günceller.
 * @param {Array} tedarikcilerListesi - Gösterilecek tedarikçiler dizisi.
 * @param {HTMLElement} tabloBodyElementi - Tedarikçilerin ekleneceği tbody HTML elementi.
 */
export function guncelleTedarikciListesiTablosu(tedarikcilerListesi, tabloBodyElementi) {
    if (!tabloBodyElementi) return;
    tabloBodyElementi.innerHTML = ''; 
    if (!Array.isArray(tedarikcilerListesi) || tedarikcilerListesi.length === 0) {
        tabloBodyElementi.innerHTML = '<tr><td colspan="7">Kayıtlı tedarikçi bulunamadı.</td></tr>';
    } else {
        tedarikcilerListesi.forEach(tedarikci => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tedarikci.ad || '-'}</td>
                <td>${tedarikci.yetkili_kisi || '-'}</td>
                <td>${tedarikci.telefon || '-'}</td>
                <td>${tedarikci.email || '-'}</td>
                <td>${tedarikci.adres || '-'}</td>
                <td>${tedarikci.not_alani || '-'}</td>
                <td class="actions">
                    <button class="edit-btn" data-id="${tedarikci.id}">Düzenle</button>
                    <button class="delete-btn" data-id="${tedarikci.id}">Sil</button>
                </td>
            `;
            tabloBodyElementi.appendChild(tr);
        });
    }
}

/**
 * Bir select dropdown elementini verilen ürün listesiyle doldurur.
 * @param {Array} urunlerListesi - Dropdown'a eklenecek ürünler dizisi.
 * @param {HTMLSelectElement} selectElement - Doldurulacak select HTML elementi.
 * @param {string} placeholderMetni - İlk seçenek için gösterilecek metin (örn: "-- Seçiniz --").
 * @param {boolean} seciliDegeriKoru - Eğer select elementinin mevcut bir değeri varsa ve bu değer yeni listede de varsa korunsun mu?
 * @param {Function|null} ekMetinFn - Her bir ürün için option metnine eklenecek ek metni döndüren fonksiyon. (örn: urun => ` (${urun.birim_adi})`)
 */
export function populeEtUrunSecimDropdown(urunlerListesi, selectElement, placeholderMetni, seciliDegeriKoru = true, ekMetinFn = null) {
    if (!selectElement) return;

    const mevcutDeger = seciliDegeriKoru ? selectElement.value : null;
    selectElement.innerHTML = `<option value="">${placeholderMetni}</option>`; // Temizle ve varsayılanı ekle

    if (Array.isArray(urunlerListesi)) {
        urunlerListesi.forEach(urun => {
            const option = document.createElement('option');
            option.value = urun.id;
            let textContent = urun.ad;
            if (ekMetinFn && typeof ekMetinFn === 'function') {
                textContent += ekMetinFn(urun);
            }
            option.textContent = textContent;
            selectElement.appendChild(option);
        });
    }

    if (seciliDegeriKoru && mevcutDeger && Array.isArray(urunlerListesi) && urunlerListesi.some(u => String(u.id) === String(mevcutDeger))) {
        selectElement.value = mevcutDeger;
    } else if (!seciliDegeriKoru && mevcutDeger) {
        selectElement.value = "";
    }
}

/**
 * Bir select dropdown elementini verilen tedarikçi listesiyle doldurur.
 * @param {Array} tedarikcilerListesi - Dropdown'a eklenecek tedarikçiler dizisi.
 * @param {HTMLSelectElement} selectElement - Doldurulacak select HTML elementi.
 * @param {string} placeholderMetni - İlk seçenek için gösterilecek metin (örn: "-- Tedarikçi Seçiniz --").
 * @param {boolean} seciliDegeriKoru - Eğer select elementinin mevcut bir değeri varsa ve bu değer yeni listede de varsa korunsun mu?
 * @param {Array|null} filtrelenecekTedarikciIdleri - Eğer sadece belirli ID'lere sahip tedarikçiler gösterilecekse bu ID'lerin listesi. Yoksa null.
 */
export function populeEtTedarikciSecimDropdown(tedarikcilerListesi, selectElement, placeholderMetni, seciliDegeriKoru = true, filtrelenecekTedarikciIdleri = null) {
    if (!selectElement) return;

    const mevcutDeger = seciliDegeriKoru ? selectElement.value : null;
    selectElement.innerHTML = `<option value="">${placeholderMetni}</option>`;

    let gosterilecekTedarikciler = tedarikcilerListesi;
    if (Array.isArray(filtrelenecekTedarikciIdleri)) {
        gosterilecekTedarikciler = tedarikcilerListesi.filter(t => filtrelenecekTedarikciIdleri.includes(String(t.id)));
    }

    if (Array.isArray(gosterilecekTedarikciler)) {
        gosterilecekTedarikciler.forEach(tedarikci => {
            const option = document.createElement('option');
            option.value = tedarikci.id;
            option.textContent = tedarikci.ad;
            selectElement.appendChild(option);
        });
    }

    if (seciliDegeriKoru && mevcutDeger && Array.isArray(gosterilecekTedarikciler) && gosterilecekTedarikciler.some(t => String(t.id) === String(mevcutDeger))) {
        selectElement.value = mevcutDeger;
    } else if (!seciliDegeriKoru && mevcutDeger) {
      selectElement.value = ""; // Eğer değer korunmayacaksa ve bir önceki değer varsa temizle
    } else if (filtrelenecekTedarikciIdleri && mevcutDeger && !gosterilecekTedarikciler.some(t => String(t.id) === String(mevcutDeger))) {
        selectElement.value = ""; // Eğer filtreleme yapıldı ve önceki seçili değer artık listede yoksa temizle
    }
}

/**
 * Kullanıcıya bir toast bildirimi gösterir.
 * @param {string} message Gösterilecek mesaj.
 * @param {string} type Bildirim tipi ('success', 'error', 'info'). Varsayılan 'info'.
 * @param {number} duration Bildirimin ekranda kalma süresi (milisaniye cinsinden). Varsayılan 3000ms.
 */
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Göstermek için .show sınıfını ekle
    setTimeout(() => {
        toast.classList.add('show');
    }, 100); // Küçük bir gecikme animasyonun düzgün çalışmasını sağlar

    // Belirtilen süre sonunda kaldır
    setTimeout(() => {
        toast.classList.remove('show');
        // Animasyon bittikten sonra DOM'dan kaldır
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 500); // CSS transition süresiyle eşleşmeli
    }, duration);
}

/**
 * Bir butonu yükleme durumuna alır (devre dışı bırakır ve metnini değiştirir).
 * @param {HTMLButtonElement} buttonElement - Yükleme durumuna alınacak buton.
 * @param {string} loadingText - Yükleme sırasında gösterilecek metin (örn: "Kaydediliyor...").
 */
export function setButtonLoading(buttonElement, loadingText = "Yükleniyor...") {
    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.dataset.originalText = buttonElement.textContent;
        buttonElement.textContent = loadingText;
        // İsteğe bağlı: Butona bir spinner ikonu da eklenebilir.
    }
}

/**
 * Bir butonu yükleme durumundan çıkarır (etkinleştirir ve orijinal metnini geri yükler).
 * @param {HTMLButtonElement} buttonElement - Yükleme durumundan çıkarılacak buton.
 */
export function resetButtonLoading(buttonElement) {
    if (buttonElement && typeof buttonElement.dataset.originalText !== 'undefined') {
        buttonElement.disabled = false;
        buttonElement.textContent = buttonElement.dataset.originalText;
    }
}

/**
 * Verilen ürün bilgileriyle malzeme tanımlama formunu doldurur.
 * @param {object} urun - Doldurulacak ürün nesnesi.
 * @param {HTMLInputElement} urunIdInput - Ürün ID input elementi.
 * @param {HTMLInputElement} urunAdiInput - Ürün adı input elementi.
 * @param {HTMLSelectElement} urunBirimSecimi - Birim seçimi select elementi.
 * @param {HTMLElement} ozelBirimContainer - Özel birim container div'i.
 * @param {HTMLInputElement} urunBirimAdiInput - Özel birim adı input elementi.
 * @param {HTMLButtonElement} formTemizleButton - Formu temizle butonu.
 */
export function doldurUrunFormu(urun, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton) {
    if (!urun) return;

    urunIdInput.value = urun.id;
    urunAdiInput.value = urun.ad;

    if (urunBirimSecimi) {
        const seceneklerdeVar = Array.from(urunBirimSecimi.options).some(option => option.value === urun.birim_adi);
        if (seceneklerdeVar && urun.birim_adi !== 'diger') {
            urunBirimSecimi.value = urun.birim_adi;
            ozelBirimContainer.style.display = 'none';
            urunBirimAdiInput.value = '';
        } else {
            urunBirimSecimi.value = 'diger';
            ozelBirimContainer.style.display = 'block';
            urunBirimAdiInput.value = urun.birim_adi || '';
        }
    } else if (urunBirimAdiInput) { // Eğer sadece text input varsa (eski yapı veya birim seçimi dropdown'ı yoksa)
        urunBirimAdiInput.value = urun.birim_adi || '';
    }

    if (formTemizleButton) formTemizleButton.style.display = 'inline-block';
    if (urunAdiInput) urunAdiInput.focus();
}

/**
 * Verilen tedarikçi bilgileriyle tedarikçi yönetimi formunu doldurur.
 * @param {object} tedarikci - Doldurulacak tedarikçi nesnesi.
 * @param {HTMLInputElement} tedarikciIdInput - Tedarikçi ID input elementi.
 * @param {HTMLInputElement} tedarikciAdiInput - Tedarikçi adı input elementi.
 * @param {HTMLInputElement} tedarikciYetkiliKisiInput - Yetkili kişi input elementi.
 * @param {HTMLInputElement} tedarikciTelefonInput - Telefon input elementi.
 * @param {HTMLInputElement} tedarikciEmailInput - Email input elementi.
 * @param {HTMLTextAreaElement} tedarikciAdresInput - Adres textarea elementi.
 * @param {HTMLTextAreaElement} tedarikciNotInput - Not textarea elementi.
 * @param {HTMLButtonElement} tedarikciFormTemizleButton - Formu temizle butonu.
 */
export function doldurTedarikciFormu(tedarikci, tedarikciIdInput, tedarikciAdiInput, tedarikciYetkiliKisiInput, tedarikciTelefonInput, tedarikciEmailInput, tedarikciAdresInput, tedarikciNotInput, tedarikciFormTemizleButton) {
    if (!tedarikci) return;

    tedarikciIdInput.value = tedarikci.id;
    tedarikciAdiInput.value = tedarikci.ad || '';
    tedarikciYetkiliKisiInput.value = tedarikci.yetkili_kisi || '';
    tedarikciTelefonInput.value = tedarikci.telefon || '';
    tedarikciEmailInput.value = tedarikci.email || '';
    tedarikciAdresInput.value = tedarikci.adres || '';
    tedarikciNotInput.value = tedarikci.not_alani || '';

    if (tedarikciFormTemizleButton) tedarikciFormTemizleButton.style.display = 'inline-block';
    if (tedarikciAdiInput) tedarikciAdiInput.focus();
}

// Diğer UI fonksiyonları buraya eklenecek... 