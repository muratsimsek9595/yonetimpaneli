/**
 * Verilen fiyat listesini belirtilen zaman aralığına göre filtreler ve sıralar.
 * @param {Array} fiyatListesi - Filtrelenecek fiyat kayıtları dizisi.
 * @param {string} zamanAraligi - 'haftalik', 'aylik', 'son3ay', 'yillik', 'tum'.
 * @returns {Array} Filtrelenmiş ve sıralanmış fiyat listesi.
 */
export function tarihiFiltrele(fiyatListesi, zamanAraligi) {
    const simdi = new Date();
    let baslangicTarihi = new Date();
    switch (zamanAraligi) {
        case 'haftalik': baslangicTarihi.setDate(simdi.getDate() - 7); break;
        case 'aylik': baslangicTarihi.setMonth(simdi.getMonth() - 1); break;
        case 'son3ay': baslangicTarihi.setMonth(simdi.getMonth() - 3); break;
        case 'yillik': baslangicTarihi.setFullYear(simdi.getFullYear() - 1); break;
        case 'tum': return fiyatListesi.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
        default: return fiyatListesi.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    }
    return fiyatListesi.filter(f => new Date(f.tarih) >= baslangicTarihi && new Date(f.tarih) <= simdi)
                       .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
}

/**
 * Fiyat grafiğini oluşturur veya günceller.
 * @param {HTMLCanvasElement} canvasElement - Grafiğin çizileceği canvas elementi.
 * @param {string} seciliUrunId - Seçili ürünün ID'si.
 * @param {string} seciliTedarikciId - Seçili tedarikçinin ID'si (boş string ise tüm tedarikçiler).
 * @param {string} seciliZamanAraligi - Seçili zaman aralığı.
 * @param {Array} tumFiyatlar - Tüm fiyat kayıtları.
 * @param {Array} tumUrunler - Tüm ürün kayıtları.
 * @param {Array} tumTedarikciler - Tüm tedarikçi kayıtları.
 * @param {Chart|null} mevcutGrafik - Varsa, güncellenecek mevcut Chart.js nesnesi.
 * @returns {Chart|null} Oluşturulan veya güncellenen Chart.js nesnesi, ya da bir hata/veri yoksa null.
 */
export function cizVeyaGuncelleFiyatGrafigi(canvasElement, seciliUrunId, seciliTedarikciId, seciliZamanAraligi, tumFiyatlar, tumUrunler, tumTedarikciler, mevcutGrafik) {
    if (mevcutGrafik) {
        mevcutGrafik.destroy();
    }
    if (!canvasElement) return null;
    const context = canvasElement.getContext('2d');
    context.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (!seciliUrunId) {
        // İsteğe bağlı: Ürün seçilmediğinde canvas'a bir mesaj yazılabilir.
        // context.fillText("Lütfen bir ürün seçin.", canvasElement.width / 2, canvasElement.height / 2);
        return null;
    }

    const seciliUrun = tumUrunler.find(u => String(u.id) === String(seciliUrunId));
    if (!seciliUrun) {
        context.font = "16px Arial";
        context.textAlign = "center";
        context.fillText("Ürün bulunamadı.", canvasElement.width / 2, canvasElement.height / 2);
        return null;
    }
    const urunAdi = seciliUrun.ad;
    const urunBirimi = seciliUrun.birim_adi || '';

    let urunFiyatlari = tumFiyatlar.filter(f => String(f.malzeme_id) === String(seciliUrunId));
    const filtrelenmisFiyatlarTumTedarikciler = tarihiFiltrele([...urunFiyatlari], seciliZamanAraligi);

    if (filtrelenmisFiyatlarTumTedarikciler.length === 0) {
        context.font = "16px Arial";
        context.textAlign = "center";
        context.fillText("Seçilen ürün ve zaman aralığı için veri bulunamadı.", canvasElement.width / 2, canvasElement.height / 2);
        return null;
    }

    let datasets = [];
    let grafikEtiketiAnaBaslik = `${urunAdi} Fiyat Değişimi`;
    const renkPaleti = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#839192'];

    if (seciliTedarikciId) { // Tek bir tedarikçi seçili
        const tedarikciFiyatlari = filtrelenmisFiyatlarTumTedarikciler.filter(f => String(f.tedarikci_id) === seciliTedarikciId);
        if (tedarikciFiyatlari.length === 0) {
            context.font = "16px Arial";
            context.textAlign = "center";
            context.fillText("Bu tedarikçi için seçilen zaman aralığında veri bulunamadı.", canvasElement.width / 2, canvasElement.height / 2);
            return null;
        }
        const etiketler = tedarikciFiyatlari.map(f => {
            const tarihObj = new Date(f.tarih);
            return `${tarihObj.getDate().toString().padStart(2, '0')}.${(tarihObj.getMonth() + 1).toString().padStart(2, '0')}.${tarihObj.getFullYear()}`;
        });
        const veriNoktalari = tedarikciFiyatlari.map(f => f.fiyat);
        const seciliTedarikci = tumTedarikciler.find(t => String(t.id) === seciliTedarikciId);
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
        return new Chart(canvasElement, {
            type: 'line',
            data: { labels: etiketler, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: { display: true, text: grafikEtiketiAnaBaslik },
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipContext) {
                                let label = tooltipContext.dataset.label || '';
                                if (label) { label += ': '; }
                                if (tooltipContext.parsed.y !== null) {
                                    label += parseFloat(tooltipContext.parsed.y).toFixed(2);
                                }
                                return label;
                            }
                        }
                    },
                    datalabels: {
                        align: 'end',
                        anchor: 'end',
                        backgroundColor: function(datalabelContext) { return datalabelContext.dataset.borderColor; },
                        borderRadius: 4,
                        color: 'white',
                        font: { weight: 'bold' },
                        formatter: function(value) { return parseFloat(value).toFixed(2); },
                        padding: 6,
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
        const tedarikciIdleri = [...new Set(filtrelenmisFiyatlarTumTedarikciler.map(f => String(f.tedarikci_id)))];
        const tumTarihler = [...new Set(filtrelenmisFiyatlarTumTedarikciler.map(f => f.tarih))]
                            .sort((a, b) => new Date(a) - new Date(b))
                            .map(tarih => {
                                const tarihObj = new Date(tarih);
                                return `${tarihObj.getDate().toString().padStart(2, '0')}.${(tarihObj.getMonth() + 1).toString().padStart(2, '0')}.${tarihObj.getFullYear()}`;
                            });
        tedarikciIdleri.forEach((id, index) => {
            const tedarikci = tumTedarikciler.find(t => String(t.id) === id);
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
        return new Chart(canvasElement, {
            type: 'line',
            data: { labels: tumTarihler, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: { display: true, text: grafikEtiketiAnaBaslik },
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        mode: 'index', 
                        intersect: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                if (tooltipItems.length > 0) return tooltipItems[0].label;
                                return '';
                            },
                            label: function(tooltipContext) {
                                let label = tooltipContext.dataset.label || '';
                                if (label) { label = label.split('(')[0].trim(); label += ': '; }
                                if (tooltipContext.parsed.y !== null) {
                                    label += parseFloat(tooltipContext.parsed.y).toFixed(2);
                                } else {
                                    label += '-';
                                }
                                return label;
                            }
                        }
                    },
                    datalabels: {
                        display: function(datalabelContext) {
                            return datalabelContext.chart.data.datasets.length === 1 || datalabelContext.dataset.data.filter(d => d !== null).length < 10;
                        },
                        align: 'end',
                        anchor: 'end',
                        backgroundColor: function(datalabelContext) { return datalabelContext.dataset.borderColor; },
                        borderRadius: 4,
                        color: 'white',
                        font: { weight: 'bold' },
                        formatter: function(value) { return parseFloat(value).toFixed(2); },
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