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

function ensureCustomCardStyles(araclarKartContainerElement) {
    if (document.getElementById('custom-arac-karti-styles')) {
        return; // Stiller zaten eklenmiş
    }
    const styleSheet = document.createElement("style");
    styleSheet.id = 'custom-arac-karti-styles';
    styleSheet.innerHTML = `
        .arac-karti-container {
            /* Gerekirse grid veya flex ayarları buraya gelebilir */
        }
        .arac-karti-container .card {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #e8e6d8 0%, #f0eee6 50%, #e0ddd0 100%);
            border-radius: 32px;
            padding: 24px 20px;
            position: relative;
            overflow: hidden;
            margin-bottom: 25px;
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12); /* Biraz daha yumuşak gölge */
            min-height: 190px; /* İçeriğe göre esneklik */
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: #4a5d3a; /* Ana metin rengi */
        }

        .arac-karti-container .card .action-buttons-wrapper {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px; /* Butonlar arası boşluk */
            z-index: 10;
        }

        .arac-karti-container .card .action-button {
            background-color: #6b7c5a; /* Örnekteki add-button rengi */
            color: white;
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            cursor: pointer;
            font-size: 16px; /* İkon boyutu */
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            transition: transform 0.2s ease, background-color 0.2s ease;
        }
        .arac-karti-container .card .action-button:hover {
            transform: scale(1.1); /* Biraz daha belirgin hover */
        }
        .arac-karti-container .card .btn-edit-arac:hover { background-color: #5a6b49; }
        .arac-karti-container .card .btn-delete-arac { background-color: #c2706e; } /* Sil butonu için farklı renk */
        .arac-karti-container .card .btn-delete-arac:hover { background-color: #b05f5d; }

        .arac-karti-container .card .card-content-wrapper {
             /* action-buttons-wrapper'ın mutlak konumlandırılması nedeniyle gerekirse üstten padding eklenebilir, ancak genel padding yeterli olmalı */
        }
        
        .arac-karti-container .card .tool-icon { /* Araç ikonu için */
            font-size: 2em; /* Büyük ikon */
            margin-bottom: 12px;
            color: #4a5d3a;
            line-height: 1;
        }

        .arac-karti-container .card .tool-name { /* Araç adı (steps-label gibi) */
            font-size: 20px;
            font-weight: 600;
            color: #4a5d3a;
            margin-bottom: 10px;
            line-height: 1.3;
        }

        .arac-karti-container .card .tool-description { /* Araç açıklaması */
            font-size: 14px;
            color: #5c6b51; /* Ana metinden biraz daha açık */
            line-height: 1.6;
            margin-bottom: 18px;
            flex-grow: 1; /* Açıklamanın kalan alanı doldurmasını sağlar */
        }

        .arac-karti-container .card .card-footer {
            margin-top: auto; /* İçerik kısa olsa bile footer'ı aşağı iter */
        }

        .arac-karti-container .card .btn-open-tool { /* "Aracı Aç" butonu */
            background-color: #6b7c5a; /* Yeşil tonu */
            color: white;
            padding: 10px 20px;
            border-radius: 20px; /* Daha yuvarlak */
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            display: inline-block;
            box-shadow: 0 3px 8px rgba(0,0,0,0.1);
            transition: background-color 0.25s ease, transform 0.2s ease;
            border: none;
        }
        .arac-karti-container .card .btn-open-tool:hover {
            background-color: #5a6b49;
            transform: translateY(-2px) scale(1.02);
        }

        .arac-karti-container .card .decorative-dots {
            position: absolute;
            bottom: 18px;
            right: 22px;
            display: flex;
            gap: 7px;
        }
        .arac-karti-container .card .dot {
            width: 7px;
            height: 7px;
            background-color: #a8b89a; /* Nokta rengi */
            border-radius: 50%;
            opacity: 0.5;
        }
    `;
    document.head.appendChild(styleSheet);

    if (araclarKartContainerElement && !araclarKartContainerElement.classList.contains('arac-karti-container')) {
        araclarKartContainerElement.classList.add('arac-karti-container');
    }
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
    const FILE_BROWSER_BASE_PATH = 'tools/'; 

    // ÖZEL KART STİLLERİNİ EKLE
    if(araclarKartContainer) { // Sadece araçlar bölümü varsa stilleri yükle
        ensureCustomCardStyles(araclarKartContainer);
    }


    // --- Dosya Tarayıcı İşlevleri ---
    const openFileBrowserModal = () => {
        selectedFilePathInput.value = ''; 
        fileBrowserSelectButton.disabled = true;
        loadDirectoryContents(); 
        showModal('fileBrowserModal');
    };

    const closeFileBrowserModal = () => {
        hideModal('fileBrowserModal');
    };

    const loadDirectoryContents = async (path = '') => {
        currentDirectory = path;
        currentFilePathDisplay.textContent = FILE_BROWSER_BASE_PATH + (path ? path + '/' : '');
        fileListContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="sr-only">Yükleniyor...</span></div></div>'; 
        fileBrowserUpButton.disabled = !path; 

        try {
            const response = await fetchWrapper(`${API_BASE_URL}/list_files.php?path=${encodeURIComponent(path)}`);
            fileListContainer.innerHTML = ''; 

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
                    listItem.dataset.path = item.path; 

                    if (item.type === 'directory') {
                        listItem.innerHTML = `📁 ${item.name}`;
                        listItem.addEventListener('click', () => loadDirectoryContents(item.path));
                    } else {
                        listItem.innerHTML = `📄 ${item.name}`;
                        listItem.addEventListener('click', () => {
                            const currentlyActive = fileListContainer.querySelector('.active');
                            if (currentlyActive) {
                                currentlyActive.classList.remove('active');
                            }
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
                parts.pop(); 
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
        aracForm.reset(); 
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
            aracIdInput.value = ''; 
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
        // Ana sınıfı .card olarak ayarlıyoruz, stiller enjekte edilen CSS'den gelecek.
        kart.className = 'card'; 
        kart.dataset.aracId = arac.id;

        kart.innerHTML = `
            <div class="action-buttons-wrapper">
                <button class="btn-edit-arac action-button" title="Düzenle">✏️</button>
                <button class="btn-delete-arac action-button" title="Sil">🗑️</button>
            </div>

            <div class="card-content-wrapper">
                ${arac.icon ? `<div class="tool-icon">${arac.icon}</div>` : '<div class="tool-icon" style="height: 1em;"></div>'}
                <div class="tool-name">${arac.ad}</div>
                <p class="tool-description">${arac.aciklama || 'Açıklama bulunmuyor.'}</p>
            </div>
            
            <div class="card-footer">
                <a href="${arac.yol}" target="_blank" class="btn-open-tool">Aracı Görüntüle</a>
            </div>

            <div class="decorative-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;

        // Düzenle butonu
        const editButton = kart.querySelector('.btn-edit-arac');
        if (editButton) {
            editButton.addEventListener('click', () => {
                openAracModal(arac);
            });
        }

        // Sil butonu
        const deleteButton = kart.querySelector('.btn-delete-arac');
        if (deleteButton) {
            deleteButton.addEventListener('click', async () => {
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
        }
        return kart;
    };

    const loadAndDisplayAraclar = async () => {
        try {
            const response = await fetchAraclar(); 
            if (!araclarKartContainer) return; // Eğer container yoksa işlem yapma
            araclarKartContainer.innerHTML = ''; 

            if (response && response.success && response.data && response.data.length > 0) {
                const araclarList = response.data; 
                araclarList.forEach(arac => {
                    const aracKarti = renderAracKarti(arac);
                    araclarKartContainer.appendChild(aracKarti);
                });
                if (aracYokMesaji) aracYokMesaji.style.display = 'none';
                araclarKartContainer.style.display = 'grid'; // veya flex, initial değeri neyse
            } else {
                if (aracYokMesaji) aracYokMesaji.style.display = 'block';
                araclarKartContainer.style.display = 'none';
                if (response && !response.success) {
                    if (aracYokMesaji) aracYokMesaji.textContent = `Araçlar yüklenemedi: ${response.message || 'Bilinmeyen bir API hatası oluştu.'}`;
                } else if (!response || !response.data || response.data.length === 0) {
                    if (aracYokMesaji) aracYokMesaji.textContent = 'Gösterilecek araç bulunmamaktadır.';
                }
            }
        } catch (error) {
            console.error("Araçlar yüklenirken hata oluştu:", error);
            if (aracYokMesaji) {
                aracYokMesaji.textContent = 'Araçlar yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.';
                aracYokMesaji.style.display = 'block';
            }
            if (araclarKartContainer) araclarKartContainer.style.display = 'none';
            showToast(`Araçlar yüklenirken bir hata oluştu: ${error.message}`, 'error');
        }
    };

    // --- Form Gönderme İşlevi ---
    if(aracForm) {
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
                if (id) { 
                    await updateArac(id, aracData); 
                    showToast('Araç başarıyla güncellendi.', 'success');
                } else { 
                    await addArac(aracData); 
                    showToast('Araç başarıyla eklendi.', 'success');
                }
                closeAracModal();
                loadAndDisplayAraclar(); 
            } catch (error) {
                console.error('Araç kaydedilirken hata:', error);
                showToast(`Araç kaydedilirken bir hata oluştu: ${error.message}`, 'error');
            } finally {
                aracKaydetButton.disabled = false;
                aracKaydetButton.textContent = id ? 'Güncelle' : 'Kaydet';
            }
        });
    }


    // --- Başlatma ve Olay Dinleyicileri ---
    const initAracYonetimi = () => {
        console.log("Araç Yönetimi başlatılıyor...");
        
        if (yeniAracEkleButton) {
            yeniAracEkleButton.addEventListener('click', () => openAracModal());
        }

        if (aracYoluGozatButton) {
            aracYoluGozatButton.addEventListener('click', () => openFileBrowserModal());
        }

        if (fileBrowserModalCloseX) {
            fileBrowserModalCloseX.addEventListener('click', () => closeFileBrowserModal());
        }
        if (fileBrowserModalKapatButton) {
            fileBrowserModalKapatButton.addEventListener('click', () => closeFileBrowserModal());
        }

        if (aracFormIptalButton) {
            aracFormIptalButton.addEventListener('click', () => closeAracModal());
        }

        if (modalKapatXButton) {
            modalKapatXButton.addEventListener('click', () => closeAracModal());
        }
        
        if (document.getElementById('araclar')) { 
             loadAndDisplayAraclar();
        }
    };

    // Ana başlatma fonksiyonunu çağır
    initAracYonetimi();
}); 