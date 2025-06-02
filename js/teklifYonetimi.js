import {
    subscribe,
    getUrunler,
    getTeklifler,
    addTeklifToStore,
    updateTeklifInStore,
    removeTeklifByIdFromStore,
    getUrunById,
    getTeklifById,
    getFiyatlar,
    getMusteriler,
    getMusteriById
} from './store.js';
import {
    saveTeklif as saveTeklifAPI,
    deleteTeklif as deleteTeklifAPI
} from './api.js';
import {
    showToast,
    setButtonLoading,
    resetButtonLoading,
    populeEtUrunSecimDropdown,
    populeEtMusteriDropdown
} from './ui.js';
import { globalHataYakala } from './hataYonetimi.js';

// DOM Elementleri
const teklifForm = document.getElementById('teklifForm');
const teklifIdInput = document.getElementById('teklifIdInput');
const teklifNoInput = document.getElementById('teklifNoInput');
const teklifMusteriSecimi = document.getElementById('teklifMusteriSecimi');
const teklifMusteriAdiInput = document.getElementById('teklifMusteriAdiInput');
const teklifMusteriIletisimInput = document.getElementById('teklifMusteriIletisimInput');
const teklifTarihiInput = document.getElementById('teklifTarihiInput');
const teklifGecerlilikTarihiInput = document.getElementById('teklifGecerlilikTarihiInput');
const teklifUrunListesiContainer = document.getElementById('teklifUrunListesiContainer');
const teklifUrunEkleButton = document.getElementById('teklifUrunEkleButton');
const teklifParaBirimiInput = document.getElementById('teklifParaBirimiInput');
const teklifDurumInput = document.getElementById('teklifDurumInput');
const teklifNotlarInput = document.getElementById('teklifNotlarInput');
const teklifFormTemizleButton = document.getElementById('teklifFormTemizleButton');
const teklifListesiTablosuBody = document.querySelector('#teklifListesiTablosu tbody');

// Toplam Alanları DOM Elementleri (Geri Eklendi)
const teklifAraToplamSpan = document.getElementById('teklifAraToplamSpan');
const teklifIndirimOraniInput = document.getElementById('teklifIndirimOraniInput');
const teklifIndirimTutariSpan = document.getElementById('teklifIndirimTutariSpan');
const teklifKdvOraniInput = document.getElementById('teklifKdvOraniInput');
const teklifKdvTutariSpan = document.getElementById('teklifKdvTutariSpan');
const teklifGenelToplamSpan = document.getElementById('teklifGenelToplamSpan');

// Dinamik ürün satırları için sayaç
let urunSatirSayaci = 0;

function initTeklifYonetimi() {
    console.log('Teklif Yönetimi Modülü Başlatıldı.');
    renderTekliflerTablosu(getTeklifler());
    ayarlamaFormVarsayilanlari();

    teklifUrunEkleButton.addEventListener('click', () => yeniUrunSatiriEkle());

    teklifForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        // Test modu kontrolü script.js'den global olarak yönetiliyor varsayımı
        // if (testModuAktif) { 
        //     showToast('Test modunda teklif kaydedilemez.', 'info');
        //     return;
        // }

        const submitButton = teklifForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, 'Kaydediliyor...');

        try {
            const teklifData = teklifFormundanVeriAl();
            const id = teklifIdInput.value;
            
            const sonuc = await saveTeklifAPI(teklifData, id);
            
            // API'dan gelen yanıtı daha esnek kontrol et
            if (sonuc && (sonuc.data || (sonuc.message && (sonuc.message.toLowerCase().includes('başarıyla eklendi') || sonuc.message.toLowerCase().includes('başarıyla güncellendi'))))) {
                const basariMesaji = sonuc.message || (id ? 'Teklif başarıyla güncellendi.' : 'Teklif başarıyla eklendi.');
                showToast(basariMesaji, 'success');

                if (sonuc.data) {
                    if (id) {
                        updateTeklifInStore(sonuc.data);
                    } else {
                        addTeklifToStore(sonuc.data);
                    }
                } else {
                    console.warn('Başarılı işlem mesajı alındı ancak API yanıtında güncel veri (sonuc.data) bulunamadı. Teklif listesi güncellenmemiş olabilir. Tüm teklifleri yeniden yüklemek gerekebilir.');
                    // İdeal olarak burada tüm teklif listesini yeniden yüklemek için bir fonksiyon çağrılmalı
                    // Örneğin: fetchAndRenderAllTeklifler(); 
                }
                formuTemizle();
            } else {
                // Hata durumu veya beklenmedik yanıt
                const hataMesaji = sonuc && sonuc.message ? sonuc.message : 'Teklif kaydedilirken bilinmeyen bir hata oluştu.';
                throw new Error(hataMesaji);
            }
        } catch (error) {
            globalHataYakala(error, 'Teklif kaydedilirken bir sorun oluştu.');
        } finally {
            resetButtonLoading(submitButton);
        }
    });

    if(teklifFormTemizleButton) {
        teklifFormTemizleButton.addEventListener('click', formuTemizle);
    }

    // İndirim ve KDV oranı inputları için olay dinleyicileri (Geri Eklendi)
    if (teklifIndirimOraniInput) {
        teklifIndirimOraniInput.addEventListener('input', genelToplamlariHesapla);
    }
    if (teklifKdvOraniInput) {
        teklifKdvOraniInput.addEventListener('input', genelToplamlariHesapla);
    }

    // Liste üzerinden düzenle/sil işlemleri için olay dinleyicisi
    teklifListesiTablosuBody.addEventListener('click', async (event) => {
        const target = event.target;
        const teklifId = target.dataset.id;

        if (target.classList.contains('edit-teklif-btn')) {
            if (!teklifId) return;
            // if (testModuAktif) { showToast('Test modunda düzenleme yapılamaz.', 'info'); return; }
            const teklif = getTeklifById(teklifId);
            if (teklif) {
                teklifFormunuDoldur(teklif);
                showToast('Teklif bilgileri forma yüklendi.', 'info');
            } else {
                globalHataYakala(new Error('Düzenlenecek teklif bulunamadı.'), 'Teklif düzenleme');
            }
        } else if (target.classList.contains('delete-teklif-btn')) {
            if (!teklifId) return;
            // if (testModuAktif) { showToast('Test modunda silme yapılamaz.', 'info'); return; }
            const teklif = getTeklifById(teklifId);
            if (confirm(`'${teklif?.teklifNo || teklifId}' numaralı teklifi silmek istediğinize emin misiniz?`)) {
                try {
                    await deleteTeklifAPI(teklifId);
                    removeTeklifByIdFromStore(teklifId);
                    showToast('Teklif başarıyla silindi.', 'success');
                    formuTemizle(); // Eğer silinen teklif formda açıksa formu temizle
                } catch (error) {
                    globalHataYakala(error, 'Teklif silinirken bir sorun oluştu.');
                }
            }
        } else if (target.classList.contains('view-teklif-btn')) {
            if (!teklifId) return;
            const teklif = getTeklifById(teklifId);
            if (teklif) {
                // Şimdilik alert ile gösterelim, daha sonra modal veya detay sayfası eklenebilir.
                let teklifDetaylari = `Teklif No: ${teklif.teklifNo}\nMüşteri: ${teklif.musteriAdi}\nTarih: ${new Date(teklif.teklifTarihi).toLocaleDateString('tr-TR')}\nToplam: ${(parseFloat(teklif.genelToplamSatis) || 0).toFixed(2)} ${teklif.paraBirimi}\nDurum: ${teklif.durum}\n\nÜrünler:\n`;
                teklif.urunler.forEach(u => {
                    teklifDetaylari += `- ${u.malzemeAdi}: ${u.miktar} ${u.birim} x ${u.birimFiyat.toFixed(2)} = ${u.satirToplami.toFixed(2)}\n`;
                });
                alert(teklifDetaylari);
            } else {
                globalHataYakala(new Error('Görüntülenecek teklif bulunamadı.'), 'Teklif görüntüleme');
            }
        }
    });
}

function ayarlamaFormVarsayilanlari() {
    teklifTarihiInput.value = new Date().toISOString().split('T')[0];
    // Örnek bir geçerlilik tarihi (örn: 1 ay sonrası)
    const birAySonrasi = new Date();
    birAySonrasi.setMonth(birAySonrasi.getMonth() + 1);
    teklifGecerlilikTarihiInput.value = birAySonrasi.toISOString().split('T')[0];
    if (teklifIndirimOraniInput) teklifIndirimOraniInput.value = 0; 
    if (teklifKdvOraniInput) teklifKdvOraniInput.value = 20; 
    teklifParaBirimiInput.value = 'TL';
    teklifDurumInput.value = 'Hazırlanıyor';
    // sonrakiTeklifNumarasiniOner(); // Bu fonksiyon silindi, gerekirse tekrar eklenebilir
}

function formuTemizle() {
    teklifForm.reset();
    teklifIdInput.value = '';
    teklifUrunListesiContainer.innerHTML = ''; 
    urunSatirSayaci = 0; 
    
    ayarlamaFormVarsayilanlari(); 
    // genelToplamlariHesapla(); // Bu çağrı gereksiz, yeniUrunSatiriEkle zaten tetikler.

    yeniUrunSatiriEkle(); // Bu zaten kendi içinde genelToplamlariHesapla'yı tetikler.
    
    if(teklifFormTemizleButton) teklifFormTemizleButton.style.display = 'none';
    teklifNoInput.focus();
}

function yeniUrunSatiriEkle(urunVerisi = null) {
    console.log("[teklifYonetimi.js] yeniUrunSatiriEkle fonksiyonu çağrıldı.");
    urunSatirSayaci++;
    const satirId = `urunSatir_${urunSatirSayaci}`;

    const urunlerListesi = getUrunler() || []; 
    console.log("[teklifYonetimi.js] getUrunler() sonucu:", urunlerListesi);

    const urunSecenekleri = urunlerListesi.map(urun => {
        const ad = (urun && urun.ad) ? String(urun.ad).trim() : 'Bilinmeyen Ürün';
        const birim = (urun && urun.birim_adi) ? String(urun.birim_adi) : 'adet';
        const id = (urun && urun.id) ? urun.id : '';
        return `<option value="${id}" data-birim="${birim}">${ad} (${birim})</option>`;
    }).join('');

    const birimFiyatValue = (urunVerisi && urunVerisi.kaydedilen_birim_satis_fiyati !== undefined)
        ? (parseFloat(urunVerisi.kaydedilen_birim_satis_fiyati) || 0).toFixed(2)
        : (urunVerisi && typeof urunVerisi.birimFiyat === 'number') // Eski data yapısıyla uyumluluk için eklendi (birimFiyat)
            ? (urunVerisi.birimFiyat || 0).toFixed(2)
            : '0.00';

    const satirToplamiValue = (urunVerisi && urunVerisi.satir_toplam_satis_fiyati_kdv_haric !== undefined)
        ? (parseFloat(urunVerisi.satir_toplam_satis_fiyati_kdv_haric) || 0).toFixed(2)
        : (urunVerisi && typeof urunVerisi.satirToplami === 'number') // Eski data yapısıyla uyumluluk için eklendi (satirToplami)
            ? (urunVerisi.satirToplami || 0).toFixed(2)
            : '0.00';

    const urunSatiriHTML = `
        <div class="teklif-urun-satiri" id="${satirId}">
            <div class="form-group urun-secimi">
                <label for="urun_${urunSatirSayaci}">Malzeme:</label>
                <select id="urun_${urunSatirSayaci}" name="urunId" class="teklif-urun-malzeme" required>
                    <option value="">-- Malzeme Seçiniz --</option>
                    ${urunSecenekleri}
                </select>
            </div>
            <div class="form-group miktar">
                <label for="miktar_${urunSatirSayaci}">Miktar:</label>
                <input type="number" id="miktar_${urunSatirSayaci}" name="miktar" class="teklif-urun-miktar" min="0" step="any" required value="${(urunVerisi && urunVerisi.miktar) ? urunVerisi.miktar : '1'}">
            </div>
            <div class="form-group birim-fiyat">
                <label for="birimFiyat_${urunSatirSayaci}">Birim Fiyat:</label>
                <input type="number" id="birimFiyat_${urunSatirSayaci}" name="birimFiyat" class="teklif-urun-birim-fiyat" min="0" step="0.01" required value="${birimFiyatValue}">
            </div>
            <div class="form-group satir-toplami">
                <label>Satır Toplamı:</label>
                <span id="satirToplami_${urunSatirSayaci}" class="teklif-urun-satir-toplami">${satirToplamiValue}</span>
            </div>
            <button type="button" class="btn-icon remove-urun-satiri-btn" data-satirid="${satirId}">✖</button>
        </div>
    `;
    console.log("[teklifYonetimi.js] Oluşturulan HTML:", urunSatiriHTML);
    teklifUrunListesiContainer.insertAdjacentHTML('beforeend', urunSatiriHTML);
    console.log("[teklifYonetimi.js] HTML DOM'a eklendi. Satır ID:", satirId);

    // Yeni eklenen satırdaki elementlere olay dinleyicileri ekle
    const yeniSelect = document.getElementById(`urun_${urunSatirSayaci}`);
    const yeniMiktarInput = document.getElementById(`miktar_${urunSatirSayaci}`);
    const yeniBirimFiyatInput = document.getElementById(`birimFiyat_${urunSatirSayaci}`);
    const silmeButonu = document.querySelector(`#${satirId} .remove-urun-satiri-btn`);

    yeniSelect.addEventListener('change', (e) => {
        birimFiyatOner(e.target.value, satirId);
        urunSatiriHesapla(satirId); 
    });
    yeniMiktarInput.addEventListener('input', (e) => urunSatiriHesapla(satirId));
    yeniBirimFiyatInput.addEventListener('input', (e) => urunSatiriHesapla(satirId));
    silmeButonu.addEventListener('click', () => urunSatiriniSil(satirId));
    
    urunSatiriHesapla(satirId); // İlk hesaplamayı yap
}

function birimFiyatOner(urunId, satirId) {
    if (!urunId) {
        const birimFiyatInput = document.querySelector(`#${satirId} .teklif-urun-birim-fiyat`);
        if (birimFiyatInput) birimFiyatInput.value = '';
        return;
    }

    const fiyatlar = getFiyatlar(); 
    const urunFiyatlari = fiyatlar
        .filter(f => String(f.malzeme_id) === String(urunId))
        .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

    const birimFiyatInput = document.querySelector(`#${satirId} .teklif-urun-birim-fiyat`);
    if (birimFiyatInput) {
        if (urunFiyatlari.length > 0) {
            birimFiyatInput.value = parseFloat(urunFiyatlari[0].fiyat).toFixed(2);
        } else {
            birimFiyatInput.value = '';
        }
    }
}

function urunSatiriniSil(satirId) {
    const satirElementi = document.getElementById(satirId);
    if (satirElementi) {
        satirElementi.remove();
        genelToplamlariHesapla(); // Satır silindikten sonra genel toplamları yeniden hesapla
    }
}

function urunSatiriHesapla(satirId) {
    console.log(`[teklifYonetimi.js] urunSatiriHesapla çağrıldı. Satır ID: ${satirId}`);
    const miktarInput = document.querySelector(`#${satirId} .teklif-urun-miktar`);
    const birimFiyatInput = document.querySelector(`#${satirId} .teklif-urun-birim-fiyat`);
    const satirToplamiSpan = document.querySelector(`#${satirId} .teklif-urun-satir-toplami`);

    const miktar = parseFloat(miktarInput.value) || 0;
    const birimFiyat = parseFloat(birimFiyatInput.value) || 0;
    const satirToplami = miktar * birimFiyat;

    console.log(`[teklifYonetimi.js] Satır ${satirId} -> Miktar: ${miktar}, Birim Fiyat: ${birimFiyat}, Satır Toplamı: ${satirToplami}`);

    if (satirToplamiSpan) {
        satirToplamiSpan.textContent = satirToplami.toFixed(2);
    } else {
        console.error(`[teklifYonetimi.js] satirToplamiSpan bulunamadı! Satır ID: ${satirId}`);
    }
    genelToplamlariHesapla();
}

function genelToplamlariHesapla() {
    console.log("[teklifYonetimi.js] genelToplamlariHesapla çağrıldı.");
    let araToplam = 0;
    document.querySelectorAll('#teklifUrunListesiContainer .teklif-urun-satiri').forEach(satir => {
        const satirId = satir.id;
        const satirToplamiSpan = satir.querySelector('.teklif-urun-satir-toplami');
        let satirToplamiValue = 0;
        if (satirToplamiSpan) {
            satirToplamiValue = parseFloat(satirToplamiSpan.textContent) || 0;
        } else {
            console.warn(`[teklifYonetimi.js] Ara toplam hesaplanırken ${satirId} için .teklif-urun-satir-toplami span'i bulunamadı!`);
        }
        console.log(`[teklifYonetimi.js] Ara toplam için satır ${satirId} toplami: ${satirToplamiValue}`);
        araToplam += satirToplamiValue;
    });
    console.log(`[teklifYonetimi.js] Hesaplanan Ara Toplam: ${araToplam}`);

    const indirimOrani = parseFloat(teklifIndirimOraniInput.value) || 0;
    const kdvOrani = parseFloat(teklifKdvOraniInput.value) || 0;
    console.log(`[teklifYonetimi.js] İndirim Oranı: ${indirimOrani}%, KDV Oranı: ${kdvOrani}%`);

    const indirimTutari = (araToplam * indirimOrani) / 100;
    const tutarIndirimSonrasi = araToplam - indirimTutari;
    const kdvTutari = (tutarIndirimSonrasi * kdvOrani) / 100;
    const genelToplam = tutarIndirimSonrasi + kdvTutari;
    console.log(`[teklifYonetimi.js] İndirim Tutarı: ${indirimTutari}, KDV Tutarı: ${kdvTutari}, Genel Toplam: ${genelToplam}`);

    if (teklifAraToplamSpan) teklifAraToplamSpan.textContent = araToplam.toFixed(2);
    if (teklifIndirimTutariSpan) teklifIndirimTutariSpan.textContent = indirimTutari.toFixed(2);
    if (teklifKdvTutariSpan) teklifKdvTutariSpan.textContent = kdvTutari.toFixed(2);
    if (teklifGenelToplamSpan) teklifGenelToplamSpan.textContent = genelToplam.toFixed(2);
    console.log("[teklifYonetimi.js] Toplam span'leri güncellendi.");
}

function teklifFormundanVeriAl() {
    const urunler = [];
    document.querySelectorAll('#teklifUrunListesiContainer .teklif-urun-satiri').forEach(satir => {
        const urunMalzemeElement = satir.querySelector('.teklif-urun-malzeme');
        if (!urunMalzemeElement) {
            console.error('Teklif formu: Ürün malzeme elementi bir satırda bulunamadı. Bu satır atlanıyor.', satir);
            return; // Skips this iteration of forEach
        }
        const urunId = urunMalzemeElement.value;
        
        const malzemeOptionChecked = urunMalzemeElement.querySelector('option:checked');
        const malzemeAdiText = malzemeOptionChecked ? malzemeOptionChecked.textContent.split(' (')[0] : '';
        const malzemeAdi = malzemeAdiText.trim();
        const birim = malzemeOptionChecked ? malzemeOptionChecked.dataset.birim : '';

        const miktarElement = satir.querySelector('.teklif-urun-miktar');
        if (!miktarElement) {
            console.error('Teklif formu: Miktar input elementi bir satırda bulunamadı. Bu satır atlanıyor.', satir);
            return; // Skips this iteration of forEach
        }
        const miktar = parseFloat(miktarElement.value) || 0;

        const birimFiyatElement = satir.querySelector('.teklif-urun-birim-fiyat');
        if (!birimFiyatElement) {
            console.error('Teklif formu: Birim fiyat input elementi bir satırda bulunamadı. Bu satır atlanıyor.', satir);
            return; // Skips this iteration of forEach
        }
        const birimFiyat = parseFloat(birimFiyatElement.value) || 0;
        
        if (urunId && miktar > 0) { 
            urunler.push({
                urunId: urunId,
                malzemeAdi: malzemeAdi,
                miktar: miktar,
                birim: birim,
                kaydedilen_birim_satis_fiyati: birimFiyat,
                satirToplami: miktar * birimFiyat,
                kalemTipi: 'malzeme',
                aciklama: ''
            });
        }
    });

    const araToplam = parseFloat(teklifAraToplamSpan.textContent) || 0;
    const indirimOrani = parseFloat(teklifIndirimOraniInput.value) || 0;
    const indirimTutari = parseFloat(teklifIndirimTutariSpan.textContent) || 0;
    const kdvOrani = parseFloat(teklifKdvOraniInput.value) || 0;
    const kdvTutari = parseFloat(teklifKdvTutariSpan.textContent) || 0;
    const genelToplam = parseFloat(teklifGenelToplamSpan.textContent) || 0;

    return {
        teklifNo: teklifNoInput.value.trim(),
        musteriAdi: teklifMusteriAdiInput.value.trim(),
        musteriIletisim: teklifMusteriIletisimInput.value.trim(),
        teklifTarihi: teklifTarihiInput.value,
        gecerlilikTarihi: teklifGecerlilikTarihiInput.value,
        urunler: urunler,
        araToplam: araToplam,
        indirimOrani: indirimOrani,
        indirimTutari: indirimTutari,
        kdvOrani: kdvOrani,
        kdvTutari: kdvTutari,
        genelToplamSatis: genelToplam,
        paraBirimi: teklifParaBirimiInput.value,
        durum: teklifDurumInput.value,
        notlar: teklifNotlarInput.value.trim()
    };
}

function teklifFormunuDoldur(teklif) {
    formuTemizle(); 
    teklifIdInput.value = teklif.id;
    teklifNoInput.value = teklif.teklifNo || '';
    teklifMusteriAdiInput.value = teklif.musteriAdi || '';
    teklifMusteriIletisimInput.value = teklif.musteriIletisim || '';
    teklifTarihiInput.value = teklif.teklifTarihi ? teklif.teklifTarihi.split('T')[0] : '';
    teklifGecerlilikTarihiInput.value = teklif.gecerlilikTarihi ? teklif.gecerlilikTarihi.split('T')[0] : '';
    
    if (teklifIndirimOraniInput) teklifIndirimOraniInput.value = teklif.indirimOrani !== undefined ? teklif.indirimOrani : 0;
    if (teklifKdvOraniInput) teklifKdvOraniInput.value = teklif.kdvOrani !== undefined ? teklif.kdvOrani : 20;

    teklifParaBirimiInput.value = teklif.paraBirimi || 'TL';
    teklifDurumInput.value = teklif.durum || 'Hazırlanıyor';
    teklifNotlarInput.value = teklif.notlar || '';

    teklifUrunListesiContainer.innerHTML = ''; 
    urunSatirSayaci = 0;
    if (teklif.urunler && teklif.urunler.length > 0) {
        teklif.urunler.forEach(urunDetay => {
            yeniUrunSatiriEkle(urunDetay); 
            const sonSatirId = `urunSatir_${urunSatirSayaci}`;
            const malzemeSelect = document.querySelector(`#${sonSatirId} .teklif-urun-malzeme`);
            const miktarInput = document.querySelector(`#${sonSatirId} .teklif-urun-miktar`);
            
            if(malzemeSelect) malzemeSelect.value = urunDetay.referans_id;
            if(miktarInput) miktarInput.value = urunDetay.miktar;
            urunSatiriHesapla(sonSatirId); 
        });
    } 
    // else {
        // Ürün yoksa bile en az bir boş satır formuTemizle içindeki yeniUrunSatiriEkle tarafından eklenir.
    // }
    
    genelToplamlariHesapla(); 

    if(teklifFormTemizleButton) teklifFormTemizleButton.style.display = 'inline-block';
    teklifMusteriAdiInput.focus();
}

function renderTekliflerTablosu(teklifler) {
    teklifListesiTablosuBody.innerHTML = ''; // Tabloyu temizle
    if (!teklifler || teklifler.length === 0) {
        teklifListesiTablosuBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Gösterilecek teklif bulunamadı.</td></tr>';
        return;
    }

    teklifler.forEach(teklif => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${teklif.teklifNo || '-'}</td>
            <td>${teklif.musteriAdi || '-'}</td>
            <td>${teklif.teklifTarihi ? new Date(teklif.teklifTarihi).toLocaleDateString('tr-TR') : '-'}</td>
            <td>${teklif.gecerlilikTarihi ? new Date(teklif.gecerlilikTarihi).toLocaleDateString('tr-TR') : '-'}</td>
            <td>${(parseFloat(teklif.genelToplamSatis) || 0).toFixed(2)}</td>
            <td>${teklif.paraBirimi || '-'}</td>
            <td><span class="durum-badge durum-${(teklif.durum || '').toLowerCase().replace(/\s+/g, '-')}">${teklif.durum || '-'}</span></td>
            <td>
                <button class="btn-icon view-teklif-btn" data-id="${teklif.id}" title="Görüntüle">👁️</button>
                <button class="btn-icon edit-teklif-btn" data-id="${teklif.id}" title="Düzenle">✏️</button>
                <button class="btn-icon delete-teklif-btn" data-id="${teklif.id}" title="Sil">🗑️</button>
            </td>
        `;
        teklifListesiTablosuBody.appendChild(tr);
    });
}

// Store Değişikliklerine Abone Ol
subscribe('tekliflerChanged', (guncelTeklifler) => {
    renderTekliflerTablosu(guncelTeklifler);
});

subscribe('urunlerChanged', (guncelUrunler) => {
    // Eğer formda ürün satırları varsa, malzeme dropdown'larını güncelle
    document.querySelectorAll('.teklif-urun-malzeme').forEach(select => {
        const currentValue = select.value;
        let optionsHTML = '<option value="">-- Malzeme Seçiniz --</option>';
        optionsHTML += guncelUrunler.map(urun => 
            `<option value="${urun.id}" data-birim="${urun.birim_adi}" ${urun.id === currentValue ? 'selected' : ''}>
                ${urun.ad} (${urun.birim_adi})
            </option>`).join('');
        select.innerHTML = optionsHTML;
    });
});

subscribe('musterilerChanged', (guncelMusteriler) => {
    if (teklifMusteriSecimi) { // Elementin var olduğundan emin ol
        populeEtMusteriDropdown(guncelMusteriler, teklifMusteriSecimi, "-- Müşteri Seçiniz --", false);
    } else {
        console.error("teklifMusteriSecimi dropdown elementi bulunamadı.");
    }
});

// Modül başlangıç fonksiyonunu çağır
// DOMContentLoaded içinde script.js'den çağrılacak şekilde ayarlanabilir veya doğrudan çağrılabilir
// Ancak, diğer modüllerin yüklenmesini beklemek (özellikle store) iyi bir pratik olabilir.
document.addEventListener('DOMContentLoaded', () => {
    // Sadece #teklif-yonetimi section'ı aktif olduğunda veya görünür olduğunda başlatmak daha iyi olabilir
    // Şimdilik direkt başlatıyoruz, ileride optimize edilebilir.
    if (document.getElementById('teklif-yonetimi')) {
        initTeklifYonetimi();
        yeniUrunSatiriEkle(); // Sayfa yüklendiğinde forma boş bir ürün satırı ekle
    }
});

console.log('Teklif Yönetimi modülü (teklifYonetimi.js) yüklendi.'); 