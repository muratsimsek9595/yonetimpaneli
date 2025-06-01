import { showToast, clearForm } from './ui.js'; // Kullanıcı arayüzü etkileşimleri için
import { saveMusteri, getMusteriler, deleteMusteri } from './api.js'; // API çağrıları için

document.addEventListener('DOMContentLoaded', () => {
    const musteriForm = document.getElementById('musteriForm');
    const musteriListesiTablosuBody = document.getElementById('musteriListesiTablosu')?.querySelector('tbody');
    const musteriFormTemizleButton = document.getElementById('musteriFormTemizleButton');
    const musteriIdInput = document.getElementById('musteriIdInput'); // Güncelleme için

    // Form gönderildiğinde
    musteriForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log("Müşteri formu submit edildi."); // Test için eklendi

        const formData = new FormData(musteriForm);
        const musteriData = {
            // id: formData.get('musteriIdInput') || null, // saveMusteri fonksiyonu ID'yi ayrı parametre olarak alıyor
            adi: formData.get('musteriAdiInput'),
            yetkiliKisi: formData.get('musteriYetkiliKisiInput'),
            telefon: formData.get('musteriTelefonInput'),
            email: formData.get('musteriEmailInput'),
            adres: formData.get('musteriAdresInput'),
            vergiNo: formData.get('musteriVergiNoInput'),
            notlar: formData.get('musteriNotlarInput')
        };
        const musteriId = formData.get('musteriIdInput');

        try {
            let response;
            if (musteriId) {
                // ID varsa güncelle
                response = await saveMusteri(musteriData, musteriId);
                showToast(response.message || 'Müşteri başarıyla güncellendi!', 'success');
            } else {
                // ID yoksa yeni müşteri ekle
                response = await saveMusteri(musteriData); // ID parametresi olmadan çağırıyoruz
                showToast(response.message || 'Müşteri başarıyla eklendi!', 'success');
            }
            
            clearForm(musteriForm);
            musteriIdInput.value = ''; // Gizli ID alanını temizle
            musteriFormTemizleButton.style.display = 'none';
            musteriForm.querySelector('button[type="submit"]').textContent = 'Müşteriyi Kaydet';
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
            const response = await getMusteriler(); // API yanıtının tamamını al
            musteriListesiTablosuBody.innerHTML = ''; // Önceki kayıtları temizle

            if (response && response.status === 'success' && response.data && response.data.length > 0) {
                response.data.forEach(musteri => { // response.data dizisini kullan
                    console.log('Rendering musteri (ilk bakış):', JSON.parse(JSON.stringify(musteri))); // Nesnenin bir kopyasını logla
                    
                    console.log("--- Iterating Musteri Object Keys ---");
                    for (const key of Object.keys(musteri)) {
                        console.log(`Key: '${key}', Value: '${musteri[key]}', Type: ${typeof musteri[key]}`);
                    }
                    console.log("--- End Iterating ---");

                    // Kontrol amaçlı, doğrudan boşluklu ve boşluksuz anahtarla erişim logları:
                    console.log("musteri[' ad'] (boşluklu erişim) değeri:", musteri[' ad']);
                    console.log("musteri.ad (boşluksuz erişim) değeri:", musteri.ad);

                    const row = musteriListesiTablosuBody.insertRow();
                    row.innerHTML = `
                        <td>AD: ${musteri.ad || 'YOK'}</td>
                        <td>YETKILI: ${musteri.yetkiliKisi || 'YOK'}</td>
                        <td>TEL: ${musteri.telefon || 'YOK'}</td>
                        <td>EMAIL: ${musteri.email || 'YOK'}</td>
                        <td>ADRES: ${musteri.adres || 'YOK'}</td>
                        <td>VERGINO: ${musteri.vergiNo || 'YOK'}</td>
                        <td>NOT: ${musteri.notlar || 'YOK'}</td>
                        <td>
                            <button class="btn-edit" data-id="${musteri.id}">Düzenle</button>
                            <button class="btn-delete" data-id="${musteri.id}">Sil</button>
                        </td>
                    `;
                });
            } else {
                // Eğer status 'success' değilse veya data yoksa/boşsa
                const mesaj = (response && response.message && response.status !== 'success') ? response.message : 'Kayıtlı müşteri bulunamadı.';
                musteriListesiTablosuBody.innerHTML = `<tr><td colspan="8">${mesaj}</td></tr>`;
            }
            addEventListenersToButtons(); // Butonlara event listener'ları ata
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
                    const musteriler = await getMusteriler(); // API'dan güncel listeyi çek
                    const musteri = musteriler.find(m => String(m.id) === String(musteriId));
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
                    } else {
                        showToast('Düzenlenecek müşteri bulunamadı.', 'error');
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
                        const response = await deleteMusteri(musteriId); // deleteMusteriAPI -> deleteMusteri
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

    // Sayfa yüklendiğinde ve ilgili bölüm görünür olduğunda müşterileri listele
    const musteriYonetimiSection = document.getElementById('musteri-yonetimi');
    if (musteriYonetimiSection) {
        // Eğer başlangıçta görünürse veya navigasyonla bu bölüme gelinirse yükle
        if (window.getComputedStyle(musteriYonetimiSection).display !== 'none') {
            loadMusteriler();
        }
        // Navigasyon linklerini dinleyerek bölüm görünür olduğunda yükle
        // Bu kısım genel script.js veya app.js içinde daha merkezi bir yerden yönetiliyorsa
        // burada tekrar ele almak gerekmeyebilir. Şimdilik basit bir kontrol ekliyorum.
        const navLink = document.querySelector('a[href="#musteri-yonetimi"]');
        navLink?.addEventListener('click', () => {
            // Kısa bir gecikme ile section'ın display özelliğinin güncellenmesini bekle
            setTimeout(loadMusteriler, 50);
        });
    }
}); 