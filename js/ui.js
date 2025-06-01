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
 * Genel bir formu temizler.
 * @param {HTMLFormElement} formElement - Temizlenecek form elementi.
 */
export function clearForm(formElement) {
    if (formElement && typeof formElement.reset === 'function') {
        formElement.reset();
    }
    // Form içindeki gizli ID inputlarını ve "Formu Temizle" butonlarını ayrıca ele almak
    // her modülün kendi sorumluluğunda olabilir veya bu fonksiyona opsiyonel parametreler eklenebilir.
    // Şimdilik sadece reset işlemini yapıyor.
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

// --- İşçi UI Fonksiyonları ---

export function guncelleIscilerTablosu(iscilerData, tabloBodyElement) {
    if (!tabloBodyElement) {
        console.error("guncelleIscilerTablosu: Tablo body elementi bulunamadı.");
        return;
    }
    tabloBodyElement.innerHTML = ''; // Tabloyu temizle

    if (!iscilerData || iscilerData.length === 0) {
        tabloBodyElement.innerHTML = '<tr><td colspan="8" class="text-center">Kayıtlı işçi bulunamadı.</td></tr>';
        return;
    }

    iscilerData.forEach(isci => {
        const row = tabloBodyElement.insertRow();
        row.innerHTML = `
            <td>${isci.id || '-'}</td>
            <td>${isci.adSoyad || '-'}</td>
            <td>${isci.pozisyon || '-'}</td>
            <td>${isci.gunlukUcret ? parseFloat(isci.gunlukUcret).toFixed(2) : (isci.saatlikUcret ? parseFloat(isci.saatlikUcret).toFixed(2) + ' (Saatlik)' : '-')}</td>
            <td>${isci.paraBirimi || 'TL'}</td>
            <td><span class="status ${isci.aktif ? 'status-active' : 'status-inactive'}">${isci.aktif ? 'Aktif' : 'Pasif'}</span></td>
            <td>${isci.iseBaslamaTarihi ? new Date(isci.iseBaslamaTarihi).toLocaleDateString('tr-TR') : '-'}</td>
            <td class="actions">
                <button class="btn-icon edit-isci-btn" data-id="${isci.id}" title="Düzenle"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete-isci-btn" data-id="${isci.id}" title="Sil"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
    });
}

export function temizleIsciFormu(formElement, idInputElement) {
    if (formElement) {
        formElement.reset(); // Formdaki tüm inputları sıfırlar
        // Varsayılan değerleri ayarla (örneğin para birimi, aktif checkbox)
        const paraBirimiInput = formElement.querySelector('#isciParaBirimiInput');
        if (paraBirimiInput) paraBirimiInput.value = 'TL';
        const aktifCheckbox = formElement.querySelector('#isciAktifCheckbox');
        if (aktifCheckbox) aktifCheckbox.checked = true;
    }
    if (idInputElement) {
        idInputElement.value = ''; // Gizli ID inputunu temizle
    }
    const submitButton = formElement.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Kaydet'; // Buton metnini 'Kaydet' yap
        submitButton.classList.remove('btn-warning'); // Eğer 'Güncelle' için farklı class varsa
        submitButton.classList.add('btn-primary');
    }
    const adSoyadInput = formElement.querySelector('#isciAdSoyadInput');
    if (adSoyadInput) {
        adSoyadInput.focus(); // İlk inputa odaklan
    }
}

export function doldurIsciFormu(isci, formElement, idInputElement) {
    if (!isci || !formElement) return;

    if (idInputElement) idInputElement.value = isci.id || '';
    
    // Formdaki her bir inputu isci nesnesindeki karşılık gelen değerle doldur
    formElement.querySelector('#isciAdSoyadInput').value = isci.adSoyad || '';
    formElement.querySelector('#isciPozisyonInput').value = isci.pozisyon || '';
    formElement.querySelector('#isciGunlukUcretInput').value = isci.gunlukUcret || '';
    formElement.querySelector('#isciSaatlikUcretInput').value = isci.saatlikUcret || '';
    formElement.querySelector('#isciParaBirimiInput').value = isci.paraBirimi || 'TL';
    formElement.querySelector('#isciIseBaslamaTarihiInput').value = isci.iseBaslamaTarihi || '';
    formElement.querySelector('#isciAktifCheckbox').checked = typeof isci.aktif === 'boolean' ? isci.aktif : true;
    formElement.querySelector('#isciTelefonInput').value = isci.telefon || '';
    formElement.querySelector('#isciEmailInput').value = isci.email || '';
    formElement.querySelector('#isciAdresInput').value = isci.adres || '';
    formElement.querySelector('#isciNotlarInput').value = isci.notlar || '';

    const submitButton = formElement.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Güncelle'; // Buton metnini 'Güncelle' yap
        submitButton.classList.remove('btn-primary');
        submitButton.classList.add('btn-warning'); // Güncelleme için farklı bir stil (isteğe bağlı)
    }
}

// --- Müşteri UI Fonksiyonları (Yeni Eklendi) ---

/**
 * Bir select dropdown elementini verilen müşteri listesiyle doldurur.
 * @param {Array} musterilerListesi - Dropdown'a eklenecek müşteriler dizisi.
 * @param {HTMLSelectElement} selectElement - Doldurulacak select HTML elementi.
 * @param {string} placeholderMetni - İlk seçenek için gösterilecek metin (örn: "-- Müşteri Seçiniz --").
 * @param {boolean} seciliDegeriKoru - Eğer select elementinin mevcut bir değeri varsa ve bu değer yeni listede de varsa korunsun mu?
 */
export function populeEtMusteriDropdown(musterilerListesi, selectElement, placeholderMetni = "-- Müşteri Seçiniz --", seciliDegeriKoru = true) {
    if (!selectElement) {
        console.error("populeEtMusteriDropdown: Select elementi bulunamadı.");
        return;
    }

    const mevcutDeger = seciliDegeriKoru ? selectElement.value : null;
    selectElement.innerHTML = `<option value="">${placeholderMetni}</option>`; // Temizle ve varsayılanı ekle

    if (Array.isArray(musterilerListesi)) {
        musterilerListesi.forEach(musteri => {
            const option = document.createElement('option');
            option.value = musteri.id;
            // Müşteri nesnesinde 'ad' veya 'firmaAdi' gibi bir alan olduğunu varsayalım.
            // Eğer farklıysa burası müşteri verisine göre güncellenmeli.
            option.textContent = musteri.ad || musteri.firmaAdi || `Müşteri ID: ${musteri.id}`;
            selectElement.appendChild(option);
        });
    }

    if (seciliDegeriKoru && mevcutDeger && Array.isArray(musterilerListesi) && musterilerListesi.some(m => String(m.id) === String(mevcutDeger))) {
        selectElement.value = mevcutDeger;
    } else if (!seciliDegeriKoru && mevcutDeger) {
        selectElement.value = "";
    }
}

// Diğer UI fonksiyonları buraya eklenecek... 