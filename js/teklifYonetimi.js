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

// Flag to ensure event listeners are attached only once
let teklifYonetimiListenersAttached = false;

// Helper function to format date as YYYYMMDD
function formatDateForTeklifNo(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
}

// Function to generate a new Teklif No
function generateNewTeklifNo() {
    const today = new Date();
    const formattedToday = formatDateForTeklifNo(today);
    const prefix = `TEK-${formattedToday}-`;

    const existingTeklifler = getTeklifler() || [];
    let maxSeq = 0;

    existingTeklifler.forEach(teklif => {
        if (teklif.teklifNo && teklif.teklifNo.startsWith(prefix)) {
            const seqPart = teklif.teklifNo.substring(prefix.length);
            const seq = parseInt(seqPart, 10);
            if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
            }
        }
    });

    const newSeq = (maxSeq + 1).toString().padStart(3, '0');
    return `${prefix}${newSeq}`;
}

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
    // Always run these to refresh UI state when this function is called
    renderTekliflerTablosu(getTeklifler());
    if (teklifMusteriSecimi) {
        populeEtMusteriDropdown(getMusteriler(), teklifMusteriSecimi, "-- Müşteri Seçiniz --", false);
    }
    guncelleTeklifIsciDropdownlarini(); // Ensure dropdowns are fresh

    // Attach event listeners only once
    if (!teklifYonetimiListenersAttached) {
        console.log("Attaching Teklif Yönetimi event listeners for the first time.");

        if (teklifMusteriSecimi) {
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

        if (teklifForm) { // Check if teklifForm exists before adding listener
            teklifForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const submitButton = teklifForm.querySelector('button[type="submit"]');
                
                // Teklif Numarası Benzersizlik Kontrolü
                const girilenTeklifNo = teklifNoInput.value.trim();
                const mevcutId = teklifIdInput.value;
                const tumTeklifler = getTeklifler() || [];

                const ayniNumaraliBaskaTeklifVar = tumTeklifler.some(teklif => {
                    // Mevcut düzenlenmekte olan teklifi kontrol dışı bırak
                    if (mevcutId && String(teklif.id) === String(mevcutId)) {
                        return false;
                    }
                    return teklif.teklifNo === girilenTeklifNo;
                });

                if (ayniNumaraliBaskaTeklifVar) {
                    showToast(`Hata: '${girilenTeklifNo}' numaralı bir teklif zaten mevcut. Lütfen farklı bir numara girin.`, 'error');
                    teklifNoInput.focus();
                    return; // Form gönderimini durdur
                }
                // --- Kontrol Sonu ---

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
        }

        if (teklifFormTemizleButton) {
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
        
        teklifYonetimiListenersAttached = true;
    } else {
        console.log("Teklif Yönetimi event listeners already attached, skipping re-attachment.");
    }
    
    // Always reset the form state (which includes adding initial rows)
    formuTemizle();
    // genelToplamlariHesapla(); // This is called within formuTemizle -> ayarlamaFormVarsayilanlari
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
    
    // Generate and set the new Teklif No
    if (teklifNoInput) { // Check if the input exists
        teklifNoInput.value = generateNewTeklifNo();
    }
    
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
        const selectedAttr = (urunVerisi && (String(urunVerisi.id) === String(id) || String(urunVerisi.urunId) === String(id))) ? 'selected' : '';
        return `<option value="${id}" data-birim="${birim}" ${selectedAttr}>${ad} (${birim})</option>`;
    }).join('');

    const birimSatisFiyatiValue = (urunVerisi && urunVerisi.kaydedilen_birim_satis_fiyati !== undefined)
        ? (parseFloat(urunVerisi.kaydedilen_birim_satis_fiyati) || 0).toFixed(2)
        : (urunVerisi && typeof urunVerisi.birimFiyat === 'number') 
            ? (urunVerisi.birimFiyat || 0).toFixed(2)
            : '0.00';

    // satirToplamiValue artık ilk maliyeti gösterecek, eğer urunVerisi.kaydedilen_birim_maliyet varsa onu kullan
    const birimMaliyetValue = (urunVerisi && urunVerisi.kaydedilen_birim_maliyet !== undefined)
        ? (parseFloat(urunVerisi.kaydedilen_birim_maliyet) || 0).toFixed(2)
        : '0.00';
    const miktarValue = (urunVerisi && urunVerisi.miktar) ? urunVerisi.miktar : '1';
    const satirToplamiValue = (parseFloat(birimMaliyetValue) * parseFloat(miktarValue)).toFixed(2);

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
                <input type="number" id="miktar_${urunSatirSayaci}" name="miktar" class="teklif-urun-miktar" min="0" step="any" required value="${miktarValue}">
            </div>
            <div class="form-group birim-maliyet">
                <label for="birimMaliyet_${urunSatirSayaci}">Birim Maliyet (KDV Hariç):</label>
                <input type="number" id="birimMaliyet_${urunSatirSayaci}" name="birimMaliyet" class="teklif-urun-birim-maliyet" min="0" step="0.01" value="${birimMaliyetValue}">
            </div>
            <div class="form-group birim-fiyat">
                <label for="birimFiyat_${urunSatirSayaci}">Birim Satış Fiyatı:</label>
                <input type="number" id="birimFiyat_${urunSatirSayaci}" name="birimSatisFiyati" class="teklif-urun-birim-satis-fiyati" min="0" step="0.01" required value="${birimSatisFiyatiValue}">
            </div>
            <div class="form-group birim-fiyat-turu">
                <label for="fiyatTuru_${urunSatirSayaci}">Satış Fiyatı Türü:</label>
                <select id="fiyatTuru_${urunSatirSayaci}" name="fiyatTuru" class="teklif-urun-fiyat-turu">
                    <option value="haric" ${ (urunVerisi && urunVerisi.fiyatTuruSatis === 'haric') ? 'selected' : '' }>KDV Hariç</option>
                    <option value="dahil" ${ (urunVerisi && urunVerisi.fiyatTuruSatis === 'dahil') ? 'selected' : '' }>KDV Dahil</option>
                </select>
            </div>
            <div class="form-group satir-toplami">
                <label>Satır Toplam Maliyeti (KDV Hariç):</label>
                <span id="satirToplami_${urunSatirSayaci}" class="teklif-urun-satir-toplami">${satirToplamiValue}</span>
                 <small class="satir-kdv-tutari-gosterge" style="display: block; font-size: 0.8em; color: #555;">Satış KDV: 0.00</small>
            </div>
            <button type="button" class="btn-icon remove-urun-satiri-btn" data-satirid="${satirId}">✖</button>
        </div>
    `;
    teklifUrunListesiContainer.insertAdjacentHTML('beforeend', urunSatiriHTML);

    // Olay dinleyicileri aynı kalacak, urunSatiriHesapla içindeki mantık değişecek
    const yeniSelect = document.getElementById(`urun_${urunSatirSayaci}`);
    const yeniMiktarInput = document.getElementById(`miktar_${urunSatirSayaci}`);
    const yeniBirimMaliyetInput = document.getElementById(`birimMaliyet_${urunSatirSayaci}`);
    const yeniBirimSatisFiyatInput = document.getElementById(`birimFiyat_${urunSatirSayaci}`);
    const yeniFiyatTuruSelect = document.getElementById(`fiyatTuru_${urunSatirSayaci}`);
    const silmeButonu = document.querySelector(`#${satirId} .remove-urun-satiri-btn`);

    yeniSelect.addEventListener('change', (e) => {
        birimFiyatOner(e.target.value, satirId); // Bu satış fiyatını önerir, maliyeti değil.
        // Maliyet için ayrı bir öneri mekanizması eklenebilir veya manuel girilir.
        urunSatiriHesapla(satirId); 
    });
    [yeniMiktarInput, yeniBirimMaliyetInput, yeniBirimSatisFiyatInput, yeniFiyatTuruSelect].forEach(input => {
        input.addEventListener('input', () => urunSatiriHesapla(satirId));
        if (input.tagName === 'SELECT') { // Select için change de dinleyelim
            input.addEventListener('change', () => urunSatiriHesapla(satirId));
        }
    });
    silmeButonu.addEventListener('click', () => urunSatiriniSil(satirId));
    
    if (urunVerisi && (urunVerisi.id || urunVerisi.urunId)) {
        yeniSelect.value = String(urunVerisi.id || urunVerisi.urunId); 
    }

    if (yeniSelect.value) {
        if (!urunVerisi || !birimSatisFiyatiValue || parseFloat(birimSatisFiyatiValue) === 0) {
             birimFiyatOner(yeniSelect.value, satirId);
        }
    }
    
    urunSatiriHesapla(satirId); 
}

function birimFiyatOner(urunId, satirId) {
    if (!urunId) {
        const birimFiyatInput = document.querySelector(`#${satirId} .teklif-urun-birim-satis-fiyati`);
        if (birimFiyatInput) birimFiyatInput.value = '';
        return;
    }

    const fiyatlar = getFiyatlar(); 
    const urunFiyatlari = fiyatlar
        .filter(f => String(f.malzeme_id) === String(urunId))
        .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

    const birimFiyatInput = document.querySelector(`#${satirId} .teklif-urun-birim-satis-fiyati`);
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
    console.log(`[urunSatiriHesapla] ${satirId} için çağrıldı.`);
    const satirElementi = document.getElementById(satirId);
    if (!satirElementi) {
        console.error(`[urunSatiriHesapla] ${satirId} bulunamadı.`);
        return;
    }

    const miktarInput = satirElementi.querySelector('.teklif-urun-miktar');
    const birimMaliyetInput = satirElementi.querySelector('.teklif-urun-birim-maliyet');
    const birimSatisFiyatInput = satirElementi.querySelector('.teklif-urun-birim-satis-fiyati');
    const fiyatTuruSelect = satirElementi.querySelector('.teklif-urun-fiyat-turu');
    const satirToplamiMaliyetSpan = satirElementi.querySelector('.teklif-urun-satir-toplami'); 
    const satirKdvTutariGosterge = satirElementi.querySelector('.satir-kdv-tutari-gosterge');

    const miktarValue = miktarInput?.value;
    const birimMaliyetValue = birimMaliyetInput?.value;
    console.log(`[urunSatiriHesapla] ${satirId} - Okunan HAM değerler: miktar='${miktarValue}', birimMaliyet='${birimMaliyetValue}'`);

    const miktar = parseFloat(miktarValue) || 0;
    const girilenBirimMaliyet = parseFloat(birimMaliyetValue) || 0;
    console.log(`[urunSatiriHesapla] ${satirId} - PARSED değerler: miktar=${miktar}, girilenBirimMaliyet=${girilenBirimMaliyet}`);

    // Maliyet Hesaplaması (KDV Hariç varsayılıyor)
    const satirToplamMaliyetKdvHaric = miktar * girilenBirimMaliyet;
    console.log(`[urunSatiriHesapla] ${satirId} - Hesaplanan satirToplamMaliyetKdvHaric: ${satirToplamMaliyetKdvHaric}`);

    satirElementi.dataset.maliyetTutari = satirToplamMaliyetKdvHaric.toFixed(2);
    if (satirToplamiMaliyetSpan) {
        satirToplamiMaliyetSpan.textContent = satirToplamMaliyetKdvHaric.toFixed(2); 
        console.log(`[urunSatiriHesapla] ${satirId} - satirToplamiMaliyetSpan.textContent AYARLANDI: '${satirToplamiMaliyetSpan.textContent}'`);
    } else {
        console.error(`[urunSatiriHesapla] ${satirId} için satirToplamiMaliyetSpan bulunamadı!`);
    }

    // Satış Fiyatı ve Satış KDV Hesaplaması (Müşteriye yansıtılacak fiyat üzerinden)
    let kdvHaricBirimSatisFiyati = 0;
    let satirSatisKdvTutari = 0;
    let satirToplamiSatisKdvHaric = 0;

    const girilenBirimSatisFiyati = parseFloat(birimSatisFiyatInput?.value) || 0;
    const fiyatTuruSatis = fiyatTuruSelect?.value || 'haric'; 
    const genelKdvOrani = parseFloat(teklifKdvOraniInput?.value) || 0;

    if (fiyatTuruSatis === 'dahil') {
        kdvHaricBirimSatisFiyati = girilenBirimSatisFiyati / (1 + (genelKdvOrani / 100));
        satirToplamiSatisKdvHaric = miktar * kdvHaricBirimSatisFiyati;
        const satirToplamiSatisKdvDahil = miktar * girilenBirimSatisFiyati;
        satirSatisKdvTutari = satirToplamiSatisKdvDahil - satirToplamiSatisKdvHaric;
    } else { 
        kdvHaricBirimSatisFiyati = girilenBirimSatisFiyati;
        satirToplamiSatisKdvHaric = miktar * kdvHaricBirimSatisFiyati;
        satirSatisKdvTutari = satirToplamiSatisKdvHaric * (genelKdvOrani / 100);
    }
    
    satirElementi.dataset.kdvTutari = satirSatisKdvTutari.toFixed(2); 
    satirElementi.dataset.satisToplamiKdvHaricUrun = satirToplamiSatisKdvHaric.toFixed(2); 

    if (satirKdvTutariGosterge) {
        satirKdvTutariGosterge.textContent = `Satış KDV: ${satirSatisKdvTutari.toFixed(2)}`;
    }

    genelToplamlariHesapla();
}

function genelToplamlariHesapla() {
    let araToplamSatisKdvHaric = 0;
    let toplamMaliyetKdvHaric = 0;
    let toplamSatisKdv = 0;

    // Malzeme satır toplamları, maliyetleri ve KDV'leri
    document.querySelectorAll('#teklifUrunListesiContainer .teklif-urun-satiri').forEach(satir => {
        // Maliyet
        toplamMaliyetKdvHaric += parseFloat(satir.dataset.maliyetTutari) || 0;
        // Satış (KDV Hariç) - Yeni dataset'ten oku
        araToplamSatisKdvHaric += parseFloat(satir.dataset.satisToplamiKdvHaricUrun) || 0;
        // Satış KDV'si
        toplamSatisKdv += parseFloat(satir.dataset.kdvTutari) || 0; 
    });

    // İşçilik satır maliyetleri ve KDV'leri
    const genelKdvOraniInputVal = teklifKdvOraniInput?.value ? parseFloat(teklifKdvOraniInput.value) : 0;
    document.querySelectorAll('#teklifIscilikListesiContainer .teklif-iscilik-satiri').forEach(satir => {
        // Maliyet
        toplamMaliyetKdvHaric += parseFloat(satir.dataset.maliyetTutariIscilik) || 0;
        
        // İşçilik için satış fiyatı artık girilmiyor, bu yüzden işçilikten satış geliri ve KDV'si olmayacak.
        // Eğer işçilik maliyeti aynı zamanda satış fiyatı gibi düşünülüyorsa ve KDV uygulanacaksa, bu mantık değişmeli.
        // Şimdiki durumda, işçilik ara satış toplamına ve KDV'ye katkıda bulunmayacak.
        // const kdvHaricSatisTutarIscilik = parseFloat(satir.querySelector('.teklif-iscilik-satir-toplami')?.textContent) || 0;
        // araToplamSatisKdvHaric += kdvHaricSatisTutarIscilik; // İşçilikten satış geliri yok
        // toplamSatisKdv += kdvHaricSatisTutarIscilik * (genelKdvOraniInputVal / 100); // İşçilikten KDV yok
    });

    const teklifToplamMaliyetSpan = document.getElementById('teklifToplamMaliyetSpan');
    if (teklifToplamMaliyetSpan) {
        teklifToplamMaliyetSpan.textContent = toplamMaliyetKdvHaric.toFixed(2);
    }

    if (teklifAraToplamSpan) teklifAraToplamSpan.textContent = araToplamSatisKdvHaric.toFixed(2);

    const indirimOrani = parseFloat(teklifIndirimOraniInput?.value) || 0;
    const indirimTutari = (araToplamSatisKdvHaric * indirimOrani) / 100; 
    if (teklifIndirimTutariSpan) teklifIndirimTutariSpan.textContent = indirimTutari.toFixed(2);

    const toplamSatisIndirimSonrasiKdvHaric = araToplamSatisKdvHaric - indirimTutari;
    
    if (teklifKdvTutariSpan) teklifKdvTutariSpan.textContent = toplamSatisKdv.toFixed(2);

    const genelToplamSatisKdvDahil = toplamSatisIndirimSonrasiKdvHaric + toplamSatisKdv;
    if (teklifGenelToplamSpan) teklifGenelToplamSpan.textContent = genelToplamSatisKdvDahil.toFixed(2);

    const teklifToplamKarSpan = document.getElementById('teklifToplamKarSpan');
    if (teklifToplamKarSpan) {
        const toplamKar = toplamSatisIndirimSonrasiKdvHaric - toplamMaliyetKdvHaric;
        teklifToplamKarSpan.textContent = toplamKar.toFixed(2);
    }
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
        
        const birimMaliyet = parseFloat(satir.querySelector('.teklif-urun-birim-maliyet')?.value) || 0;
        const birimSatisFiyati = parseFloat(satir.querySelector('.teklif-urun-birim-satis-fiyati')?.value) || 0;
        const fiyatTuru = satir.querySelector('.teklif-urun-fiyat-turu')?.value || 'haric';
        const kalemSatisKdvTutari = parseFloat(satir.dataset.kdvTutari) || 0; 
        const kalemToplamMaliyetKdvHaric = parseFloat(satir.dataset.maliyetTutari) || 0; 
        // Satırın KDV hariç satış toplamını dataset'ten oku
        const kalemToplamSatisKdvHaric = parseFloat(satir.dataset.satisToplamiKdvHaricUrun) || 0;
        
        if (urunMalzemeElement.value && miktar > 0) { 
            kalemler.push({
                kalemTipi: 'malzeme', 
                referans_id: urunMalzemeElement.value, 
                aciklama: malzemeAdi, 
                miktar: miktar,
                birim: birim,
                kaydedilen_birim_maliyet: birimMaliyet,
                satir_toplam_maliyet_kdv_haric: kalemToplamMaliyetKdvHaric,
                kaydedilen_birim_satis_fiyati: birimSatisFiyati,
                fiyatTuruSatis: fiyatTuru,
                satir_toplam_satis_fiyati_kdv_haric: kalemToplamSatisKdvHaric, // Güncellendi
                kalem_satis_kdv_tutari: kalemSatisKdvTutari
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
        const birimMaliyet = parseFloat(satir.querySelector('.teklif-iscilik-birim-maliyet')?.value) || 0;
        // const birimSatisUcreti = parseFloat(satir.querySelector('.teklif-iscilik-birim-satis-ucreti')?.value) || 0; // Bu alan kaldırıldı
        const satirToplamMaliyetKdvHaric = parseFloat(satir.dataset.maliyetTutariIscilik) || 0;
        // const satirToplamSatisKdvHaric = parseFloat(satir.querySelector('.teklif-iscilik-satir-toplami')?.textContent) || 0; // Bu span artık maliyeti gösteriyor

        if (isciIdSelect.value && miktar > 0) {
            kalemler.push({
                kalemTipi: 'iscilik', 
                referans_id: isciIdSelect.value, 
                aciklama: isciAdi, 
                birim: birim,
                miktar: miktar,
                kaydedilen_birim_maliyet: birimMaliyet,
                satir_toplam_maliyet_kdv_haric: satirToplamMaliyetKdvHaric,
                kaydedilen_birim_satis_fiyati: 0, // İşçilik için satış fiyatı yok
                satir_toplam_satis_fiyati_kdv_haric: 0 // İşçilik için KDV hariç satış toplamı yok
                // İşçilik için KDV detayları (fiyatTuruSatis, kalem_satis_kdv_tutari) burada yok,
                // çünkü KDV'nin genel olarak hesaplanacağını varsaydık ve işçilikte KDV yok.
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
    
    teklifIdInput.value = teklif.id || '';
    teklifNoInput.value = teklif.teklifNo || '';
    
    teklifMusteriAdiInput.value = ''; 
    teklifMusteriIletisimInput.value = ''; 
    
    const musteriIdFromTeklif = teklif.musteriId || teklif.musteri_id;

    if (teklifMusteriSecimi && musteriIdFromTeklif) {
        console.log(`[TeklifYonetimi] Müşteri atanıyor. musteriIdFromTeklif: ${musteriIdFromTeklif} (tip: ${typeof musteriIdFromTeklif}), mevcut seçenekler HTML:`, teklifMusteriSecimi.innerHTML);
        teklifMusteriSecimi.value = String(musteriIdFromTeklif);
        console.log(`[TeklifYonetimi] Müşteri atandıktan sonra teklifMusteriSecimi.value: ${teklifMusteriSecimi.value}`);
        
        const event = new Event('change');
        teklifMusteriSecimi.dispatchEvent(event);
        console.log(`[TeklifYonetimi] Müşteri için 'change' olayı tetiklendikten sonra teklifMusteriSecimi.value: ${teklifMusteriSecimi.value}`);
    } else {
        console.log(`[TeklifYonetimi] Müşteri ID bulunamadı veya teklifMusteriSecimi elementi yok. teklif.musteriAdi: ${teklif.musteriAdi}`);
        teklifMusteriAdiInput.value = teklif.musteriAdi || '';
        teklifMusteriIletisimInput.value = teklif.musteriIletisim || '';
    }
    
    teklifTarihiInput.value = teklif.teklifTarihi ? new Date(teklif.teklifTarihi).toISOString().split('T')[0] : '';
    teklifGecerlilikTarihiInput.value = teklif.gecerlilikTarihi ? new Date(teklif.gecerlilikTarihi).toISOString().split('T')[0] : '';
    if(teklifIndirimOraniInput) teklifIndirimOraniInput.value = teklif.indirimOrani || 0;
    if(teklifKdvOraniInput) teklifKdvOraniInput.value = teklif.kdvOrani === undefined ? 20 : teklif.kdvOrani;
    
    if (teklifParaBirimiInput) {
        if (teklif.paraBirimi === "0" || teklif.paraBirimi === 0) {
            teklifParaBirimiInput.value = 'TL';
        } else {
            teklifParaBirimiInput.value = teklif.paraBirimi || 'TL';
        }
    }

    teklifDurumInput.value = teklif.durum || 'Hazırlanıyor';
    teklifNotlarInput.value = teklif.notlar || '';

    if (teklifUrunListesiContainer) teklifUrunListesiContainer.innerHTML = '';
    urunSatirSayaci = 0;
    if (teklifIscilikListesiContainer) teklifIscilikListesiContainer.innerHTML = '';
    iscilikSatirSayaci = 0;

    if (teklif.urunler && Array.isArray(teklif.urunler)) {
        teklif.urunler.forEach(kalem => {
            if (kalem.kalemTipi === 'malzeme') {
                yeniUrunSatiriEkle({ 
                    id: kalem.malzeme_id || kalem.referans_id, // API'dan malzeme_id geliyor olabilir
                    urunId: kalem.malzeme_id || kalem.referans_id, // Dropdown seçimi için
                    malzemeAdi: kalem.aciklama, 
                    miktar: kalem.miktar,
                    birim_adi: kalem.birim, // yeniUrunSatiriEkle bunu doğrudan kullanmıyor, option oluşturmada kullanılıyor
                    kaydedilen_birim_maliyet: kalem.kaydedilen_birim_maliyet, // Güncellendi: Maliyet bilgisini aktar
                    kaydedilen_birim_satis_fiyati: kalem.kaydedilen_birim_satis_fiyati, 
                    fiyatTuruSatis: kalem.fiyatTuruSatis, // Güncellendi: Satış fiyat türünü aktar
                    // satir_toplam_satis_fiyati_kdv_haric: kalem.satir_toplam_satis_fiyati_kdv_haric // Bu bilgi artık yeniUrunSatiriEkle tarafından başlangıçta kullanılmıyor, urunSatiriHesapla tarafından hesaplanacak.
                });
            } else if (kalem.kalemTipi === 'iscilik') {
                yeniIscilikSatiriEkle({
                    isciId: kalem.isci_id || kalem.referans_id, // API'dan isci_id geliyor olabilir
                    isciAdi: kalem.aciklama, 
                    birim: kalem.birim,
                    miktar: kalem.miktar,
                    birimMaliyet: kalem.kaydedilen_birim_maliyet, // Güncellendi: Sadece maliyet bilgisini aktar
                    // birimUcret: kalem.kaydedilen_birim_satis_fiyati, // Bu alan artık yeniIscilikSatiriEkle tarafından beklenmiyor/kullanılmıyor
                    // satirToplami: kalem.satir_toplam_satis_fiyati_kdv_haric // Bu alan artık yeniIscilikSatiriEkle tarafından beklenmiyor/kullanılmıyor
                });
            }
        });
    }
    
    if (teklifUrunListesiContainer && teklifUrunListesiContainer.childElementCount === 0) {
        yeniUrunSatiriEkle();
    }
    if (teklifIscilikListesiContainer && teklifIscilikListesiContainer.childElementCount === 0) {
        yeniIscilikSatiriEkle();
    }

    genelToplamlariHesapla();
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

    const birimSatisFiyatiValue = (iscilikVerisi && iscilikVerisi.birimUcret !== undefined)
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
            <div class="form-group birim-maliyet">
                <label for="iscilikBirimMaliyet_${iscilikSatirSayaci}">Birim Maliyet:</label>
                <input type="number" id="iscilikBirimMaliyet_${iscilikSatirSayaci}" name="iscilikBirimMaliyet" class="teklif-iscilik-birim-maliyet" min="0" step="0.01" value="${(iscilikVerisi && iscilikVerisi.birimMaliyet !== undefined) ? (parseFloat(iscilikVerisi.birimMaliyet) || 0).toFixed(2) : '0.00'}">
            </div>
            
            <div class="form-group satir-toplami">
                <label>Satır Toplam Maliyeti:</label>
                <span id="iscilikSatirToplami_${iscilikSatirSayaci}" class="teklif-iscilik-satir-toplami">${satirToplamiValue}</span>
            </div>
            <button type="button" class="btn-icon remove-iscilik-satiri-btn" data-satirid="${satirId}">✖</button>
        </div>
    `;
    teklifIscilikListesiContainer.insertAdjacentHTML('beforeend', iscilikSatiriHTML);

    const yeniIsciSelect = document.getElementById(`isci_${iscilikSatirSayaci}`);
    const yeniBirimSelect = document.getElementById(`iscilikBirim_${iscilikSatirSayaci}`);
    const yeniMiktarInput = document.getElementById(`iscilikMiktar_${iscilikSatirSayaci}`);
    const yeniBirimMaliyetInput = document.getElementById(`iscilikBirimMaliyet_${iscilikSatirSayaci}`);
    // const yeniBirimSatisUcretiInput = document.getElementById(`iscilikBirimSatisUcreti_${iscilikSatirSayaci}`); // Kaldırıldı
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
                    if (yeniBirimMaliyetInput) {
                        if (secilenBirim === 'gun' && isci.gunlukUcret) {
                            yeniBirimMaliyetInput.value = (parseFloat(isci.gunlukUcret) || 0).toFixed(2);
                        } else if (secilenBirim === 'saat' && isci.saatlikUcret) {
                            yeniBirimMaliyetInput.value = (parseFloat(isci.saatlikUcret) || 0).toFixed(2);
                        } else {
                            yeniBirimMaliyetInput.value = '0.00';
                        }
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
                if (yeniBirimMaliyetInput) {
                    if (secilenBirim === 'gun' && isci.gunlukUcret) {
                        yeniBirimMaliyetInput.value = (parseFloat(isci.gunlukUcret) || 0).toFixed(2);
                    } else if (secilenBirim === 'saat' && isci.saatlikUcret) {
                        yeniBirimMaliyetInput.value = (parseFloat(isci.saatlikUcret) || 0).toFixed(2);
                    } else {
                        yeniBirimMaliyetInput.value = '0.00';
                    }
                }
            }
        }
        iscilikSatiriHesapla(satirId);
    });

    // Sadece miktar ve birim maliyet input'ları dinlenecek
    [yeniMiktarInput, yeniBirimMaliyetInput].forEach(input => {
        input?.addEventListener('input', () => iscilikSatiriHesapla(satirId));
    });

    silmeButonu.addEventListener('click', () => iscilikSatiriniSil(satirId));

    if (iscilikVerisi) {
        if (iscilikVerisi.isciId && yeniIsciSelect) {
            yeniIsciSelect.value = String(iscilikVerisi.isciId);
        }
        if (iscilikVerisi.birim && yeniBirimSelect) {
            yeniBirimSelect.value = iscilikVerisi.birim;
        }
        iscilikSatiriHesapla(satirId); 
    } else {
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
    if (!satirElementi) {
        console.error(`[iscilikSatiriHesapla] ${satirId} bulunamadı.`);
        return;
    }

    const miktarInput = satirElementi.querySelector('.teklif-iscilik-miktar');
    const birimMaliyetInput = satirElementi.querySelector('.teklif-iscilik-birim-maliyet');
    // const birimSatisUcretiInput = satirElementi.querySelector('.teklif-iscilik-birim-satis-ucreti'); // Kaldırıldı
    const satirToplamiSpan = satirElementi.querySelector('.teklif-iscilik-satir-toplami');

    const miktar = parseFloat(miktarInput?.value) || 0;
    const birimMaliyet = parseFloat(birimMaliyetInput?.value) || 0;
    // const birimSatisUcreti = parseFloat(birimSatisUcretiInput?.value) || 0; // Kaldırıldı

    // Maliyet Hesaplaması
    const satirToplamMaliyetKdvHaric = miktar * birimMaliyet;
    satirElementi.dataset.maliyetTutariIscilik = satirToplamMaliyetKdvHaric.toFixed(2);

    // Satır Toplamı olarak Maliyeti Göster
    if (satirToplamiSpan) {
        satirToplamiSpan.textContent = satirToplamMaliyetKdvHaric.toFixed(2);
    } else {
        console.error(`[iscilikSatiriHesapla] ${satirId} için satirToplamiSpan bulunamadı!`);
    }

    genelToplamlariHesapla();
}

// --- İŞÇİLİK SATIRI FONKSİYONLARI SONU ---

export { initTeklifYonetimi, renderTekliflerTablosu, formuTemizle as temizleTeklifFormu }; 