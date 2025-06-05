import {
    fetchIsciler, // Eğer iscileriYukle fonksiyonu burada olacaksa veya başlangıçta yüklenmesi gerekiyorsa
    addIsciAPI,
    updateIsciAPI,
    deleteIsciAPI
} from './api.js';
import {
    getIsciById,
    addIsci,
    updateIsci,
    removeIsciById as removeIsciFromStore,
    // getIsciler, // Eğer subscribe burada yönetilecekse veya tüm işçilere erişim gerekiyorsa
    // setIsciler // Eğer iscileriYukle burada olacaksa
} from './store.js';
import {
    guncelleIscilerTablosu, // script.js'de subscribe içinde kalabilir veya buraya alınabilir
    doldurIsciFormu,
    temizleIsciFormu,
    showToast,
    setButtonLoading,
    resetButtonLoading
} from './ui.js';
import { globalHataYakala } from './hataYonetimi.js';

// DOM Elementleri (script.js'den taşınacak)
let isciForm;
let isciIdInput;
let isciListesiTablosuBody;
let isciFormTemizleButton;
let isciKaydetBtn;

function initDOMReferences() {
    isciForm = document.getElementById('isciForm');
    isciIdInput = document.getElementById('isciIdInput');
    isciListesiTablosuBody = document.querySelector('#isciListesiTablosu tbody');
    isciFormTemizleButton = document.getElementById('isciFormTemizleButton');
    isciKaydetBtn = isciForm ? isciForm.querySelector('button[type="submit"]') : null;
}

async function handleIsciFormSubmit(event) {
    event.preventDefault();
    if (!isciForm || !isciKaydetBtn || !isciIdInput) {
        console.warn("İşçi formu submit için gerekli DOM elemanları eksik.");
        return;
    }
    if (typeof setButtonLoading === 'function') setButtonLoading(isciKaydetBtn, 'Kaydediliyor...');

    const id = isciIdInput.value;
    const adSoyad = isciForm.elements.adSoyad.value.trim();
    const pozisyon = isciForm.elements.pozisyon.value.trim() || null;
    const gunlukUcretValue = isciForm.elements.gunlukUcret.value.trim();
    const gunlukUcret = gunlukUcretValue ? parseFloat(gunlukUcretValue) : null;
    const saatlikUcretValue = isciForm.elements.saatlikUcret.value.trim();
    const saatlikUcret = saatlikUcretValue ? parseFloat(saatlikUcretValue) : null;
    const paraBirimi = isciForm.elements.paraBirimi.value || 'TL';
    let iseBaslamaTarihi = isciForm.elements.iseBaslamaTarihi.value.trim();
    if (iseBaslamaTarihi && !/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/.test(iseBaslamaTarihi)) {
        showToast('İşe başlama tarihi geçerli bir formatta (YYYY-AA-GG) olmalıdır.', 'error');
        if (typeof resetButtonLoading === 'function') resetButtonLoading(isciKaydetBtn);
        return;
    }
    iseBaslamaTarihi = iseBaslamaTarihi || null;
    const aktif = isciForm.elements.aktif.checked;
    const telefon = isciForm.elements.telefon.value.trim() || null;
    const email = isciForm.elements.email.value.trim() || null;
    const adres = isciForm.elements.adres.value.trim() || null;
    const notlar = isciForm.elements.notlar.value.trim() || null;

    if (!adSoyad) {
        showToast('Ad Soyad alanı zorunludur.', 'error');
        if (typeof resetButtonLoading === 'function') resetButtonLoading(isciKaydetBtn);
        if(isciForm.elements.adSoyad) isciForm.elements.adSoyad.focus();
        return;
    }

    const isciData = {
        adSoyad, pozisyon, gunlukUcret, saatlikUcret, paraBirimi,
        iseBaslamaTarihi, aktif, telefon, email, adres, notlar
    };

    try {
        let savedIsci;
        if (id) {
            isciData.id = parseInt(id, 10);
            savedIsci = await updateIsciAPI(isciData);
            updateIsci(savedIsci); // Store'u güncelle
            showToast('İşçi başarıyla güncellendi.', 'success');
        } else {
            savedIsci = await addIsciAPI(isciData);
            addIsci(savedIsci); // Store'u güncelle
            showToast('İşçi başarıyla eklendi.', 'success');
        }
        if (typeof temizleIsciFormu === 'function') {
            temizleIsciFormu(isciForm, isciIdInput, isciKaydetBtn, isciFormTemizleButton);
        }
    } catch (error) {
        console.error('İşçi kaydetme/güncelleme hatası:', error);
        showToast(error.message || 'İşçi kaydedilirken bir hata oluştu.', 'error');
        globalHataYakala(error, `İşçi ${id ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`);
    } finally {
        if (typeof resetButtonLoading === 'function') resetButtonLoading(isciKaydetBtn);
    }
}

async function handleIsciListesiClick(event) {
    if(!isciListesiTablosuBody) return;

    // console.log('[İşçi Tıklama Dinleyici Kontrolü] isciListesiTablosuBody tıklandı. Raw Event Target:', event.target); // İhtiyaç halinde açılabilir
    const target = event.target;
    // console.log('[İşçi Tıklama Dinleyici Kontrolü] Target Detayları -> TagName:', target.tagName, 'ClassName:', target.className, 'ID:', target.id); // İhtiyaç halinde açılabilir

    const editButton = typeof target.className === 'string' && target.className.includes('isci-edit-btn') ? target : null;
    const deleteButton = typeof target.className === 'string' && target.className.includes('isci-delete-btn') ? target : null;

    // console.log('[İşçi Tıklama Dinleyici Kontrolü] --- Değişken Değerleri Kontrolü (Düzeltilmiş Sınıf Adı ile) ---'); // İhtiyaç halinde açılabilir
    // console.log('[İşçi Tıklama Dinleyici Kontrolü] \'editButton\' değişkeninin değeri:', editButton); // İhtiyaç halinde açılabilir
    // console.log('[İşçi Tıklama Dinleyici Kontrolü] \'deleteButton\' değişkeninin değeri:', deleteButton); // İhtiyaç halinde açılabilir
    // console.log('[İşçi Tıklama Dinleyici Kontrolü] --- Kontrol Sonu ---'); // İhtiyaç halinde açılabilir

    if (editButton) {
        // console.log('[İşçi Tıklama Dinleyici Kontrolü] >>> BLOK: if (editButton) İÇİNDE <<<'); // İhtiyaç halinde açılabilir
        const isciId = editButton.dataset.id;
        if (isciForm && isciIdInput && getIsciById && typeof doldurIsciFormu === 'function') {
            const isci = getIsciById(isciId);
            if (isci) {
                doldurIsciFormu(isci, isciForm, isciIdInput, isciKaydetBtn, isciFormTemizleButton);
                if(isciForm) isciForm.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
                showToast(`${isci.adSoyad} düzenleniyor...`, 'info', 2000);
            } else {
                showToast('Düzenlenecek işçi bulunamadı.', 'error');
            }
        } else {
            console.warn('İşçi düzenleme butonu için gerekli form elemanları veya fonksiyonlar eksik.');
            showToast('Düzenleme formu yüklenemedi. Lütfen konsolu kontrol edin.', 'error');
        }
    } else if (deleteButton) {
        // console.log('[İşçi Tıklama Dinleyici Kontrolü] >>> BLOK: else if (deleteButton) İÇİNDE <<<'); // İhtiyaç halinde açılabilir
        const isciId = deleteButton.dataset.id;
        if (getIsciById && typeof deleteIsciAPI === 'function' && typeof removeIsciFromStore === 'function') {
            const isci = getIsciById(isciId);
            if (isci && confirm(`'${isci.adSoyad}' adlı işçiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
                const originalIconHTML = deleteButton.innerHTML;
                if (typeof setButtonLoading === 'function') setButtonLoading(deleteButton, '...');
                deleteButton.disabled = true;
                try {
                    await deleteIsciAPI(isciId);
                    removeIsciFromStore(isciId);
                    showToast('İşçi başarıyla silindi.', 'success');
                    if (isciIdInput && isciIdInput.value === isciId && isciForm && typeof temizleIsciFormu === 'function' && isciKaydetBtn && isciFormTemizleButton) {
                        temizleIsciFormu(isciForm, isciIdInput, isciKaydetBtn, isciFormTemizleButton);
                    }
                } catch (error) {
                    console.error('İşçi silme hatası:', error);
                    showToast(error.message || 'İşçi silinirken bir hata oluştu.', 'error');
                    globalHataYakala(error, 'İşçi silinirken bir sorun oluştu.');
                } finally {
                    if (typeof resetButtonLoading === 'function') resetButtonLoading(deleteButton);
                    deleteButton.innerHTML = originalIconHTML;
                    deleteButton.disabled = false;
                }
            } else if (!isci && !editButton) { 
                showToast('Silinecek işçi bulunamadı.', 'error');
            }
        } else {
            console.warn('İşçi silme butonu için gerekli fonksiyonlar eksik.');
            showToast('Silme işlemi gerçekleştirilemedi. Lütfen konsolu kontrol edin.', 'error');
        }
    } 
    // else {
        // console.log('[İşçi Tıklama Dinleyici Kontrolü] !!! BLOK: NE editButton NE deleteButton BULUNDU !!!'); // İhtiyaç halinde açılabilir
        // console.log('[İşçi Tıklama Dinleyici Kontrolü] Kontrol edilen target:', target); // İhtiyaç halinde açılabilir
        // if (target.parentNode) { // İhtiyaç halinde açılabilir
            // console.log('[İşçi Tıklama Dinleyici Kontrolü] Kontrol edilen target\'ın parentNode\'u:', target.parentNode, 'Parent ClassName:', target.parentNode.className); // İhtiyaç halinde açılabilir
        // }
    // }
}

function handleFormTemizleClick() {
    if (!isciForm || !isciIdInput || !isciKaydetBtn || !isciFormTemizleButton || typeof temizleIsciFormu !== 'function') {
        console.warn("İşçi formu temizleme için gerekli DOM elemanları veya fonksiyonlar eksik.");
        return;
    }
    temizleIsciFormu(isciForm, isciIdInput, isciKaydetBtn, isciFormTemizleButton);
}

export function initIsciYonetimi() {
    console.log("initIsciYonetimi çağrıldı.");
    initDOMReferences();

    if (isciListesiTablosuBody) {
        isciListesiTablosuBody.addEventListener('click', handleIsciListesiClick);
    } else {
        console.warn("DOM Elementi bulunamadı: isciListesiTablosuBody. İşçi listesi tablo butonları çalışmayacaktır.");
    }
    
    if (isciForm) {
        isciForm.addEventListener('submit', handleIsciFormSubmit);
    } else {
        console.warn("DOM Elementi bulunamadı: isciForm. İşçi formu gönderme işlevi çalışmayacaktır.");
    }

    if (isciFormTemizleButton) {
        isciFormTemizleButton.addEventListener('click', handleFormTemizleClick);
    } else {
        console.warn("DOM Elementi bulunamadı: isciFormTemizleButton. Form temizleme işlevi çalışmayacaktır.");
    }

    // İlk yükleme ve subscribe işlemleri script.js'de kalabilir veya buraya taşınabilir.
    // Örneğin, iscileriYukle() ve subscribe('iscilerChanged', ...) buraya alınabilir.
    // Şimdilik script.js'deki subscribe mekanizmasının çalışmaya devam ettiğini varsayıyoruz.
    // Bu, guncelleIscilerTablosu'nun script.js tarafından çağrılacağı anlamına gelir.
} 