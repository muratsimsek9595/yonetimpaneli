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
const teklifIndirimOraniInputAyarlar = document.getElementById('teklifIndirimOraniInputAyarlar');
const teklifIndirimTutariSpan = document.getElementById('teklifIndirimTutariSpan');
const teklifKdvOraniInputAyarlar = document.getElementById('teklifKdvOraniInputAyarlar');
const teklifKdvTutariSpan = document.getElementById('teklifKdvTutariSpan');
const teklifGenelToplamSpan = document.getElementById('teklifGenelToplamSpan');
const teklifToplamKarSpan = document.getElementById('teklifToplamKarSpan'); // Yeni eklendi

// Yeni eklenen Teklif Fiyat Ayarları DOM Elementleri
const teklifTutariInputAyarlar = document.getElementById('teklifTutariInputAyarlar'); // Değiştirildi
// const teklifKdvDahilCheckbox = document.getElementById('teklifKdvDahilCheckbox'); // Kaldırıldı

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

        // Yeni Teklif Fiyat Ayarları için olay dinleyicileri
        if (teklifTutariInputAyarlar) { // Değiştirildi
            teklifTutariInputAyarlar.addEventListener('input', genelToplamlariHesapla); // Değiştirildi
        }
        if (teklifIndirimOraniInputAyarlar) {
            teklifIndirimOraniInputAyarlar.addEventListener('input', genelToplamlariHesapla);
        }
        // if (teklifKdvDahilCheckbox) { // Kaldırıldı
        //     teklifKdvDahilCheckbox.addEventListener('change', genelToplamlariHesapla); // Kaldırıldı
        // } // Kaldırıldı
        if (teklifKdvOraniInputAyarlar) {
            teklifKdvOraniInputAyarlar.addEventListener('input', genelToplamlariHesapla);
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
    
    // Eski KDV ve İndirim Oranı inputlarına değer atamaları kaldırılıyor
    // if (teklifIndirimOraniInput) teklifIndirimOraniInput.value = 0;
    // if (teklifKdvOraniInput) teklifKdvOraniInput.value = 20;

    // Yeni Teklif Fiyat Ayarları için varsayılanlar
    if (teklifTutariInputAyarlar) teklifTutariInputAyarlar.value = '';
    if (teklifIndirimOraniInputAyarlar) teklifIndirimOraniInputAyarlar.value = 0;
    if (teklifKdvOraniInputAyarlar) teklifKdvOraniInputAyarlar.value = 20; // Varsayılan KDV oranı %20

    teklifParaBirimiInput.value = 'TL';
    teklifDurumInput.value = 'Hazırlanıyor';
    
    // Form sıfırlandığında veya ilk açıldığında boş satırları ekle
    yeniUrunSatiriEkle();
    yeniIscilikSatiriEkle();
    genelToplamlariHesapla();
}

function formuTemizle(clearForm = true) {
    teklifForm.reset();
    teklifIdInput.value = '';
    if (teklifUrunListesiContainer) teklifUrunListesiContainer.innerHTML = ''; 
    urunSatirSayaci = 0; 
    if (teklifIscilikListesiContainer) teklifIscilikListesiContainer.innerHTML = '';
    iscilikSatirSayaci = 0; 
    
    ayarlamaFormVarsayilanlari(); // Bu, inputları ve varsayılan satırları ayarlar ama teklifNo'yu ayarlamaz
    
    if (clearForm) { // Yeni bir form açılıyorsa
        if (teklifNoInput) {
            teklifNoInput.value = generateNewTeklifNo(); // Teklif No'yu burada üret ve ata
        }
    }
    // genelToplamlariHesapla(); // ayarlamaFormVarsayilanlari içinde zaten çağrılıyor.

    if(teklifFormTemizleButton) teklifFormTemizleButton.style.display = 'none';
    if(teklifNoInput && clearForm) teklifNoInput.focus(); // Sadece yeni formda focusla
}

function yeniUrunSatiriEkle(urunVerisi = null) {
    console.log('[TeklifYonetimi] yeniUrunSatiriEkle çağrıldı. urunVerisi:', JSON.parse(JSON.stringify(urunVerisi || {})));
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

    // urunVerisi'nden gelen birimMaliyet ve fiyatTuruMaliyet'i kullan
    let birimMaliyetValue = '0.00';
    let fiyatTuruMaliyetSelected = 'dahil'; // Default KDV Dahil

    if (urunVerisi) {
        // Use saved cost if available
        if (urunVerisi.kaydedilen_birim_maliyet !== undefined) {
            birimMaliyetValue = (parseFloat(urunVerisi.kaydedilen_birim_maliyet) || 0).toFixed(2);
        }
        // Set KDV type for cost based on saved data
        // 'fiyatTuruSatis' from 'kalem' object in teklifFormunuDoldur was 'fiyatTuruMaliyet' when saved
        if (urunVerisi.fiyatTuruSatis === 'haric') { 
            fiyatTuruMaliyetSelected = 'haric';
        } else if (urunVerisi.fiyatTuruSatis === 'dahil') { // Explicitly check for 'dahil' or default to 'dahil'
            fiyatTuruMaliyetSelected = 'dahil';
        }
    }

    const miktarValue = (urunVerisi && urunVerisi.miktar) ? urunVerisi.miktar : '1';
    // Satır toplamı başlangıçta boş veya 0.00 olabilir, urunSatiriHesapla'da hesaplanacak
    const satirToplamiMaliyetKdvHaricValue = '0.00'; 

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
                <label for="birimMaliyet_${urunSatirSayaci}">Birim Maliyet:</label> 
                <input type="number" id="birimMaliyet_${urunSatirSayaci}" name="birimMaliyet" class="teklif-urun-birim-maliyet" min="0" step="0.01" value="${birimMaliyetValue}">
            </div>
            <div class="form-group birim-fiyat-turu"> <label for="fiyatTuruMaliyet_${urunSatirSayaci}">Maliyet Fiyat Türü:</label>
                <select id="fiyatTuruMaliyet_${urunSatirSayaci}" name="fiyatTuruMaliyet" class="teklif-urun-fiyat-turu-maliyet">
                    <option value="dahil" ${fiyatTuruMaliyetSelected === 'dahil' ? 'selected' : ''}>KDV Dahil</option>
                    <option value="haric" ${fiyatTuruMaliyetSelected === 'haric' ? 'selected' : ''}>KDV Hariç</option>
                </select>
            </div>
            <div class="form-group satir-toplami">
                <label>Satır Toplam Maliyeti (KDV Hariç):</label>
                <span id="satirToplamiMaliyet_${urunSatirSayaci}" class="teklif-urun-satir-toplami">${satirToplamiMaliyetKdvHaricValue}</span>
            </div>
            <button type="button" class="btn-icon remove-urun-satiri-btn" data-satirid="${satirId}">✖</button>
        </div>
    `;
    teklifUrunListesiContainer.insertAdjacentHTML('beforeend', urunSatiriHTML);

    const yeniSelect = document.getElementById(`urun_${urunSatirSayaci}`);
    const yeniMiktarInput = document.getElementById(`miktar_${urunSatirSayaci}`);
    const yeniBirimMaliyetInput = document.getElementById(`birimMaliyet_${urunSatirSayaci}`);
    const yeniFiyatTuruMaliyetSelect = document.getElementById(`fiyatTuruMaliyet_${urunSatirSayaci}`);
    const silmeButonu = document.querySelector(`#${satirId} .remove-urun-satiri-btn`);

    yeniSelect.addEventListener('change', (e) => {
        maliyetFiyatiOner(e.target.value, satirId); 
        urunSatiriHesapla(satirId); 
    });
    
    [yeniMiktarInput, yeniBirimMaliyetInput, yeniFiyatTuruMaliyetSelect].forEach(input => {
        input.addEventListener('input', () => urunSatiriHesapla(satirId));
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', () => urunSatiriHesapla(satirId));
        }
    });
    silmeButonu.addEventListener('click', () => urunSatiriniSil(satirId));
    
    if (urunVerisi && (urunVerisi.id || urunVerisi.urunId)) {
        yeniSelect.value = String(urunVerisi.id || urunVerisi.urunId);
        // For existing data, birimMaliyetValue and fiyatTuruMaliyetSelected are already determined
        // and used in HTML generation through birimMaliyetValue and fiyatTuruMaliyetSelected variables.
        // So, directly calculate with loaded values.
        urunSatiriHesapla(satirId);
    } else {
        // This is a new row (no urunVerisi).
        if (yeniSelect.value && yeniSelect.value !== "") {
            // If a material is somehow pre-selected in a new row (unlikely for default "-- Malzeme Seçiniz --")
            maliyetFiyatiOner(yeniSelect.value, satirId); // This will fetch price and then call urunSatiriHesapla
        } else {
            // New row, no material selected (or value is empty string), just calculate (will be zeros)
            urunSatiriHesapla(satirId);
        }
    }
    // The urunSatiriHesapla(satirId) call that was here previously is now handled by the conditional logic above.
}

function maliyetFiyatiOner(urunId, satirId) {
    const birimMaliyetInput = document.querySelector(`#${satirId} .teklif-urun-birim-maliyet`);
    const fiyatTuruMaliyetSelect = document.querySelector(`#${satirId} .teklif-urun-fiyat-turu-maliyet`);

    if (!urunId || !birimMaliyetInput || !fiyatTuruMaliyetSelect) {
        if (birimMaliyetInput) birimMaliyetInput.value = '0.00'; 
        // Fiyat türünü de varsayılana (dahil) çekebiliriz veya ellemesine izin verebiliriz.
        // Şimdilik sadece maliyeti sıfırlayalım.
        return;
    }

    const fiyatlar = getFiyatlar(); 
    const urunFiyatlari = fiyatlar
        .filter(f => String(f.malzeme_id) === String(urunId))
        .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

    if (urunFiyatlari.length > 0) {
        // Veritabanından gelen fiyatın KDV DAHİL olduğunu varsayıyoruz.
        birimMaliyetInput.value = parseFloat(urunFiyatlari[0].fiyat).toFixed(2);
        fiyatTuruMaliyetSelect.value = 'dahil'; // Otomatik olarak KDV Dahil seç
    } else {
        birimMaliyetInput.value = '0.00'; // Fiyat bulunamazsa sıfırla
        // fiyatTuruMaliyetSelect.value = 'dahil'; // İsteğe bağlı olarak varsayılana çekilebilir
    }
    // Değişiklik sonrası hesaplamayı tetikle
    urunSatiriHesapla(satirId);
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
    const fiyatTuruMaliyetSelect = satirElementi.querySelector('.teklif-urun-fiyat-turu-maliyet');
    const satirToplamiMaliyetSpan = satirElementi.querySelector('.teklif-urun-satir-toplami'); 

    const miktarValue = miktarInput?.value;
    const girilenBirimMaliyetValue = birimMaliyetInput?.value;
    const fiyatTuruMaliyet = fiyatTuruMaliyetSelect?.value || 'dahil';
    console.log(`[urunSatiriHesapla] ${satirId} - Okunan HAM değerler: miktar='${miktarValue}', girilenBirimMaliyet='${girilenBirimMaliyetValue}', fiyatTuruMaliyet='${fiyatTuruMaliyet}'`);

    const miktar = parseFloat(miktarValue) || 0;
    const girilenBirimMaliyet = parseFloat(girilenBirimMaliyetValue) || 0;
    const genelKdvOrani = parseFloat(teklifKdvOraniInputAyarlar?.value) || 0;
    console.log(`[urunSatiriHesapla] ${satirId} - PARSED değerler: miktar=${miktar}, girilenBirimMaliyet=${girilenBirimMaliyet}, genelKdvOrani=${genelKdvOrani}`);

    let kdvHaricBirimMaliyet = 0;
    if (fiyatTuruMaliyet === 'dahil') {
        if (genelKdvOrani > 0) {
            kdvHaricBirimMaliyet = girilenBirimMaliyet / (1 + (genelKdvOrani / 100));
        } else {
            kdvHaricBirimMaliyet = girilenBirimMaliyet;
        }
    } else {
        kdvHaricBirimMaliyet = girilenBirimMaliyet;
    }
    console.log(`[urunSatiriHesapla] ${satirId} - Hesaplanan kdvHaricBirimMaliyet: ${kdvHaricBirimMaliyet}`);

    const satirToplamMaliyetKdvHaric = miktar * kdvHaricBirimMaliyet;
    console.log(`[urunSatiriHesapla] ${satirId} - Hesaplanan satirToplamMaliyetKdvHaric: ${satirToplamMaliyetKdvHaric}`);

    if (satirToplamiMaliyetSpan) {
        satirToplamiMaliyetSpan.textContent = satirToplamMaliyetKdvHaric.toFixed(2); 
        console.log(`[urunSatiriHesapla] ${satirId} - satirToplamiMaliyetSpan.textContent AYARLANDI: '${satirToplamiMaliyetSpan.textContent}'`);
    }
    satirElementi.dataset.maliyetTutari = satirToplamMaliyetKdvHaric.toFixed(2);

    const satirKdvTutari = satirToplamMaliyetKdvHaric * (genelKdvOrani / 100);
    satirElementi.dataset.kdvTutari = satirKdvTutari.toFixed(2);
    console.log(`[urunSatiriHesapla] ${satirId} - Hesaplanan satirKdvTutari (maliyet üzerinden): ${satirKdvTutari}`);

    genelToplamlariHesapla();
}

function genelToplamlariHesapla() {
    // 1. Teklif Fiyat Ayarlarından Girdileri Oku
    const teklifTutariAyarlarStr = teklifTutariInputAyarlar?.value.trim() || '0';
    let teklifTutariAyarlar = parseFloat(teklifTutariAyarlarStr.replace(/,/g, '')) || 0;

    const indirimOraniAyarlar = parseFloat(teklifIndirimOraniInputAyarlar?.value) || 0;
    const kdvOraniAyarlar = parseFloat(teklifKdvOraniInputAyarlar?.value) || 0;

    // 2. Maliyetleri Hesapla (Malzeme ve İşçilik)
    let toplamMalzemeMaliyeti = 0;
    document.querySelectorAll('#teklifUrunListesiContainer .urun-satiri').forEach(satir => {
        const satirId = satir.id;
        const miktar = parseFloat(document.getElementById(`urunMiktar_${satirId}`)?.value) || 0;
        const birimMaliyetStr = document.getElementById(`urunBirimMaliyet_${satirId}`)?.value.trim() || '0';
        const birimMaliyet = parseFloat(birimMaliyetStr.replace(/,/g, '')) || 0;
        const fiyatTuruMaliyet = document.getElementById(`urunFiyatTuruMaliyet_${satirId}`)?.value || 'dahil';
        const kdvOraniMaliyet = parseFloat(document.getElementById(`urunKdvOraniMaliyet_${satirId}`)?.value) || 0;

        let birimMaliyetKdvHaric = birimMaliyet;
        if (fiyatTuruMaliyet === 'dahil') {
            birimMaliyetKdvHaric = birimMaliyet / (1 + kdvOraniMaliyet / 100);
        }
        toplamMalzemeMaliyeti += miktar * birimMaliyetKdvHaric;
    });

    let toplamIscilikMaliyeti = 0;
    document.querySelectorAll('#teklifIscilikListesiContainer .iscilik-satiri').forEach(satir => {
        const satirId = satir.id;
        const miktar = parseFloat(document.getElementById(`iscilikMiktar_${satirId}`)?.value) || 0;
        const birimMaliyetStr = document.getElementById(`iscilikBirimMaliyet_${satirId}`)?.value.trim() || '0';
        const birimMaliyet = parseFloat(birimMaliyetStr.replace(/,/g, '')) || 0;
        const fiyatTuruMaliyet = document.getElementById(`iscilikFiyatTuruMaliyet_${satirId}`)?.value || 'dahil';
        const kdvOraniMaliyet = parseFloat(document.getElementById(`iscilikKdvOraniMaliyet_${satirId}`)?.value) || 0;

        let birimMaliyetKdvHaric = birimMaliyet;
        if (fiyatTuruMaliyet === 'dahil') {
            birimMaliyetKdvHaric = birimMaliyet / (1 + kdvOraniMaliyet / 100);
        }
        toplamIscilikMaliyeti += miktar * birimMaliyetKdvHaric;
    });

    const toplamMaliyetKdvHaric = toplamMalzemeMaliyeti + toplamIscilikMaliyeti;

    // 3. Satış Toplamlarını Hesapla (Ayarlara Göre)
    const araToplamSatis = teklifTutariAyarlar; // Bu, kullanıcının girdiği KDV Hariç, İndirimsiz tutar
    const indirimTutariSatis = (araToplamSatis * indirimOraniAyarlar) / 100;
    const tutarIndirimSonrasiSatis = araToplamSatis - indirimTutariSatis;
    const kdvTutariSatis = (tutarIndirimSonrasiSatis * kdvOraniAyarlar) / 100;
    const genelToplamSatis = tutarIndirimSonrasiSatis + kdvTutariSatis;

    // 4. Kârı Hesapla
    const toplamKar = tutarIndirimSonrasiSatis - toplamMaliyetKdvHaric;

    // 5. Span'leri Güncelle
    if (teklifAraToplamSpan) teklifAraToplamSpan.textContent = araToplamSatis.toFixed(2);
    if (teklifIndirimTutariSpan) teklifIndirimTutariSpan.textContent = indirimTutariSatis.toFixed(2);
    if (teklifKdvTutariSpan) teklifKdvTutariSpan.textContent = kdvTutariSatis.toFixed(2);
    if (teklifGenelToplamSpan) teklifGenelToplamSpan.textContent = genelToplamSatis.toFixed(2);
    
    const teklifToplamMaliyetSpan = document.getElementById('teklifToplamMaliyetSpan');
    if (teklifToplamMaliyetSpan) teklifToplamMaliyetSpan.textContent = toplamMaliyetKdvHaric.toFixed(2);
    
    if (teklifToplamKarSpan) teklifToplamKarSpan.textContent = toplamKar.toFixed(2);

    // Para birimi göstergesini de güncelleyelim (varsa)
    const paraBirimiGosterge = document.getElementById('teklifParaBirimiGosterge');
    const seciliParaBirimi = teklifParaBirimiInput?.options[teklifParaBirimiInput.selectedIndex]?.text || 'TL';
    if (paraBirimiGosterge) {
        paraBirimiGosterge.textContent = seciliParaBirimi;
    }
     // Diğer para birimi göstergelerini de güncelle (urun ve işçilik satırları için)
    document.querySelectorAll('.para-birimi-gosterge-urun, .para-birimi-gosterge-iscilik, #teklifGenelToplamParaBirimiGosterge, #teklifToplamMaliyetParaBirimiGosterge, #teklifToplamKarParaBirimiGosterge').forEach(span => {
        if(span) span.textContent = seciliParaBirimi;
    });
}

function teklifFormundanVeriAl() {
    // Malzeme ve İşçilik Kalemleri ÖNCE toplanmalı
    const kalemler = []; 

    // Malzemeleri topla
    document.querySelectorAll('#teklifUrunListesiContainer .teklif-urun-satiri').forEach(satir => {
        const urunMalzemeElement = satir.querySelector('.teklif-urun-malzeme');
        if (!urunMalzemeElement || !urunMalzemeElement.value) return;

        const malzemeOptionChecked = urunMalzemeElement.querySelector('option:checked');
        const malzemeAdi = (malzemeOptionChecked?.textContent.split(' (')[0] || '').trim();
        const birim = malzemeOptionChecked?.dataset.birim || '';
        const miktar = parseFloat(satir.querySelector('.teklif-urun-miktar')?.value) || 0;
        
        const birimMaliyet = parseFloat(satir.querySelector('.teklif-urun-birim-maliyet')?.value) || 0;
        // const birimSatisFiyati = parseFloat(satir.querySelector('.teklif-urun-birim-satis-fiyati')?.value) || 0; // Bu alan artık yok
        const fiyatTuruMaliyet = satir.querySelector('.teklif-urun-fiyat-turu-maliyet')?.value || 'dahil'; // Maliyetin KDV türü
        // const kalemSatisKdvTutari = parseFloat(satir.dataset.kdvTutari) || 0; // Bu genel KDV'den hesaplanacak
        const kalemToplamMaliyetKdvHaric = parseFloat(satir.dataset.maliyetTutari) || 0; 
        
        if (urunMalzemeElement.value && miktar > 0) { 
            kalemler.push({
                kalemTipi: 'malzeme', 
                referans_id: urunMalzemeElement.value, 
                aciklama: malzemeAdi, 
                miktar: miktar,
                birim: birim,
                kaydedilen_birim_maliyet: birimMaliyet, // Kullanıcının girdiği maliyet
                fiyatTuruMaliyet: fiyatTuruMaliyet, // Maliyetin KDV türü
                satir_toplam_maliyet_kdv_haric: kalemToplamMaliyetKdvHaric,
                // Satışla ilgili alanlar artık bu seviyede değil, genel ayarlardan geliyor.
                // kaydedilen_birim_satis_fiyati: 0, 
                // satir_toplam_satis_fiyati_kdv_haric: 0,
                // kalem_satis_kdv_tutari: 0
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
        const fiyatTuruMaliyet = 'dahil'; // İşçilik maliyetinin KDV dahil olduğu varsayılıyor veya ayrıca belirtilmeli
        const satirToplamMaliyetKdvHaric = parseFloat(satir.dataset.maliyetTutariIscilik) || 0;

        if (isciIdSelect.value && miktar > 0) {
            kalemler.push({
                kalemTipi: 'iscilik', 
                referans_id: isciIdSelect.value, 
                aciklama: isciAdi, 
                birim: birim,
                miktar: miktar,
                kaydedilen_birim_maliyet: birimMaliyet,
                fiyatTuruMaliyet: fiyatTuruMaliyet, // İşçilik maliyetinin KDV türü
                satir_toplam_maliyet_kdv_haric: satirToplamMaliyetKdvHaric
            });
        }
    });

    // Temel Teklif Bilgileri (kalemler toplandıktan SONRA)
    const anaVeri = {
        id: teklifIdInput.value || null,
        teklifNo: teklifNoInput.value.trim(),
        musteri_id: teklifMusteriSecimi.value,
        musteriAdi: teklifMusteriAdiInput.value.trim(),
        musteriIletisim: teklifMusteriIletisimInput.value.trim(),
        teklifTarihi: teklifTarihiInput.value,
        gecerlilikTarihi: teklifGecerlilikTarihiInput.value,
        paraBirimi: teklifParaBirimiInput.value,
        durum: teklifDurumInput.value,
        notlar: teklifNotlarInput.value.trim(),
        
        // Teklif Fiyat Ayarlarından ve Hesaplamalardan Gelen Değerler
        araToplamSatis: parseFloat(teklifTutariInputAyarlar.value.replace(/,/g, '')) || 0,
        indirimOrani: parseFloat(teklifIndirimOraniInputAyarlar.value) || 0,
        kdvOrani: parseFloat(teklifKdvOraniInputAyarlar.value) || 0,
        
        indirimTutari: parseFloat(teklifIndirimTutariSpan.textContent.replace(/,/g, '')) || 0,
        kdvTutari: parseFloat(teklifKdvTutariSpan.textContent.replace(/,/g, '')) || 0,
        genelToplamSatis: parseFloat(teklifGenelToplamSpan.textContent.replace(/,/g, '')) || 0,
        
        toplamMaliyet: parseFloat(document.getElementById('teklifToplamMaliyetSpan')?.textContent.replace(/,/g, '')) || 0,
        toplamKar: parseFloat(document.getElementById('teklifToplamKarSpan')?.textContent.replace(/,/g, '')) || 0,

        urunler: kalemler // Kalemler dizisi buraya eklendi
    };
    
    console.log("[TeklifYonetimi] API'ye gönderilecek teklif verisi:", JSON.parse(JSON.stringify(anaVeri)));
    return anaVeri;
}

function teklifFormunuDoldur(teklif) {
    if (!teklif) return;
    console.log("[TeklifYonetimi] teklifFormunuDoldur çağrıldı. Teklif verisi:", JSON.parse(JSON.stringify(teklif)));
    
    formuTemizle(false); // Formu temizle ama yeni teklif no üretme

    teklifIdInput.value = teklif.id || '';
    teklifNoInput.value = teklif.teklifNo || '';
    
    if (teklifMusteriSecimi && teklif.musteri_id) {
        teklifMusteriSecimi.value = teklif.musteri_id;
        // Müşteri seçimi değiştiğinde tetiklenen 'change' event'ını manuel olarak tetikle
        // böylece musteriAdi ve musteriIletisim alanları otomatik dolar.
        const event = new Event('change');
        teklifMusteriSecimi.dispatchEvent(event);
    } else {
        // Eğer musteri_id yoksa, doğrudan adi ve iletisim bilgilerini bas (eski kayıtlar için)
        teklifMusteriAdiInput.value = teklif.musteriAdi || '';
        teklifMusteriIletisimInput.value = teklif.musteriIletisim || '';
    }

    teklifTarihiInput.value = teklif.teklifTarihi ? new Date(teklif.teklifTarihi).toISOString().split('T')[0] : '';
    teklifGecerlilikTarihiInput.value = teklif.gecerlilikTarihi ? new Date(teklif.gecerlilikTarihi).toISOString().split('T')[0] : '';
    
    // Teklif Fiyat Ayarlarını Yükle
    console.log('[TeklifYonetimi] Teklif Ayarları Yükleniyor (API\'den gelenler):');
    console.log(`  - araToplamSatis (beklenen): ${teklif.araToplamSatis}`);
    console.log(`  - indirimOrani: ${teklif.indirimOrani}`);
    console.log(`  - kdvOrani: ${teklif.kdvOrani}`);

    if(teklifTutariInputAyarlar) {
        teklifTutariInputAyarlar.value = typeof teklif.araToplamSatis !== 'undefined' ? parseFloat(teklif.araToplamSatis).toFixed(2) : '0.00';
    }
    if(teklifIndirimOraniInputAyarlar) {
        teklifIndirimOraniInputAyarlar.value = typeof teklif.indirimOrani !== 'undefined' ? teklif.indirimOrani : 0;
    }
    if(teklifKdvOraniInputAyarlar) {
        teklifKdvOraniInputAyarlar.value = typeof teklif.kdvOrani !== 'undefined' ? teklif.kdvOrani : 20; // Varsayılan 20
    }

    teklifParaBirimiInput.value = teklif.paraBirimi || 'TL';
    teklifDurumInput.value = teklif.durum || 'Hazırlanıyor';
    teklifNotlarInput.value = teklif.notlar || '';

    // Malzeme ve İşçilik Kalemlerini Yükle
    // Önce mevcut satırları temizle (varsa)
    teklifUrunListesiContainer.innerHTML = ''; 
    teklifIscilikListesiContainer.innerHTML = '';
    urunSatirSayaci = 0; // Sayaçları sıfırla
    iscilikSatirSayaci = 0;

    if (teklif.urunler && Array.isArray(teklif.urunler)) {
        teklif.urunler.forEach(kalem => {
            if (kalem.kalemTipi === 'malzeme') {
                yeniUrunSatiriEkle(kalem);
            } else if (kalem.kalemTipi === 'iscilik') {
                yeniIscilikSatiriEkle(kalem);
            }
        });
    }
    
    // Tüm ayarlar ve kalemler yüklendikten sonra genel toplamları hesapla
    genelToplamlariHesapla(); 

    showToast('Teklif bilgileri forma yüklendi.', 'info');
    // Sayfanın üstüne odaklanabilir veya formun başına
    window.scrollTo({ top: teklifForm.offsetTop - 20, behavior: 'smooth' }); 
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