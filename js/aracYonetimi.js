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
            /* Grid ayarları burada kalabilir veya ihtiyaca göre düzenlenebilir */
        }
        .arac-karti-container .card {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            /* Varsayılan gradyan arka plan, resim olmadığında kullanılır */
            background: linear-gradient(135deg, #e8e6d8 0%, #f0eee6 50%, #e0ddd0 100%);
            background-size: cover; /* Arka plan resminin kartı kaplaması için */
            background-position: center; /* Resmin ortalanması için */
            border-radius: 32px;
            padding: 24px 20px;
            position: relative;
            overflow: hidden;
            margin-bottom: 25px;
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
            min-height: 200px; /* İçerik ve resme göre ayarlanabilir */
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: #4a5d3a;
            transition: box-shadow 0.3s ease; /* Hover için yumuşak geçiş */
        }
        .arac-karti-container .card:hover {
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.15); /* Hover'da gölgeyi artır */
        }

        /* Resim olduğunda yazının okunabilirliği için overlay */
        .arac-karti-container .card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.5) 100%); /* Okunabilirlik için hafif overlay */
            opacity: 0; /* Başlangıçta gizli */
            transition: opacity 0.3s ease;
            z-index: 1; /* İçeriğin altında, resmin üstünde */
            border-radius: 32px; /* Ana kartın border-radius'unu alır */
        }
        .arac-karti-container .card.has-background-image::before {
            opacity: 1; /* Resim varsa overlay'i göster */
        }
        .arac-karti-container .card.has-background-image * {
            position: relative; /* İçeriğin overlay üzerinde kalması için */
            z-index: 2;
            color: #ffffff; /* Resim varken metin rengi beyaz */
        }
         .arac-karti-container .card.has-background-image .tool-description {
            color: #f0f0f0; /* Resim varken açıklama rengi biraz daha sönük beyaz */
        }
        .arac-karti-container .card.has-background-image .btn-open-tool {
            background-color: rgba(255,255,255,0.2); /* Resim varken buton arka planı */
            border: 1px solid rgba(255,255,255,0.7);
            color: white;
        }
        .arac-karti-container .card.has-background-image .btn-open-tool:hover {
            background-color: rgba(255,255,255,0.35);
        }
        .arac-karti-container .card.has-background-image .action-button {
            background-color: rgba(0,0,0,0.3); /* Resim varken düzenle/sil butonları */
            color: white;
        }
        .arac-karti-container .card.has-background-image .action-button:hover {
            background-color: rgba(0,0,0,0.5);
        }
         .arac-karti-container .card.has-background-image .dot {
            background-color: rgba(255,255,255,0.5); /* Resim varken noktaların rengi */
        }

        .arac-karti-container .card .action-buttons-wrapper {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 10; /* Diğer stillerden daha üstte */
        }

        .arac-karti-container .card .action-button {
            background-color: #6b7c5a;
            color: white;
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            transition: transform 0.2s ease, background-color 0.2s ease;
        }
        .arac-karti-container .card .action-button:hover {
            transform: scale(1.1);
        }
        .arac-karti-container .card .btn-edit-arac:hover { background-color: #5a6b49; }
        .arac-karti-container .card .btn-delete-arac { background-color: #c2706e; }
        .arac-karti-container .card .btn-delete-arac:hover { background-color: #b05f5d; }

        .arac-karti-container .card .card-content-wrapper {
            /* İhtiyaç duyulursa ek stiller */
            flex-grow: 1; /* İçeriğin dikeyde ortalanmasına yardımcı olur */
            display: flex;
            flex-direction: column;
        }
        
        .arac-karti-container .card .tool-icon-text { /* Metin tabanlı ikon için (resim yoksa) */
            font-size: 2em;
            margin-bottom: 12px;
            color: #4a5d3a; /* Stil .has-background-image altında ezilecek */
            line-height: 1;
        }

        .arac-karti-container .card .tool-name {
            font-size: 20px;
            font-weight: 600;
            color: #4a5d3a; /* Stil .has-background-image altında ezilecek */
            margin-bottom: 10px;
            line-height: 1.3;
        }

        .arac-karti-container .card .tool-description {
            font-size: 14px;
            color: #5c6b51; /* Stil .has-background-image altında ezilecek */
            line-height: 1.6;
            margin-bottom: 18px;
            flex-grow: 1;
        }

        .arac-karti-container .card .card-footer {
            margin-top: auto; /* Footer'ı aşağıya iter */
        }

        .arac-karti-container .card .btn-open-tool {
            background-color: #6b7c5a;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
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
            z-index: 5; /* Diğer butonlardan geride olabilir */
        }
        .arac-karti-container .card .dot {
            width: 7px;
            height: 7px;
            background-color: #a8b89a; /* Stil .has-background-image altında ezilecek */
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

    // Yeni: Resim yolu için gözat butonu
    const aracResimGozatButton = document.getElementById('aracResimGozatButton');

    let currentDirectory = ''; // Dosya tarayıcısının o an bulunduğu dizin
    const FILE_BROWSER_ROOT_PATH = 'tools/'; // Ana tarama kök dizini
    let fileBrowserActiveBasePath = 'images/'; // Varsayılan olarak images altındayız
    const ALLOWED_IMAGE_EXTENSIONS = [/'.jpg$/i, /'.jpeg$/i, /'.png$/i, /'.gif$/i, /'.svg$/i, /'.webp$/i];

    // ÖZEL KART STİLLERİNİ EKLE
    if(araclarKartContainer) { // Sadece araçlar bölümü varsa stilleri yükle
        ensureCustomCardStyles(araclarKartContainer);
    }


    // --- Dosya Tarayıcı İşlevleri ---
    const openFileBrowserModal = (targetInputId) => {
        selectedFilePathInput.value = ''; 
        fileBrowserSelectButton.disabled = true;
        // Hedef input'a göre başlangıç klasörünü ve filtreleri ayarla
        if (targetInputId === 'aracIconInput') { // aracIconInput artık resim yolu için
            fileBrowserActiveBasePath = 'images/'; // Sonunda bir adet / olmalı
            // Resim filtreleri zaten loadDirectoryContents içinde uygulanıyor.
        } else if (targetInputId === 'aracYoluInput') {
            fileBrowserActiveBasePath = ''; // tools/ klasörünün kökünü göster
             // HTML/JS dosyalarını filtrelemek için bir extension listesi eklenebilir
        }
        loadDirectoryContents(fileBrowserActiveBasePath, targetInputId);
        showModal('fileBrowserModal');
        // Dosya tarayıcısının hangi input için açıldığını kaydet
        fileBrowserModal.dataset.targetInput = targetInputId;
    };

    const closeFileBrowserModal = () => {
        hideModal('fileBrowserModal');
    };

    const loadDirectoryContents = async (relativePathFromTools = '', targetInputId) => {
        // relativePathFromTools, FILE_BROWSER_ROOT_PATH ('tools/') altına eklenen yoldur.
        currentDirectory = relativePathFromTools;
        currentFilePathDisplay.textContent = FILE_BROWSER_ROOT_PATH + (currentDirectory ? currentDirectory : ''); // tools/images/ gibi gösterilecek
        fileListContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="sr-only">Yükleniyor...</span></div></div>'; 
        
        const isRootOfTools = !relativePathFromTools;
        const isRootOfImages = relativePathFromTools === 'images' || relativePathFromTools === 'images/';

        if (targetInputId === 'aracIconInput') { // Resim yolu için açıldıysa
            fileBrowserUpButton.disabled = isRootOfImages;
        } else if (targetInputId === 'aracYoluInput') { // Araç yolu/URL için açıldıysa
            fileBrowserUpButton.disabled = isRootOfTools;
        }

        try {
            const apiPath = currentDirectory; 
            const response = await fetchWrapper(`${API_BASE_URL}/list_files.php?path=${encodeURIComponent(apiPath)}`); // apiPath 'images/' olmalı
            fileListContainer.innerHTML = ''; 

            if (response.success && response.data) {
                let filteredData = response.data;
                if (targetInputId === 'aracIconInput') {
                    filteredData = response.data.filter(item => {
                        if (item.type === 'directory') {
                            return item.path.startsWith('images');
                        }
                        return ALLOWED_IMAGE_EXTENSIONS.some(ext => ext.test(item.name));
                    });
                } else if (targetInputId === 'aracYoluInput') {
                     // Araç yolu için filtreleme (örneğin sadece .html, .php veya klasörler)
                     // Şimdilik tüm dosya ve klasörleri gösteriyor, gerekirse filtrelenebilir.
                }

                if (filteredData.length === 0) {
                    let message = 'Bu klasör boş.';
                    if (targetInputId === 'aracIconInput') message = 'Bu klasörde uygun resim dosyası bulunmuyor.';
                    else if (targetInputId === 'aracYoluInput') message = 'Bu klasörde dosya bulunmuyor.';
                    fileListContainer.innerHTML = `<li class="list-group-item text-muted">${message}</li>`;
                }
                filteredData.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item list-group-item-action';
                    listItem.style.cursor = 'pointer';
                    listItem.textContent = item.name;
                    listItem.dataset.type = item.type;
                    listItem.dataset.path = item.path; 

                    if (item.type === 'directory') {
                        listItem.innerHTML = `📁 ${item.name}`;
                        listItem.addEventListener('click', () => loadDirectoryContents(item.path, targetInputId)); 
                    } else {
                        // İkonu dosya tipine göre ayarla (resim veya genel dosya)
                        let fileIcon = '📄';
                        if (targetInputId === 'aracIconInput' && ALLOWED_IMAGE_EXTENSIONS.some(ext => ext.test(item.name))) {
                            fileIcon = '🖼️';
                        }
                        listItem.innerHTML = `${fileIcon} ${item.name}`;
                        listItem.addEventListener('click', () => {
                            const currentlyActive = fileListContainer.querySelector('.active');
                            if (currentlyActive) {
                                currentlyActive.classList.remove('active');
                            }
                            listItem.classList.add('active');
                            selectedFilePathInput.value = FILE_BROWSER_ROOT_PATH + item.path;
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
                // Hangi input için dosya seçildiğini belirle
                const targetInputId = fileBrowserModal.dataset.targetInput;
                const targetInputElement = document.getElementById(targetInputId);
                if (targetInputElement) {
                    targetInputElement.value = selectedFilePathInput.value;
                }
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
            aracIconInput.value = arac.resimyolu || '';
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
        kart.className = 'card'; 
        kart.dataset.aracId = arac.id;

        // Arka plan resmi varsa ayarla ve özel sınıf ekle
        if (arac.resimyolu && arac.resimyolu.trim() !== '') {
            kart.style.backgroundImage = `url('../${arac.resimyolu}')`; // resimyolu 'tools/images/foo.png' gibi olmalı, bu yüzden ../ ekliyoruz
            kart.classList.add('has-background-image');
        } else {
            // Resim yoksa, varsayılan gradyan CSS üzerinden zaten uygulanıyor.
            // Eğer metin tabanlı bir ikon (eski sistemden kalan) varsa onu gösterelim
            // Bu kısım şimdilik yoruma alınıyor, çünkü API'den artık icon değil resimyolu geliyor.
            // if (arac.eski_icon_verisi) { 
            //    defaultIconHTML = `<div class="tool-icon-text">${arac.eski_icon_verisi}</div>`; 
            // }
        }

        let defaultIconHTML = '<div class="tool-icon-text" style="height: 2em;"></div>'; // Resim yoksa ve metin ikonu da yoksa boşluk bırakır
        // Eğer API'den gelen `arac` nesnesinde `icon` diye bir alan varsa ve bu resim yolu değilse (örn. emoji ise) onu kullanabiliriz.
        // Şimdilik API sadece `resimyolu` döndürecek şekilde ayarlandı.
        // Eğer resim varsa, bu tool-icon-text div'i görünmeyecek (CSS ile .has-background-image altında gizlenebilir ya da hiç eklenmeyebilir)
        // Ancak, resim yoksa ve metin bazlı ikon da yoksa bir boşluk bırakmak için bu div'i kullanabiliriz.
        // `arac.icon` artık `arac.resimyolu` olduğu için, metin ikonu için farklı bir alan adı gerekebilir ya da bu mantık kaldırılabilir.
        // Şimdiki tasarımda metin ikonu, resim olmadığında CSS ile belirlenen renkte gösterilecek.

        kart.innerHTML = `
            <div class="action-buttons-wrapper">
                <button class="btn-edit-arac action-button" title="Düzenle">✏️</button>
                <button class="btn-delete-arac action-button" title="Sil">🗑️</button>
            </div>

            <div class="card-content-wrapper">
                ${!kart.classList.contains('has-background-image') ? defaultIconHTML : ''}
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

        const editButton = kart.querySelector('.btn-edit-arac');
        if (editButton) {
            editButton.addEventListener('click', () => {
                openAracModal(arac);
            });
        }

        const deleteButton = kart.querySelector('.btn-delete-arac');
        if (deleteButton) {
            deleteButton.addEventListener('click', async () => {
                if (confirm(`'${arac.ad}' adlı aracı silmek istediğinizden emin misiniz?`)) {
                    try {
                        await deleteAracById(arac.id);
                        showToast(`'${arac.ad}' başarıyla silindi.`, 'success');
                        loadAndDisplayAraclar();
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
                resimyolu: aracIconInput.value.trim()
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

        // "Araç Yolu" alanı yanındaki "Gözat..." butonu
        if (aracYoluGozatButton) {
            aracYoluGozatButton.addEventListener('click', () => openFileBrowserModal('aracYoluInput'));
        }
        // Yeni: "Arka Plan Resmi" alanı yanındaki "Gözat..." butonu
        if (aracResimGozatButton) {
            aracResimGozatButton.addEventListener('click', () => openFileBrowserModal('aracIconInput'));
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