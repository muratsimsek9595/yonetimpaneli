import {
    getMalzemeler as fetchMalzemeler,
    saveMalzeme as saveMalzemeAPI,
    deleteMalzeme as deleteMalzemeAPI,
    getTedarikciler as fetchTedarikciler,
    saveTedarikci as saveTedarikciAPI,
    deleteTedarikci as deleteTedarikciAPI,
    getFiyatlar as fetchFiyatlar,
    saveFiyat as saveFiyatAPI,
    deleteFiyat as deleteFiyatAPI,
    getTeklifler as fetchTekliflerAPI,
    getMusteriler as getMusterilerAPI,
    fetchIsciler,
    addIsciAPI,
    updateIsciAPI,
    deleteIsciAPI
} from './api.js';
import {
    subscribe,
    getUrunler,
    setUrunler,
    removeUrunById,
    getUrunById,
    getTedarikciler,
    setTedarikciler,
    removeTedarikciById,
    getTedarikciById,
    getFiyatlar,
    setFiyatlar,
    saveFiyatStore,
    removeFiyatById,
    getTeklifler,
    setTeklifler,
    getMusteriler,
    setMusteriler,
    getIsciler,
    setIsciler,
    addIsci,
    updateIsci,
    removeIsciById as removeIsciFromStore,
    getIsciById
} from './store.js';
import {
    temizleUrunFormu,
    temizleTedarikciFormu,
    gosterSonFiyatlarTablosu,
    guncelleUrunListesiTablosu,
    populeEtUrunSecimDropdown,
    guncelleTedarikciListesiTablosu,
    populeEtTedarikciSecimDropdown as populeTedarikciDropdown,
    showToast,
    setButtonLoading,
    resetButtonLoading,
    doldurUrunFormu,
    doldurTedarikciFormu,
    guncelleIscilerTablosu,
    doldurIsciFormu,
    temizleIsciFormu,
    populeEtIsciSecimDropdown
} from './ui.js';
import {
    cizVeyaGuncelleFiyatGrafigi
} from './grafik.js';
import { globalHataYakala } from './hataYonetimi.js';
import { initTeklifYonetimi } from './teklifYonetimi.js?v=1.0';
import { initTeklifListeleme } from './teklifListeleme.js';
import { initMusteriYonetimi } from './musteriYonetimi.js';
import { initMusteriListeleme } from './musteriListeleme.js';
import { initIsciYonetimi } from './isciYonetimi.js';

// Genel JavaScript fonksiyonları ve olay dinleyicileri buraya gelecek.
// Chart.js DataLabels eklentisini global olarak kaydet
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
} else {
    console.error('ChartDataLabels eklentisi yüklenemedi!');
}

// Durum değişkenleri, hangi init fonksiyonlarının çağrıldığını takip etmek için
let isTeklifYonetimiInitialized = false;
let isTeklifListelemeInitialized = false;
let isMusteriYonetimiInitialized = false;
let isMusteriListelemeInitialized = false;
let isIsciYonetimiInitialized = false;
// Diğer modüller için ayrı ayrı de benzer flag'ler eklenebilir

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.sidebar nav a'); // Tüm linkleri alır (hem ana hem alt menü)
    const sections = document.querySelectorAll('.main-content section');
    const quickActionButtons = document.querySelectorAll('.quick-action-button');
    const menuToggles = document.querySelectorAll('.sidebar .menu-toggle'); // Sadece alt menü açma/kapama linkleri

    // Alt menü açma/kapama işlevselliği
    menuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            event.preventDefault();
            const parentLi = this.parentElement; // .has-submenu olan li elementi
            parentLi.classList.toggle('active-group');
        });
    });

    function updateActiveMenu(targetId) {
        // Tüm active ve active-group sınıflarını temizle
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        document.querySelectorAll('.sidebar .has-submenu').forEach(li => li.classList.remove('active-group'));

        // Hedef ID'ye sahip linki bul ve active yap
        const activeLink = document.querySelector(`.sidebar nav a[href="#${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            
            // Eğer aktif link bir alt menü içindeyse, üst menü grubunu da active-group yap
            const parentSubmenu = activeLink.closest('ul.submenu');
            if (parentSubmenu) {
                const parentLiHasSubmenu = parentSubmenu.closest('li.has-submenu');
                if (parentLiHasSubmenu) {
                    parentLiHasSubmenu.classList.add('active-group');
                }
            }
        } else {
            // Eğer doğrudan link bulunamazsa (örn: ana grup linki), # anasayfa için kontrol edilebilir
            // Veya bir alt menünün ilk elemanını aktif yapabiliriz, bu senaryoya göre değişir.
            // Şimdilik, doğrudan link bulunamazsa sadece bölüm gösterilir, menüde özel bir aktiflik olmaz.
        }
    }

    function showSection(targetId) {
        let sectionFound = false;
        sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active-section');
                section.style.display = '';
                sectionFound = true;
            } else {
                section.classList.remove('active-section');
                section.style.display = 'none';
            }
        });

        // Eğer hedef ID'ye ait bir section yoksa, anasayfayı göster
        if (!sectionFound && document.getElementById('anasayfa')) {
            targetId = 'anasayfa'; // Hedef anasayfa olarak güncellenir
            document.getElementById('anasayfa').classList.add('active-section');
            document.getElementById('anasayfa').style.display = '';
             sections.forEach(s => { // Diğer tüm sectionları gizle
                if(s.id !== 'anasayfa') {
                    s.classList.remove('active-section');
                    s.style.display = 'none';
                }
            });
        }

        updateActiveMenu(targetId); // Aktif menü durumunu güncelle

        // İlgili bölüm için init fonksiyonunu çağır (sadece bir kere)
        if (targetId === 'teklif-yonetimi' && !isTeklifYonetimiInitialized) {
            initTeklifYonetimi();
            isTeklifYonetimiInitialized = true;
        } else if (targetId === 'teklifler' && !isTeklifListelemeInitialized) {
            initTeklifListeleme();
            isTeklifListelemeInitialized = true;
        } else if (targetId === 'musteri-yonetimi' && !isMusteriYonetimiInitialized) {
            initMusteriYonetimi();
            isMusteriYonetimiInitialized = true;
        } else if (targetId === 'musteriler' && !isMusteriListelemeInitialized) {
            initMusteriListeleme();
            isMusteriListelemeInitialized = true;
        } else if (targetId === 'isciler' && !isIsciYonetimiInitialized) {
            initIsciYonetimi();
            isIsciYonetimiInitialized = true;
        }
        // Diğer bölümler için de benzer else if blokları eklenebilir
    }

    let initialTargetId = 'anasayfa';
    if (window.location.hash) {
        const hashId = window.location.hash.substring(1);
        if (document.getElementById(hashId) && document.querySelector(`.sidebar nav a[href="#${hashId}"]`)) { // Linkin varlığını da kontrol et
            initialTargetId = hashId;
        } else {
            console.warn("URL hash'inde belirtilen bölüm veya menü linki bulunamadı: #", hashId, "Anasayfaya yönlendiriliyor.");
            window.location.hash = 'anasayfa'; // Geçersiz hash ise anasayfaya yönlendir.
        }
    } else if (sections.length > 0 && !document.getElementById(initialTargetId)) {
        // initialTargetId 'anasayfa' ve anasayfa bölümü yoksa ilk bölümü hedefle (bu senaryo nadir)
        const firstVisibleSection = Array.from(sections).find(s => document.querySelector(`.sidebar nav a[href="#${s.id}"]`));
        if (firstVisibleSection) initialTargetId = firstVisibleSection.id;
        else if (sections.length > 0) initialTargetId = sections[0].id; // Fallback
    }
    
    sections.forEach(s => {
        s.style.display = 'none'; // Başlangıçta tüm sectionları gizle
    });
    
    // `showSection` çağrısı, initialTargetId'ye göre hem bölümü gösterir hem de menüyü günceller.
    showSection(initialTargetId);

    // Navigasyon linklerine tıklama olayları (hem ana hem alt menü)
    navLinks.forEach(link => {
        // menu-toggle linkleri kendi tıklama işleyicisine sahip, burada tekrar ele alma
        if (!link.classList.contains('menu-toggle')) {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                showSection(targetId);
                window.location.hash = targetId; // URL hash'ini güncelle
            });
        }
    });

    quickActionButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            window.location.hash = targetId; // URL hash'ini güncelle
            // Hızlı işlem butonları için menüde aktifliği de ayarlayabiliriz, 
            // `updateActiveMenu(targetId);` zaten showSection içinde çağrılıyor.
        });
    });

    // DOM Element Tanımlamaları
    const urunForm = document.getElementById('urunForm');
    const urunIdInput = document.getElementById('urunId');
    const urunAdiInput = document.getElementById('urunAdi');
    const urunBirimSecimi = document.getElementById('urunBirimSecimi');
    const ozelBirimContainer = document.getElementById('ozelBirimContainer');
    const urunBirimAdiInput = document.getElementById('urunBirimAdi');
    const urunListesiTablosuBody = document.querySelector('#urunListesiTablosu tbody');
    const formTemizleButton = document.getElementById('formTemizleButton');

    const tedarikciForm = document.getElementById('tedarikciForm');
    const tedarikciIdInput = document.getElementById('tedarikciIdInput');
    const tedarikciAdiInput = document.getElementById('tedarikciAdiInput');
    const tedarikciYetkiliKisiInput = document.getElementById('tedarikciYetkiliKisi');
    const tedarikciTelefonInput = document.getElementById('tedarikciTelefon');
    const tedarikciEmailInput = document.getElementById('tedarikciEmail');
    const tedarikciAdresInput = document.getElementById('tedarikciAdres');
    const tedarikciNotInput = document.getElementById('tedarikciNot');
    const tedarikciListesiTablosuBody = document.querySelector('#tedarikciListesiTablosu tbody');
    const tedarikciFormTemizleButton = document.getElementById('tedarikciFormTemizleButton');

    const gunlukFiyatForm = document.getElementById('gunlukFiyatForm');
    const fiyatGirisMalzemeSecimi = document.getElementById('fiyatGirisMalzemeSecimi');
    const fiyatGirisTedarikciSecimi = document.getElementById('fiyatGirisTedarikciSecimi');
    const fiyatGirisBirimGostergesi = document.getElementById('fiyatGirisBirimGostergesi');
    const sonFiyatlarTablosuBody = document.querySelector('#sonFiyatlarTablosu tbody');

    const grafikUrunSecimi = document.getElementById('grafikUrunSecimi');
    const grafikTedarikciSecimi = document.getElementById('grafikTedarikciSecimi');
    const tedarikciFilterGrafikDiv = document.querySelector('.tedarikci-filter-grafik');
    const zamanAraligiSecimi = document.getElementById('zamanAraligiSecimi');
    const fiyatGrafigiCanvas = document.getElementById('fiyatGrafigi');
    
    const statsToplamMalzemeEl = document.getElementById('statsToplamMalzeme');
    const statsToplamTedarikciEl = document.getElementById('statsToplamTedarikci');
    const statsToplamFiyatEl = document.getElementById('statsToplamFiyat');
    const statsSonFiyatTarihiEl = document.getElementById('statsSonFiyatTarihi');
    const statsToplamIsciEl = document.getElementById('statsToplamIsci');
    const statsToplamMusteriEl = document.getElementById('statsToplamMusteri');
    const statsToplamTeklifEl = document.getElementById('statsToplamTeklif');

    let fiyatGrafigi;

    async function iscileriYukle() {
        try {
            const apiIsciler = await fetchIsciler();
            setIsciler(apiIsciler && Array.isArray(apiIsciler) ? apiIsciler : []);
        } catch (error) {
            globalHataYakala(error, 'İşçiler yüklenirken bir sorun oluştu.');
            setIsciler([]);
        }
    }

    async function malzemeleriYukle() {
        try {
            const apiUrunler = await fetchMalzemeler();
            setUrunler(apiUrunler && Array.isArray(apiUrunler) ? apiUrunler : []);
        } catch (error) {
            globalHataYakala(error, 'Malzemeler yüklenirken bir sorun oluştu.');
            setUrunler([]);
        }
    }

    async function tedarikcileriYukle() {
        try {
            const apiTedarikciler = await fetchTedarikciler();
            setTedarikciler(apiTedarikciler && Array.isArray(apiTedarikciler) ? apiTedarikciler : []);
        } catch (error) {
            globalHataYakala(error, 'Tedarikçiler yüklenirken bir sorun oluştu.');
            setTedarikciler([]);
        }
    }

    async function fiyatlariYukle() {
        try {
            const tumGelenFiyatlar = await fetchFiyatlar();
            setFiyatlar(tumGelenFiyatlar && Array.isArray(tumGelenFiyatlar) ? tumGelenFiyatlar : []);
        } catch (error) {
            globalHataYakala(error, 'Fiyatlar yüklenirken bir sorun oluştu.');
            setFiyatlar([]);
        }
    }

    async function teklifleriYukle() {
        try {
            const apiTekliflerRaw = await fetchTekliflerAPI();
            console.log('[script.js] teklifleriYukle - Ham API Yanıtı (fetchTekliflerAPI):', JSON.parse(JSON.stringify(apiTekliflerRaw)));

            // API yanıtının doğrudan bir dizi olup olmadığını veya bir data özelliği içerip içermediğini kontrol et
            // Örnek API yanıtınızda { success: true, data: [...] } şeklinde bir yapı vardı.
            const tekliflerDizisi = apiTekliflerRaw && apiTekliflerRaw.data && Array.isArray(apiTekliflerRaw.data) 
                                    ? apiTekliflerRaw.data 
                                    : (apiTekliflerRaw && Array.isArray(apiTekliflerRaw) ? apiTekliflerRaw : []);

            console.log('[script.js] teklifleriYukle - setTeklifler fonksiyonuna gönderilecek dizi:', JSON.parse(JSON.stringify(tekliflerDizisi)));
            setTeklifler(tekliflerDizisi);

        } catch (error) {
            globalHataYakala(error, 'Teklifler yüklenirken bir sorun oluştu.');
            console.error('[script.js] teklifleriYukle - Hata oluştu, setTeklifler boş dizi ile çağrılıyor:', error);
            setTeklifler([]);
        }
    }

    async function musterileriYukle() {
        try {
            const response = await getMusterilerAPI();
            const musterilerData = response && response.data && Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
            setMusteriler(musterilerData);
        } catch (error) {
            globalHataYakala(error, 'Müşteriler yüklenirken bir sorun oluştu.');
            setMusteriler([]);
        }
    }

    function guncelleAnasayfaIstatistikleri() {
        const urunler = getUrunler();
        const tedarikciler = getTedarikciler();
        const fiyatlar = getFiyatlar();
        const mevcutIsciler = getIsciler();
        const mevcutMusteriler = getMusteriler();
        const mevcutTeklifler = getTeklifler();

        if (statsToplamMalzemeEl) statsToplamMalzemeEl.textContent = urunler.length;
        if (statsToplamTedarikciEl) statsToplamTedarikciEl.textContent = tedarikciler.length;
        if (statsToplamFiyatEl) statsToplamFiyatEl.textContent = fiyatlar.length;
        if (statsToplamIsciEl) statsToplamIsciEl.textContent = mevcutIsciler.length;
        if (statsToplamMusteriEl) statsToplamMusteriEl.textContent = mevcutMusteriler.length;
        if (statsToplamTeklifEl) statsToplamTeklifEl.textContent = mevcutTeklifler.length;
        
        if (statsSonFiyatTarihiEl) {
            if (fiyatlar.length > 0) {
                const sonFiyat = [...fiyatlar].sort((a,b) => new Date(b.tarih) - new Date(a.tarih))[0];
                statsSonFiyatTarihiEl.textContent = sonFiyat ? new Date(sonFiyat.tarih).toLocaleDateString('tr-TR') : '-';
            } else {
                statsSonFiyatTarihiEl.textContent = '-';
            }
        }
    }

    async function initializePageData() {
        showToast('Veriler yükleniyor...', 'info', 1500);
        try {
            await Promise.all([
                malzemeleriYukle(),
                tedarikcileriYukle(),
                fiyatlariYukle(),
                teklifleriYukle(),
                musterileriYukle(),
                iscileriYukle()
            ]);
            const gunlukTarihInput = document.getElementById('gunlukTarihInput');
            if (gunlukTarihInput) {
                gunlukTarihInput.value = new Date().toISOString().split('T')[0];
            }
            guncelleAnasayfaIstatistikleri();
            showToast('Veriler başarıyla yüklendi.', 'success', 1000);
        } catch (error) {
            console.error('initializePageData Promise.all HATA:', error);
            guncelleAnasayfaIstatistikleri();
            showToast('Genel veri yükleme hatası! Lütfen sayfayı yenileyin.', 'error', 5000);
        }
    }

    initializePageData();

    subscribe('urunlerChanged', (guncelUrunler) => {
        if(urunListesiTablosuBody) guncelleUrunListesiTablosu(guncelUrunler, urunListesiTablosuBody);
        if(grafikUrunSecimi) populeEtUrunSecimDropdown(guncelUrunler, grafikUrunSecimi, "-- Ürün Seçiniz --", true, null);
        if(fiyatGirisMalzemeSecimi) populeEtUrunSecimDropdown(guncelUrunler, fiyatGirisMalzemeSecimi, "-- Malzeme Seçiniz --", true, urun => ` (${urun.birim_adi || 'Tanımsız Birim'})`);
        guncelleAnasayfaIstatistikleri();
    });

    subscribe('tedarikcilerChanged', (guncelTedarikciler) => {
        if(tedarikciListesiTablosuBody) guncelleTedarikciListesiTablosu(guncelTedarikciler, tedarikciListesiTablosuBody);
        if(fiyatGirisTedarikciSecimi) populeTedarikciDropdown(guncelTedarikciler, fiyatGirisTedarikciSecimi, "-- Tedarikçi Seçiniz --");
        if(grafikUrunSecimi && grafikTedarikciSecimi && tedarikciFilterGrafikDiv) guncelleGrafikTedarikciFiltresi();
        guncelleAnasayfaIstatistikleri();
    });

    subscribe('fiyatlarChanged', (guncelFiyatlar) => {
        if(sonFiyatlarTablosuBody) gosterSonFiyatlarTablosu(guncelFiyatlar, sonFiyatlarTablosuBody, getUrunler(), getTedarikciler(), 10);
        if(fiyatGrafigiCanvas && grafikUrunSecimi && grafikTedarikciSecimi && zamanAraligiSecimi){
            fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(
                fiyatGrafigiCanvas, 
                grafikUrunSecimi.value, 
                grafikTedarikciSecimi.value, 
                zamanAraligiSecimi.value, 
                guncelFiyatlar,
                getUrunler(),
                getTedarikciler(),
                fiyatGrafigi
            );
        }
        guncelleAnasayfaIstatistikleri();
    });

    subscribe('tekliflerChanged', (guncelTeklifler) => {
        guncelleAnasayfaIstatistikleri();
    });

    subscribe('musterilerChanged', (guncelMusteriler) => {
        guncelleAnasayfaIstatistikleri();
    });

    subscribe('iscilerChanged', (guncelIscilerListesi) => {
        const localIsciListesiTablosuBody = document.querySelector('#isciListesiTablosu tbody');
        if (localIsciListesiTablosuBody) {
            guncelleIscilerTablosu(guncelIscilerListesi, localIsciListesiTablosuBody);
        }
        guncelleAnasayfaIstatistikleri();
    });

    if (urunBirimSecimi) {
        urunBirimSecimi.addEventListener('change', function() {
            ozelBirimContainer.style.display = this.value === 'diger' ? 'block' : 'none';
            if (this.value === 'diger' && urunBirimAdiInput) {
                urunBirimAdiInput.value = '';
                urunBirimAdiInput.focus();
            }
        });
    }

    if (urunForm) {
        urunForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const submitButton = urunForm.querySelector('button[type="submit"]');
            if(!submitButton) return;
            setButtonLoading(submitButton, 'Kaydediliyor...');
            const id = urunIdInput.value;
            const ad = urunAdiInput.value.trim();
            let birimDegeri = urunBirimSecimi.value === 'diger' ? urunBirimAdiInput.value.trim() : urunBirimSecimi.value;
            if (!ad) {
                resetButtonLoading(submitButton);
                return showToast('Malzeme adı boş bırakılamaz!', 'warning');
            }
            if (urunBirimSecimi.value === 'diger' && !birimDegeri) {
                 resetButtonLoading(submitButton);
                 return showToast('Lütfen özel birim adını girin veya listeden bir birim seçin.', 'warning');
            }
            const malzemeVerisi = { ad, birim_adi: birimDegeri };
            try {
                const kaydedilenMalzeme = await saveMalzemeAPI(malzemeVerisi, id);
                await malzemeleriYukle(); 
                showToast(kaydedilenMalzeme?.message || (id ? 'Malzeme güncellendi.' : 'Malzeme eklendi.'), 'success');
                if(urunForm) temizleUrunFormu(urunForm, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton);
            } catch (error) {
                globalHataYakala(error, `Malzeme ${id ? 'güncellenirken' : 'eklenirken'} sorun oluştu.`);
            } finally {
                resetButtonLoading(submitButton);
            }
        });
    }

    if(formTemizleButton && urunForm) {
        formTemizleButton.addEventListener('click', () => {
            temizleUrunFormu(urunForm, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton);
        });
    }

    if(urunListesiTablosuBody){
        urunListesiTablosuBody.addEventListener('click', async function(event) {
            const target = event.target;
            const urunId = target.dataset.id || target.closest('[data-id]')?.dataset.id;
    
            if (target.closest('.edit-btn')) {
                const urun = getUrunById(urunId);
                if (urun && urunForm) {
                    doldurUrunFormu(urun, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton);
                    showSection('malzeme-tanimlama');
                    if(urunAdiInput) urunAdiInput.focus();
                }
            } else if (target.closest('.delete-btn')) {
                const urun = getUrunById(urunId);
                if (urun && confirm(`'${urun.ad}' malzemesini silmek istediğinize emin misiniz?`)) {
                    try {
                        const sonuc = await deleteMalzemeAPI(urunId);
                        removeUrunById(urunId);
                        showToast(sonuc?.message || 'Malzeme silindi.', 'success');
                        if (urunIdInput && urunIdInput.value === urunId && urunForm) {
                             temizleUrunFormu(urunForm, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton);
                        }
                    } catch (error) {
                        globalHataYakala(error, 'Malzeme silinirken sorun oluştu.');
                    }
                }
            }
        });
    }

    if (tedarikciForm) {
        tedarikciForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const submitButton = tedarikciForm.querySelector('button[type="submit"]');
            if(!submitButton) return;
            setButtonLoading(submitButton, 'Kaydediliyor...');
            const id = tedarikciIdInput.value;
            const tedarikciVerisi = {
                ad: tedarikciAdiInput.value.trim(),
                yetkili_kisi: tedarikciYetkiliKisiInput.value.trim(),
                telefon: tedarikciTelefonInput.value.trim(),
                email: tedarikciEmailInput.value.trim(),
                adres: tedarikciAdresInput.value.trim(),
                not_alani: tedarikciNotInput.value.trim()
            };
            if (!tedarikciVerisi.ad) {
                resetButtonLoading(submitButton);
                return showToast('Tedarikçi adı boş bırakılamaz!', 'warning');
            }
            try {
                const kaydedilenTedarikci = await saveTedarikciAPI(tedarikciVerisi, id);
                await tedarikcileriYukle(); 
                showToast(kaydedilenTedarikci?.message || (id ? 'Tedarikçi güncellendi.' : 'Tedarikçi eklendi.'), 'success');
                if(tedarikciForm) temizleTedarikciFormu(tedarikciForm, tedarikciIdInput, tedarikciAdiInput, tedarikciYetkiliKisiInput, tedarikciTelefonInput, tedarikciEmailInput, tedarikciAdresInput, tedarikciNotInput, tedarikciFormTemizleButton);
            } catch (error) {
                globalHataYakala(error, `Tedarikçi ${id ? 'güncellenirken' : 'eklenirken'} sorun oluştu.`);
            } finally {
                resetButtonLoading(submitButton);
            }
        });
    }

    if(tedarikciFormTemizleButton && tedarikciForm){
        tedarikciFormTemizleButton.addEventListener('click', () => {
            temizleTedarikciFormu(tedarikciForm, tedarikciIdInput, tedarikciAdiInput, tedarikciYetkiliKisiInput, tedarikciTelefonInput, tedarikciEmailInput, tedarikciAdresInput, tedarikciNotInput, tedarikciFormTemizleButton);
        });
    }

    if(tedarikciListesiTablosuBody){
        tedarikciListesiTablosuBody.addEventListener('click', async function(event) {
            const target = event.target;
            const tedarikciId = target.dataset.id || target.closest('[data-id]')?.dataset.id;

            if (target.closest('.edit-btn')) {
                const tedarikci = getTedarikciById(tedarikciId);
                if (tedarikci && tedarikciForm) {
                    doldurTedarikciFormu(tedarikci, tedarikciIdInput, tedarikciAdiInput, tedarikciYetkiliKisiInput, tedarikciTelefonInput, tedarikciEmailInput, tedarikciAdresInput, tedarikciNotInput, tedarikciFormTemizleButton);
                    showSection('tedarikciler');
                    if(tedarikciAdiInput) tedarikciAdiInput.focus();
                }
            } else if (target.closest('.delete-btn')) {
                const tedarikci = getTedarikciById(tedarikciId);
                if (tedarikci && confirm(`'${tedarikci.ad}' tedarikçisini silmek istediğinize emin misiniz?`)) {
                    try {
                        const sonuc = await deleteTedarikciAPI(tedarikciId);
                        removeTedarikciById(tedarikciId); 
                        showToast(sonuc?.message || 'Tedarikçi silindi.', 'success');
                        if (fiyatGirisTedarikciSecimi && fiyatGirisTedarikciSecimi.value === tedarikciId) fiyatGirisTedarikciSecimi.value = "";
                        if (grafikTedarikciSecimi && grafikTedarikciSecimi.value === tedarikciId) grafikTedarikciSecimi.value = "";
                        if (tedarikciIdInput && tedarikciIdInput.value === tedarikciId && tedarikciForm) {
                           temizleTedarikciFormu(tedarikciForm, tedarikciIdInput, tedarikciAdiInput, tedarikciYetkiliKisiInput, tedarikciTelefonInput, tedarikciEmailInput, tedarikciAdresInput, tedarikciNotInput, tedarikciFormTemizleButton);
                        }
                    } catch (error) {
                        globalHataYakala(error, 'Tedarikçi silinirken sorun oluştu.');
                    }
                }
            }
        });
    }

    if (gunlukFiyatForm) {
        gunlukFiyatForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const submitButton = gunlukFiyatForm.querySelector('button[type="submit"]');
            if(!submitButton) return;
            setButtonLoading(submitButton, 'Kaydediliyor...');
            const malzeme_id = fiyatGirisMalzemeSecimi.value;
            const tedarikci_id = fiyatGirisTedarikciSecimi.value;
            const fiyatValue = document.getElementById('gunlukFiyatInput').value;
            const tarih = document.getElementById('gunlukTarihInput').value;

            if (!malzeme_id || !tedarikci_id || fiyatValue === '' || !tarih) {
                resetButtonLoading(submitButton);
                return showToast('Lütfen tüm fiyat giriş alanlarını doldurun.', 'warning');
            }
            const fiyatFloat = parseFloat(fiyatValue);
            if (isNaN(fiyatFloat) || fiyatFloat <= 0) {
                resetButtonLoading(submitButton);
                return showToast('Fiyat geçerli pozitif bir sayı olmalıdır.', 'warning');
            }
            const fiyatVerisi = { malzeme_id, tedarikci_id, fiyat: fiyatFloat, tarih };
            try {
                const kaydedilenFiyat = await saveFiyatAPI(fiyatVerisi);
                await fiyatlariYukle(); 
                showToast(kaydedilenFiyat?.message || 'Fiyat başarıyla kaydedildi.', 'success');
                if(gunlukFiyatForm) gunlukFiyatForm.reset();
                if(document.getElementById('gunlukTarihInput')) document.getElementById('gunlukTarihInput').value = new Date().toISOString().split('T')[0];
                if(fiyatGirisMalzemeSecimi) fiyatGirisMalzemeSecimi.value = '';
                if(fiyatGirisTedarikciSecimi) fiyatGirisTedarikciSecimi.value = '';
                if(fiyatGirisBirimGostergesi) fiyatGirisBirimGostergesi.textContent = '-';
            } catch (error) {
                globalHataYakala(error, 'Fiyat kaydedilirken sorun oluştu.');
            } finally {
                resetButtonLoading(submitButton);
            }
        });
    }

    if (sonFiyatlarTablosuBody) {
        sonFiyatlarTablosuBody.addEventListener('click', async function(event) {
            const target = event.target;
            const deleteButton = target.closest('.delete-fiyat-btn');
            if (deleteButton) {
                const fiyatId = deleteButton.dataset.id;
                const trElement = target.closest('tr');
                const malzemeAdi = trElement?.cells[0]?.textContent || 'Bilinmeyen Malzeme';
                if (confirm(`'${malzemeAdi}' için girilen fiyat kaydını silmek istediğinize emin misiniz?`)) {
                    try {
                        const sonuc = await deleteFiyatAPI(fiyatId);
                        removeFiyatById(fiyatId);
                        showToast(sonuc?.message || 'Fiyat kaydı silindi.', 'success');
                    } catch (error) {
                        globalHataYakala(error, 'Fiyat silinirken sorun oluştu.');
                    }
                }
            }
        });
    }

    function guncelleGrafikTedarikciFiltresi() {
        if(!grafikUrunSecimi || !grafikTedarikciSecimi || !tedarikciFilterGrafikDiv) return;
        const seciliUrunId = grafikUrunSecimi.value;
        const tumTedarikciler = getTedarikciler();
        const tumFiyatlar = getFiyatlar();
        let filtrelenecekTedarikciler = tumTedarikciler;

        if (seciliUrunId) {
            const urunFiyatlari = tumFiyatlar.filter(f => String(f.malzeme_id) === String(seciliUrunId));
            const buUrununTedarikciIdleri = [...new Set(urunFiyatlari.map(f => String(f.tedarikci_id)))];
            filtrelenecekTedarikciler = tumTedarikciler.filter(t => buUrununTedarikciIdleri.includes(String(t.id)));
            tedarikciFilterGrafikDiv.style.display = filtrelenecekTedarikciler.length > 0 ? 'block' : 'none';
        } else {
            tedarikciFilterGrafikDiv.style.display = 'none';
        }
        populeTedarikciDropdown(filtrelenecekTedarikciler, grafikTedarikciSecimi, "-- Tüm Tedarikçiler --", true);
        if(fiyatGrafigiCanvas && zamanAraligiSecimi && grafikUrunSecimi && grafikTedarikciSecimi) {
            fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, seciliUrunId, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, tumFiyatlar, getUrunler(), tumTedarikciler, fiyatGrafigi);
        }
    }

    if(grafikUrunSecimi) grafikUrunSecimi.addEventListener('change', guncelleGrafikTedarikciFiltresi);
    if(grafikTedarikciSecimi) grafikTedarikciSecimi.addEventListener('change', () => {
        if(fiyatGrafigiCanvas && grafikUrunSecimi && zamanAraligiSecimi && grafikTedarikciSecimi){
            fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, grafikUrunSecimi.value, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, getFiyatlar(), getUrunler(), getTedarikciler(), fiyatGrafigi);
        }
    });
    if(zamanAraligiSecimi) zamanAraligiSecimi.addEventListener('change', () => {
        if(fiyatGrafigiCanvas && grafikUrunSecimi && grafikTedarikciSecimi && zamanAraligiSecimi){
            fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, grafikUrunSecimi.value, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, getFiyatlar(), getUrunler(), getTedarikciler(), fiyatGrafigi);
        }
    });

    function guncelleFiyatGirisBirimGostergesi() {
        if(!fiyatGirisMalzemeSecimi || !fiyatGirisBirimGostergesi) return;
        const seciliUrunId = fiyatGirisMalzemeSecimi.value;
        if (seciliUrunId) {
            const seciliUrun = getUrunById(seciliUrunId);
            fiyatGirisBirimGostergesi.textContent = seciliUrun ? (seciliUrun.birim_adi || '-') : '-';
        } else {
            fiyatGirisBirimGostergesi.textContent = '-';
        }
    }
    if(fiyatGirisMalzemeSecimi) fiyatGirisMalzemeSecimi.addEventListener('change', guncelleFiyatGirisBirimGostergesi);

}); // Tek DOMContentLoaded Kapanışı