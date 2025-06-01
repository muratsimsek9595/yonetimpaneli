import { showToast } from './ui.js'; // showToast fonksiyonunu ui.js'den import et

/**
 * Global hata yakalayıcı.
 * Hataları konsola loglar ve kullanıcıya bir toast bildirimi gösterir.
 * @param {Error} error - Yakalanan hata nesnesi.
 * @param {string} [contextMessage] - Hatanın oluştuğu bağlam hakkında ek bilgi (örn: "Malzeme eklenirken").
 */
export function globalHataYakala(error, contextMessage = "Bir sorun oluştu") {
    console.error(`${contextMessage}:`, error.message, error.stack ? `\nStack: ${error.stack}` : '');
    
    // Kullanıcıya gösterilecek mesajı belirle
    let kullaniciMesaji = `${contextMessage}. Lütfen daha sonra tekrar deneyin.`;
    if (error.message && !error.message.toLowerCase().includes('api') && !error.message.toLowerCase().includes('network')) {
        // Eğer hata mesajı genel bir API/Network hatası değilse, mesajı kullanabiliriz
        // Ama çok teknik detay içermemesine dikkat etmeliyiz.
        // Şimdilik, API dışı hatalar için daha genel bir mesaj kullanabiliriz veya error.message'ı doğrudan ekleyebiliriz.
        // Örneğin: kullaniciMesaji = `${contextMessage}: ${error.message}`;
        // Ancak bu, kullanıcıya çok teknik bilgi verebilir. Şimdilik sabit mesajda kalalım.
    }

    showToast(kullaniciMesaji, 'error'); // alert yerine showToast kullan
} 