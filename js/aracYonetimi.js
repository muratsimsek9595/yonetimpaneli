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
    
    // Dosya Tarayıcı Modal Elementleri
    const aracYoluGozatButton = document.getElementById('aracYoluGozatButton');
    const fileBrowserModal = document.getElementById('fileBrowserModal');
    const fileBrowserModalCloseX = document.getElementById('fileBrowserModalCloseX');
    const fileBrowserModalKapatButton = document.getElementById('fileBrowserModalKapatButton');
    const fileBrowserSelectButton = document.getElementById('fileBrowserSelectButton');
    const fileListContainer = document.getElementById('fileListContainer');
    const currentFilePathDisplay = document.getElementById('currentFilePathDisplay');
    const selectedFilePathInput = document.getElementById('selectedFilePathInput');
    const fileBrowserUpButton = document.getElementById('fileBrowserUpButton');

    let currentDirectory = ''; // Dosya tarayıcısının o an bulunduğu dizin
    const FILE_BROWSER_BASE_PATH = 'tools/'; // Sunucuda taranacak ana klasör. API script'i de bunu dikkate almalı.

    // --- Dosya Tarayıcı İşlevleri ---
    const openFileBrowserModal = () => {
        selectedFilePathInput.value = ''; // Her açılışta seçili dosya alanını temizle
        fileBrowserSelectButton.disabled = true;
        loadDirectoryContents(); // Kök dizini yükle
        showModal('fileBrowserModal');
    };

    const closeFileBrowserModal = () => {
        hideModal('fileBrowserModal');
    };

    const loadDirectoryContents = async (path = '') => {
        currentDirectory = path;
        currentFilePathDisplay.textContent = FILE_BROWSER_BASE_PATH + (path ? path + '/' : '');
        fileListContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="sr-only">Yükleniyor...</span></div></div>'; // Yükleniyor göstergesi
        fileBrowserUpButton.disabled = !path; // Kök dizindeyken yukarı gitme butonu pasif

        try {
            // API_BASE_URL burada tanımlı olmalı veya doğrudan URL yazılmalı
            const response = await fetchWrapper(`${API_BASE_URL}/list_files.php?path=${encodeURIComponent(path)}`);
            fileListContainer.innerHTML = ''; // Temizle

            if (response.success && response.data) {
                if (response.data.length === 0) {
                    fileListContainer.innerHTML = '<li class="list-group-item text-muted">Bu klasör boş.</li>';
                }
                response.data.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item list-group-item-action';
                    listItem.style.cursor = 'pointer';
                    listItem.textContent = item.name;
                    listItem.dataset.type = item.type;
                    listItem.dataset.path = item.path; // Tam yolu (base path hariç)

                    if (item.type === 'directory') {
                        listItem.innerHTML = `📁 ${item.name}`;
                        listItem.addEventListener('click', () => loadDirectoryContents(item.path));
                    } else {
                        listItem.innerHTML = `📄 ${item.name}`;
                        listItem.addEventListener('click', () => {
                            // Önceki seçili elemandan active sınıfını kaldır
                            const currentlyActive = fileListContainer.querySelector('.active');
                            if (currentlyActive) {
                                currentlyActive.classList.remove('active');
                            }
                            // Tıklanan elemana active sınıfını ekle
                            listItem.classList.add('active');
                            selectedFilePathInput.value = FILE_BROWSER_BASE_PATH + item.path;
                            fileBrowserSelectButton.disabled = false;
                        });
                    }
                    fileListContainer.appendChild(listItem);
                });
            } else {
                fileListContainer.innerHTML = `<li class="list-group-item list-group-item-danger">Dosyalar yüklenemedi: ${response.message || 'Bilinmeyen hata'}</li>`;
            }
        } catch (error) {
            console.error("Dosya listesi yüklenirken hata:", error);
            fileListContainer.innerHTML = `<li class="list-group-item list-group-item-danger">Dosyalar yüklenirken bir hata oluştu: ${error.message}</li>`;
            showToast('Dosya listesi yüklenirken bir hata oluştu.', 'error');
        }
    };

    if (fileBrowserUpButton) {
        fileBrowserUpButton.addEventListener('click', () => {
            if (currentDirectory) {
                const parts = currentDirectory.split('/').filter(p => p);
                parts.pop(); // Son kısmı çıkar
                loadDirectoryContents(parts.join('/'));
            }
        });
    }

    if (fileBrowserSelectButton) {
        fileBrowserSelectButton.addEventListener('click', () => {
            if (selectedFilePathInput.value) {
                aracYoluInput.value = selectedFilePathInput.value;
                closeFileBrowserModal();
            }
        });
    }

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
        kart.className = 'arac-karti card shadow-sm'; // Bootstrap card ve hafif gölge
        kart.style.borderRadius = '12px'; // Daha yuvarlak köşeler
        kart.style.marginBottom = '20px'; // Kartlar arası boşluk
        kart.style.backgroundColor = '#f8f9fa'; // Açık gri bir arka plan, görsele benzer
        kart.style.overflow = 'hidden'; // İçerik taşmasını engelle
        kart.dataset.aracId = arac.id;

        kart.innerHTML = `
            <div class="card-body" style="padding: 20px;">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="arac-baslik d-flex align-items-center">
                        ${arac.icon ? `<span class="arac-icon" style="font-size: 1.8em; margin-right: 12px; color: #007bff;">${arac.icon}</span>` : '<span class="arac-icon-placeholder" style="width: 2em; height: 1.8em; margin-right: 12px; display: inline-block;"></span>'}
                        <h5 class="card-title mb-0" style="font-size: 1.25rem; font-weight: 500;">${arac.ad}</h5>
                    </div>
                    <div class="arac-karti-actions">
                        <button class="btn btn-sm btn-outline-primary btn-edit-arac" title="Düzenle" style="margin-left: 5px; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">✏️</button>
                        <button class="btn btn-sm btn-outline-danger btn-delete-arac" title="Sil" style="margin-left: 5px; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">🗑️</button>
                    </div>
                </div>
                <p class="card-text arac-karti-aciklama" style="font-size: 0.95em; color: #6c757d; min-height: 40px; margin-bottom: 20px;">
                    ${arac.aciklama || 'Açıklama bulunmuyor.'}
                </p>
                <a href="${arac.yol}" target="_blank" class="btn btn-primary" style="text-decoration: none; padding: 10px 15px; border-radius: 8px; font-size: 0.9em; display: inline-block;">
                    <i class="fas fa-external-link-alt" style="margin-right: 5px;"></i> Aracı Aç
                </a>
            </div>
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
            const response = await fetchAraclar(); // Renamed for clarity
            araclarKartContainer.innerHTML = ''; // Mevcut kartları temizle

            if (response && response.success && response.data && response.data.length > 0) {
                const araclarList = response.data; // Extract the array of tools
                araclarList.forEach(arac => {
                    const aracKarti = renderAracKarti(arac);
                    araclarKartContainer.appendChild(aracKarti);
                });
                aracYokMesaji.style.display = 'none';
                araclarKartContainer.style.display = 'grid'; // veya initial değeri
            } else {
                aracYokMesaji.style.display = 'block';
                araclarKartContainer.style.display = 'none';
                // Optional: Display a more specific message if response.success is false
                if (response && !response.success) {
                    aracYokMesaji.textContent = `Araçlar yüklenemedi: ${response.message || 'Bilinmeyen bir API hatası oluştu.'}`;
                } else if (!response || !response.data || response.data.length === 0) {
                    aracYokMesaji.textContent = 'Gösterilecek araç bulunmamaktadır.';
                }
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

        // "Araç Yolu" alanı yanındaki "Gözat..." butonu
        if (aracYoluGozatButton) {
            aracYoluGozatButton.addEventListener('click', () => openFileBrowserModal());
        }

        // Dosya Tarayıcı Modal kapatma butonları
        if (fileBrowserModalCloseX) {
            fileBrowserModalCloseX.addEventListener('click', () => closeFileBrowserModal());
        }
        if (fileBrowserModalKapatButton) {
            fileBrowserModalKapatButton.addEventListener('click', () => closeFileBrowserModal());
        }

        // Modal kapatma işlevleri için event listener'lar
        if (aracFormIptalButton) {
            aracFormIptalButton.addEventListener('click', () => closeAracModal());
        }

        if (modalKapatXButton) {
            modalKapatXButton.addEventListener('click', () => closeAracModal());
        }

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