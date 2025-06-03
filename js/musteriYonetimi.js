import { showToast, clearForm } from './ui.js'; // Kullanıcı arayüzü etkileşimleri için
import { saveMusteri, getMusteriler as getMusterilerFromAPI, deleteMusteri as deleteMusteriFromAPI } from './api.js'; // API çağrıları için
import { 
    getMusteriler as getMusterilerFromStore, 
    getMusteriById as getMusteriByIdFromStore,
    addMusteriToStore, 
    updateMusteriInStore,
    removeMusteriByIdFromStore,
    subscribe
} from './store.js';

// DOM Elementlerini global (modül kapsamında) tanımla, init içinde erişilebilir olmaları için
let musteriForm;
let musteriListesiTablosuBody;
let musteriFormTemizleButton;
let musteriIdInput;

// Müşteri listesini store'dan gelen veriye göre render et
function renderMusterilerTablosu(musterilerListesi) {
    if (!musteriListesiTablosuBody) return;
    musteriListesiTablosuBody.innerHTML = ''; 

    if (Array.isArray(musterilerListesi) && musterilerListesi.length > 0) {
        musterilerListesi.forEach(musteri => {
            const row = musteriListesiTablosuBody.insertRow();
            row.innerHTML = `
                <td>${musteri.ad || ''}</td>
                <td>${musteri.yetkili_kisi || ''}</td>
                <td>${musteri.telefon || ''}</td>
                <td>${musteri.email || ''}</td>
                <td>${musteri.adres || ''}</td>
                <td>${musteri.vergi_no || ''}</td>
                <td>${musteri.notlar || ''}</td>
                <td class="actions">
                    <button class="btn-edit" data-id="${musteri.id}">Düzenle</button>
                    <button class="btn-delete" data-id="${musteri.id}">Sil</button>
                </td>
            `;
        });
    } else {
        musteriListesiTablosuBody.innerHTML = '<tr><td colspan="8">Kayıtlı müşteri bulunamadı.</td></tr>';
    }
    // Olay delegasyonu kullanılmıyorsa, butonlara her render'da event listener eklemek gerekir.
    // Şimdilik addEventListenersToButtons() çağrısını initMusteriYonetimi'nde bir kere yapacağız
    // ve tabloya olay delegasyonu ile yaklaşacağız. Bu fonksiyonu buradan kaldırıyoruz.
}

// Olay delegasyonu için tabloya event listener ekle
function addTableEventListeners() {
    if (!musteriListesiTablosuBody) return;

    musteriListesiTablosuBody.addEventListener('click', async (e) => {
        const target = e.target;
        const editButton = target.closest('.btn-edit');
        const deleteButton = target.closest('.btn-delete');

        if (editButton) {
            const musteriId = editButton.dataset.id;
            const musteri = getMusteriByIdFromStore(musteriId); // Store'dan al
            if (musteri) {
                musteriIdInput.value = musteri.id;
                document.getElementById('musteriAdiInput').value = musteri.ad || '';
                document.getElementById('musteriYetkiliKisiInput').value = musteri.yetkili_kisi || '';
                document.getElementById('musteriTelefonInput').value = musteri.telefon || '';
                document.getElementById('musteriEmailInput').value = musteri.email || '';
                document.getElementById('musteriAdresInput').value = musteri.adres || '';
                document.getElementById('musteriVergiNoInput').value = musteri.vergi_no || '';
                document.getElementById('musteriNotlarInput').value = musteri.notlar || '';
                
                musteriForm.querySelector('button[type="submit"]').textContent = 'Müşteriyi Güncelle';
                if(musteriFormTemizleButton) musteriFormTemizleButton.style.display = 'inline-block';
                // Sayfayı formun olduğu yere kaydır
                const musteriYonetimiSection = document.getElementById('musteri-yonetimi');
                if (musteriYonetimiSection) {
                    musteriYonetimiSection.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                showToast('Düzenlenecek müşteri bulunamadı.', 'error');
            }
        } else if (deleteButton) {
            const musteriId = deleteButton.dataset.id;
            const musteri = getMusteriByIdFromStore(musteriId); // Store'dan al
            if (musteri && confirm(`'${musteri.ad || 'Bu müşteri'}' adlı müşteriyi silmek istediğinizden emin misiniz?`)) {
                try {
                    // Butona yükleme durumu ekle (opsiyonel ama iyi pratik)
                    deleteButton.disabled = true;
                    deleteButton.textContent = 'Siliniyor...';

                    const response = await deleteMusteriFromAPI(musteriId); // API'den sil
                    removeMusteriByIdFromStore(musteriId); // Store'dan sil
                    showToast(response.message || 'Müşteri başarıyla silindi!', 'success');
                    
                    // Eğer silinen müşteri formda yüklü ise formu temizle
                    if (musteriIdInput.value === musteriId) {
                        clearForm(musteriForm);
                        musteriIdInput.value = '';
                        if(musteriFormTemizleButton) musteriFormTemizleButton.style.display = 'none';
                        musteriForm.querySelector('button[type="submit"]').textContent = 'Müşteriyi Kaydet';
                    }

                } catch (error) {
                    console.error('Müşteri silme hatası:', error);
                    showToast(error.message || 'Müşteri silinirken bir hata oluştu.', 'error');
                } finally {
                    // Butonu eski haline getir (opsiyonel)
                    // Bu basit bir örnek, daha gelişmiş bir buton yükleme yönetimi ui.js'de olabilir.
                    if (document.body.contains(deleteButton)) { // Element hala DOM'da mı kontrol et
                        deleteButton.disabled = false;
                        deleteButton.textContent = 'Sil';
                    }
                }
            } else if (!musteri) {
                 showToast('Silinecek müşteri bulunamadı.', 'error');
            }
        }
    });
}

function initMusteriYonetimi() {
    musteriForm = document.getElementById('musteriForm');
    musteriListesiTablosuBody = document.getElementById('musteriListesiTablosu')?.querySelector('tbody');
    musteriFormTemizleButton = document.getElementById('musteriFormTemizleButton');
    musteriIdInput = document.getElementById('musteriIdInput'); 

    if (!musteriForm || !musteriListesiTablosuBody || !musteriFormTemizleButton || !musteriIdInput) {
        console.error("Müşteri Yönetimi için gerekli DOM elementlerinden biri veya birkaçı bulunamadı!");
        return; 
    }

    // Store'daki değişikliklere abone ol ve tabloyu güncelle
    subscribe('musterilerChanged', (guncelMusteriler) => {
        renderMusterilerTablosu(guncelMusteriler);
    });

    // Başlangıçta müşteri listesini store'dan alıp render et
    renderMusterilerTablosu(getMusterilerFromStore());

    // Tabloya olay dinleyicilerini (düzenle/sil için) ekle
    addTableEventListeners();

    musteriForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(musteriForm);
        const musteriData = {
            ad: formData.get('musteriAdiInput'),
            yetkili_kisi: formData.get('musteriYetkiliKisiInput'),
            telefon: formData.get('musteriTelefonInput'),
            email: formData.get('musteriEmailInput'),
            adres: formData.get('musteriAdresInput'),
            vergi_no: formData.get('musteriVergiNoInput'),
            notlar: formData.get('musteriNotlarInput')
        };
        const musteriId = formData.get('musteriIdInput');
        
        const submitButton = musteriForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = musteriId ? 'Güncelleniyor...' : 'Kaydediliyor...';

        try {
            let response;
            if (musteriId) {
                response = await saveMusteri(musteriData, musteriId); // API'ye kaydet/güncelle
                // API yanıtı güncel müşteri verisini 'data' altında dönmeli
                if (response && response.data) {
                    updateMusteriInStore(response.data); 
                } else {
                    // Eğer API güncel veriyi dönmüyorsa, gönderilen veriyle store'u güncelle
                    updateMusteriInStore({ ...musteriData, id: musteriId });
                    console.warn("Müşteri güncelleme API yanıtı tam veri içermiyor. Gönderilen veri kullanıldı.");
                }
                showToast(response.message || 'Müşteri başarıyla güncellendi!', 'success');
            } else {
                response = await saveMusteri(musteriData); // API'ye kaydet
                
                if (response && response.id) { // Doğrudan response.id kontrolü
                    const yeniMusteriDetayi = { ...musteriData, id: response.id };
                    addMusteriToStore(yeniMusteriDetayi);
                    showToast(response.message || 'Müşteri başarıyla eklendi!', 'success');
                } else if (response && response.data && response.data.id) { // Önceki data yapısını da kontrol et
                    addMusteriToStore(response.data);
                    showToast(response.message || 'Müşteri başarıyla eklendi!', 'success');
                } else {
                    console.error('Yeni müşteri API yanıtı beklenen formatta değil veya ID eksik.', response);
                    showToast('Müşteri eklendi ancak yanıt alınamadı veya ID dönmedi, liste güncel olmayabilir.', 'warning');
                    // Fallback: tüm listeyi yeniden çekip store'u güncelle (çok ideal değil)
                    // const allMusteriler = await getMusterilerFromAPI();
                    // if(allMusteriler && allMusteriler.data) setMusteriler(allMusteriler.data);
                }
            }
            
            clearForm(musteriForm);
            musteriIdInput.value = ''; 
            if(musteriFormTemizleButton) musteriFormTemizleButton.style.display = 'none';
            // Buton metnini burada sıfırlama, renderMusterilerTablosu'ndan sonra veya finally'de
            // submitButton.textContent = 'Müşteriyi Kaydet'; // renderMusterilerTablosu'ndan sonraki state'e göre ayarlanır

        } catch (error) {
            console.error('Müşteri kaydetme/güncelleme hatası:', error);
            showToast(error.message || 'Müşteri kaydedilirken/güncellenirken bir hata oluştu.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText; // Form temizlense bile orijinal metne dön
            // Eğer form temizlendiyse ve ID yoksa "Kaydet" olmalı, ID varsa "Güncelle"
            // Bu mantık clearForm ve edit butonu içinde zaten var.
             if (musteriIdInput.value) {
                 submitButton.textContent = 'Müşteriyi Güncelle';
             } else {
                 submitButton.textContent = 'Müşteriyi Kaydet';
             }
        }
    });

    if(musteriFormTemizleButton) {
        musteriFormTemizleButton.addEventListener('click', () => {
            clearForm(musteriForm);
            musteriIdInput.value = '';
            musteriFormTemizleButton.style.display = 'none';
            musteriForm.querySelector('button[type="submit"]').textContent = 'Müşteriyi Kaydet';
        });
    }
    // Eski loadMusteriler() çağrısı kaldırıldı.
}

export { initMusteriYonetimi }; 