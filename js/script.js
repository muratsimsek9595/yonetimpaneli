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
    getMusteriler as getMusterilerAPI
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
    setMusteriler
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
    doldurTedarikciFormu
} from './ui.js';
import {
    cizVeyaGuncelleFiyatGrafigi
} from './grafik.js';
import { globalHataYakala } from './hataYonetimi.js';

// Genel JavaScript fonksiyonları ve olay dinleyicileri buraya gelecek.
// Chart.js DataLabels eklentisini global olarak kaydet
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
} else {
    console.error('ChartDataLabels eklentisi yüklenemedi!');
}

document.addEventListener('DOMContentLoaded', function() {
    // console.log('DOM yüklendi ve hazır!'); // Bu log mesajını geçici olarak kaldırıyorum

    // Navigasyon ve sayfa ilk yükleme mantığı (initializePageData'dan önce olması daha mantıklı olabilir)
    const navLinks = document.querySelectorAll('.sidebar nav a');
    const sections = document.querySelectorAll('.main-content section');
    const anasayfaSection = document.getElementById('anasayfa');

    // Hızlı işlem butonlarını da section geçişleri için yakala
    const quickActionButtons = document.querySelectorAll('.quick-action-button');

    function showSection(targetId) {
        sections.forEach(section => {
            section.id === targetId ? section.classList.add('active-section') : section.classList.remove('active-section');
        });
        navLinks.forEach(navLink => {
            navLink.getAttribute('href') === `#\${targetId}` ? navLink.classList.add('active') : navLink.classList.remove('active');
        });

        // URL hash'ini güncelle (isteğe bağlı, tarayıcı geçmişi için)
        // history.pushState(null, null, `#\${targetId}`);
    }

    if (anasayfaSection) {
        showSection('anasayfa');
    } else {
        if (sections.length > 0) {
            showSection(sections[0].id);
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });

    quickActionButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            // İlgili ana navigasyon linkini de aktif yap
            navLinks.forEach(navLink => {
                navLink.getAttribute('href') === `#\${targetId}` ? navLink.classList.add('active') : navLink.classList.remove('active');
        });
    });
    });

    // DOM Element Tanımlamaları (Global değişkenlerden sonra, fonksiyonlardan önce)
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
    
    // Ana Sayfa İstatistik Elementleri
    const statsToplamMalzemeEl = document.getElementById('statsToplamMalzeme');
    const statsToplamTedarikciEl = document.getElementById('statsToplamTedarikci');
    const statsToplamFiyatEl = document.getElementById('statsToplamFiyat');
    const statsSonFiyatTarihiEl = document.getElementById('statsSonFiyatTarihi');

    let fiyatGrafigi; // Chart.js nesnesi için

    // Fonksiyon Tanımlamaları

    function tedarikciAdiniGetir(tedarikciId) {
        const tedarikci = getTedarikciById(tedarikciId);
        return tedarikci ? tedarikci.ad : '-';
    }

    function urunListesiniGuncelle() {
        guncelleUrunListesiTablosu(getUrunler(), urunListesiTablosuBody);
        populeEtUrunSecimDropdown(getUrunler(), grafikUrunSecimi, "-- Ürün Seçiniz --", true, null);
        guncelleGrafikTedarikciFiltresi();
        populeEtUrunSecimDropdown(getUrunler(), fiyatGirisMalzemeSecimi, "-- Malzeme Seçiniz --", true, urun => ` (${urun.birim_adi || 'Tanımsız Birim'})`);
        guncelleFiyatGirisBirimGostergesi();
    }

    function tedarikciListesiniGuncelle() {
        guncelleTedarikciListesiTablosu(getTedarikciler(), tedarikciListesiTablosuBody);
        populeTedarikciDropdown(getTedarikciler(), fiyatGirisTedarikciSecimi, "-- Tedarikçi Seçiniz --"); // Grafik tedarikçi dropdown'ı ayrı güncelleniyor
        guncelleGrafikTedarikciFiltresi(); // Tedarikçiler değiştiğinde grafik filtresini de güncelle
    }

    if (urunBirimSecimi) {
        urunBirimSecimi.addEventListener('change', function() {
            ozelBirimContainer.style.display = this.value === 'diger' ? 'block' : 'none';
            if (this.value === 'diger') {
                urunBirimAdiInput.value = '';
                urunBirimAdiInput.focus();
            }
        });
    }

    urunForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const submitButton = urunForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, 'Kaydediliyor...');
        const id = urunIdInput.value;
        const ad = urunAdiInput.value.trim();
        let birimDegeri = urunBirimSecimi.value === 'diger' ? urunBirimAdiInput.value.trim() : urunBirimSecimi.value;
        if (!ad) return alert('Malzeme adı boş bırakılamaz!');
        if (urunBirimSecimi.value === 'diger' && !birimDegeri) return alert('Lütfen özel birim adını girin veya listeden bir birim seçin.');
        const malzemeVerisi = { ad, birim_adi: birimDegeri };
        try {
            const kaydedilenMalzeme = await saveMalzemeAPI(malzemeVerisi, id);
            await malzemeleriYukle();
            showToast(kaydedilenMalzeme?.message || (id ? 'Malzeme başarıyla güncellendi.' : 'Malzeme başarıyla eklendi.'), 'success');
            temizleUrunFormu(urunForm, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton);
        } catch (error) {
            globalHataYakala(error, `Malzeme ${id ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`);
        } finally {
            resetButtonLoading(submitButton);
        }
    });

    formTemizleButton.addEventListener('click', () => {
        temizleUrunFormu(urunForm, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton);
    });

    urunListesiTablosuBody.addEventListener('click', async function(event) {
        const target = event.target;
        const urunId = target.dataset.id;
        if (!urunId && (target.classList.contains('edit-btn') || target.classList.contains('delete-btn'))) return; 

        const urun = getUrunById(urunId);
        if (!urun && (target.classList.contains('edit-btn') || target.classList.contains('delete-btn'))) {
            return globalHataYakala(new Error("İşlem yapılacak ürün bulunamadı."), "Ürün işlemi sırasında");
        }

        if (target.classList.contains('edit-btn')) {
            if (urun) {
                doldurUrunFormu(urun, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton);
            }
        } else if (target.classList.contains('delete-btn')) {
            if (confirm(`'${urun.ad}' malzemesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
                try {
                    const sonuc = await deleteMalzemeAPI(urunId);
                    removeUrunById(urunId);
                    showToast(sonuc?.message || 'Malzeme başarıyla silindi.', 'success');
                    temizleUrunFormu(urunForm, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton);
                } catch (error) {
                    globalHataYakala(error, 'Malzeme silinirken bir sorun oluştu.');
                }
            }
        }
    });

    if (tedarikciForm) {
        tedarikciForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const submitButton = tedarikciForm.querySelector('button[type="submit"]');
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
            if (!tedarikciVerisi.ad) return alert('Tedarikçi adı boş bırakılamaz!');
            try {
                const kaydedilenTedarikci = await saveTedarikciAPI(tedarikciVerisi, id);
                await tedarikcileriYukle();
                showToast(kaydedilenTedarikci?.message || (id ? 'Tedarikçi başarıyla güncellendi.' : 'Tedarikçi başarıyla eklendi.'), 'success');
                temizleTedarikciFormu(tedarikciForm, tedarikciIdInput, tedarikciAdiInput, tedarikciYetkiliKisiInput, tedarikciTelefonInput, tedarikciEmailInput, tedarikciAdresInput, tedarikciNotInput, tedarikciFormTemizleButton);
            } catch (error) {
                globalHataYakala(error, `Tedarikçi ${id ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`);
            } finally {
                resetButtonLoading(submitButton);
            }
        });
    }

    if (tedarikciFormTemizleButton) {
        tedarikciFormTemizleButton.addEventListener('click', () => {
            temizleTedarikciFormu(tedarikciForm, tedarikciIdInput, tedarikciAdiInput, tedarikciYetkiliKisiInput, tedarikciTelefonInput, tedarikciEmailInput, tedarikciAdresInput, tedarikciNotInput, tedarikciFormTemizleButton);
        });
    }

    if (tedarikciListesiTablosuBody) {
        tedarikciListesiTablosuBody.addEventListener('click', async function(event) {
            const target = event.target;
            const tedarikciId = target.dataset.id;
            if (!tedarikciId && (target.classList.contains('edit-btn') || target.classList.contains('delete-btn'))) return;

            const tedarikci = getTedarikciById(tedarikciId);
            if (!tedarikci && (target.classList.contains('edit-btn') || target.classList.contains('delete-btn'))) {
                return globalHataYakala(new Error("İşlem yapılacak tedarikçi bulunamadı."), "Tedarikçi işlemi sırasında");
            }

            if (target.classList.contains('edit-btn')) {
                if (tedarikci) {
                    doldurTedarikciFormu(tedarikci, tedarikciIdInput, tedarikciAdiInput, tedarikciYetkiliKisiInput, tedarikciTelefonInput, tedarikciEmailInput, tedarikciAdresInput, tedarikciNotInput, tedarikciFormTemizleButton);
                }
            } else if (target.classList.contains('delete-btn')) {
                if (confirm(`'${tedarikci.ad}' tedarikçisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tedarikçiye ait tüm fiyat kayıtları da silinecektir!`)) {
                    try {
                        const sonuc = await deleteTedarikciAPI(tedarikciId);
                        removeTedarikciById(tedarikciId);
                        showToast(sonuc?.message || 'Tedarikçi başarıyla silindi.', 'success');
                        if (fiyatGirisTedarikciSecimi.value === tedarikciId) fiyatGirisTedarikciSecimi.value = "";
                        if (grafikTedarikciSecimi.value === tedarikciId) grafikTedarikciSecimi.value = "";
                    } catch (error) {
                        globalHataYakala(error, 'Tedarikçi silinirken bir sorun oluştu.');
                    }
                }
            }
        });
    }

    function guncelleGrafikTedarikciFiltresi() {
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
        fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, seciliUrunId, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, tumFiyatlar, getUrunler(), tumTedarikciler, fiyatGrafigi);
    }

    grafikUrunSecimi.addEventListener('change', guncelleGrafikTedarikciFiltresi);
    grafikTedarikciSecimi.addEventListener('change', () => {
        fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, grafikUrunSecimi.value, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, getFiyatlar(), getUrunler(), getTedarikciler(), fiyatGrafigi);
    });
    zamanAraligiSecimi.addEventListener('change', () => {
        fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, grafikUrunSecimi.value, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, getFiyatlar(), getUrunler(), getTedarikciler(), fiyatGrafigi);
    });

    function guncelleFiyatGirisBirimGostergesi() {
        const seciliUrunId = fiyatGirisMalzemeSecimi.value;
        if (seciliUrunId) {
            const seciliUrun = getUrunById(seciliUrunId);
            fiyatGirisBirimGostergesi.textContent = seciliUrun ? (seciliUrun.birim_adi || '-') : '-';
        } else {
            fiyatGirisBirimGostergesi.textContent = '-';
        }
    }
    fiyatGirisMalzemeSecimi.addEventListener('change', guncelleFiyatGirisBirimGostergesi);

    if (sonFiyatlarTablosuBody) {
        sonFiyatlarTablosuBody.addEventListener('click', async function(event) {
            const target = event.target;
            if (target.classList.contains('delete-fiyat-btn')) {
                const fiyatId = target.dataset.id;
                const trElement = target.closest('tr');
                const malzemeAdi = trElement?.cells[0]?.textContent || 'Bilinmeyen Malzeme';
                const fiyatDegeri = trElement?.cells[1]?.textContent || 'Bilinmeyen Fiyat';
                if (confirm(`'${malzemeAdi}' için girilen ${fiyatDegeri} TL değerindeki fiyat kaydını silmek istediğinize emin misiniz?`)) {
                    try {
                        const sonuc = await deleteFiyatAPI(fiyatId);
                        removeFiyatById(fiyatId);
                        showToast(sonuc?.message || 'Fiyat kaydı başarıyla silindi.', 'success');
                    } catch (error) {
                        globalHataYakala(error, 'Fiyat silinirken bir sorun oluştu.');
                    }
                }
            }
        });
    }

    gunlukFiyatForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const submitButton = gunlukFiyatForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, 'Kaydediliyor...');
        const malzeme_id = fiyatGirisMalzemeSecimi.value;
        const tedarikci_id = fiyatGirisTedarikciSecimi.value;
        const fiyatValue = document.getElementById('gunlukFiyatInput').value;
        const tarih = document.getElementById('gunlukTarihInput').value;
        if (!malzeme_id || !tedarikci_id || fiyatValue === '' || !tarih) return alert('Lütfen tüm alanları doldurun.');
        const fiyatFloat = parseFloat(fiyatValue);
        if (isNaN(fiyatFloat)) return alert('Fiyat geçerli bir sayı olmalıdır.');
        const fiyatVerisi = { malzeme_id, tedarikci_id, fiyat: fiyatFloat, tarih };
        try {
            const kaydedilenFiyat = await saveFiyatAPI(fiyatVerisi);
            saveFiyatStore(kaydedilenFiyat.data);
            showToast(kaydedilenFiyat?.message || 'Fiyat başarıyla kaydedildi.', 'success');
            gunlukFiyatForm.reset();
            guncelleFiyatGirisBirimGostergesi(); 
            document.getElementById('gunlukTarihInput').value = new Date().toISOString().split('T')[0];
        } catch (error) {
            globalHataYakala(error, 'Fiyat kaydedilirken bir sorun oluştu.');
        } finally {
            resetButtonLoading(submitButton);
        }
    });

    async function malzemeleriYukle() {
        try {
            const apiUrunler = await fetchMalzemeler();
            setUrunler(apiUrunler && Array.isArray(apiUrunler) ? apiUrunler : []);
        } catch (error) {
            globalHataYakala(error, 'Malzemeler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
            setUrunler([]); // Hata durumunda boş dizi ata
        }
    }

    async function tedarikcileriYukle() {
        try {
            const apiTedarikciler = await fetchTedarikciler();
            setTedarikciler(apiTedarikciler && Array.isArray(apiTedarikciler) ? apiTedarikciler : []);
        } catch (error) {
            globalHataYakala(error, 'Tedarikçiler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
            setTedarikciler([]); // Hata durumunda boş dizi ata
        }
    }

    async function fiyatlariYukle() {
        try {
            const tumGelenFiyatlar = await fetchFiyatlar();
            setFiyatlar(tumGelenFiyatlar && Array.isArray(tumGelenFiyatlar) ? tumGelenFiyatlar : []);
        } catch (error) {
            globalHataYakala(error, 'Fiyatlar yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
            setFiyatlar([]); // Hata durumunda boş dizi ata
        }
    }

    async function teklifleriYukle() {
        try {
            const apiTeklifler = await fetchTekliflerAPI(); // Bu fonksiyon api.js'de tanımlanacak
            setTeklifler(apiTeklifler && Array.isArray(apiTeklifler) ? apiTeklifler : []);
        } catch (error) {
            globalHataYakala(error, 'Teklifler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
            setTeklifler([]); // Hata durumunda boş dizi ata
        }
    }

    // Müşterileri Yükle Fonksiyonu
    async function musterileriYukle() {
        try {
            showToast('Müşteriler yükleniyor...', 'info', 1000);
            const musteriler = await getMusterilerAPI();
            setMusteriler(musteriler.data && Array.isArray(musteriler.data) ? musteriler.data : []); // API'den gelen veri.data varsayımı
            console.log('Müşteriler API üzerinden yüklendi.', getMusteriler());
            showToast('Müşteriler başarıyla yüklendi.', 'success');
        } catch (error) {
            console.warn('Müşteriler yüklenirken bir sorun oluştu.', error.message);
            setMusteriler([]); // Hata durumunda boş dizi ata
            showToast('Müşteriler API\'den yüklenemedi. Lütfen daha sonra tekrar deneyin.', 'warning');
        }
    }

    // --- Ana Sayfa İstatistiklerini Güncelleme Fonksiyonu ---
    function guncelleAnasayfaIstatistikleri() {
        const urunler = getUrunler();
        const tedarikciler = getTedarikciler();
        const fiyatlar = getFiyatlar(); // Bu zaten sıralı geliyor (en sonuncusu en yeni)

        if (statsToplamMalzemeEl) statsToplamMalzemeEl.textContent = urunler.length;
        if (statsToplamTedarikciEl) statsToplamTedarikciEl.textContent = tedarikciler.length;
        if (statsToplamFiyatEl) statsToplamFiyatEl.textContent = fiyatlar.length;
        
        if (statsSonFiyatTarihiEl) {
            if (fiyatlar.length > 0) {
                // Fiyatlar store'dan zaten tarihe göre tersten sıralı geldiği için ilk eleman en yenisidir.
                const sonFiyat = fiyatlar[0]; 
                statsSonFiyatTarihiEl.textContent = new Date(sonFiyat.tarih).toLocaleDateString('tr-TR');
            } else {
                statsSonFiyatTarihiEl.textContent = '-';
            }
        }
    }

    async function initializePageData() {
        showToast('Veriler yükleniyor, lütfen bekleyin...', 'info', 2000);
        try {
            await Promise.all([
                malzemeleriYukle(),
                tedarikcileriYukle(),
                fiyatlariYukle(),
                teklifleriYukle(),
                musterileriYukle()
            ]);
            console.log('Tüm başlangıç veri yükleme denemeleri tamamlandı.');
        
        const gunlukTarihInput = document.getElementById('gunlukTarihInput');
        if (gunlukTarihInput) {
                gunlukTarihInput.value = new Date().toISOString().split('T')[0];
            }
            guncelleAnasayfaIstatistikleri();
            
        } catch (error) {
            console.error('initializePageData Promise.all BEKLENMEDİK HATA:', error);
            // Hata durumunda UI'ı bilgilendir, ancak dummy data yükleme.
            // Gerekirse, her bir yükleme fonksiyonu kendi içinde boş veri setleyebilir.
            guncelleAnasayfaIstatistikleri(); // Boş veya hatalı verilerle istatistikleri yine de güncellemeye çalış
            showToast('Genel bir veri yükleme hatası oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.', 'error');
        }
    }

    initializePageData();

    // Ürünler değiştiğinde UI'ı güncelle
    subscribe('urunlerChanged', (guncelUrunler) => {
        guncelleUrunListesiTablosu(guncelUrunler, urunListesiTablosuBody);
        populeEtUrunSecimDropdown(guncelUrunler, grafikUrunSecimi, "-- Ürün Seçiniz --", true, null);
        guncelleGrafikTedarikciFiltresi(); 
        populeEtUrunSecimDropdown(guncelUrunler, fiyatGirisMalzemeSecimi, "-- Malzeme Seçiniz --", true, urun => ` (${urun.birim_adi || 'Tanımsız Birim'})`);
        guncelleFiyatGirisBirimGostergesi();
        guncelleAnasayfaIstatistikleri(); // Ana sayfa istatistiklerini de güncelle
    });

    // Tedarikçiler değiştiğinde UI'ı güncelle
    subscribe('tedarikcilerChanged', (guncelTedarikciler) => {
        guncelleTedarikciListesiTablosu(guncelTedarikciler, tedarikciListesiTablosuBody);
        populeTedarikciDropdown(guncelTedarikciler, fiyatGirisTedarikciSecimi, "-- Tedarikçi Seçiniz --");
        guncelleGrafikTedarikciFiltresi();
        guncelleAnasayfaIstatistikleri(); // Ana sayfa istatistiklerini de güncelle
    });

    // Fiyatlar değiştiğinde UI'ı güncelle
    subscribe('fiyatlarChanged', (guncelFiyatlar) => {
        gosterSonFiyatlarTablosu(guncelFiyatlar, sonFiyatlarTablosuBody, getUrunler(), getTedarikciler(), 5);
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
        guncelleAnasayfaIstatistikleri(); // Ana sayfa istatistiklerini de güncelle
    });

    // Teklifler değiştiğinde UI'ı güncelle (şimdilik sadece ana sayfa için, sonra teklifler tablosu eklenecek)
    subscribe('tekliflerChanged', (guncelTeklifler) => {
        // TODO: Teklifler tablosunu güncelleme fonksiyonu buraya gelecek
        // guncelleTekliflerTablosu(guncelTeklifler, tekliflerTabloBodyEl);
        guncelleAnasayfaIstatistikleri(); // Ana sayfa istatistiklerini de güncelle
    });

}); // DOMContentLoaded kapanışı 