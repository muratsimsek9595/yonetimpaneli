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
    getMusteriById,
    getIsciler
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
    populeEtMusteriDropdown,
    populeEtIsciSecimDropdown
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

// İşçilikle ilgili DOM Elementleri (Yeni Eklendi)
const teklifIscilikListesiContainer = document.getElementById('teklifIscilikListesiContainer');
const teklifIscilikEkleButton = document.getElementById('teklifIscilikEkleButton');

// Toplam Alanları DOM Elementleri (Geri Eklendi)
const teklifAraToplamSpan = document.getElementById('teklifAraToplamSpan');
const teklifIndirimOraniInput = document.getElementById('teklifIndirimOraniInput');
const teklifIndirimTutariSpan = document.getElementById('teklifIndirimTutariSpan');
const teklifKdvOraniInput = document.getElementById('teklifKdvOraniInput');
const teklifKdvTutariSpan = document.getElementById('teklifKdvTutariSpan');
const teklifGenelToplamSpan = document.getElementById('teklifGenelToplamSpan');

// Dinamik ürün satırları için sayaç
let urunSatirSayaci = 0;
// Dinamik işçilik satırları için sayaç
let iscilikSatirSayaci = 0;

function guncelleTeklifIsciDropdownlarini(iscilerListesiParam) {
    const iscilerListesi = iscilerListesiParam || getIsciler() || [];
    const aktifIsciler = iscilerListesi
        .filter(isci => isci.aktif)
        .sort((a, b) => (a.adSoyad || '').localeCompare(b.adSoyad || ''));

    document.querySelectorAll('.teklif-isci-secim').forEach(selectElement => {
        const currentSelectedId = selectElement.value;
        populeEtIsciSecimDropdown(aktifIsciler, selectElement, "-- İşçi Seçiniz --", true, currentSelectedId);
    });
}

function initTeklifYonetimi() {
    renderTekliflerTablosu(getTeklifler());
    formuTemizle();
    // Müşteri dropdown'ını sayfa yüklendiğinde doldur (EKLENDİ)
    if (teklifMusteriSecimi) {
        populeEtMusteriDropdown(getMusteriler(), teklifMusteriSecimi, "-- Müşteri Seçiniz --", false);
        teklifMusteriSecimi.addEventListener('change', (e) => {
            const musteriId = e.target.value;
            if (musteriId) {
                const musteri = getMusteriById(musteriId);
                if (musteri) {
                    teklifMusteriAdiInput.value = musteri.ad || '';
                    let iletisim = [];
                    if(musteri.telefon) iletisim.push(musteri.telefon);
                    if(musteri.email) iletisim.push(musteri.email);
                    teklifMusteriIletisimInput.value = iletisim.join(' / ');
                }
            } else {
                teklifMusteriAdiInput.value = '';
                teklifMusteriIletisimInput.value = '';
            }
        });
    }

    if (teklifUrunEkleButton) {
        teklifUrunEkleButton.addEventListener('click', () => yeniUrunSatiriEkle());
    }

    if (teklifIscilikEkleButton) {
        teklifIscilikEkleButton.addEventListener('click', () => yeniIscilikSatiriEkle());
    }

    teklifForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = teklifForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, 'Kaydediliyor...');

        try {
            const teklifData = teklifFormundanVeriAl();
            const id = teklifIdInput.value;
            
            const sonuc = await saveTeklifAPI(teklifData, id);
            
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
                    console.warn('Başarılı işlem mesajı alındı ancak API yanıtında güncel veri (sonuc.data) bulunamadı. Teklif listesi güncellenmemiş olabilir.');
                }
                formuTemizle();
            } else {
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

    if (teklifIndirimOraniInput) {
        teklifIndirimOraniInput.addEventListener('input', genelToplamlariHesapla);
    }
    if (teklifKdvOraniInput) {
        teklifKdvOraniInput.addEventListener('input', genelToplamlariHesapla);
    }

    const tableBodyForEvents = document.querySelector('#teklifListesiTablosu tbody');
    if (tableBodyForEvents) {
        tableBodyForEvents.addEventListener('click', async (event) => {
            const target = event.target;
            const teklifRow = target.closest('tr');
            const teklifId = target.dataset.id || target.closest('[data-id]')?.dataset.id;

            if (target.classList.contains('edit-teklif-btn') || target.closest('.edit-teklif-btn')) {
                if (!teklifId) return;
                const teklif = getTeklifById(teklifId);
                if (teklif) {
                    teklifFormunuDoldur(teklif);
                    showToast('Teklif bilgileri forma yüklendi.', 'info');
                } else {
                    globalHataYakala(new Error('Düzenlenecek teklif bulunamadı.'), 'Teklif düzenleme');
                }
            } else if (target.classList.contains('delete-teklif-btn')) {
                if (!teklifId) return;
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
    } else {
        console.warn('#teklifListesiTablosu tbody element not found for attaching event listeners.');
    }
    
    // Başlangıçta birer adet boş ürün ve işçilik satırı ekle (EKLENDİ)
    // Bu çağrılar ayarlamaFormVarsayilanlari içinde yapılıyor, burada tekrar gerek yok.
    // yeniUrunSatiriEkle();
    // yeniIscilikSatiriEkle(); 
    
    // ayarlamaFormVarsayilanlari içinde ilk satırlar ekleniyor.
    // O satırlardaki dropdown'ları mevcut işçi listesiyle doldurmayı dene.
    guncelleTeklifIsciDropdownlarini();

    genelToplamlariHesapla(); // Başlangıç toplamlarını hesapla
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
    
    // Form sıfırlandığında veya ilk açıldığında boş satırları ekle
    yeniUrunSatiriEkle();
    yeniIscilikSatiriEkle();
    genelToplamlariHesapla();
}

function formuTemizle() {
    teklifForm.reset();
    teklifIdInput.value = '';
    if (teklifUrunListesiContainer) teklifUrunListesiContainer.innerHTML = ''; 
    urunSatirSayaci = 0; 
    if (teklifIscilikListesiContainer) teklifIscilikListesiContainer.innerHTML = ''; // İşçilikleri de temizle (EKLENDİ)
    iscilikSatirSayaci = 0; // İşçilik sayacını sıfırla (EKLENDİ)
    
    ayarlamaFormVarsayilanlari(); 
    
    // Başlangıçta birer adet boş ürün ve işçilik satırı ekle (EKLENDİ)
    // Bu zaten ayarlamaFormVarsayilanlari içinde yapılıyor.
    // yeniUrunSatiriEkle(); 
    // yeniIscilikSatiriEkle();
    genelToplamlariHesapla(); // Temizlik sonrası toplamları hesapla

    if(teklifFormTemizleButton) teklifFormTemizleButton.style.display = 'none';
    if(teklifNoInput) teklifNoInput.focus();
}

function yeniUrunSatiriEkle(urunVerisi = null) {
    urunSatirSayaci++;
    const satirId = `urunSatir_${urunSatirSayaci}`;

    const urunlerListesi = getUrunler() || [];

    const urunSecenekleri = urunlerListesi.map(urun => {
        const ad = (urun && urun.ad) ? String(urun.ad).trim() : 'Bilinmeyen Ürün';
        const birim = (urun && urun.birim_adi) ? String(urun.birim_adi) : 'adet';
        const id = (urun && urun.id) ? urun.id : '';
        // urunVerisi varsa ve ID eşleşiyorsa 'selected' attribute'ünü ekle
        const selectedAttr = (urunVerisi && (String(urunVerisi.id) === String(id) || String(urunVerisi.urunId) === String(id))) ? 'selected' : '';
        return `<option value="${id}" data-birim="${birim}" ${selectedAttr}>${ad} (${birim})</option>`;
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
    teklifUrunListesiContainer.insertAdjacentHTML('beforeend', urunSatiriHTML);

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
    
    // Eğer urunVerisi varsa ve dropdown'da seçili değer yoksa (dinamik eklemeden sonra olabilir)
    // ve map içinde selectedAttr doğru çalıştıysa bu satıra gerek kalmayabilir.
    // Ancak garanti olması adına, dropdown DOM'a eklendikten sonra value'sunu set edebiliriz.
    if (urunVerisi && (urunVerisi.id || urunVerisi.urunId)) {
        yeniSelect.value = String(urunVerisi.id || urunVerisi.urunId); 
    }

    // Seçili ürün değiştiğinde birim fiyatı otomatik önerme (eğer düzenleme modunda değilse veya birim fiyat sıfırsa)
    if (yeniSelect.value) { // Eğer bir ürün seçiliyse (ya yeni eklendi ya da veriyle geldi)
        // Eğer urunVerisi var ve birim fiyatı zaten doluysa, birimFiyatOner'i tetikleme.
        // Sadece yeni eklenen boş satırlarda veya kullanıcı değiştirdiğinde tetiklensin.
        if (!urunVerisi || !birimFiyatValue || parseFloat(birimFiyatValue) === 0) {
             birimFiyatOner(yeniSelect.value, satirId);
        }
    }
    
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
    const miktarInput = document.querySelector(`#${satirId} .teklif-urun-miktar`);
    const birimFiyatInput = document.querySelector(`#${satirId} .teklif-urun-birim-fiyat`);
    const satirToplamiSpan = document.querySelector(`#${satirId} .teklif-urun-satir-toplami`);

    const miktar = parseFloat(miktarInput.value) || 0;
    const birimFiyat = parseFloat(birimFiyatInput.value) || 0;
    const satirToplami = miktar * birimFiyat;

    if (satirToplamiSpan) {
        satirToplamiSpan.textContent = satirToplami.toFixed(2);
    }
    genelToplamlariHesapla();
}

function genelToplamlariHesapla() {
    let araToplam = 0;

    // Malzeme satır toplamları
    document.querySelectorAll('#teklifUrunListesiContainer .teklif-urun-satiri').forEach(satir => {
        const satirToplamiSpan = satir.querySelector('.teklif-urun-satir-toplami');
        araToplam += parseFloat(satirToplamiSpan?.textContent) || 0;
    });

    // İşçilik satır toplamları (EKLENDİ)
    document.querySelectorAll('#teklifIscilikListesiContainer .teklif-iscilik-satiri').forEach(satir => {
        const satirToplamiSpan = satir.querySelector('.teklif-iscilik-satir-toplami');
        araToplam += parseFloat(satirToplamiSpan?.textContent) || 0;
    });

    if (teklifAraToplamSpan) teklifAraToplamSpan.textContent = araToplam.toFixed(2);

    const indirimOrani = parseFloat(teklifIndirimOraniInput?.value) || 0;
    const indirimTutari = (araToplam * indirimOrani) / 100;
    if (teklifIndirimTutariSpan) teklifIndirimTutariSpan.textContent = indirimTutari.toFixed(2);

    const toplamIndirimSonrasi = araToplam - indirimTutari;
    
    const kdvOrani = parseFloat(teklifKdvOraniInput?.value) || 0;
    const kdvTutari = (toplamIndirimSonrasi * kdvOrani) / 100;
    if (teklifKdvTutariSpan) teklifKdvTutariSpan.textContent = kdvTutari.toFixed(2);

    const genelToplam = toplamIndirimSonrasi + kdvTutari;
    if (teklifGenelToplamSpan) teklifGenelToplamSpan.textContent = genelToplam.toFixed(2);
}

function teklifFormundanVeriAl() {
    const kalemler = []; // urunler ve iscilikler birleşti

    // Malzemeleri topla
    document.querySelectorAll('#teklifUrunListesiContainer .teklif-urun-satiri').forEach(satir => {
        const urunMalzemeElement = satir.querySelector('.teklif-urun-malzeme');
        if (!urunMalzemeElement || !urunMalzemeElement.value) return;

        const malzemeOptionChecked = urunMalzemeElement.querySelector('option:checked');
        const malzemeAdi = (malzemeOptionChecked?.textContent.split(' (')[0] || '').trim();
        const birim = malzemeOptionChecked?.dataset.birim || '';
        const miktar = parseFloat(satir.querySelector('.teklif-urun-miktar')?.value) || 0;
        const birimFiyat = parseFloat(satir.querySelector('.teklif-urun-birim-fiyat')?.value) || 0;
        
        if (urunMalzemeElement.value && miktar > 0) { 
            kalemler.push({
                kalemTipi: 'malzeme', // kalemTipi eklendi
                referans_id: urunMalzemeElement.value, 
                aciklama: malzemeAdi, // malzemeAdi -> aciklama
                miktar: miktar,
                birim: birim,
                kaydedilen_birim_satis_fiyati: birimFiyat,
                satir_toplam_satis_fiyati_kdv_haric: miktar * birimFiyat
                // kaydedilen_birim_maliyet ve diğer maliyet alanları backend'de veya daha sonra eklenebilir.
            });
        }
    });

    // İşçilikleri topla
    document.querySelectorAll('#teklifIscilikListesiContainer .teklif-iscilik-satiri').forEach(satir => {
        const isciIdSelect = satir.querySelector('.teklif-isci-secim');
        if (!isciIdSelect || !isciIdSelect.value) return;

        const isciAdi = isciIdSelect.options[isciIdSelect.selectedIndex]?.text || '';
        const birim = satir.querySelector('.teklif-iscilik-birim')?.value || '';
        const miktar = parseFloat(satir.querySelector('.teklif-iscilik-miktar')?.value) || 0;
        const birimUcret = parseFloat(satir.querySelector('.teklif-iscilik-birim-ucret')?.value) || 0;

        if (isciIdSelect.value && miktar > 0) {
            kalemler.push({
                kalemTipi: 'iscilik', // kalemTipi eklendi
                referans_id: isciIdSelect.value, // isci_id -> referans_id
                aciklama: isciAdi, // isciAdi -> aciklama
                birim: birim,
                miktar: miktar,
                kaydedilen_birim_satis_fiyati: birimUcret, // birimUcret -> kaydedilen_birim_satis_fiyati
                satir_toplam_satis_fiyati_kdv_haric: miktar * birimUcret
            });
        }
    });

    const anaVeri = {
        id: teklifIdInput.value || null,
        teklifNo: teklifNoInput.value,
        musteriId: teklifMusteriSecimi.value,
        musteriAdi: teklifMusteriAdiInput.value,
        musteriIletisim: teklifMusteriIletisimInput.value,
        teklifTarihi: teklifTarihiInput.value,
        gecerlilikTarihi: teklifGecerlilikTarihiInput.value,
        indirimOrani: parseFloat(teklifIndirimOraniInput?.value) || 0,
        kdvOrani: parseFloat(teklifKdvOraniInput?.value) || 0,
        paraBirimi: teklifParaBirimiInput.value,
        durum: teklifDurumInput.value,
        notlar: teklifNotlarInput.value,
        urunler: kalemler, // 'kalemler' olarak güncellendi, backend 'urunler' bekliyor
        // Ara toplamlar, KDV vb. backend'de yeniden hesaplanabilir veya buradan gönderilebilir.
        // Şimdilik frontend'den gönderilen toplamları (genelToplamSatis vb.) backend'de de kullanıyoruz.
        araToplam: parseFloat(teklifAraToplamSpan?.textContent) || 0,
        indirimTutari: parseFloat(teklifIndirimTutariSpan?.textContent) || 0,
        kdvTutari: parseFloat(teklifKdvTutariSpan?.textContent) || 0,
        genelToplamSatis: parseFloat(teklifGenelToplamSpan?.textContent) || 0
    };
    return anaVeri;
}

function teklifFormunuDoldur(teklif) {
    if (!teklif) return;
    console.log("[TeklifYonetimi] teklifFormunuDoldur çağrıldı. Teklif verisi:", JSON.parse(JSON.stringify(teklif)));
    console.log("[TeklifYonetimi] teklifFormunuDoldur başında getMusteriler():", JSON.parse(JSON.stringify(getMusteriler())));
    if (teklifMusteriSecimi) {
        console.log(`[TeklifYonetimi] teklifFormunuDoldur, musteriId atamadan önce teklifMusteriSecimi.innerHTML:`, teklifMusteriSecimi.innerHTML);
    } else {
        console.log("[TeklifYonetimi] teklifFormunuDoldur, teklifMusteriSecimi elementi bulunamadı!");
    }
    
    // Formu temizlemeden önce müşteri dropdown'ı hariç diğer alanları sıfırla
    teklifIdInput.value = teklif.id || '';
    teklifNoInput.value = teklif.teklifNo || '';
    
    teklifMusteriAdiInput.value = ''; // Önce temizle
    teklifMusteriIletisimInput.value = ''; // Önce temizle
    
    // API'dan gelen yanıtta musteri_id kullanılıyor olabilir.
    const musteriIdFromTeklif = teklif.musteriId || teklif.musteri_id;

    if (teklifMusteriSecimi && musteriIdFromTeklif) {
        console.log(`[TeklifYonetimi] Müşteri atanıyor. musteriIdFromTeklif: ${musteriIdFromTeklif} (tip: ${typeof musteriIdFromTeklif}), mevcut seçenekler HTML:`, teklifMusteriSecimi.innerHTML);
        teklifMusteriSecimi.value = String(musteriIdFromTeklif);
        console.log(`[TeklifYonetimi] Müşteri atandıktan sonra teklifMusteriSecimi.value: ${teklifMusteriSecimi.value}`);
        
        const event = new Event('change');
        teklifMusteriSecimi.dispatchEvent(event);
        console.log(`[TeklifYonetimi] Müşteri için 'change' olayı tetiklendikten sonra teklifMusteriSecimi.value: ${teklifMusteriSecimi.value}`);
    } else {
         // musteriId yoksa ama musteriAdi varsa (eski data veya direkt isim girilmişse)
        console.log(`[TeklifYonetimi] Müşteri ID bulunamadı veya teklifMusteriSecimi elementi yok. teklif.musteriAdi: ${teklif.musteriAdi}`);
        teklifMusteriAdiInput.value = teklif.musteriAdi || '';
        teklifMusteriIletisimInput.value = teklif.musteriIletisim || '';
    }
    
    teklifTarihiInput.value = teklif.teklifTarihi ? new Date(teklif.teklifTarihi).toISOString().split('T')[0] : '';
    teklifGecerlilikTarihiInput.value = teklif.gecerlilikTarihi ? new Date(teklif.gecerlilikTarihi).toISOString().split('T')[0] : '';
    if(teklifIndirimOraniInput) teklifIndirimOraniInput.value = teklif.indirimOrani || 0;
    if(teklifKdvOraniInput) teklifKdvOraniInput.value = teklif.kdvOrani === undefined ? 20 : teklif.kdvOrani;
    
    // Para birimini ayarla: API'dan "0" geliyorsa "TL" olarak göster
    if (teklifParaBirimiInput) {
        if (teklif.paraBirimi === "0" || teklif.paraBirimi === 0) {
            teklifParaBirimiInput.value = 'TL';
        } else {
            teklifParaBirimiInput.value = teklif.paraBirimi || 'TL'; // Diğer durumlar veya null/undefined için varsayılan TL
        }
    }

    teklifDurumInput.value = teklif.durum || 'Hazırlanıyor';
    teklifNotlarInput.value = teklif.notlar || '';

    // Mevcut ürün ve işçilik satırlarını temizle
    if (teklifUrunListesiContainer) teklifUrunListesiContainer.innerHTML = '';
    urunSatirSayaci = 0;
    if (teklifIscilikListesiContainer) teklifIscilikListesiContainer.innerHTML = '';
    iscilikSatirSayaci = 0;

    // Kayıtlı kalemleri (ürünler ve işçilikler) forma yükle
    if (teklif.urunler && Array.isArray(teklif.urunler)) {
        teklif.urunler.forEach(kalem => {
            if (kalem.kalemTipi === 'malzeme') {
                yeniUrunSatiriEkle({ 
                    id: kalem.malzeme_id || kalem.referans_id, // API'dan malzeme_id geliyor olabilir
                    urunId: kalem.malzeme_id || kalem.referans_id, // Dropdown seçimi için
                    malzemeAdi: kalem.aciklama, 
                    miktar: kalem.miktar,
                    birim_adi: kalem.birim,
                    kaydedilen_birim_satis_fiyati: kalem.kaydedilen_birim_satis_fiyati, 
                    satir_toplam_satis_fiyati_kdv_haric: kalem.satir_toplam_satis_fiyati_kdv_haric 
                });
            } else if (kalem.kalemTipi === 'iscilik') {
                yeniIscilikSatiriEkle({
                    isciId: kalem.isci_id || kalem.referans_id, // API'dan isci_id geliyor olabilir
                    isciAdi: kalem.aciklama, 
                    birim: kalem.birim,
                    miktar: kalem.miktar,
                    birimUcret: kalem.kaydedilen_birim_satis_fiyati,
                    satirToplami: kalem.satir_toplam_satis_fiyati_kdv_haric
                });
            }
        });
    }
    
    // Eğer hiç ürün/işçilik satırı eklenmediyse (yeni teklif veya boş teklif), birer tane boş ekle
    if (teklifUrunListesiContainer && teklifUrunListesiContainer.childElementCount === 0) {
        yeniUrunSatiriEkle();
    }
    if (teklifIscilikListesiContainer && teklifIscilikListesiContainer.childElementCount === 0) {
        yeniIscilikSatiriEkle();
    }

    genelToplamlariHesapla(); // Tüm satırlar eklendikten sonra toplamları güncelle
    if(teklifFormTemizleButton) teklifFormTemizleButton.style.display = 'inline-block';
    if(teklifNoInput) teklifNoInput.focus();
}

function renderTekliflerTablosu(teklifler) {
    const tableBody = document.querySelector('#teklifListesiTablosu tbody');

    if (!tableBody) {
        return;
    }
    tableBody.innerHTML = ''; // Tabloyu temizle
    if (!teklifler || teklifler.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Gösterilecek teklif bulunamadı.</td></tr>';
        return;
    }

    teklifler.forEach((teklif, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${teklif.teklifNo || '-'}</td>
            <td>${teklif.musteriAdi || '-'}</td>
            <td>${teklif.teklifTarihi ? new Date(teklif.teklifTarihi).toLocaleDateString('tr-TR') : '-'}</td>
            <td>${teklif.gecerlilikTarihi ? new Date(teklif.gecerlilikTarihi).toLocaleDateString('tr-TR') : '-'}</td>
            <td>${(parseFloat(teklif.genelToplamSatis) || 0).toFixed(2)}</td>
            <td>${(teklif.paraBirimi === "0" || teklif.paraBirimi === 0) ? 'TL' : (teklif.paraBirimi || '-')}</td>
            <td><span class="durum-badge durum-${(teklif.durum || '').toLowerCase().replace(/\s+/g, '-')}">${teklif.durum || '-'}</span></td>
            <td>
                <button class="btn-icon view-teklif-btn" data-id="${teklif.id}" title="Görüntüle">👁️</button>
                <button class="btn-icon edit-teklif-btn" data-id="${teklif.id}" title="Düzenle">✏️</button>
                <button class="btn-icon delete-teklif-btn" data-id="${teklif.id}" title="Sil">🗑️</button>
            </td>
        `;
        tableBody.appendChild(tr);
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
        // console.error("teklifMusteriSecimi dropdown elementi bulunamadı."); // Bu logu şimdilik kapatalım, çok sık gelebilir.
    }
});

// iscilerChanged aboneliği initTeklifYonetimi dışına, modül seviyesine taşındı.
subscribe('iscilerChanged', (iscilerListesi) => {
    guncelleTeklifIsciDropdownlarini(iscilerListesi);
});

// Modül başlangıç fonksiyonunu çağır
// DOMContentLoaded içinde script.js'den çağrılacak şekilde ayarlanabilir veya doğrudan çağrılabilir
// Ancak, diğer modüllerin yüklenmesini beklemek (özellikle store) iyi bir pratik olabilir.
document.addEventListener('DOMContentLoaded', () => {
    // Sadece #teklif-yonetimi section'ı aktif olduğunda veya görünür olduğunda başlatmak daha iyi olabilir
    // Şimdilik direkt başlatıyoruz, ileride optimize edilebilir.
    if (document.getElementById('teklif-yonetimi')) {
        initTeklifYonetimi();
        // aşağıdaki satır initTeklifYonetimi içindeki ayarlamaFormVarsayilanlari tarafından zaten çağrılıyor.
        // yeniUrunSatiriEkle(); // Sayfa yüklendiğinde forma boş bir ürün satırı ekle
    }
});

console.log('Teklif Yönetimi modülü (teklifYonetimi.js) yüklendi.'); 

// --- İŞÇİLİK SATIRI FONKSİYONLARI (YENİ EKLENDİ) ---

function yeniIscilikSatiriEkle(iscilikVerisi = null) {
    if (!teklifIscilikListesiContainer) return;
    iscilikSatirSayaci++;
    const satirId = `iscilikSatir_${iscilikSatirSayaci}`;
    const iscilerListesi = getIsciler() || [];

    // Aktif işçileri alıp isme göre sırala
    const aktifIsciler = iscilerListesi
        .filter(isci => isci.aktif) // Varsayılan olarak aktif işçiler
        .sort((a, b) => (a.adSoyad || '').localeCompare(b.adSoyad || ''));

    const birimFiyatValue = (iscilikVerisi && iscilikVerisi.birimUcret !== undefined)
        ? (parseFloat(iscilikVerisi.birimUcret) || 0).toFixed(2)
        : '0.00';
    
    const satirToplamiValue = (iscilikVerisi && iscilikVerisi.satirToplami !== undefined)
        ? (parseFloat(iscilikVerisi.satirToplami) || 0).toFixed(2)
        : '0.00';

    const iscilikSatiriHTML = `
        <div class="teklif-urun-satiri teklif-iscilik-satiri" id="${satirId}">
            <div class="form-group isci-secimi">
                <label for="isci_${iscilikSatirSayaci}">İşçi:</label>
                <select id="isci_${iscilikSatirSayaci}" name="isciId" class="teklif-isci-secim" required>
                    <option value="">-- İşçi Seçiniz --</option>
                    ${aktifIsciler.map(isci => `<option value="${isci.id}">${isci.adSoyad}</option>`).join('')}
                </select>
            </div>
            <div class="form-group iscilik-birim">
                <label for="iscilikBirim_${iscilikSatirSayaci}">Birim:</label>
                <select id="iscilikBirim_${iscilikSatirSayaci}" name="iscilikBirim" class="teklif-iscilik-birim">
                    <option value="gun" ${iscilikVerisi && iscilikVerisi.birim === 'gun' ? 'selected' : ''}>Gün</option>
                    <option value="saat" ${iscilikVerisi && iscilikVerisi.birim === 'saat' ? 'selected' : ''}>Saat</option>
                    <option value="ay" ${iscilikVerisi && iscilikVerisi.birim === 'ay' ? 'selected' : ''}>Ay</option>
                    <option value="proje" ${iscilikVerisi && iscilikVerisi.birim === 'proje' ? 'selected' : ''}>Proje Başı</option>
                </select>
            </div>
            <div class="form-group miktar">
                <label for="iscilikMiktar_${iscilikSatirSayaci}">Miktar:</label>
                <input type="number" id="iscilikMiktar_${iscilikSatirSayaci}" name="iscilikMiktar" class="teklif-iscilik-miktar" min="0" step="any" required value="${(iscilikVerisi && iscilikVerisi.miktar) ? iscilikVerisi.miktar : '1'}">
            </div>
            <div class="form-group birim-fiyat">
                <label for="iscilikBirimUcret_${iscilikSatirSayaci}">Birim Ücret:</label>
                <input type="number" id="iscilikBirimUcret_${iscilikSatirSayaci}" name="iscilikBirimUcret" class="teklif-iscilik-birim-ucret" min="0" step="0.01" required value="${birimFiyatValue}">
            </div>
            <div class="form-group satir-toplami">
                <label>Satır Toplamı:</label>
                <span id="iscilikSatirToplami_${iscilikSatirSayaci}" class="teklif-iscilik-satir-toplami">${satirToplamiValue}</span>
            </div>
            <button type="button" class="btn-icon remove-iscilik-satiri-btn" data-satirid="${satirId}">✖</button>
        </div>
    `;
    teklifIscilikListesiContainer.insertAdjacentHTML('beforeend', iscilikSatiriHTML);

    const yeniIsciSelect = document.getElementById(`isci_${iscilikSatirSayaci}`);
    const yeniBirimSelect = document.getElementById(`iscilikBirim_${iscilikSatirSayaci}`);
    const yeniMiktarInput = document.getElementById(`iscilikMiktar_${iscilikSatirSayaci}`);
    const yeniBirimUcretInput = document.getElementById(`iscilikBirimUcret_${iscilikSatirSayaci}`);
    const silmeButonu = document.querySelector(`#${satirId} .remove-iscilik-satiri-btn`);

    // İşçi dropdown'ını doldur
    if (yeniIsciSelect) {
        populeEtIsciSecimDropdown(aktifIsciler, yeniIsciSelect, "-- İşçi Seçiniz --", !(iscilikVerisi && iscilikVerisi.isciId), iscilikVerisi ? iscilikVerisi.isciId : null);
        
        yeniIsciSelect.addEventListener('change', (e) => {
            const secilenIsciId = e.target.value;
            const secilenBirim = yeniBirimSelect.value;
            if (secilenIsciId) {
                const isci = getIsciler().find(i => i.id === parseInt(secilenIsciId));
                if (isci) {
                    if (secilenBirim === 'gun' && isci.gunlukUcret) {
                        yeniBirimUcretInput.value = (parseFloat(isci.gunlukUcret) || 0).toFixed(2);
                    } else if (secilenBirim === 'saat' && isci.saatlikUcret) {
                        yeniBirimUcretInput.value = (parseFloat(isci.saatlikUcret) || 0).toFixed(2);
                    } else {
                        // Diğer birimler veya ücret tanımlı değilse birim ücreti sıfırla veya boş bırak
                        // yeniBirimUcretInput.value = '0.00'; 
                    }
                }
            }
            iscilikSatiriHesapla(satirId);
        });
    }
    
    yeniBirimSelect.addEventListener('change', (e) => {
        const secilenIsciId = yeniIsciSelect.value;
        const secilenBirim = e.target.value;
         if (secilenIsciId) {
            const isci = getIsciler().find(i => i.id === parseInt(secilenIsciId));
            if (isci) {
                if (secilenBirim === 'gun' && isci.gunlukUcret) {
                    yeniBirimUcretInput.value = (parseFloat(isci.gunlukUcret) || 0).toFixed(2);
                } else if (secilenBirim === 'saat' && isci.saatlikUcret) {
                    yeniBirimUcretInput.value = (parseFloat(isci.saatlikUcret) || 0).toFixed(2);
                } else {
                    // Belki aylık ücret veya proje başı ücret de eklenebilir gelecekte
                    // Şimdilik diğer durumlarda manuel giriş beklenir.
                }
            }
        }
        iscilikSatiriHesapla(satirId);
    });

    [yeniMiktarInput, yeniBirimUcretInput].forEach(input => {
        input.addEventListener('input', () => iscilikSatiriHesapla(satirId));
    });

    silmeButonu.addEventListener('click', () => iscilikSatiriniSil(satirId));

    // Eğer veriyle dolduruluyorsa, seçili işçiye ve birime göre ayarla
    if (iscilikVerisi) {
        if (iscilikVerisi.isciId && yeniIsciSelect) {
            // populeEtIsciSecimDropdown, seciliIsciId parametresiyle seçimi yapmalı.
            // Ek güvence olarak ve populeEtIsciSecimDropdown'ın iç yapısını bilmediğimizden, değeri ayrıca set ediyoruz.
            yeniIsciSelect.value = String(iscilikVerisi.isciId);
        }
        if (iscilikVerisi.birim && yeniBirimSelect) {
            yeniBirimSelect.value = iscilikVerisi.birim;
        }
        // Programatik atamalardan sonra change event'i tetiklenmez.
        // birimUcret zaten iscilikVerisi'nden geliyor, change handler'ın bunu değiştirmesini istemeyiz.
        iscilikSatiriHesapla(satirId); // Yüklenen değerlerle satır toplamını hesapla.
    } else {
         // Yeni, boş satır için başlangıç hesaplaması
         iscilikSatiriHesapla(satirId);
    }
}

function iscilikSatiriniSil(satirId) {
    const satirElementi = document.getElementById(satirId);
    if (satirElementi) {
        satirElementi.remove();
        genelToplamlariHesapla();
    }
}

function iscilikSatiriHesapla(satirId) {
    const satirElementi = document.getElementById(satirId);
    if (!satirElementi) return;

    const miktarInput = satirElementi.querySelector('.teklif-iscilik-miktar');
    const birimUcretInput = satirElementi.querySelector('.teklif-iscilik-birim-ucret');
    const satirToplamiSpan = satirElementi.querySelector('.teklif-iscilik-satir-toplami');

    const miktar = parseFloat(miktarInput.value) || 0;
    const birimUcret = parseFloat(birimUcretInput.value) || 0;
    const satirToplami = miktar * birimUcret;

    satirToplamiSpan.textContent = satirToplami.toFixed(2);
    genelToplamlariHesapla();
}

// --- İŞÇİLİK SATIRI FONKSİYONLARI SONU ---

export { initTeklifYonetimi, renderTekliflerTablosu, formuTemizle as temizleTeklifFormu }; 