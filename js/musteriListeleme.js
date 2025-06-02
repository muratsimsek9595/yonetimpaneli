import { getMusteriler, getMusteriById, subscribe } from './store.js';
import { showToast } from './ui.js';

const musteriOzetListesiContainer = document.getElementById('musteri-ozet-listesi-container');
const musteriDetayModal = document.getElementById('musteriDetayModal');
const modalKapatButonlari = document.querySelectorAll('#musteriDetayModal .modal-kapat-buton'); // Modala özgü butonlar
const musteriDetayKartAlani = document.getElementById('musteriDetayKartAlani');
const modalMusteriAdiBaslik = document.getElementById('modalMusteriAdi');

function renderMusteriOzetleri(musteriler) {
    if (!musteriOzetListesiContainer) {
        return;
    }
    musteriOzetListesiContainer.innerHTML = ''; 

    if (!musteriler || musteriler.length === 0) {
        musteriOzetListesiContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Gösterilecek müşteri bulunamadı.</p>';
        return;
    }

    musteriler.forEach(musteri => {
        const kart = document.createElement('div');
        kart.classList.add('musteri-ozet-karti');
        kart.dataset.musteriId = musteri.id;
        
        kart.innerHTML = `
            <h4>${musteri.ad || 'İsim Yok'}</h4>
            <p><span class="ozet-label">Yetkili:</span> ${musteri.yetkili_kisi || '-'}</p>
            <p><span class="ozet-label">Telefon:</span> ${musteri.telefon || '-'}</p>
            <p><span class="ozet-label">Email:</span> ${musteri.email || '-'}</p>
        `;
        kart.addEventListener('click', () => musteriDetayiniGoster(musteri.id));
        musteriOzetListesiContainer.appendChild(kart);
    });
}

async function musteriDetayiniGoster(musteriId) {
    const musteri = getMusteriById(musteriId); 

    if (!musteri) {
        showToast('Müşteri detayları bulunamadı.', 'error');
        return;
    }

    if (!musteriDetayModal || !musteriDetayKartAlani || !modalMusteriAdiBaslik) {
        console.error('Müşteri modal elementleri bulunamadı.');
        return;
    }
    
    modalMusteriAdiBaslik.textContent = `${musteri.ad || 'Müşteri Detayı'}`;

    musteriDetayKartAlani.innerHTML = `
        <div class="musteri-detay-bolum">
            <h4>Temel Bilgiler</h4>
            <div class="musteri-bilgi-grid">
                <p><span class="detail-label">Firma/Şahıs Adı:</span></p><p>${musteri.ad || '-'}</p>
                <p><span class="detail-label">Yetkili Kişi:</span></p><p>${musteri.yetkili_kisi || '-'}</p>
                <p><span class="detail-label">Vergi No/TCKN:</span></p><p>${musteri.vergi_no || '-'}</p>
            </div>
        </div>
        <div class="musteri-detay-bolum">
            <h4>İletişim Bilgileri</h4>
            <div class="musteri-bilgi-grid">
                <p><span class="detail-label">Telefon:</span></p><p>${musteri.telefon || '-'}</p>
                <p><span class="detail-label">Email:</span></p><p>${musteri.email || '-'}</p>
                <p><span class="detail-label">Adres:</span></p><p>${musteri.adres || '-'}</p>
            </div>
        </div>
        <div class="musteri-detay-bolum">
            <h4>Notlar</h4>
            <p class="notlar-kutusu">${musteri.notlar || '-'}</p>
        </div>
    `;

    musteriDetayModal.style.display = 'flex';
}

function modalKapat() {
    if (musteriDetayModal) {
        musteriDetayModal.style.display = 'none';
    }
}

if (musteriDetayModal) {
    modalKapatButonlari.forEach(button => {
        button.addEventListener('click', modalKapat);
    });

    window.addEventListener('click', (event) => {
        if (event.target === musteriDetayModal) {
            modalKapat();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && musteriDetayModal.style.display === 'flex') {
            modalKapat();
        }
    });
}

function initMusteriListeleme() {
    const mevcutMusteriler = getMusteriler();
    renderMusteriOzetleri(mevcutMusteriler);

    subscribe('musterilerChanged', (yeniMusteriler) => {
        renderMusteriOzetleri(yeniMusteriler);
    });
}

export { initMusteriListeleme }; 