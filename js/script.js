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
    const urunBirimSecimi = document.getElementById('urunBirimSecimi');
    const ozelBirimContainer = document.getElementById('ozelBirimContainer');
    const urunBirimAdiInput = document.getElementById('urunBirimAdi');
    const urunListesiTablosuBody = document.querySelector('#urunListesiTablosu tbody');
    const formTemizleButton = document.getElementById('formTemizleButton');

    // Tedarikçi Yönetimi Elemanları
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

    // Günlük Fiyat Girişi Elemanları
    const gunlukFiyatForm = document.getElementById('gunlukFiyatForm');
    const fiyatGirisMalzemeSecimi = document.getElementById('fiyatGirisMalzemeSecimi');
    const fiyatGirisTedarikciSecimi = document.getElementById('fiyatGirisTedarikciSecimi');
    const fiyatGirisBirimGostergesi = document.getElementById('fiyatGirisBirimGostergesi');
    const sonFiyatlarTablosuBody = document.querySelector('#sonFiyatlarTablosu tbody');

    let urunler = []; // Ürünler artık API'den yüklenecek
    let fiyatlar = []; // Fiyatlar da API'den yüklenecek
    let tedarikciler = []; // Tedarikçiler artık API'den yüklenecek

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
        if (urunBirimSecimi) {
            urunBirimSecimi.value = ''; // Dropdown'ı sıfırla
        }
        ozelBirimContainer.style.display = 'none'; // Özel birim alanını gizle
        urunBirimAdiInput.value = ''; // Özel birim inputunu temizle
        formTemizleButton.style.display = 'none';
        urunAdiInput.focus();
    }

    // Birim seçimi dropdown'ı değiştiğinde özel birim alanını yönet
    if (urunBirimSecimi) { // Elementin varlığını kontrol et
        urunBirimSecimi.addEventListener('change', function() {
            if (this.value === 'diger') {
                ozelBirimContainer.style.display = 'block';
                urunBirimAdiInput.value = ''; // Özel birim alanını temizle
                urunBirimAdiInput.focus();
            } else {
                ozelBirimContainer.style.display = 'none';
                // urunBirimAdiInput.value = this.value; // Kullanıcı dropdown'dan seçince özel alanı doldurmayalım, form submit anında karar verilir.
            }
        });
    }

    urunForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const id = urunIdInput.value;
        const ad = urunAdiInput.value.trim();
        
        let birimDegeri = '';
        if (urunBirimSecimi) { // Dropdown varsa
            if (urunBirimSecimi.value === 'diger') {
                birimDegeri = urunBirimAdiInput.value.trim();
            } else {
                birimDegeri = urunBirimSecimi.value;
            }
        }

        if (!ad) {
            alert('Malzeme adı boş bırakılamaz!');
            return;
        }
        // İsteğe bağlı: "Diğer" seçiliyse özel birimin boş olmaması kontrolü
        if (urunBirimSecimi && urunBirimSecimi.value === 'diger' && !birimDegeri) {
            alert('Lütfen özel birim adını girin veya listeden bir birim seçin.');
            return;
        }

        const malzemeVerisi = {
            ad: ad,
            birim_adi: birimDegeri // API bu ismi bekliyor
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
                const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status}` }));
                throw new Error(errorData.message || `Malzeme ${id ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`);
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
            const urun = urunler.find(u => String(u.id) === String(urunId));
            if (urun) {
                urunIdInput.value = urun.id;
                urunAdiInput.value = urun.ad;
                
                // Birim alanlarını doldur
                if (urunBirimSecimi) {
                    const seceneklerdeVar = Array.from(urunBirimSecimi.options).some(option => option.value === urun.birim_adi);
                    if (seceneklerdeVar && urun.birim_adi !== 'diger') {
                        urunBirimSecimi.value = urun.birim_adi;
                        ozelBirimContainer.style.display = 'none';
                        urunBirimAdiInput.value = ''; // Özel alanı temizle
                    } else {
                        urunBirimSecimi.value = 'diger';
                        ozelBirimContainer.style.display = 'block';
                        urunBirimAdiInput.value = urun.birim_adi || '';
                    }
                } else { // Dropdown yoksa (eski yapı veya bir hata durumunda), sadece text inputu doldur
                    urunBirimAdiInput.value = urun.birim_adi || '';
                }

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
                        const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status}` }));
                        throw new Error(errorData.message || `Malzeme silinirken bir sorun oluştu.`);
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
        tedarikciListesiTablosuBody.innerHTML = ''; 
        if (!Array.isArray(tedarikciler) || tedarikciler.length === 0) {
            tedarikciListesiTablosuBody.innerHTML = '<tr><td colspan="7">Kayıtlı tedarikçi bulunamadı.</td></tr>';
        } else {
            tedarikciler.forEach(tedarikci => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${tedarikci.ad || '-'}</td>
                    <td>${tedarikci.yetkili_kisi || '-'}</td>
                    <td>${tedarikci.telefon || '-'}</td>
                    <td>${tedarikci.email || '-'}</td>
                    <td>${tedarikci.adres || '-'}</td>
                    <td>${tedarikci.not_alani || '-'}</td>
                    <td class="actions">
                        <button class="edit-btn" data-id="${tedarikci.id}">Düzenle</button>
                        <button class="delete-btn" data-id="${tedarikci.id}">Sil</button>
                    </td>
                `;
                tedarikciListesiTablosuBody.appendChild(tr);
            });
        }
        urunTedarikciSeciminiDoldur();
        guncelleGrafikTedarikciFiltresi();
    }

    function tedarikciFormuTemizle() {
        tedarikciForm.reset();
        tedarikciIdInput.value = '';
        tedarikciAdiInput.value = '';
        tedarikciYetkiliKisiInput.value = '';
        tedarikciTelefonInput.value = '';
        tedarikciEmailInput.value = '';
        tedarikciAdresInput.value = '';
        tedarikciNotInput.value = '';
        tedarikciFormTemizleButton.style.display = 'none';
        tedarikciAdiInput.focus();
    }

    if (tedarikciForm) {
        tedarikciForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const id = tedarikciIdInput.value;
            const ad = tedarikciAdiInput.value.trim();
            const yetkili_kisi = tedarikciYetkiliKisiInput.value.trim();
            const telefon = tedarikciTelefonInput.value.trim();
            const email = tedarikciEmailInput.value.trim();
            const adres = tedarikciAdresInput.value.trim();
            const not_alani = tedarikciNotInput.value.trim();

            if (!ad) {
                alert('Tedarikçi adı boş bırakılamaz!');
                return;
            }

            const tedarikciVerisi = {
                ad: ad,
                yetkili_kisi: yetkili_kisi,
                telefon: telefon,
                email: email,
                adres: adres,
                not_alani: not_alani
            };

            let url = 'api/tedarikciler.php';
            let method = 'POST';

            if (id) { // Güncelleme
                url = `api/tedarikciler.php?id=${id}`;
                method = 'PUT';
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(tedarikciVerisi),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status}` }));
                    throw new Error(errorData.message || `Tedarikçi ${id ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`);
                }
                
                const sonuc = await response.json();
                console.log(id ? 'Tedarikçi güncellendi:' : 'Yeni tedarikçi eklendi:', sonuc);
                
                await tedarikcileriYukle();
                tedarikciFormuTemizle();
            } catch (error) {
                console.error('Tedarikçi kaydedilirken hata:', error);
                alert(`Hata: ${error.message}`);
            }
        });
    }

    if (tedarikciFormTemizleButton) {
        tedarikciFormTemizleButton.addEventListener('click', tedarikciFormuTemizle);
    }

    if (tedarikciListesiTablosuBody) {
        tedarikciListesiTablosuBody.addEventListener('click', async function(event) {
            const target = event.target;
            const tedarikciId = target.dataset.id;

            if (target.classList.contains('edit-btn')) {
                const tedarikci = tedarikciler.find(t => String(t.id) === String(tedarikciId));
                if (tedarikci) {
                    tedarikciIdInput.value = tedarikci.id;
                    tedarikciAdiInput.value = tedarikci.ad || '';
                    tedarikciYetkiliKisiInput.value = tedarikci.yetkili_kisi || '';
                    tedarikciTelefonInput.value = tedarikci.telefon || '';
                    tedarikciEmailInput.value = tedarikci.email || '';
                    tedarikciAdresInput.value = tedarikci.adres || '';
                    tedarikciNotInput.value = tedarikci.not_alani || '';
                    
                    tedarikciFormTemizleButton.style.display = 'inline-block';
                    tedarikciAdiInput.focus();
                }
            } else if (target.classList.contains('delete-btn')) {
                const tedarikciAdiSil = tedarikciler.find(t => String(t.id) === String(tedarikciId))?.ad || 'Bu tedarikçi';
                if (confirm(`'${tedarikciAdiSil}' tedarikçisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tedarikçiye ait tüm fiyat kayıtları da silinecektir!`)) { 
                    try {
                        const response = await fetch(`api/tedarikciler.php?id=${tedarikciId}`, {
                            method: 'DELETE'
                        });

                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status}` }));
                            throw new Error(errorData.message || `Tedarikçi silinirken bir sorun oluştu.`);
                        }
                        const sonuc = await response.json();
                        console.log(sonuc.message);
                        await tedarikcileriYukle();
                        if (fiyatGirisTedarikciSecimi.value === tedarikciId) {
                            fiyatGirisTedarikciSecimi.value = ""; 
                        }
                        if (document.getElementById('grafikTedarikciSecimi') && document.getElementById('grafikTedarikciSecimi').value === tedarikciId) {
                            document.getElementById('grafikTedarikciSecimi').value = "";
                        }
                    } catch (error) {
                        console.error('Tedarikçi silinirken hata:', error);
                        alert(`Hata: ${error.message}`);
                    }
                }
            }
        });
    }
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
            // API'den gelen fiyatlarda malzeme_id ve tedarikci_id olacak
            const urunFiyatlari = fiyatlar.filter(f => String(f.malzeme_id) === String(seciliUrunId));
            const buUrununTedarikcileri = [...new Set(urunFiyatlari.map(f => String(f.tedarikci_id)))];
            
            buUrununTedarikcileri.forEach(id => { // tedarikciId -> id olarak değiştirdim, zaten string
                const tedarikci = tedarikciler.find(t => String(t.id) === id);
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
        const seciliTedarikciIdString = grafikTedarikciSecimi.value; // String olarak gelir "" veya "id"
        const seciliZamanAraligi = zamanAraligiSecimi.value;

        if (fiyatGrafigi) {
            fiyatGrafigi.destroy();
        }
        const context = fiyatGrafigiCanvas.getContext('2d');
        context.clearRect(0, 0, fiyatGrafigiCanvas.width, fiyatGrafigiCanvas.height);

        if (!seciliUrunId) {
            return;
        }

        const seciliUrun = urunler.find(u => String(u.id) === String(seciliUrunId));
        if (!seciliUrun) {
            context.fillText("Ürün bulunamadı.", fiyatGrafigiCanvas.width / 2, fiyatGrafigiCanvas.height / 2);
            return;
        }
        const urunAdi = seciliUrun.ad;
        const urunBirimi = seciliUrun.birim_adi || '';

        // API'den gelen fiyatlarda malzeme_id olacak
        let urunFiyatlari = fiyatlar.filter(f => String(f.malzeme_id) === String(seciliUrunId));
        const filtrelenmisFiyatlarTumTedarikciler = tarihiFiltrele([...urunFiyatlari], seciliZamanAraligi);

        if (filtrelenmisFiyatlarTumTedarikciler.length === 0) {
            context.font = "16px Arial";
            context.textAlign = "center";
            context.fillText("Seçilen ürün ve zaman aralığı için veri bulunamadı.", fiyatGrafigiCanvas.width / 2, fiyatGrafigiCanvas.height / 2);
            return;
        }

        let datasets = [];
        let grafikEtiketiAnaBaslik = `${urunAdi} Fiyat Değişimi`;
        
        const renkPaleti = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#839192'];

        if (seciliTedarikciIdString) { // Tek bir tedarikçi seçili (ID'si string olarak geliyor)
            const tedarikciFiyatlari = filtrelenmisFiyatlarTumTedarikciler.filter(f => String(f.tedarikci_id) === seciliTedarikciIdString);
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
            const seciliTedarikci = tedarikciler.find(t => String(t.id) === seciliTedarikciIdString);
            const tedarikciAdi = seciliTedarikci ? seciliTedarikci.ad : 'Bilinmeyen Tedarikçi';
            grafikEtiketiAnaBaslik = `${urunAdi} (${tedarikciAdi}) Fiyat Değişimi`;

            datasets.push({
                label: `${tedarikciAdi} (${urunBirimi})`,
                data: veriNoktalari,
                borderColor: renkPaleti[0],
                backgroundColor: 'rgba(92, 184, 92, 0.1)',
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

        } else { // "Tüm Tedarikçiler" seçili (seciliTedarikciIdString === "")
            grafikEtiketiAnaBaslik = `${urunAdi} Fiyat Değişimi (Tüm Tedarikçiler)`;
            // API'den gelen fiyatlarda tedarikci_id olacak
            const tedarikciIdleri = [...new Set(filtrelenmisFiyatlarTumTedarikciler.map(f => String(f.tedarikci_id)))];
            
            const tumTarihler = [...new Set(filtrelenmisFiyatlarTumTedarikciler.map(f => f.tarih))]
                                .sort((a, b) => new Date(a) - new Date(b))
                                .map(tarih => {
                                    const tarihObj = new Date(tarih);
                                    return `${tarihObj.getDate().toString().padStart(2, '0')}.${(tarihObj.getMonth() + 1).toString().padStart(2, '0')}.${tarihObj.getFullYear()}`;
                                });

            tedarikciIdleri.forEach((id, index) => { // tdrId -> id
                const tedarikci = tedarikciler.find(t => String(t.id) === id);
                const tedarikciAdi = tedarikci ? tedarikci.ad : 'Bilinmeyen Tedarikçi';
                const buTedarikcininFiyatlari = filtrelenmisFiyatlarTumTedarikciler.filter(f => String(f.tedarikci_id) === id);

                const veriNoktalari = tumTarihler.map(etiketTarih => {
                    const tarihObjFormatli = `${etiketTarih.split('.')[2]}-${etiketTarih.split('.')[1]}-${etiketTarih.split('.')[0]}`;
                    const fiyatKaydi = buTedarikcininFiyatlari.find(f => {
                        const kayitTarihObj = new Date(f.tarih);
                        const kayitTarihFormatli = `${kayitTarihObj.getFullYear()}-${(kayitTarihObj.getMonth() + 1).toString().padStart(2, '0')}-${kayitTarihObj.getDate().toString().padStart(2, '0')}`;
                        return kayitTarihFormatli === tarihObjFormatli;
                    });
                    return fiyatKaydi ? fiyatKaydi.fiyat : null;
                });
                
                datasets.push({
                    label: `${tedarikciAdi} (${urunBirimi})`,
                    data: veriNoktalari,
                    borderColor: renkPaleti[index % renkPaleti.length],
                    tension: 0.1,
                    fill: false,
                    spanGaps: true,
                });
            });

            fiyatGrafigi = new Chart(fiyatGrafigiCanvas, {
                type: 'line',
                data: {
                    labels: tumTarihler,
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
            option.textContent = `${urun.ad} (${urun.birim_adi || 'Tanımsız Birim'})`;
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
            const seciliUrun = urunler.find(u => String(u.id) === String(seciliUrunId));
            fiyatGirisBirimGostergesi.textContent = seciliUrun ? (seciliUrun.birim_adi || '-') : '-';
        } else {
            fiyatGirisBirimGostergesi.textContent = '-';
        }
    }

    fiyatGirisMalzemeSecimi.addEventListener('change', guncelleFiyatGirisBirimGostergesi);

    async function sonFiyatlariGuncelle(tabloLimiti = 5) { 
        console.log("sonFiyatlariGuncelle fonksiyonu çağrıldı. Tablo için limit:", tabloLimiti);
        
        try {
            const tumFiyatlarApiUrl = 'api/fiyatlar.php'; 
            console.log("Tüm fiyatlar için API isteği yapılacak:", tumFiyatlarApiUrl);
            const response = await fetch(tumFiyatlarApiUrl);
            console.log("Fiyatlar API yanıtı durumu:", response.status, response.statusText);
            console.log("Fiyatlar API yanıtı headers:", response.headers.get('content-type'));
            
            // Önce response text olarak al ve kontrol et
            const responseText = await response.text();
            console.log("Fiyatlar API ham yanıtı:", responseText);
            
            if (!response.ok) {
                throw new Error(`Fiyatlar yüklenirken bir sorun oluştu. Yanıt: ${responseText}`);
            }
            const tumGelenFiyatlar = await response.json();
            
            fiyatlar = tumGelenFiyatlar.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
            console.log("Global fiyatlar güncellendi (API\'den çekildi), toplam:", fiyatlar.length, "adet.");

            sonFiyatlarTablosuBody.innerHTML = '';
            const gosterilecekFiyatlar = fiyatlar.slice(0, tabloLimiti);

            if (gosterilecekFiyatlar.length === 0) {
                sonFiyatlarTablosuBody.innerHTML = '<tr><td colspan="6">Kayıtlı fiyat girişi bulunamadı.</td></tr>'; // colspan güncellendi
            } else {
                gosterilecekFiyatlar.forEach(fiyat => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${fiyat.malzeme_adi || '-'}</td>
                        <td>${parseFloat(fiyat.fiyat).toFixed(2)}</td>
                        <td>${fiyat.malzeme_birim_adi || '-'}</td>
                        <td>${new Date(fiyat.tarih).toLocaleDateString('tr-TR')}</td>
                        <td>${fiyat.tedarikci_adi || '-'}</td>
                        <td class="actions">
                            <button class="delete-fiyat-btn" data-id="${fiyat.id}">Sil</button>
                        </td>
                    `;
                    sonFiyatlarTablosuBody.appendChild(tr);
                });
            }
            if (grafikUrunSecimi.value) {
                 guncelleGrafikTedarikciFiltresi(); 
            } else {
                 grafigiOlusturVeyaGuncelle(); 
            }

        } catch (error) {
            console.error('Fiyatlar yüklenirken veya tablo güncellenirken hata:', error);
            sonFiyatlarTablosuBody.innerHTML = '<tr><td colspan="6">Fiyatlar yüklenirken bir hata oluştu.</td></tr>'; // colspan güncellendi
            fiyatlar = []; 
            grafigiOlusturVeyaGuncelle(); 
        }
    }

    // Son Fiyatlar Tablosu için silme olay dinleyicisi
    if (sonFiyatlarTablosuBody) {
        sonFiyatlarTablosuBody.addEventListener('click', async function(event) {
            const target = event.target;
            if (target.classList.contains('delete-fiyat-btn')) {
                const fiyatId = target.dataset.id;
                const malzemeAdi = target.closest('tr').cells[0].textContent;
                const fiyatDegeri = target.closest('tr').cells[1].textContent;

                if (confirm(`'${malzemeAdi}' için girilen ${fiyatDegeri} TL değerindeki fiyat kaydını silmek istediğinize emin misiniz?`)) {
                    try {
                        const response = await fetch(`api/fiyatlar.php?id=${fiyatId}`, {
                            method: 'DELETE'
                        });
                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status}` }));
                            throw new Error(errorData.message || `Fiyat silinirken bir sorun oluştu.`);
                        }
                        const sonuc = await response.json();
                        console.log(sonuc.message);
                        // alert(sonuc.message); // İsteğe bağlı olarak kullanıcıya bildirim gösterilebilir

                        // Fiyat listesini ve grafikleri güncelle
                        await sonFiyatlariGuncelle(); 

                    } catch (error) {
                        console.error('Fiyat silinirken hata:', error);
                        alert(`Hata: ${error.message}`);
                    }
                }
            }
        });
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
                const errorData = await response.json().catch(() => ({ message: `API hatası: ${response.status}` }));
                throw new Error(errorData.message || `Fiyat eklenirken bir sorun oluştu.`);
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
            console.log("API yanıtı durumu:", response.status, response.statusText);
            console.log("API yanıtı headers:", response.headers.get('content-type'));
            
            // Önce response text olarak al ve kontrol et
            const responseText = await response.text();
            console.log("API ham yanıtı:", responseText);
            
            if (!response.ok) {
                throw new Error(`Malzemeler yüklenirken bir sorun oluştu. Yanıt: ${responseText}`);
            }
            
            // JSON parse etmeyi dene
            let apiUrunler;
            try {
                apiUrunler = JSON.parse(responseText);
            } catch (parseError) {
                console.error("JSON parse hatası:", parseError);
                throw new Error(`API yanıtı geçerli JSON değil: ${responseText}`);
            }
            
            urunler = apiUrunler; // Global ürünler listesini güncelle
            console.log("Malzemeler API'den yüklendi:", urunler);
            urunListesiniGuncelle(); // Malzemeler yüklendikten sonra tabloyu ve dropdownları güncelle
        } catch (error) {
            console.error('Malzemeler API\'den getirilirken hata:', error);
            urunListesiTablosuBody.innerHTML = '<tr><td colspan="3">Malzemeler yüklenirken bir hata oluştu.</td></tr>';
        }
    }

    async function tedarikcileriYukle() {
        console.log("tedarikcileriYukle fonksiyonu çağrıldı.");
        try {
            const response = await fetch('api/tedarikciler.php');
            console.log("Tedarikçi API yanıtı durumu:", response.status, response.statusText);
            console.log("Tedarikçi API yanıtı headers:", response.headers.get('content-type'));
            
            // Önce response text olarak al ve kontrol et
            const responseText = await response.text();
            console.log("Tedarikçi API ham yanıtı:", responseText);
            
            if (!response.ok) {
                throw new Error(`Tedarikçiler yüklenirken bir sorun oluştu. Yanıt: ${responseText}`);
            }
            
            // JSON parse etmeyi dene
            let apiTedarikciler;
            try {
                apiTedarikciler = JSON.parse(responseText);
            } catch (parseError) {
                console.error("JSON parse hatası:", parseError);
                throw new Error(`API yanıtı geçerli JSON değil: ${responseText}`);
            }
            
            console.log("API'den gelen tedarikçiler:", apiTedarikciler); // API yanıtını kontrol et
            tedarikciler = Array.isArray(apiTedarikciler) ? apiTedarikciler : []; // Global tedarikçiler listesini güncelle, array değilse boş array ata
            tedarikciListesiniGuncelle(); // Listeyi ve ilgili dropdownları güncelle
        } catch (error) {
            console.error('Tedarikçiler API\'den getirilirken hata:', error);
            tedarikciListesiTablosuBody.innerHTML = '<tr><td colspan="7">Tedarikçiler yüklenirken bir hata oluştu.</td></tr>';
            tedarikciler = []; // Hata durumunda global diziyi de boşalt
            tedarikciListesiniGuncelle(); // Hata olsa bile listeyi (boş haliyle) güncelle
        }
    }

    async function initializePageData() {
        console.log("Sayfa verileri yükleniyor...");
        
        await tedarikcileriYukle(); // Değişiklik burada: tedarikciListesiniGuncelle -> tedarikcileriYukle
        await malzemeleriYukle();
        
        console.log("initializePageData: sonFiyatlariGuncelle ÇAĞRILMADAN ÖNCE (Tüm fiyatlar yüklenecek)");
        try {
            await sonFiyatlariGuncelle(); // Parametresiz çağrı tüm fiyatları yükler, tabloyu varsayılan limitle (5) günceller
            console.log("initializePageData: sonFiyatlariGuncelle (Tüm fiyatlar) BAŞARIYLA TAMAMLANDI");
        } catch (error) {
            console.error("initializePageData: sonFiyatlariGuncelle (Tüm fiyatlar) ÇAĞRISINDA HATA:", error);
        }
        
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