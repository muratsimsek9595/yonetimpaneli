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

export function guncelleIscilerTablosu(iscilerListesi, tabloBodyElementi) {
    if (!tabloBodyElementi) return;
    tabloBodyElementi.innerHTML = ''; 
    if (!Array.isArray(iscilerListesi) || iscilerListesi.length === 0) {
        tabloBodyElementi.innerHTML = '<tr><td colspan="9">Kayıtlı işçi bulunamadı.</td></tr>';
    } else {
        iscilerListesi.forEach(isci => {
            const tr = document.createElement('tr');
            tr.dataset.isciId = isci.id;

            // HTML'deki th sırasına göre td'leri oluşturuyoruz:
            // API'den gelen camelCase alan adlarını kullanacağız.

            // 1. ID
            const tdId = document.createElement('td');
            tdId.textContent = isci.id || '-';
            tr.appendChild(tdId);

            // 2. Ad Soyad
            const tdAdSoyad = document.createElement('td');
            tdAdSoyad.textContent = isci.adSoyad || '-';
            tr.appendChild(tdAdSoyad);

            // 3. Pozisyon
            const tdPozisyon = document.createElement('td');
            tdPozisyon.textContent = isci.pozisyon || '-';
            tr.appendChild(tdPozisyon);

            // 4. Günlük Ücret
            const tdGunlukUcret = document.createElement('td');
            tdGunlukUcret.textContent = isci.gunlukUcret ? parseFloat(isci.gunlukUcret).toFixed(2) : '-';
            tr.appendChild(tdGunlukUcret);

            // 5. Para Birimi
            const tdParaBirimi = document.createElement('td');
            tdParaBirimi.textContent = isci.paraBirimi || '-';
            tr.appendChild(tdParaBirimi);

            // 6. Aktif
            const tdAktif = document.createElement('td');
            tdAktif.textContent = isci.aktif ? 'Aktif' : 'Pasif';
            tr.appendChild(tdAktif);

            // 7. İşe Başlama Tarihi
            const tdIseBaslama = document.createElement('td');
            tdIseBaslama.textContent = isci.iseBaslamaTarihi ? new Date(isci.iseBaslamaTarihi).toLocaleDateString('tr-TR') : '-';
            tr.appendChild(tdIseBaslama);

            // 8. İşlemler
            const tdActions = document.createElement('td');
            tdActions.classList.add('actions');
            tdActions.innerHTML = `
                <button class="btn-edit isci-edit-btn" data-id="${isci.id}">Düzenle</button>
                <button class="btn-delete isci-delete-btn" data-id="${isci.id}">Sil</button>
            `;
            tr.appendChild(tdActions);
            
            tabloBodyElementi.appendChild(tr);
        });
    }
}

export function temizleIsciFormu(formElement, idInputElement, submitButton, resetButton) {
    if (formElement) formElement.reset();
    if (idInputElement) idInputElement.value = '';
    
    if (formElement.elements.aktif) { // 'aktif' checkbox'ı için özel reset
      formElement.elements.aktif.checked = true; // Varsayılan olarak aktif olsun
    }
    if (formElement.elements.paraBirimi) { // 'paraBirimi' dropdown'ı için
        formElement.elements.paraBirimi.value = 'TL'; // Varsayılan TL
    }

    if (submitButton) {
        submitButton.textContent = 'Kaydet';
        submitButton.classList.remove('btn-warning');
        submitButton.classList.add('btn-primary');
    }
    if (resetButton) { // Düzenleme modunda bu buton "İptal" metni alır, temizleme modunda gizlenir/farklı davranır.
        resetButton.style.display = 'none'; // Genellikle temizle butonu düzenleme modunda görünür olur.
    }
    
    // Odaklanılacak ilk alan (genellikle Ad Soyad)
    if (formElement.elements.adSoyad) {
        formElement.elements.adSoyad.focus();
    }
}

export function doldurIsciFormu(isci, formElement, idInputElement, submitButton, resetButton) {
    if (!isci || !formElement) return;

    idInputElement.value = isci.id;
    formElement.elements.adSoyad.value = isci.adSoyad || '';
    formElement.elements.pozisyon.value = isci.pozisyon || '';
    formElement.elements.gunlukUcret.value = isci.gunlukUcret !== null && isci.gunlukUcret !== undefined ? parseFloat(isci.gunlukUcret) : '';
    formElement.elements.saatlikUcret.value = isci.saatlikUcret !== null && isci.saatlikUcret !== undefined ? parseFloat(isci.saatlikUcret) : '';
    formElement.elements.paraBirimi.value = isci.paraBirimi || 'TL';
    
    // Tarih formatını YYYY-MM-DD olarak ayarla (input type="date" için)
    if (isci.iseBaslamaTarihi) {
        try {
            const date = new Date(isci.iseBaslamaTarihi);
            if (!isNaN(date.getTime())) {
                // JavaScript Date objesi ayları 0-11 arası tutar, bu yüzden +1 eklenir.
                // Gün ve ay için '0' padding'i eklenir.
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                formElement.elements.iseBaslamaTarihi.value = `${year}-${month}-${day}`;
            } else {
                formElement.elements.iseBaslamaTarihi.value = ''; // Geçersizse boş bırak
            }
        } catch (e) {
            formElement.elements.iseBaslamaTarihi.value = ''; // Hata olursa boş bırak
            console.error("Tarih parse hatası doldurIsciFormu:", isci.iseBaslamaTarihi, e);
        }
    } else {
        formElement.elements.iseBaslamaTarihi.value = '';
    }
    
    formElement.elements.aktif.checked = !!isci.aktif; // Boolean değere çevir ve ata
    formElement.elements.telefon.value = isci.telefon || '';
    formElement.elements.email.value = isci.email || '';
    formElement.elements.adres.value = isci.adres || '';
    formElement.elements.notlar.value = isci.notlar || '';

    if (submitButton) {
        submitButton.textContent = 'Güncelle';
        submitButton.classList.remove('btn-primary');
        submitButton.classList.add('btn-warning');
    }
    if (resetButton) {
        resetButton.textContent = 'İptal'; // Düzenleme modunda "İptal"
        resetButton.style.display = 'inline-block';
    }
    formElement.elements.adSoyad.focus();
}

export function populeEtIsciSecimDropdown(iscilerListesi, selectElement, placeholderMetni = "-- İşçi Seçiniz --", seciliDegeriKoru = true, secilecekId = null) {
    if (!selectElement) return;

    const mevcutDeger = seciliDegeriKoru ? selectElement.value : null;
    selectElement.innerHTML = `<option value="">${placeholderMetni}</option>`;

    if (Array.isArray(iscilerListesi)) {
        // Aktif işçileri ve isme göre sıralı listele
        const aktifIsciler = iscilerListesi
            .filter(isci => isci.aktif)
            .sort((a, b) => (a.adSoyad || '').localeCompare(b.adSoyad || ''));

        aktifIsciler.forEach(isci => {
            const option = document.createElement('option');
            option.value = isci.id;
            option.textContent = `${isci.adSoyad}${isci.pozisyon ? ' (' + isci.pozisyon + ')' : ''}`;
            selectElement.appendChild(option);
        });
    }

    if (secilecekId !== null) {
        selectElement.value = secilecekId;
    } else if (seciliDegeriKoru && mevcutDeger && Array.isArray(iscilerListesi) && iscilerListesi.some(i => String(i.id) === String(mevcutDeger))) {
        selectElement.value = mevcutDeger;
    } else {
        selectElement.value = ""; // Eğer korunmayacaksa veya bulunamadıysa placeholder'a dön
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