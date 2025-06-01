// Genel JavaScript fonksiyonları ve olay dinleyicileri buraya gelecek.
// Chart.js DataLabels eklentisini global olarak kaydet
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
} else {
    console.error('ChartDataLabels eklentisi yüklenemedi!');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM yüklendi ve hazır!');

    const navLinks = document.querySelectorAll('.sidebar nav a');
    const sections = document.querySelectorAll('.main-content section');

    // Sayfa ilk yüklendiğinde #anasayfa bölümünü göster
    const anasayfaSection = document.getElementById('anasayfa');
    if (anasayfaSection) {
        anasayfaSection.classList.add('active-section');
        const anasayfaLink = document.querySelector('.sidebar nav a[href="#anasayfa"]');
        if (anasayfaLink) {
            anasayfaLink.classList.add('active');
        }
    } else {
        // Eğer #anasayfa yoksa, ilk section'ı göster (güvenlik önlemi)
        if (sections.length > 0) {
            sections[0].classList.add('active-section');
            if (navLinks.length > 0) {
                navLinks[0].classList.add('active');
            }
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Sayfanın yeniden yüklenmesini engelle

            const targetId = this.getAttribute('href').substring(1);
            
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active-section');
                } else {
                    section.classList.remove('active-section');
                }
            });

            // Tüm linklerden 'active' sınıfını kaldır
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            // Tıklanan linke 'active' sınıfını ekle
            this.classList.add('active');
        });
    });

    // Örnek: Bir butona tıklandığında mesaj gösterme
    /*
    const ornekButon = document.getElementById('ornekButon');
    if (ornekButon) {
        ornekButon.addEventListener('click', function() {
            alert('Butona tıklandı!');
        });
    }
    */

    // ----------- Ürün Yönetimi Kodları Başlangıç -----------
    const urunForm = document.getElementById('urunForm');
    const urunIdInput = document.getElementById('urunId');
    const urunAdiInput = document.getElementById('urunAdi');
    const urunBirimTipiInput = document.getElementById('urunBirimTipi');
    const urunBirimAdiInput = document.getElementById('urunBirimAdi');
    const urunListesiTablosuBody = document.querySelector('#urunListesiTablosu tbody');
    const formTemizleButton = document.getElementById('formTemizleButton');

    // Tedarikçi Yönetimi Elemanları
    const tedarikciForm = document.getElementById('tedarikciForm');
    const tedarikciIdInput = document.getElementById('tedarikciIdInput');
    const tedarikciAdiInput = document.getElementById('tedarikciAdiInput');
    const tedarikciListesiTablosuBody = document.querySelector('#tedarikciListesiTablosu tbody');
    const tedarikciFormTemizleButton = document.getElementById('tedarikciFormTemizleButton');

    // Günlük Fiyat Girişi Elemanları
    const gunlukFiyatForm = document.getElementById('gunlukFiyatForm');
    const fiyatGirisMalzemeSecimi = document.getElementById('fiyatGirisMalzemeSecimi');
    const fiyatGirisTedarikciSecimi = document.getElementById('fiyatGirisTedarikciSecimi');
    const fiyatGirisBirimGostergesi = document.getElementById('fiyatGirisBirimGostergesi');
    const sonFiyatlarTablosuBody = document.querySelector('#sonFiyatlarTablosu tbody');

    // Veri Saklama (LocalStorage)
    let urunler = JSON.parse(localStorage.getItem('urunler')) || [];
    let fiyatlar = JSON.parse(localStorage.getItem('fiyatlar')) || [];
    let tedarikciler = []; // Tedarikçiler artık API'den yüklenecek

    function verileriKaydet() {
        localStorage.setItem('urunler', JSON.stringify(urunler));
        localStorage.setItem('fiyatlar', JSON.stringify(fiyatlar));
        // localStorage.setItem('tedarikciler', JSON.stringify(tedarikciler)); // Bu satır kaldırılacak veya yorum yapılacak
    }

    function tedarikciAdiniGetir(tedarikciId) {
        const tedarikci = tedarikciler.find(t => t.id === tedarikciId);
        return tedarikci ? tedarikci.ad : '-';
    }

    function urunListesiniGuncelle() {
        urunListesiTablosuBody.innerHTML = ''; // Tabloyu temizle
        urunler.forEach(urun => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${urun.ad}</td>
                <td>${urun.birimAdi || '-'}</td>
                <td class="actions">
                    <button class="edit-btn" data-id="${urun.id}">Düzenle</button>
                    <button class="delete-btn" data-id="${urun.id}">Sil</button>
                </td>
            `;
            urunListesiTablosuBody.appendChild(tr);
        });
        urunleriGrafikSecimineYukle();
        urunleriGunlukFiyatGirisSecimineYukle();
        grafigiOlusturVeyaGuncelle();
    }

    function formuTemizle() {
        urunForm.reset();
        urunIdInput.value = '';
        urunBirimTipiInput.value = '';
        urunBirimAdiInput.value = '';
        formTemizleButton.style.display = 'none';
        urunAdiInput.focus();
    }

    urunForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const id = urunIdInput.value;
        const ad = urunAdiInput.value.trim();
        const birimTipi = urunBirimTipiInput.value;
        const birimAdi = urunBirimAdiInput.value.trim();

        if (!ad || !birimTipi || !birimAdi) {
            alert('Malzeme adı, birim tipi ve birim adı boş bırakılamaz!');
            return;
        }

        if (id) { // Güncelleme
            const index = urunler.findIndex(u => u.id === id);
            if (index > -1) {
                urunler[index] = { ...urunler[index], ad, birimTipi, birimAdi };
            }
        } else { // Yeni Ekleme
            const yeniUrun = {
                id: 'urun-' + Date.now(),
                ad,
                birimTipi,
                birimAdi,
            };
            urunler.push(yeniUrun);
        }
        verileriKaydet();
        urunListesiniGuncelle();
        formuTemizle();
    });

    formTemizleButton.addEventListener('click', formuTemizle);

    urunListesiTablosuBody.addEventListener('click', function(event) {
        const target = event.target;
        const urunId = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const urun = urunler.find(u => u.id === urunId);
            if (urun) {
                urunIdInput.value = urun.id;
                urunAdiInput.value = urun.ad;
                urunBirimTipiInput.value = urun.birimTipi || '';
                urunBirimAdiInput.value = urun.birimAdi || '';
                formTemizleButton.style.display = 'inline-block';
                urunAdiInput.focus();
            }
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Bu malzemeyi silmek istediğinize emin misiniz? Bu işlem malzemenin tüm fiyat geçmişini de silecektir.')) {
                urunler = urunler.filter(u => u.id !== urunId);
                fiyatlar = fiyatlar.filter(f => f.urunId !== urunId);
                verileriKaydet();
                urunListesiniGuncelle(); 
                formuTemizle(); 
            }
        }
    });

    // ----------- Ürün Yönetimi Kodları Bitiş -----------

    // ----------- Tedarikçi Yönetimi Kodları Başlangıç -----------
    function urunTedarikciSeciminiDoldur() {
        const mevcutDeger = fiyatGirisTedarikciSecimi.value;
        fiyatGirisTedarikciSecimi.innerHTML = '<option value="">-- Tedarikçi Seçiniz --</option>';
        tedarikciler.forEach(tedarikci => {
            const option = document.createElement('option');
            option.value = tedarikci.id;
            option.textContent = tedarikci.ad;
            fiyatGirisTedarikciSecimi.appendChild(option);
        });
        // Eğer formda düzenleme sırasında bir değer varsa onu koru
        if (mevcutDeger && tedarikciler.some(t => t.id === mevcutDeger)) {
            fiyatGirisTedarikciSecimi.value = mevcutDeger;
        }
    }

    async function tedarikciListesiniGuncelle() {
        try {
            const response = await fetch('http://localhost:3000/api/tedarikciler'); // Backend adresiniz farklıysa güncelleyin
            if (!response.ok) {
                throw new Error(`API hatası: ${response.status}`);
            }
            const apiTedarikciler = await response.json();
            tedarikciler = apiTedarikciler; // Global tedarikçiler listesini güncelle

            tedarikciListesiTablosuBody.innerHTML = '';
            if (tedarikciler.length === 0) {
                tedarikciListesiTablosuBody.innerHTML = '<tr><td colspan="2">Kayıtlı tedarikçi bulunamadı.</td></tr>';
            } else {
                tedarikciler.forEach(tedarikci => {
                    const tr = document.createElement('tr');
                    // Backend'den gelen `id` (sayısal) ve `ad` alanlarını kullanıyoruz
                    // Ayrıca, backend'den yetkili_kisi, telefon, email, adres de geliyor, tabloya eklenebilir.
                    tr.innerHTML = `
                        <td>${tedarikci.ad}</td>
                        <td>${tedarikci.yetkili_kisi || '-'}</td>
                        <td>${tedarikci.telefon || '-'}</td>
                        <td>${tedarikci.email || '-'}</td>
                        <td>${tedarikci.adres || '-'}</td>
                        <td class="actions">
                            <button class="edit-btn" data-id="${tedarikci.id}">Düzenle</button>
                            <button class="delete-btn" data-id="${tedarikci.id}">Sil</button>
                        </td>
                    `;
                    tedarikciListesiTablosuBody.appendChild(tr);
                });
            }
            urunTedarikciSeciminiDoldur(); // Tedarikçi listesi güncellendiğinde ürün formundaki dropdown da güncellensin
        } catch (error) {
            console.error('Tedarikçiler API\'den getirilirken hata:', error);
            tedarikciListesiTablosuBody.innerHTML = '<tr><td colspan="6">Tedarikçiler yüklenirken bir hata oluştu.</td></tr>'; 
        }
    }

    function tedarikciFormuTemizle() {
        tedarikciForm.reset();
        tedarikciIdInput.value = '';
        tedarikciFormTemizleButton.style.display = 'none';
        tedarikciAdiInput.focus();
    }

    tedarikciForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const id = tedarikciIdInput.value; 
        const ad = tedarikciAdiInput.value.trim();
        const yetkiliKisi = document.getElementById('tedarikciYetkiliKisi') ? document.getElementById('tedarikciYetkiliKisi').value.trim() : null;
        const telefon = document.getElementById('tedarikciTelefon') ? document.getElementById('tedarikciTelefon').value.trim() : null;
        const email = document.getElementById('tedarikciEmail') ? document.getElementById('tedarikciEmail').value.trim() : null;
        const adres = document.getElementById('tedarikciAdres') ? document.getElementById('tedarikciAdres').value.trim() : null;

        if (!ad) {
            alert('Tedarikçi adı boş bırakılamaz!');
            return;
        }

        const tedarikciVerisi = {
            ad: ad,
            yetkili_kisi: yetkiliKisi || null, 
            telefon: telefon || null,
            email: email || null,
            adres: adres || null
        };

        try {
            let response;
            let url = 'http://localhost:3000/api/tedarikciler';
            let method = 'POST';

            if (id) { // Güncelleme (PUT)
                // alert('Tedarikçi güncelleme fonksiyonu API\'ye henüz bağlanmadı.');
                // return; // Güncelleme API'si hazır olana kadar burada bırakılabilir
                url = `http://localhost:3000/api/tedarikciler/${id}`;
                method = 'PUT';
                // Backend'de PUT /api/tedarikciler/:id endpoint'i server.js'e eklendiğinde burası çalışacak.
            } 
            
            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tedarikciVerisi),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `API hatası: ${response.status}`);
            }
            
            const sonuc = await response.json();
            console.log(id ? 'Tedarikçi güncellendi:' : 'Yeni tedarikçi eklendi:', sonuc);
            
            await tedarikciListesiniGuncelle(); 
            tedarikciFormuTemizle();
        } catch (error) {
            console.error('Tedarikçi kaydedilirken hata:', error);
            alert(`Hata: ${error.message}`);
        }
    });

    tedarikciFormTemizleButton.addEventListener('click', tedarikciFormuTemizle);

    tedarikciListesiTablosuBody.addEventListener('click', async function(event) {
        const target = event.target;
        const tedarikciId = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const tedarikci = tedarikciler.find(t => String(t.id) === String(tedarikciId));
            if (tedarikci) {
                tedarikciIdInput.value = tedarikci.id;
                tedarikciAdiInput.value = tedarikci.ad;
                // Formdaki diğer inputları da doldur (HTML'de bu ID'lerin olduğundan emin olun)
                const yetkiliInput = document.getElementById('tedarikciYetkiliKisi');
                const telefonInput = document.getElementById('tedarikciTelefon');
                const emailInput = document.getElementById('tedarikciEmail');
                const adresInput = document.getElementById('tedarikciAdres');

                if (yetkiliInput) yetkiliInput.value = tedarikci.yetkili_kisi || '';
                if (telefonInput) telefonInput.value = tedarikci.telefon || '';
                if (emailInput) emailInput.value = tedarikci.email || '';
                if (adresInput) adresInput.value = tedarikci.adres || '';
                
                tedarikciFormTemizleButton.style.display = 'inline-block';
                tedarikciAdiInput.focus();
                // Sayfayı forma scroll ettirebilirsiniz (opsiyonel)
                // document.getElementById('tedarikciForm').scrollIntoView({ behavior: 'smooth' });
            }
        } else if (target.classList.contains('delete-btn')) {
            const tedarikciAdiSil = tedarikciler.find(t => String(t.id) === String(tedarikciId))?.ad || 'Bu';
            if (confirm(`"${tedarikciAdiSil}" tedarikçisini ve ilişkili tüm fiyat kayıtlarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
                try {
                    const response = await fetch(`http://localhost:3000/api/tedarikciler/${tedarikciId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `API hatası: ${response.status}`);
                    }
                    const sonuc = await response.json();
                    console.log('Tedarikçi silindi:', sonuc.message);
                    alert(sonuc.message); // Başarı mesajını kullanıcıya göster

                    await tedarikciListesiniGuncelle(); // Listeyi API'den tazeleyerek güncelle
                    await sonFiyatlariGuncelle(); 
                    await grafigiOlusturVeyaGuncelle();
                    tedarikciFormuTemizle(); // Formu temizle (eğer düzenleme modundaysa)

                } catch (error) {
                    console.error('Tedarikçi silinirken hata:', error);
                    alert(`Hata: ${error.message}`);
                }
            }
        }
    });
    // ----------- Tedarikçi Yönetimi Kodları Bitiş -----------

    // ----------- Fiyat Grafikleri Kodları Başlangıç -----------
    const grafikUrunSecimi = document.getElementById('grafikUrunSecimi');
    const grafikTedarikciSecimi = document.getElementById('grafikTedarikciSecimi');
    const tedarikciFilterGrafikDiv = document.querySelector('.tedarikci-filter-grafik');
    const zamanAraligiSecimi = document.getElementById('zamanAraligiSecimi');
    const fiyatGrafigiCanvas = document.getElementById('fiyatGrafigi');
    let fiyatGrafigi;

    function urunleriGrafikSecimineYukle() {
        grafikUrunSecimi.innerHTML = '<option value="">-- Ürün Seçiniz --</option>'; // Temizle ve varsayılanı ekle
        urunler.forEach(urun => {
            const option = document.createElement('option');
            option.value = urun.id;
            option.textContent = urun.ad;
            grafikUrunSecimi.appendChild(option);
        });
        // Malzeme seçimi değiştiğinde tedarikçi filtresini de güncelle
        guncelleGrafikTedarikciFiltresi(); 
    }

    function guncelleGrafikTedarikciFiltresi() {
        const seciliUrunId = grafikUrunSecimi.value;
        grafikTedarikciSecimi.innerHTML = '<option value="">-- Tüm Tedarikçiler --</option>'; // Resetle

        if (seciliUrunId) {
            const urunFiyatlari = fiyatlar.filter(f => f.urunId === seciliUrunId);
            const buUrununTedarikcileri = [...new Set(urunFiyatlari.map(f => f.tedarikciId))];
            
            buUrununTedarikcileri.forEach(tedarikciId => {
                const tedarikci = tedarikciler.find(t => t.id === tedarikciId);
                if (tedarikci) {
                    const option = document.createElement('option');
                    option.value = tedarikci.id;
                    option.textContent = tedarikci.ad;
                    grafikTedarikciSecimi.appendChild(option);
                }
            });
            tedarikciFilterGrafikDiv.style.display = buUrununTedarikcileri.length > 0 ? 'block' : 'none';
        } else {
            tedarikciFilterGrafikDiv.style.display = 'none';
        }
        grafigiOlusturVeyaGuncelle(); // Ana grafik fonksiyonunu çağır
    }

    function tarihiFiltrele(fiyatListesi, zamanAraligi) {
        const simdi = new Date();
        let baslangicTarihi = new Date();

        switch (zamanAraligi) {
            case 'haftalik':
                baslangicTarihi.setDate(simdi.getDate() - 7);
                break;
            case 'aylik':
                baslangicTarihi.setMonth(simdi.getMonth() - 1);
                break;
            case 'son3ay':
                baslangicTarihi.setMonth(simdi.getMonth() - 3);
                break;
            case 'yillik':
                baslangicTarihi.setFullYear(simdi.getFullYear() - 1);
                break;
            case 'tum':
                return fiyatListesi.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
            default:
                return fiyatListesi.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
        }
        
        return fiyatListesi.filter(f => new Date(f.tarih) >= baslangicTarihi && new Date(f.tarih) <= simdi)
                           .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    }

    function grafigiOlusturVeyaGuncelle() {
        const seciliUrunId = grafikUrunSecimi.value;
        const seciliTedarikciId = grafikTedarikciSecimi.value; // "" ise "Tüm Tedarikçiler"
        const seciliZamanAraligi = zamanAraligiSecimi.value;

        if (fiyatGrafigi) {
            fiyatGrafigi.destroy();
        }
        const context = fiyatGrafigiCanvas.getContext('2d');
        context.clearRect(0, 0, fiyatGrafigiCanvas.width, fiyatGrafigiCanvas.height);

        if (!seciliUrunId) {
            // Seçili ürün yoksa canvas'ı temizle (zaten yapıldı ama garanti) ve çık
            return;
        }

        const seciliUrun = urunler.find(u => u.id === seciliUrunId);
        if (!seciliUrun) {
            context.fillText("Ürün bulunamadı.", fiyatGrafigiCanvas.width / 2, fiyatGrafigiCanvas.height / 2);
            return;
        }
        const urunAdi = seciliUrun.ad;
        const urunBirimi = seciliUrun.birimAdi || '';

        let urunFiyatlari = fiyatlar.filter(f => f.urunId === seciliUrunId);
        const filtrelenmisFiyatlarTumTedarikciler = tarihiFiltrele([...urunFiyatlari], seciliZamanAraligi); // Kopyasını gönder

        if (filtrelenmisFiyatlarTumTedarikciler.length === 0) {
            context.font = "16px Arial";
            context.textAlign = "center";
            context.fillText("Seçilen ürün ve zaman aralığı için veri bulunamadı.", fiyatGrafigiCanvas.width / 2, fiyatGrafigiCanvas.height / 2);
            return;
        }

        let datasets = [];
        let grafikEtiketiAnaBaslik = `${urunAdi} Fiyat Değişimi`;
        
        // Renk paleti (gerekirse daha fazla renk eklenebilir)
        const renkPaleti = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#839192'];

        if (seciliTedarikciId) { // Tek bir tedarikçi seçili
            const tedarikciFiyatlari = filtrelenmisFiyatlarTumTedarikciler.filter(f => f.tedarikciId === seciliTedarikciId);
            if (tedarikciFiyatlari.length === 0) {
                context.font = "16px Arial";
                context.textAlign = "center";
                context.fillText("Bu tedarikçi için seçilen zaman aralığında veri bulunamadı.", fiyatGrafigiCanvas.width / 2, fiyatGrafigiCanvas.height / 2);
                return;
            }

            const etiketler = tedarikciFiyatlari.map(f => {
                const tarihObj = new Date(f.tarih);
                return `${tarihObj.getDate().toString().padStart(2, '0')}.${(tarihObj.getMonth() + 1).toString().padStart(2, '0')}.${tarihObj.getFullYear()}`;
            });
            const veriNoktalari = tedarikciFiyatlari.map(f => f.fiyat);
            const seciliTedarikci = tedarikciler.find(t => t.id === seciliTedarikciId);
            const tedarikciAdi = seciliTedarikci ? seciliTedarikci.ad : 'Bilinmeyen Tedarikçi';
            grafikEtiketiAnaBaslik = `${urunAdi} (${tedarikciAdi}) Fiyat Değişimi`;

            datasets.push({
                label: `${tedarikciAdi} (${urunBirimi})`,
                data: veriNoktalari,
                borderColor: renkPaleti[0], // İlk rengi kullan
                backgroundColor: 'rgba(92, 184, 92, 0.1)', // Yeşilimsi dolgu
                tension: 0.1,
                fill: true,
            });

            fiyatGrafigi = new Chart(fiyatGrafigiCanvas, {
                type: 'line',
                data: {
                    labels: etiketler,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        title: { display: true, text: grafikEtiketiAnaBaslik },
                        legend: { display: true }, // Tek tedarikçi için de lejantı göster
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) { label += ': '; }
                                    if (context.parsed.y !== null) {
                                        label += parseFloat(context.parsed.y).toFixed(2);
                                    }
                                    return label;
                                }
                            }
                        },
                        datalabels: {
                            align: 'end',
                            anchor: 'end',
                            backgroundColor: function(context) { return context.dataset.borderColor; },
                            borderRadius: 4,
                            color: 'white',
                            font: { weight: 'bold' },
                            formatter: function(value, context) { return parseFloat(value).toFixed(2); },
                            padding: 6,
                            // Çok fazla nokta varsa etiketleri gizle, burada tek çizgi olduğu için her zaman gösterilebilir.
                            // Veya bir eşik değer belirlenebilir. Şimdilik hep gösterilsin.
                        }
                    },
                    scales: {
                        y: { beginAtZero: false, title: { display: true, text: 'Fiyat' } },
                        x: { title: { display: true, text: 'Tarih' } }
                    }
                }
            });

        } else { // "Tüm Tedarikçiler" seçili
            grafikEtiketiAnaBaslik = `${urunAdi} Fiyat Değişimi (Tüm Tedarikçiler)`;
            const tedarikciIdleri = [...new Set(filtrelenmisFiyatlarTumTedarikciler.map(f => f.tedarikciId))];
            
            // Tüm verilerdeki benzersiz tarihleri alıp sıralayalım
            const tumTarihler = [...new Set(filtrelenmisFiyatlarTumTedarikciler.map(f => f.tarih))]
                                .sort((a, b) => new Date(a) - new Date(b))
                                .map(tarih => {
                                    const tarihObj = new Date(tarih);
                                    return `${tarihObj.getDate().toString().padStart(2, '0')}.${(tarihObj.getMonth() + 1).toString().padStart(2, '0')}.${tarihObj.getFullYear()}`;
                                });

            tedarikciIdleri.forEach((tdrId, index) => {
                const tedarikci = tedarikciler.find(t => t.id === tdrId);
                const tedarikciAdi = tedarikci ? tedarikci.ad : 'Bilinmeyen Tedarikçi';
                const buTedarikcininFiyatlari = filtrelenmisFiyatlarTumTedarikciler.filter(f => f.tedarikciId === tdrId);

                // Her tedarikçinin verisini, tüm benzersiz tarihlere göre eşleştir
                const veriNoktalari = tumTarihler.map(etiketTarih => {
                    const tarihObjFormatli = `${etiketTarih.split('.')[2]}-${etiketTarih.split('.')[1]}-${etiketTarih.split('.')[0]}`; // YYYY-MM-DD formatına çevir
                    const fiyatKaydi = buTedarikcininFiyatlari.find(f => {
                        const kayitTarihObj = new Date(f.tarih);
                        const kayitTarihFormatli = `${kayitTarihObj.getFullYear()}-${(kayitTarihObj.getMonth() + 1).toString().padStart(2, '0')}-${kayitTarihObj.getDate().toString().padStart(2, '0')}`;
                        return kayitTarihFormatli === tarihObjFormatli;
                    });
                    return fiyatKaydi ? fiyatKaydi.fiyat : null; // O tarihte fiyat yoksa null
                });
                
                datasets.push({
                    label: `${tedarikciAdi} (${urunBirimi})`,
                    data: veriNoktalari,
                    borderColor: renkPaleti[index % renkPaleti.length], // Renk paletinden sırayla ata
                    tension: 0.1,
                    fill: false, // Çoklu çizgiler için dolguyu kapatmak daha iyi görünür
                    spanGaps: true, // null olan noktalarda çizgiyi birleştir
                });
            });

            fiyatGrafigi = new Chart(fiyatGrafigiCanvas, {
                type: 'line',
                data: {
                    labels: tumTarihler, // Ortak X ekseni etiketleri
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        title: { display: true, text: grafikEtiketiAnaBaslik },
                        legend: { 
                            display: true,
                            position: 'top', // Lejantı üstte göster
                        },
                        tooltip: {
                            mode: 'index', // Aynı index'teki tüm veri setlerini göster
                            intersect: false,
                            callbacks: {
                                // Tooltip başlığını tarih olarak ayarla
                                title: function(tooltipItems) {
                                    if (tooltipItems.length > 0) {
                                        return tooltipItems[0].label; // X ekseni etiketi (tarih)
                                    }
                                    return '';
                                },
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) { label = label.split('(')[0].trim(); label += ': '; } // Tedarikçi adını al
                                    if (context.parsed.y !== null) {
                                        label += parseFloat(context.parsed.y).toFixed(2);
                                    } else {
                                        label += '-'; // Değer yoksa
                                    }
                                    return label;
                                }
                            }
                        },
                        datalabels: {
                            // Çoklu çizgilerde ve çok noktada datalabels karmaşık olabilir.
                            // Şimdilik devre dışı bırakalım veya koşullu yapalım.
                            // Örneğin, sadece bir tedarikçi seçiliyse veya nokta sayısı azsa göster.
                            display: function(context) {
                                // Çok fazla dataset veya nokta varsa gösterme
                                return context.chart.data.datasets.length === 1 || context.dataset.data.filter(d => d !== null).length < 10;
                            },
                            align: 'end',
                            anchor: 'end',
                            backgroundColor: function(context) { return context.dataset.borderColor; },
                            borderRadius: 4,
                            color: 'white',
                            font: { weight: 'bold' },
                            formatter: function(value, context) { return parseFloat(value).toFixed(2); },
                            padding: 6
                        }
                    },
                    scales: {
                        y: { beginAtZero: false, title: { display: true, text: 'Fiyat' } },
                        x: { title: { display: true, text: 'Tarih' } }
                    }
                }
            });
        }
    }

    grafikUrunSecimi.addEventListener('change', guncelleGrafikTedarikciFiltresi);
    grafikTedarikciSecimi.addEventListener('change', grafigiOlusturVeyaGuncelle);
    zamanAraligiSecimi.addEventListener('change', grafigiOlusturVeyaGuncelle);

    // ----------- Fiyat Grafikleri Kodları Bitiş -----------

    // ----------- Günlük Fiyat Girişi Kodları Başlangıç -----------
    function urunleriGunlukFiyatGirisSecimineYukle() {
        const mevcutDeger = fiyatGirisMalzemeSecimi.value;
        fiyatGirisMalzemeSecimi.innerHTML = '<option value="">-- Malzeme Seçiniz --</option>';
        urunler.forEach(urun => {
            const option = document.createElement('option');
            option.value = urun.id;
            option.textContent = `${urun.ad} (${urun.birimAdi || 'Tanımsız Birim'})`;
            fiyatGirisMalzemeSecimi.appendChild(option);
        });
        if (mevcutDeger && urunler.some(u => u.id === mevcutDeger)) {
            fiyatGirisMalzemeSecimi.value = mevcutDeger;
        }
        // Malzeme seçimi değiştiğinde birimi güncelle
        guncelleFiyatGirisBirimGostergesi();
    }

    function guncelleFiyatGirisBirimGostergesi() {
        const seciliUrunId = fiyatGirisMalzemeSecimi.value;
        if (seciliUrunId) {
            const seciliUrun = urunler.find(u => u.id === seciliUrunId);
            fiyatGirisBirimGostergesi.textContent = seciliUrun ? (seciliUrun.birimAdi || '-') : '-';
        } else {
            fiyatGirisBirimGostergesi.textContent = '-';
        }
    }

    fiyatGirisMalzemeSecimi.addEventListener('change', guncelleFiyatGirisBirimGostergesi);

    function sonFiyatlariGuncelle(limit = 5) {
        sonFiyatlarTablosuBody.innerHTML = '';
        // Fiyatları tarihe göre tersten sırala ve limiti uygula
        const sonGirilenler = [...fiyatlar].sort((a, b) => new Date(b.tarih) - new Date(a.tarih)).slice(0, limit);
        sonGirilenler.forEach(fiyat => {
            const urun = urunler.find(u => u.id === fiyat.urunId);
            if (urun) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${urun.ad}</td>
                    <td>${fiyat.fiyat.toFixed(2)}</td>
                    <td>${urun.birimAdi || '-'}</td>
                    <td>${new Date(fiyat.tarih).toLocaleDateString('tr-TR')}</td>
                    <td>${tedarikciAdiniGetir(fiyat.tedarikciId)}</td>
                `;
                sonFiyatlarTablosuBody.appendChild(tr);
            }
        });
    }

    gunlukFiyatForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const urunId = fiyatGirisMalzemeSecimi.value;
        const tedarikciId = fiyatGirisTedarikciSecimi.value;
        const fiyat = parseFloat(gunlukFiyatInput.value);
        const tarih = gunlukTarihInput.value;

        if (!urunId || !tedarikciId || isNaN(fiyat) || !tarih) {
            alert('Lütfen malzeme, tedarikçi seçin ve tüm alanları doğru bir şekilde doldurun.');
            return;
        }

        fiyatlar.push({ urunId, tedarikciId, fiyat, tarih });
        verileriKaydet();
        alert('Fiyat başarıyla kaydedildi!');
        gunlukFiyatForm.reset();
        fiyatGirisMalzemeSecimi.value = '';
        fiyatGirisTedarikciSecimi.value = '';
        guncelleFiyatGirisBirimGostergesi();
        const today = new Date().toISOString().split('T')[0];
        gunlukTarihInput.value = today;
        sonFiyatlariGuncelle();
        grafigiOlusturVeyaGuncelle();
    });
    
    // ----------- Günlük Fiyat Girişi Kodları Bitiş -----------

    // Mevcut urunListesiniGuncelle fonksiyonuna ekleme:
    const eskiUrunListesiniGuncelle = urunListesiniGuncelle;
    urunListesiniGuncelle = function() { 
        eskiUrunListesiniGuncelle.apply(this, arguments); 
        // urunleriGunlukFiyatGirisSecimineYukle(); // Zaten eskiUrunListesiniGuncelle içinde çağrılıyor
        // urunleriGrafikSecimineYukle(); // Zaten eskiUrunListesiniGuncelle içinde çağrılıyor
        // grafigiOlusturVeyaGuncelle(); // Bu çağrı gereksiz çünkü eskiUrunListesiniGuncelle zaten grafik güncellemesini tetikliyor.
                                     // eskiUrunListesiniGuncelle -> urunleriGrafikSecimineYukle -> guncelleGrafikTedarikciFiltresi -> grafigiOlusturVeyaGuncelle zinciri var.
    }

    const eskiTedarikciListesiniGuncelle = tedarikciListesiniGuncelle;

    // Sayfa yüklendiğinde ve "Fiyat Grafikleri" sekmesi aktif olduğunda dropdown'u doldur.
    tedarikciListesiniGuncelle(); 
    urunListesiniGuncelle(); // Bu, ürünleri ve ilişkili dropdownları (grafik, günlük fiyat) yükler
    sonFiyatlariGuncelle(); // Sayfa ilk yüklendiğinde son fiyatları göster
    const today = new Date().toISOString().split('T')[0];
    gunlukTarihInput.value = today; // Günlük fiyat girişi tarihini bugüne ayarla

    grafigiOlusturVeyaGuncelle(); 
});

// Daha fazla JavaScript kodu eklenebilir. 