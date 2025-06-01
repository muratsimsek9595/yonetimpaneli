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
    // let urunler = []; // Ürünler artık API'den yüklenecek
    // let fiyatlar = []; // Fiyatlar da API'den yüklenecek (sonraki adım)
    // let tedarikciler = []; // Tedarikçiler artık API'den yüklenecek

    function verileriKaydet() { 
        // localStorage artık kullanılmayacak, bu fonksiyonun içeriği boşaltıldı veya tamamen kaldırılabilir.
    }

    function tedarikciAdiniGetir(tedarikciId) {
        const tedarikci = tedarikciler.find(t => t.id === tedarikciId);
        return tedarikci ? tedarikci.ad : '-';
    }

    function urunListesiniGuncelle() {
        urunListesiTablosuBody.innerHTML = ''; 
        if (!Array.isArray(urunler) || urunler.length === 0) {
            urunListesiTablosuBody.innerHTML = '<tr><td colspan="3">Kayıtlı malzeme bulunamadı.</td></tr>';
        } else {
            urunler.forEach(urun => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${urun.ad}</td>
                    <td>${urun.birim_adi || '-'}</td> 
                    <td class="actions">
                        <button class="edit-btn" data-id="${urun.id}">Düzenle</button>
                        <button class="delete-btn" data-id="${urun.id}">Sil</button>
                    </td>
                `;
                urunListesiTablosuBody.appendChild(tr);
            });
        }
        urunleriGrafikSecimineYukle();
        urunleriGunlukFiyatGirisSecimineYukle();
        // grafigiOlusturVeyaGuncelle(); // Bu, fiyatlar yüklendikten sonra çağrılmalı
    }

    function formuTemizle() { // urunForm için
        urunForm.reset();
        urunIdInput.value = '';
        // urunBirimTipiInput.value = ''; // Form reset ile temizleniyor
        // urunBirimAdiInput.value = ''; // Form reset ile temizleniyor
        formTemizleButton.style.display = 'none';
        urunAdiInput.focus();
    }

    urunForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const id = urunIdInput.value;
        const ad = urunAdiInput.value.trim();
        const birimTipi = urunBirimTipiInput.value;
        const birimAdi = urunBirimAdiInput.value.trim();

        if (!ad || !birimTipi || !birimAdi) {
            alert('Malzeme adı, birim tipi ve birim adı boş bırakılamaz!');
            return;
        }

        const malzemeVerisi = {
            ad: ad,
            birim_tipi: birimTipi, // API'ye göndereceğimiz isimler DB ile aynı olmalı
            birim_adi: birimAdi
        };

        let url = 'api/malzemeler.php';
        let method = 'POST';

        if (id) { // Güncelleme
            url = `api/malzemeler.php?id=${id}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(malzemeVerisi),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status} - ${response.statusText}` }));
                throw new Error(errorData.message || `Malzeme ${id ? 'güncellenirken' : 'eklenirken'} API hatası: ${response.status}`);
            }

            const sonuc = await response.json();
            console.log(sonuc.message, sonuc);
            // alert(sonuc.message);

            await malzemeleriYukle(); // Listeyi API'den tazeleyerek güncelle
            formuTemizle();
        } catch (error) {
            console.error(`Malzeme ${id ? 'güncellenirken' : 'eklenirken'} hata:`, error);
            alert(`Hata: ${error.message}`);
        }
    });

    formTemizleButton.addEventListener('click', formuTemizle);

    urunListesiTablosuBody.addEventListener('click', async function(event) {
        const target = event.target;
        const urunId = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const urun = urunler.find(u => String(u.id) === String(urunId)); // API'den gelen ID'ler string olabilir
            if (urun) {
                urunIdInput.value = urun.id;
                urunAdiInput.value = urun.ad;
                urunBirimTipiInput.value = urun.birim_tipi || ''; // API'den gelen isim
                urunBirimAdiInput.value = urun.birim_adi || '';   // API'den gelen isim
                formTemizleButton.style.display = 'inline-block';
                urunAdiInput.focus();
            }
        } else if (target.classList.contains('delete-btn')) {
            const urunAdiSil = urunler.find(u => String(u.id) === String(urunId))?.ad || 'Bu malzeme';
            // Fiyat silme uyarısını API'ye göre güncelleyeceğiz
            if (confirm(`'${urunAdiSil}' malzemesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) { 
                try {
                    const response = await fetch(`api/malzemeler.php?id=${urunId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status} - ${response.statusText}` }));
                        throw new Error(errorData.message || `Malzeme silinirken API hatası: ${response.status}`);
                    }
                    const sonuc = await response.json();
                    console.log(sonuc.message, sonuc);
                    // alert(sonuc.message);

                    await malzemeleriYukle(); // Listeyi API'den tazeleyerek güncelle
                    formuTemizle(); 
                } catch (error) {
                    console.error('Malzeme silinirken hata:', error);
                    alert(`Hata: ${error.message}`);
                }
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
            const response = await fetch('api/tedarikciler.php'); // Güncellendi
            if (!response.ok) {
                // HTTP durum kodu 200-299 aralığında değilse hata fırlat
                let errorText = `API hatası: ${response.status}`;
                try {
                    const errorData = await response.json(); // Sunucudan gelen JSON hata mesajını almaya çalış
                    errorText = errorData.message || errorText;
                } catch (e) { /* JSON parse edilemezse statusText\'i kullan */ errorText = response.statusText; }
                throw new Error(errorText);
            }
            const apiTedarikciler = await response.json();
            tedarikciler = apiTedarikciler; // Global tedarikçiler listesini güncelle

            tedarikciListesiTablosuBody.innerHTML = '';
            if (!Array.isArray(tedarikciler) || tedarikciler.length === 0) {
                tedarikciListesiTablosuBody.innerHTML = '<tr><td colspan="3">Kayıtlı tedarikçi bulunamadı.</td></tr>';
            } else {
                tedarikciler.forEach(tedarikci => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${tedarikci.ad}</td>
                        <td class="actions">
                            <button class="edit-btn" data-id="${tedarikci.id}">Düzenle</button>
                            <button class="delete-btn" data-id="${tedarikci.id}">Sil</button>
                        </td>
                    `;
                    tedarikciListesiTablosuBody.appendChild(tr);
                });
            }
            urunTedarikciSeciminiDoldur(); 
        } catch (error) {
            console.error('Tedarikçiler API\'den getirilirken hata:', error);
            tedarikciListesiTablosuBody.innerHTML = '<tr><td colspan="3">Tedarikçiler yüklenirken bir hata oluştu.</td></tr>';
        }
    }

    function tedarikciFormuTemizle() {
        tedarikciForm.reset();
        tedarikciIdInput.value = '';
        // Diğer inputların temizlenmesi (artık kullanılmıyorlar ama formda kalmış olabilirler)
        const yetkiliInput = document.getElementById('tedarikciYetkiliKisi');
        const telefonInput = document.getElementById('tedarikciTelefon');
        const emailInput = document.getElementById('tedarikciEmail');
        const adresInput = document.getElementById('tedarikciAdres');
        if (yetkiliInput) yetkiliInput.value = '';
        if (telefonInput) telefonInput.value = '';
        if (emailInput) emailInput.value = '';
        if (adresInput) adresInput.value = '';
        
        tedarikciFormTemizleButton.style.display = 'none';
        tedarikciAdiInput.focus();
    }

    tedarikciForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const id = tedarikciIdInput.value; 
        const ad = tedarikciAdiInput.value.trim();

        if (!ad) {
            alert('Tedarikçi adı boş bırakılamaz!');
            return;
        }

        const tedarikciVerisi = { // Sadece 'ad' alanı gönderiliyor
            ad: ad
        };

        try {
            let response;
            let url = 'api/tedarikciler.php'; // Güncellendi
            let method = 'POST';

            if (id) { // Güncelleme (PUT)
                url = `api/tedarikciler.php?id=${id}`; // Güncellendi: ID URL parametresi olarak
                method = 'PUT';
            } 
            
            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tedarikciVerisi),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status} - ${response.statusText}` }));
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
                // Diğer form inputları artık doldurulmuyor (yetkili_kisi vb.)
                
                tedarikciFormTemizleButton.style.display = 'inline-block';
                tedarikciAdiInput.focus();
            }
        } else if (target.classList.contains('delete-btn')) {
            const tedarikciAdiSil = tedarikciler.find(t => String(t.id) === String(tedarikciId))?.ad || 'Bu';
            // Fiyat kayıtları ile ilgili uyarıyı kaldırdım, çünkü PHP tarafı henüz bunu işlemiyor.
            if (confirm(`"${tedarikciAdiSil}" tedarikçisini silmek istediğinize emin misiniz?`)) {
                try {
                    const response = await fetch(`api/tedarikciler.php?id=${tedarikciId}`, { // Güncellendi
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status} - ${response.statusText}` }));
                        throw new Error(errorData.message || `API hatası: ${response.status}`);
                    }
                    const sonuc = await response.json();
                    console.log('Tedarikçi silindi:', sonuc.message);
                    alert(sonuc.message || 'Tedarikçi başarıyla silindi.');

                    await tedarikciListesiniGuncelle(); 
                    // await sonFiyatlariGuncelle(); // Fiyat API'si henüz yok
                    // await grafigiOlusturVeyaGuncelle(); // Fiyat API'si henüz yok
                    tedarikciFormuTemizle(); 
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

    async function sonFiyatlariGuncelle(limit = 5) {
        sonFiyatlarTablosuBody.innerHTML = '';
        try {
            const response = await fetch(`api/fiyatlar.php?limit=${limit}&sortBy=tarih&order=DESC`); // API'den son N fiyatı çek
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Son fiyatlar API hatası: ${response.status} - ${response.statusText}`);
            }
            const sonGirilenler = await response.json();
            fiyatlar = sonGirilenler; // Global fiyatlar dizisini de güncelleyebiliriz veya sadece bu fonksiyon için kullanabiliriz.

            if (sonGirilenler.length === 0) {
                sonFiyatlarTablosuBody.innerHTML = '<tr><td colspan="5">Kayıtlı fiyat girişi bulunamadı.</td></tr>';
                return;
            }

            sonGirilenler.forEach(fiyat => {
                // API yanıtında malzeme_adi, malzeme_birim_adi, tedarikci_adi zaten geliyor olmalı (JOIN ile)
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${fiyat.malzeme_adi || '-'}</td>
                    <td>${parseFloat(fiyat.fiyat).toFixed(2)}</td>
                    <td>${fiyat.malzeme_birim_adi || '-'}</td>
                    <td>${new Date(fiyat.tarih).toLocaleDateString('tr-TR')}</td>
                    <td>${fiyat.tedarikci_adi || '-'}</td>
                `;
                sonFiyatlarTablosuBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Son fiyatlar yüklenirken hata:', error);
            sonFiyatlarTablosuBody.innerHTML = '<tr><td colspan="5">Son fiyatlar yüklenirken bir hata oluştu.</td></tr>';
        }
    }

    gunlukFiyatForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const malzeme_id = fiyatGirisMalzemeSecimi.value;
        const tedarikci_id = fiyatGirisTedarikciSecimi.value;
        const fiyatInput = document.getElementById('gunlukFiyatInput'); // ID'yi direkt alalım
        const fiyatValue = fiyatInput.value;
        const tarih = document.getElementById('gunlukTarihInput').value; // ID'yi direkt alalım

        if (!malzeme_id || !tedarikci_id || fiyatValue === '' || !tarih) {
            alert('Lütfen malzeme, tedarikçi seçin ve tüm alanları doğru bir şekilde doldurun.');
            return;
        }
        
        const fiyatFloat = parseFloat(fiyatValue);
        if (isNaN(fiyatFloat)) {
            alert('Fiyat geçerli bir sayı olmalıdır.');
            return;
        }

        const fiyatVerisi = {
            malzeme_id: malzeme_id,
            tedarikci_id: tedarikci_id,
            fiyat: fiyatFloat,
            tarih: tarih
        };

        try {
            const response = await fetch('api/fiyatlar.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(fiyatVerisi),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status} - ${response.statusText}` }));
                throw new Error(errorData.message || `Fiyat eklenirken API hatası: ${response.status}`);
            }

            const sonuc = await response.json();
            console.log(sonuc.message, sonuc);
            // alert(sonuc.message);

            gunlukFiyatForm.reset();
            //fiyatGirisMalzemeSecimi.value = ''; // Reset sonrası zaten boş olur
            //fiyatGirisTedarikciSecimi.value = ''; // Reset sonrası zaten boş olur
            guncelleFiyatGirisBirimGostergesi(); 
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('gunlukTarihInput').value = today;
            
            await sonFiyatlariGuncelle(); // Son fiyatlar listesini API'den tazele
            // await grafigiOlusturVeyaGuncelle(); // Grafik de API'den güncellenecek

        } catch (error) {
            console.error('Fiyat kaydedilirken hata:', error);
            alert(`Hata: ${error.message}`);
        }
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

    // ----------- Genel Başlangıç Fonksiyonları -----------
    async function malzemeleriYukle() {
        console.log("malzemeleriYukle fonksiyonu çağrıldı."); // Kontrol için eklendi
        try {
            console.log("API isteği yapılacak: api/malzemeler.php"); // Kontrol için eklendi
            const response = await fetch('api/malzemeler.php');
            if (!response.ok) {
                let errorText = `Malzeme API hatası: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorText = errorData.message || errorText;
                } catch (e) { errorText = response.statusText; }
                throw new Error(errorText);
            }
            const apiUrunler = await response.json();
            urunler = apiUrunler; // Global ürünler listesini güncelle
            console.log("Malzemeler API'den yüklendi:", urunler);
            urunListesiniGuncelle(); // Malzemeler yüklendikten sonra tabloyu ve dropdownları güncelle
        } catch (error) {
            console.error('Malzemeler API\'den getirilirken hata:', error);
            urunListesiTablosuBody.innerHTML = '<tr><td colspan="3">Malzemeler yüklenirken bir hata oluştu.</td></tr>';
        }
    }

    async function initializePageData() {
        console.log("Sayfa verileri yükleniyor...");
        await tedarikciListesiniGuncelle();
        await malzemeleriYukle();
        await sonFiyatlariGuncelle(); // Sayfa ilk yüklendiğinde son fiyatları API'den çek
        
        const gunlukTarihInput = document.getElementById('gunlukTarihInput');
        if (gunlukTarihInput) {
            const today = new Date().toISOString().split('T')[0];
            gunlukTarihInput.value = today;
        }
        console.log("Sayfa verileri başarıyla yüklendi.");
    }

    // Sayfa yüklendiğinde verileri ve UI'ı hazırla
    initializePageData();
});

// Daha fazla JavaScript kodu eklenebilir. 