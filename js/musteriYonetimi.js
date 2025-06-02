import { showToast, clearForm } from './ui.js'; // Kullanıcı arayüzü etkileşimleri için
import { saveMusteri, getMusteriler, deleteMusteri } from './api.js'; // API çağrıları için

// DOM Elementlerini global (modül kapsamında) tanımla, init içinde erişilebilir olmaları için
let musteriForm;
let musteriListesiTablosuBody;
let musteriFormTemizleButton;
let musteriIdInput;

// Müşterileri yükle ve listele
async function loadMusteriler() {
    if (!musteriListesiTablosuBody) return;
    try {
        const response = await getMusteriler(); 
        musteriListesiTablosuBody.innerHTML = ''; 

        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
            response.data.forEach(musteri => {
                const row = musteriListesiTablosuBody.insertRow();
                row.innerHTML = `
                    <td>${musteri.ad || ''}</td>
                    <td>${musteri.yetkili_kisi || ''}</td>
                    <td>${musteri.telefon || ''}</td>
                    <td>${musteri.email || ''}</td>
                    <td>${musteri.adres || ''}</td>
                    <td>${musteri.vergi_no || ''}</td>
                    <td>${musteri.notlar || ''}</td>
                    <td>
                        <button class="btn-edit" data-id="${musteri.id}">Düzenle</button>
                        <button class="btn-delete" data-id="${musteri.id}">Sil</button>
                    </td>
                `;
            });
        } else {
            const mesaj = (response && response.message && response.success === false) ? response.message : 'Kayıtlı müşteri bulunamadı.';
            musteriListesiTablosuBody.innerHTML = `<tr><td colspan="8">${mesaj}</td></tr>`;
        }
        addEventListenersToButtons(); 
    } catch (error) {
        console.error('Müşteriler yüklenirken hata:', error);
        showToast(error.message || 'Müşteriler yüklenirken bir hata oluştu.', 'error');
        if (musteriListesiTablosuBody) {
             musteriListesiTablosuBody.innerHTML = '<tr><td colspan="8">Müşteriler yüklenemedi.</td></tr>';
        }
    }
}

// Düzenle ve Sil butonlarına event listener ekle
function addEventListenersToButtons() {
    document.querySelectorAll('#musteriListesiTablosu .btn-edit').forEach(button => {
        button.addEventListener('click', async (e) => {
            const musteriId = e.target.dataset.id;
            try {
                const apiResponse = await getMusteriler();
                if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
                    const musteriListesi = apiResponse.data;
                    const musteri = musteriListesi.find(m => String(m.id) === String(musteriId));
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
                        musteriFormTemizleButton.style.display = 'inline-block';
                        document.getElementById('musteri-yonetimi').scrollIntoView({ behavior: 'smooth' });
                    } else {
                        showToast('Düzenlenecek müşteri bulunamadı.', 'error');
                    }
                } else {
                     showToast('Müşteri verileri alınamadı veya format hatalı.', 'error');
                }
            } catch (error) {
                console.error('Müşteri bilgileri getirilirken hata:', error);
                showToast('Müşteri bilgileri getirilirken bir hata oluştu.', 'error');
            }
        });
    });

    document.querySelectorAll('#musteriListesiTablosu .btn-delete').forEach(button => {
        button.addEventListener('click', async (e) => {
            const musteriId = e.target.dataset.id;
            if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
                try {
                    const response = await deleteMusteri(musteriId);
                    showToast(response.message || 'Müşteri başarıyla silindi!', 'success');
                    await loadMusteriler(); 
                } catch (error) {
                    console.error('Müşteri silme hatası:', error);
                    showToast(error.message || 'Müşteri silinirken bir hata oluştu.', 'error');
                }
            }
        });
    });
}

function initMusteriYonetimi() {
    // DOM elementlerini burada bul
    musteriForm = document.getElementById('musteriForm');
    musteriListesiTablosuBody = document.getElementById('musteriListesiTablosu')?.querySelector('tbody');
    musteriFormTemizleButton = document.getElementById('musteriFormTemizleButton');
    musteriIdInput = document.getElementById('musteriIdInput'); 

    if (!musteriForm || !musteriListesiTablosuBody || !musteriFormTemizleButton || !musteriIdInput) {
        console.error("Müşteri Yönetimi için gerekli DOM elementlerinden biri veya birkaçı bulunamadı!");
        return; // Gerekli elementler yoksa devam etme
    }

    // Form gönderildiğinde
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

        try {
            let response;
            if (musteriId) {
                response = await saveMusteri(musteriData, musteriId);
                showToast(response.message || 'Müşteri başarıyla güncellendi!', 'success');
            } else {
                response = await saveMusteri(musteriData);
                showToast(response.message || 'Müşteri başarıyla eklendi!', 'success');
            }
            
            clearForm(musteriForm);
            musteriIdInput.value = ''; 
            if(musteriFormTemizleButton) musteriFormTemizleButton.style.display = 'none';
            musteriForm.querySelector('button[type="submit"]').textContent = 'Müşteriyi Kaydet';
            await loadMusteriler(); 
        } catch (error) {
            console.error('Müşteri kaydetme hatası:', error);
            showToast(error.message || 'Müşteri kaydedilirken bir hata oluştu.', 'error');
        }
    });

    // Form temizleme butonu
    if(musteriFormTemizleButton) {
        musteriFormTemizleButton.addEventListener('click', () => {
            clearForm(musteriForm);
            musteriIdInput.value = '';
            musteriFormTemizleButton.style.display = 'none';
            musteriForm.querySelector('button[type="submit"]').textContent = 'Müşteriyi Kaydet';
        });
    }

    // Başlangıçta müşterileri yükle
    loadMusteriler();
}

export { initMusteriYonetimi }; 