import { showToast, clearForm } from './ui.js'; // Kullanıcı arayüzü etkileşimleri için
import { addMusteriAPI, getMusterilerAPI, updateMusteriAPI, deleteMusteriAPI } from './api.js'; // API çağrıları için

document.addEventListener('DOMContentLoaded', () => {
    const musteriForm = document.getElementById('musteriForm');
    const musteriListesiTablosuBody = document.getElementById('musteriListesiTablosu')?.querySelector('tbody');
    const musteriFormTemizleButton = document.getElementById('musteriFormTemizleButton');
    const musteriIdInput = document.getElementById('musteriIdInput'); // Güncelleme için

    // Form gönderildiğinde
    musteriForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(musteriForm);
        const musteri = {
            id: formData.get('musteriIdInput') || null, // Güncelleme için ID, yoksa null (yeni kayıt)
            adi: formData.get('musteriAdiInput'),
            yetkiliKisi: formData.get('musteriYetkiliKisiInput'),
            telefon: formData.get('musteriTelefonInput'),
            email: formData.get('musteriEmailInput'),
            adres: formData.get('musteriAdresInput'),
            vergiNo: formData.get('musteriVergiNoInput'),
            notlar: formData.get('musteriNotlarInput')
        };

        try {
            let response;
            if (musteri.id) {
                // ID varsa güncelle
                response = await updateMusteriAPI(musteri.id, musteri);
                showToast(response.message || 'Müşteri başarıyla güncellendi!', 'success');
            } else {
                // ID yoksa yeni müşteri ekle
                // API'den gelen 'id' alanını artık beklemiyoruz, PHP tarafı hallediyor.
                // Sadece 'adi' zorunlu, diğerleri opsiyonel.
                const yeniMusteri = { ...musteri };
                delete yeniMusteri.id; // Yeni eklerken ID göndermiyoruz
                response = await addMusteriAPI(yeniMusteri);
                showToast(response.message || 'Müşteri başarıyla eklendi!', 'success');
            }
            
            clearForm(musteriForm);
            musteriIdInput.value = ''; // Gizli ID alanını temizle
            musteriFormTemizleButton.style.display = 'none';
            await loadMusteriler(); // Listeyi yenile
        } catch (error) {
            console.error('Müşteri kaydetme hatası:', error);
            showToast(error.message || 'Müşteri kaydedilirken bir hata oluştu.', 'error');
        }
    });

    // Form temizleme butonu
    musteriFormTemizleButton?.addEventListener('click', () => {
        clearForm(musteriForm);
        musteriIdInput.value = '';
        musteriFormTemizleButton.style.display = 'none';
        musteriForm.querySelector('button[type="submit"]').textContent = 'Müşteriyi Kaydet';
    });

    // Müşterileri yükle ve listele
    async function loadMusteriler() {
        if (!musteriListesiTablosuBody) return;
        try {
            const musteriler = await getMusterilerAPI();
            musteriListesiTablosuBody.innerHTML = ''; // Önceki kayıtları temizle

            if (musteriler && musteriler.length > 0) {
                musteriler.forEach(musteri => {
                    const row = musteriListesiTablosuBody.insertRow();
                    row.innerHTML = `
                        <td>${musteri.adi || ''}</td>
                        <td>${musteri.yetkiliKisi || ''}</td>
                        <td>${musteri.telefon || ''}</td>
                        <td>${musteri.email || ''}</td>
                        <td>${musteri.adres || ''}</td>
                        <td>${musteri.vergiNo || ''}</td>
                        <td>${musteri.notlar || ''}</td>
                        <td>
                            <button class="btn-edit" data-id="${musteri.id}">Düzenle</button>
                            <button class="btn-delete" data-id="${musteri.id}">Sil</button>
                        </td>
                    `;
                });
            } else {
                musteriListesiTablosuBody.innerHTML = '<tr><td colspan="8">Kayıtlı müşteri bulunamadı.</td></tr>';
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
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', async (e) => {
                const musteriId = e.target.dataset.id;
                const musteri = (await getMusterilerAPI()).find(m => m.id == musteriId); // Tekrar API'dan çekmek yerine listeden bulunabilir
                if (musteri) {
                    musteriIdInput.value = musteri.id;
                    document.getElementById('musteriAdiInput').value = musteri.adi || '';
                    document.getElementById('musteriYetkiliKisiInput').value = musteri.yetkiliKisi || '';
                    document.getElementById('musteriTelefonInput').value = musteri.telefon || '';
                    document.getElementById('musteriEmailInput').value = musteri.email || '';
                    document.getElementById('musteriAdresInput').value = musteri.adres || '';
                    document.getElementById('musteriVergiNoInput').value = musteri.vergiNo || '';
                    document.getElementById('musteriNotlarInput').value = musteri.notlar || '';
                    
                    musteriForm.querySelector('button[type="submit"]').textContent = 'Müşteriyi Güncelle';
                    musteriFormTemizleButton.style.display = 'inline-block';
                    document.getElementById('musteri-yonetimi').scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                const musteriId = e.target.dataset.id;
                if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
                    try {
                        const response = await deleteMusteriAPI(musteriId);
                        showToast(response.message || 'Müşteri başarıyla silindi!', 'success');
                        await loadMusteriler(); // Listeyi yenile
                    } catch (error) {
                        console.error('Müşteri silme hatası:', error);
                        showToast(error.message || 'Müşteri silinirken bir hata oluştu.', 'error');
                    }
                }
            });
        });
    }

    // Sayfa yüklendiğinde müşterileri listele
    if (document.getElementById('musteri-yonetimi')) {
         loadMusteriler();
    }
}); 