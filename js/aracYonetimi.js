import { API_BASE_URL, fetchWrapper } from './api.js';
import { showToast, showModal, hideModal } from './ui.js';

// Araçlar API Fonksiyonları (aracYonetimi.js içine taşındı)
async function fetchAraclar() {
    return fetchWrapper(`${API_BASE_URL}/araclar.php`);
}

async function addArac(aracData) {
    return fetchWrapper(`${API_BASE_URL}/araclar.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aracData),
    });
}

async function updateArac(aracId, aracData) {
    return fetchWrapper(`${API_BASE_URL}/araclar.php?id=${aracId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aracData),
    });
}

async function deleteAracById(aracId) {
    return fetchWrapper(`${API_BASE_URL}/araclar.php?id=${aracId}`, { method: 'DELETE' });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("aracYonetimi.js yüklendi ve DOM hazır.");

    // Gerekli DOM elementleri
    const yeniAracEkleButton = document.getElementById('yeniAracEkleButton');
    const aracFormModal = document.getElementById('aracFormModal');
    const aracForm = document.getElementById('aracForm');
    const aracFormModalBaslik = document.getElementById('aracFormModalBaslik');
    const aracIdInput = document.getElementById('aracIdInput');
    const aracAdiInput = document.getElementById('aracAdiInput');
    const aracYoluInput = document.getElementById('aracYoluInput');
    const aracAciklamaInput = document.getElementById('aracAciklamaInput');
    const aracIconInput = document.getElementById('aracIconInput');
    const aracKaydetButton = document.getElementById('aracKaydetButton');
    const araclarKartContainer = document.getElementById('araclarKartContainer');
    const aracYokMesaji = document.getElementById('aracYokMesaji');
    const aracFormIptalButton = document.getElementById('aracFormIptalButton');
    const modalKapatXButton = aracFormModal ? aracFormModal.querySelector('.modal-kapat-buton') : null;
    
    // Modal kapatma butonları (ui.js'deki genel event listener halletmiyorsa diye)
    // const modalKapatButonlari = aracFormModal.querySelectorAll('.modal-kapat-buton');

    // --- Modal İşlevleri ---
    const openAracModal = (arac = null) => {
        aracForm.reset(); // Formu her açılışta sıfırla
        if (arac && arac.id) {
            aracFormModalBaslik.textContent = 'Aracı Düzenle';
            aracIdInput.value = arac.id;
            aracAdiInput.value = arac.ad || '';
            aracYoluInput.value = arac.yol || '';
            aracAciklamaInput.value = arac.aciklama || '';
            aracIconInput.value = arac.icon || '';
            aracKaydetButton.textContent = 'Güncelle';
        } else {
            aracFormModalBaslik.textContent = 'Yeni Araç Ekle';
            aracIdInput.value = ''; // Yeni araç için ID boş olmalı
            aracKaydetButton.textContent = 'Kaydet';
        }
        showModal('aracFormModal');
    };

    const closeAracModal = () => {
        hideModal('aracFormModal');
        aracForm.reset();
    };

    // --- Araçları Yükleme ve Listeleme ---
    const renderAracKarti = (arac) => {
        const kart = document.createElement('div');
        kart.className = 'arac-karti card';
        kart.style.padding = '15px';
        kart.style.borderRadius = '8px';
        kart.dataset.aracId = arac.id;

        // Kart içeriği (basit haliyle)
        kart.innerHTML = `
            <div class="arac-karti-baslik" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0;">
                    ${arac.icon ? `<span style="margin-right: 8px;">${arac.icon}</span>` : ''}
                    ${arac.ad}
                </h3>
                <div class="arac-karti-actions">
                    <button class="btn-icon btn-edit-arac" title="Düzenle" style="background: none; border: none; cursor: pointer; font-size: 1.2em; margin-left: 5px;">✏️</button>
                    <button class="btn-icon btn-delete-arac" title="Sil" style="background: none; border: none; cursor: pointer; font-size: 1.2em; margin-left: 5px;">🗑️</button>
                </div>
            </div>
            <p class="arac-karti-aciklama" style="font-size: 0.9em; margin-bottom: 15px; min-height: 40px; color: #555;">
                ${arac.aciklama || 'Açıklama bulunmuyor.'}
            </p>
            <a href="${arac.yol}" target="_blank" class="btn btn-secondary" style="text-decoration: none; padding: 8px 12px; border-radius: 5px; display: inline-block;">
                Aracı Aç
            </a>
        `;

        // Düzenle butonu
        kart.querySelector('.btn-edit-arac').addEventListener('click', () => {
            // Önce API'den güncel aracı çekmek daha iyi olabilir, ama şimdilik listedeki ile açalım
            openAracModal(arac);
        });

        // Sil butonu
        kart.querySelector('.btn-delete-arac').addEventListener('click', async () => {
            if (confirm(`'${arac.ad}' adlı aracı silmek istediğinizden emin misiniz?`)) {
                try {
                    await deleteAracById(arac.id);
                    showToast(`'${arac.ad}' başarıyla silindi.`, 'success');
                    loadAndDisplayAraclar(); // Listeyi yenile
                } catch (error) {
                    console.error('Araç silinirken hata:', error);
                    showToast(`Araç silinirken bir hata oluştu: ${error.message}`, 'error');
                }
            }
        });
        return kart;
    };

    const loadAndDisplayAraclar = async () => {
        try {
            const araclar = await fetchAraclar(); // api.js'den gelecek
            araclarKartContainer.innerHTML = ''; // Mevcut kartları temizle

            if (araclar && araclar.length > 0) {
                araclar.forEach(arac => {
                    const aracKarti = renderAracKarti(arac);
                    araclarKartContainer.appendChild(aracKarti);
                });
                aracYokMesaji.style.display = 'none';
                araclarKartContainer.style.display = 'grid'; // veya initial değeri
            } else {
                aracYokMesaji.style.display = 'block';
                araclarKartContainer.style.display = 'none';
            }
        } catch (error) {
            console.error("Araçlar yüklenirken hata oluştu:", error);
            showToast(`Araçlar yüklenirken bir hata oluştu: ${error.message}`, 'error');
            aracYokMesaji.textContent = 'Araçlar yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.';
            aracYokMesaji.style.display = 'block';
            araclarKartContainer.style.display = 'none';
        }
    };

    // --- Form Gönderme İşlevi ---
    aracForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = aracIdInput.value;
        const aracData = {
            ad: aracAdiInput.value.trim(),
            yol: aracYoluInput.value.trim(),
            aciklama: aracAciklamaInput.value.trim(),
            icon: aracIconInput.value.trim()
        };

        if (!aracData.ad || !aracData.yol) {
            showToast('Araç adı ve yolu boş bırakılamaz.', 'error');
            return;
        }

        aracKaydetButton.disabled = true;
        aracKaydetButton.textContent = id ? 'Güncelleniyor...' : 'Kaydediliyor...';

        try {
            if (id) { // Güncelleme
                await updateArac(id, aracData); // api.js'den
                showToast('Araç başarıyla güncellendi.', 'success');
            } else { // Yeni ekleme
                await addArac(aracData); // api.js'den
                showToast('Araç başarıyla eklendi.', 'success');
            }
            closeAracModal();
            loadAndDisplayAraclar(); // Listeyi yenile
        } catch (error) {
            console.error('Araç kaydedilirken hata:', error);
            showToast(`Araç kaydedilirken bir hata oluştu: ${error.message}`, 'error');
        } finally {
            aracKaydetButton.disabled = false;
            aracKaydetButton.textContent = id ? 'Güncelle' : 'Kaydet';
        }
    });


    // --- Başlatma ve Olay Dinleyicileri ---
    const initAracYonetimi = () => {
        console.log("Araç Yönetimi başlatılıyor...");
        
        if (yeniAracEkleButton) {
            yeniAracEkleButton.addEventListener('click', () => openAracModal());
        }

        // Modal kapatma işlevleri için event listener'lar
        if (aracFormIptalButton) {
            aracFormIptalButton.addEventListener('click', () => closeAracModal());
        }

        if (modalKapatXButton) {
            modalKapatXButton.addEventListener('click', () => closeAracModal());
        }

        // ui.js'deki genel modal kapatma dinleyicileri yeterli olabilir.
        // Değilse, burada özel kapatma butonlarına dinleyici eklenebilir:
        // modalKapatButonlari.forEach(button => {
        //    button.addEventListener('click', () => closeAracModal());
        // });

        // Araçlar sekmesi aktif olduğunda araçları yükle
        // Bu, script.js'deki navigasyon mantığına entegre edilebilir
        // Şimdilik, eğer #araclar bölümü görünürse yükleyelim
        // veya direkt sayfa yüklendiğinde eğer kullanıcı bu sekmeyi görebiliyorsa.
        // En basit haliyle, eğer #araclar diye bir link varsa ve bu modül yüklendiyse,
        // bu sekme için bir gösterici olarak kabul edip yükleyebiliriz.
        // Ancak, en doğru yöntem script.js'deki sekmeye tıklama olayını dinlemek olacaktır.
        // Biz şimdilik doğrudan yükleyelim, daha sonra bu optimize edilebilir.
        if (document.getElementById('araclar')) { // Eğer "Araçlar" bölümü DOM'da varsa
             loadAndDisplayAraclar();
        }
    };

    // Ana başlatma fonksiyonunu çağır
    initAracYonetimi();
}); 