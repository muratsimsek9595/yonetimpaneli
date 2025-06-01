import {
    getMalzemeler,
    saveMalzeme,
    deleteMalzeme,
    getTedarikciler,
    saveTedarikci,
    deleteTedarikci,
    getFiyatlar,
    saveFiyat,
    deleteFiyat
} from './api.js';
import {
    temizleUrunFormu,
    temizleTedarikciFormu,
    gosterSonFiyatlarTablosu,
    guncelleUrunListesiTablosu,
    populeEtUrunSecimDropdown,
    guncelleTedarikciListesiTablosu,
    populeEtTedarikciSecimDropdown as populeTedarikciDropdown
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

    if (anasayfaSection) {
        anasayfaSection.classList.add('active-section');
        const anasayfaLink = document.querySelector('.sidebar nav a[href="#anasayfa"]');
        if (anasayfaLink) anasayfaLink.classList.add('active');
    } else {
        if (sections.length > 0) {
            sections[0].classList.add('active-section');
            if (navLinks.length > 0) navLinks[0].classList.add('active');
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            sections.forEach(section => {
                section.id === targetId ? section.classList.add('active-section') : section.classList.remove('active-section');
            });
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
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
    
    // Global Değişkenler
    let urunler = [];
    let fiyatlar = [];
    let tedarikciler = [];
    let fiyatGrafigi; // Chart.js nesnesi için

    // Fonksiyon Tanımlamaları

    function tedarikciAdiniGetir(tedarikciId) {
        const tedarikci = tedarikciler.find(t => String(t.id) === String(tedarikciId));
        return tedarikci ? tedarikci.ad : '-';
    }

    function urunListesiniGuncelle() {
        guncelleUrunListesiTablosu(urunler, urunListesiTablosuBody);
        populeEtUrunSecimDropdown(urunler, grafikUrunSecimi, "-- Ürün Seçiniz --", true, null);
        guncelleGrafikTedarikciFiltresi();
        populeEtUrunSecimDropdown(urunler, fiyatGirisMalzemeSecimi, "-- Malzeme Seçiniz --", true, urun => ` (${urun.birim_adi || 'Tanımsız Birim'})`);
        guncelleFiyatGirisBirimGostergesi();
    }

    function tedarikciListesiniGuncelle() {
        guncelleTedarikciListesiTablosu(tedarikciler, tedarikciListesiTablosuBody);
        populeTedarikciDropdown(tedarikciler, fiyatGirisTedarikciSecimi, "-- Tedarikçi Seçiniz --"); // Grafik tedarikçi dropdown'ı ayrı güncelleniyor
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
        const id = urunIdInput.value;
        const ad = urunAdiInput.value.trim();
        let birimDegeri = urunBirimSecimi.value === 'diger' ? urunBirimAdiInput.value.trim() : urunBirimSecimi.value;
        if (!ad) return alert('Malzeme adı boş bırakılamaz!');
        if (urunBirimSecimi.value === 'diger' && !birimDegeri) return alert('Lütfen özel birim adını girin veya listeden bir birim seçin.');
        const malzemeVerisi = { ad, birim_adi: birimDegeri };
        try {
            const sonuc = await saveMalzeme(malzemeVerisi, id);
            console.log(sonuc?.message || (id ? 'Malzeme güncellendi.' : 'Malzeme eklendi.'), sonuc);
            await malzemeleriYukle();
            temizleUrunFormu(urunForm, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton);
        } catch (error) {
            globalHataYakala(error, `Malzeme ${id ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`);
        }
    });

    formTemizleButton.addEventListener('click', () => {
        temizleUrunFormu(urunForm, urunIdInput, urunAdiInput, urunBirimSecimi, ozelBirimContainer, urunBirimAdiInput, formTemizleButton);
    });

    urunListesiTablosuBody.addEventListener('click', async function(event) {
        const target = event.target;
        const urunId = target.dataset.id;
        if (!urunId) return; 

        const urun = urunler.find(u => String(u.id) === String(urunId));
        if (!urun && (target.classList.contains('edit-btn') || target.classList.contains('delete-btn'))) {
            return globalHataYakala(new Error("İşlem yapılacak ürün bulunamadı."), "Ürün işlemi sırasında");
        }

        if (target.classList.contains('edit-btn')) {
            urunIdInput.value = urun.id;
            urunAdiInput.value = urun.ad;
            const seceneklerdeVar = Array.from(urunBirimSecimi.options).some(option => option.value === urun.birim_adi);
            if (seceneklerdeVar && urun.birim_adi !== 'diger') {
                urunBirimSecimi.value = urun.birim_adi;
                ozelBirimContainer.style.display = 'none';
                urunBirimAdiInput.value = '';
            } else {
                urunBirimSecimi.value = 'diger';
                ozelBirimContainer.style.display = 'block';
                urunBirimAdiInput.value = urun.birim_adi || '';
            }
            formTemizleButton.style.display = 'inline-block';
            urunAdiInput.focus();
        } else if (target.classList.contains('delete-btn')) {
            if (confirm(`'${urun.ad}' malzemesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
                try {
                    const sonuc = await deleteMalzeme(urunId);
                    console.log(sonuc?.message || 'Malzeme silindi.', sonuc);
                    await malzemeleriYukle();
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
                const sonuc = await saveTedarikci(tedarikciVerisi, id);
                console.log(id ? 'Tedarikçi güncellendi.' : 'Yeni tedarikçi eklendi.', sonuc?.message || 'İşlem başarılı.', sonuc);
                await tedarikcileriYukle();
                temizleTedarikciFormu(tedarikciForm, tedarikciIdInput, tedarikciAdiInput, tedarikciYetkiliKisiInput, tedarikciTelefonInput, tedarikciEmailInput, tedarikciAdresInput, tedarikciNotInput, tedarikciFormTemizleButton);
            } catch (error) {
                globalHataYakala(error, `Tedarikçi ${id ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`);
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
            if (!tedarikciId) return;

            const tedarikci = tedarikciler.find(t => String(t.id) === String(tedarikciId));
            if (!tedarikci && (target.classList.contains('edit-btn') || target.classList.contains('delete-btn'))) {
                return globalHataYakala(new Error("İşlem yapılacak tedarikçi bulunamadı."), "Tedarikçi işlemi sırasında");
            }

            if (target.classList.contains('edit-btn')) {
                tedarikciIdInput.value = tedarikci.id;
                tedarikciAdiInput.value = tedarikci.ad || '';
                tedarikciYetkiliKisiInput.value = tedarikci.yetkili_kisi || '';
                tedarikciTelefonInput.value = tedarikci.telefon || '';
                tedarikciEmailInput.value = tedarikci.email || '';
                tedarikciAdresInput.value = tedarikci.adres || '';
                tedarikciNotInput.value = tedarikci.not_alani || '';
                tedarikciFormTemizleButton.style.display = 'inline-block';
                tedarikciAdiInput.focus();
            } else if (target.classList.contains('delete-btn')) {
                if (confirm(`'${tedarikci.ad}' tedarikçisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tedarikçiye ait tüm fiyat kayıtları da silinecektir!`)) {
                    try {
                        const sonuc = await deleteTedarikci(tedarikciId);
                        console.log(sonuc?.message || 'Tedarikçi silindi.', sonuc);
                        await tedarikcileriYukle();
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
        let filtrelenecekTedarikciler = tedarikciler;
        if (seciliUrunId) {
            const urunFiyatlari = fiyatlar.filter(f => String(f.malzeme_id) === String(seciliUrunId));
            const buUrununTedarikciIdleri = [...new Set(urunFiyatlari.map(f => String(f.tedarikci_id)))];
            filtrelenecekTedarikciler = tedarikciler.filter(t => buUrununTedarikciIdleri.includes(String(t.id)));
            tedarikciFilterGrafikDiv.style.display = filtrelenecekTedarikciler.length > 0 ? 'block' : 'none';
        } else {
            tedarikciFilterGrafikDiv.style.display = 'none';
        }
        populeTedarikciDropdown(filtrelenecekTedarikciler, grafikTedarikciSecimi, "-- Tüm Tedarikçiler --", true);
        fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, seciliUrunId, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, fiyatlar, urunler, tedarikciler, fiyatGrafigi);
    }

    grafikUrunSecimi.addEventListener('change', guncelleGrafikTedarikciFiltresi);
    grafikTedarikciSecimi.addEventListener('change', () => {
        fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, grafikUrunSecimi.value, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, fiyatlar, urunler, tedarikciler, fiyatGrafigi);
    });
    zamanAraligiSecimi.addEventListener('change', () => {
        fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, grafikUrunSecimi.value, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, fiyatlar, urunler, tedarikciler, fiyatGrafigi);
    });

    function guncelleFiyatGirisBirimGostergesi() {
        const seciliUrunId = fiyatGirisMalzemeSecimi.value;
        if (seciliUrunId) {
            const seciliUrun = urunler.find(u => String(u.id) === String(seciliUrunId));
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
                        const sonuc = await deleteFiyat(fiyatId);
                        console.log(sonuc?.message || 'Fiyat silindi.', sonuc);
                        await sonFiyatlariGuncelle();
                    } catch (error) {
                        globalHataYakala(error, 'Fiyat silinirken bir sorun oluştu.');
                    }
                }
            }
        });
    }

    gunlukFiyatForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const malzeme_id = fiyatGirisMalzemeSecimi.value;
        const tedarikci_id = fiyatGirisTedarikciSecimi.value;
        const fiyatValue = document.getElementById('gunlukFiyatInput').value;
        const tarih = document.getElementById('gunlukTarihInput').value;
        if (!malzeme_id || !tedarikci_id || fiyatValue === '' || !tarih) return alert('Lütfen tüm alanları doldurun.');
        const fiyatFloat = parseFloat(fiyatValue);
        if (isNaN(fiyatFloat)) return alert('Fiyat geçerli bir sayı olmalıdır.');
        const fiyatVerisi = { malzeme_id, tedarikci_id, fiyat: fiyatFloat, tarih };
        try {
            const sonuc = await saveFiyat(fiyatVerisi);
            console.log(sonuc?.message || 'Fiyat eklendi.', sonuc);
            gunlukFiyatForm.reset();
            guncelleFiyatGirisBirimGostergesi();
            document.getElementById('gunlukTarihInput').value = new Date().toISOString().split('T')[0];
            await sonFiyatlariGuncelle();
        } catch (error) {
            globalHataYakala(error, 'Fiyat kaydedilirken bir sorun oluştu.');
        }
    });

    async function malzemeleriYukle() {
        try {
            const apiUrunler = await getMalzemeler();
            urunler = apiUrunler && Array.isArray(apiUrunler) ? apiUrunler : [];
            // console.log("Malzemeler API'den yüklendi:", urunler); // Kontrol için
            urunListesiniGuncelle();
        } catch (error) {
            globalHataYakala(error, 'Malzemeler yüklenirken bir sorun oluştu.');
            if (urunListesiTablosuBody) urunListesiTablosuBody.innerHTML = '<tr><td colspan="3">Malzemeler yüklenemedi.</td></tr>';
            urunler = [];
            urunListesiniGuncelle(); // Hata durumunda da UI güncellensin
        }
    }

    async function tedarikcileriYukle() {
        try {
            const apiTedarikciler = await getTedarikciler();
            tedarikciler = apiTedarikciler && Array.isArray(apiTedarikciler) ? apiTedarikciler : [];
            // console.log("API'den gelen tedarikçiler:", tedarikciler); // Kontrol için
            tedarikciListesiniGuncelle();
        } catch (error) {
            globalHataYakala(error, 'Tedarikçiler yüklenirken bir sorun oluştu.');
            if (tedarikciListesiTablosuBody) tedarikciListesiTablosuBody.innerHTML = '<tr><td colspan="7">Tedarikçiler yüklenemedi.</td></tr>';
            tedarikciler = [];
            tedarikciListesiniGuncelle();
        }
    }

    async function sonFiyatlariGuncelle(tabloLimiti = 5) {
        try {
            const tumGelenFiyatlar = await getFiyatlar();
            fiyatlar = (tumGelenFiyatlar && Array.isArray(tumGelenFiyatlar) ? tumGelenFiyatlar : []).sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
            // console.log("Global fiyatlar güncellendi, toplam:", fiyatlar.length, "adet."); // Kontrol için
            gosterSonFiyatlarTablosu(fiyatlar, sonFiyatlarTablosuBody, urunler, tedarikciler, tabloLimiti);
            fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, grafikUrunSecimi.value, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, fiyatlar, urunler, tedarikciler, fiyatGrafigi);
        } catch (error) {
            globalHataYakala(error, 'Fiyatlar güncellenirken bir sorun oluştu.');
            if (sonFiyatlarTablosuBody) sonFiyatlarTablosuBody.innerHTML = '<tr><td colspan="6">Fiyatlar yüklenemedi.</td></tr>';
            fiyatlar = [];
            fiyatGrafigi = cizVeyaGuncelleFiyatGrafigi(fiyatGrafigiCanvas, grafikUrunSecimi.value, grafikTedarikciSecimi.value, zamanAraligiSecimi.value, fiyatlar, urunler, tedarikciler, fiyatGrafigi); // Hata durumunda grafiği boşalt
        }
    }

    async function initializePageData() {
        // console.log("Sayfa verileri yükleniyor..."); // Kontrol için
        try {
            await Promise.all([
                tedarikcileriYukle(),
                malzemeleriYukle()
            ]);
            await sonFiyatlariGuncelle(); // Malzemeler ve tedarikçiler yüklendikten sonra fiyatları yükle
            
            const gunlukTarihInput = document.getElementById('gunlukTarihInput');
            if (gunlukTarihInput) {
                gunlukTarihInput.value = new Date().toISOString().split('T')[0];
            }
            // console.log("Sayfa verileri başarıyla yüklendi."); // Kontrol için
        } catch (error) {
            globalHataYakala(error, "Sayfa başlatılırken genel bir hata oluştu. Lütfen sayfayı yenileyin.");
        }
    }

    initializePageData();

}); // DOMContentLoaded kapanışı 