import { getTeklifler, getTeklifById, getMusteriById, subscribe } from './store.js'; // subscribe eklendi
import { showToast } from './ui.js';

const teklifOzetListesiContainer = document.getElementById('teklif-ozet-listesi-container');
const teklifDetayModal = document.getElementById('teklifDetayModal');
const modalKapatButonlari = document.querySelectorAll('.modal-kapat-buton');
const teklifDetayKartAlani = document.getElementById('teklifDetayKartAlani');
const modalTeklifNoBaslik = document.getElementById('modalTeklifNo');

function formatCurrency(amount, currency) {
    let numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
        numericAmount = 0; // amount sayı değilse veya NaN ise 0 olarak ayarla
    }

    let safeCurrency = currency;
    // Para birimi "0", 0, null, undefined veya boş bir string ise 'TL' olarak ayarla
    if (safeCurrency === "0" || safeCurrency === 0 || !safeCurrency || String(safeCurrency).trim() === "") {
        safeCurrency = 'TL'; 
    } else {
        safeCurrency = String(safeCurrency).trim();
    }

    try {
        // Intl.NumberFormat, geçersiz para birimi kodu durumunda hata verebilir.
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: safeCurrency }).format(numericAmount);
    } catch (e) {
        // Fallback, artık güvenli olmalı
        return `${numericAmount.toFixed(2)} ${safeCurrency}`;
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString; // Hatalı formatta ise olduğu gibi döndür
    }
}

function renderTeklifOzetleri(teklifler) {
    if (!teklifOzetListesiContainer) {
        // console.error('Teklif özeti konteyneri bulunamadı.'); // Bu log çok sık gelebilir, kapalı tutalım.
        return;
    }
    teklifOzetListesiContainer.innerHTML = ''; // Temizle

    if (!teklifler || teklifler.length === 0) {
        teklifOzetListesiContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Gösterilecek teklif bulunamadı.</p>';
        return;
    }

    teklifler.forEach(teklif => {
        const kart = document.createElement('div');
        kart.classList.add('teklif-ozet-karti');
        kart.dataset.teklifId = teklif.id;

        const musteriAdi = teklif.musteriAdi || (teklif.musteriId ? (getMusteriById(teklif.musteriId)?.ad || 'Bilinmiyor') : 'Bilinmiyor');
        
        kart.innerHTML = `
            <h4>${teklif.teklifNo || 'Teklif No Yok'}</h4>
            <p><span class="ozet-label">Müşteri:</span> ${musteriAdi}</p>
            <p><span class="ozet-label">Tarih:</span> ${formatDate(teklif.teklifTarihi)}</p>
            <p><span class="ozet-label">Toplam:</span> ${formatCurrency(teklif.genelToplamSatis, teklif.paraBirimi)}</p>
            <p><span class="ozet-label">Durum:</span> <span class="durum-badge durum-${(teklif.durum || '').toLowerCase().replace(/\s+/g, '-')}">${teklif.durum || '-'}</span></p>
        `;
        kart.addEventListener('click', () => teklifDetayiniGoster(teklif.id));
        teklifOzetListesiContainer.appendChild(kart);
    });
}

async function teklifDetayiniGoster(teklifId) {
    const teklif = getTeklifById(teklifId); // Store'dan al
    console.log('[teklifListeleme.js] Modal için teklif detayı:', JSON.parse(JSON.stringify(teklif))); // Teklif nesnesini logla

    if (!teklif) {
        showToast('Teklif detayları bulunamadı.', 'error');
        return;
    }

    if (!teklifDetayModal || !teklifDetayKartAlani || !modalTeklifNoBaslik) {
        console.error('Modal elementleri bulunamadı.');
        return;
    }
    
    modalTeklifNoBaslik.textContent = `Teklif Detayı: ${teklif.teklifNo || ''}`;

    let kalemlerHTML = '';
    if (teklif.urunler && teklif.urunler.length > 0) {
        kalemlerHTML += '<h4>Kalemler</h4><div class="table-responsive"><table class="detay-tablosu"><thead><tr><th>Açıklama</th><th>Miktar</th><th>Birim</th><th>Birim Fiyat (Maliyet)</th><th>Toplam (Maliyet)</th></tr></thead><tbody>';
        teklif.urunler.forEach(kalem => {
            const birimFiyat = kalem.kaydedilen_birim_maliyet || 0;
            const satirToplami = kalem.satir_toplam_maliyet_kdv_haric || (kalem.miktar * birimFiyat);
            kalemlerHTML += `
                <tr>
                    <td>${kalem.aciklama || (kalem.kalemTipi === 'malzeme' ? 'Malzeme' : 'İşçilik')}</td>
                    <td>${kalem.miktar || 0}</td>
                    <td>${kalem.birim || '-'}</td>
                    <td>${formatCurrency(birimFiyat, teklif.paraBirimi)}</td>
                    <td>${formatCurrency(satirToplami, teklif.paraBirimi)}</td>
                </tr>
            `;
        });
        kalemlerHTML += '</tbody></table></div>';
    } else {
        kalemlerHTML = '<p>Bu teklife ait kalem bulunmamaktadır.</p>';
    }
    
    const musteri = getMusteriById(teklif.musteriId || teklif.musteri_id);

    teklifDetayKartAlani.innerHTML = `
        <div class="teklif-detay-bolum">
            <p><span class="detail-label">Müşteri Adı:</span> ${teklif.musteriAdi || (musteri ? musteri.ad : 'Belirtilmemiş')}</p>
            <p><span class="detail-label">Müşteri İletişim:</span> ${teklif.musteriIletisim || (musteri ? ((musteri.telefon || '') + (musteri.email && musteri.telefon ? ' / ' : '') + (musteri.email || '')) : 'Belirtilmemiş')}</p>
            <p><span class="detail-label">Teklif Tarihi:</span> ${formatDate(teklif.teklifTarihi)}</p>
            <p><span class="detail-label">Geçerlilik Tarihi:</span> ${formatDate(teklif.gecerlilikTarihi)}</p>
        </div>
        <div class="teklif-detay-bolum">
            ${kalemlerHTML}
        </div>
        <div class="teklif-detay-bolum">
            <h4>Toplamlar</h4>
            <div class="toplamlar-grid">
                 <p><span class="detail-label">Proje Maliyeti (KDV Dahil):</span></p><p class="tutar">${formatCurrency(teklif.araToplamMaliyet, teklif.paraBirimi)}</p>
                 <p><span class="detail-label">Ara Toplam:</span></p><p class="tutar">${formatCurrency(teklif.araToplamSatis, teklif.paraBirimi)}</p>
                 <p><span class="detail-label">İndirim (${teklif.indirimOrani || 0}%):</span></p><p class="tutar">-${formatCurrency(teklif.indirimTutari, teklif.paraBirimi)}</p>
                 <p><span class="detail-label">KDV (${teklif.kdvOrani || 0}%):</span></p><p class="tutar">+${formatCurrency(teklif.kdvTutari, teklif.paraBirimi)}</p>
                 <p><strong class="detail-label">Genel Toplam:</strong></p><p class="tutar genel-toplam-modal"><strong>${formatCurrency(teklif.genelToplamSatis, teklif.paraBirimi)}</strong></p>
            </div>
        </div>
        <div class="teklif-detay-bolum">
            <p><span class="detail-label">Durum:</span> <span class="durum-badge durum-${(teklif.durum || '').toLowerCase().replace(/\s+/g, '-')}">${teklif.durum || '-'}</span></p>
            <p><span class="detail-label">Notlar:</span></p>
            <p class="notlar-kutusu">${teklif.notlar || '-'}</p>
        </div>
    `;

    teklifDetayModal.style.display = 'flex';
}

function modalKapat() {
    if (teklifDetayModal) {
        teklifDetayModal.style.display = 'none';
    }
}

// Olay Dinleyicileri
if(teklifDetayModal) { // Modalın varlığını kontrol et
    modalKapatButonlari.forEach(button => {
        button.addEventListener('click', modalKapat);
    });

    // Modal dışına tıklayınca kapatma
    window.addEventListener('click', (event) => {
        if (event.target === teklifDetayModal) {
            modalKapat();
        }
    });

    // Klavye ile ESC tuşuna basınca kapatma
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && teklifDetayModal.style.display === 'flex') {
            modalKapat();
        }
    });
}

function initTeklifListeleme() {
    // console.log("[teklifListeleme.js] initTeklifListeleme çağrıldı.");
    const mevcutTeklifler = getTeklifler();
    renderTeklifOzetleri(mevcutTeklifler);

    // Teklifler store'da değiştiğinde listeyi güncelle
    subscribe('tekliflerChanged', (yeniTeklifler) => {
        // console.log("[teklifListeleme.js] tekliflerChanged event'i alındı. Yeni teklifler:", yeniTeklifler);
        renderTeklifOzetleri(yeniTeklifler);
    });
}

// Bu modülün `script.js` veya başka bir ana JS dosyası tarafından çağrılması gerekecek.
export { initTeklifListeleme }; 