const MB = 1024 * 1024;

export const FACE_PHOTO_ACCEPT = 'image/jpeg,image/png';
export const BROADCAST_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * Face ID rasmi: faqat JPG yoki PNG, 5 MB gacha (TZ 1.6, 2.7).
 * Backend fayl baytlarini ham tekshiradi, bu faqat oldindan ogohlantirish.
 * @returns {string} xato matni yoki bo'sh satr
 */
export const validateFacePhoto = (file) => {
    if (!file) return 'Rasm tanlang';
    if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Faqat JPG yoki PNG rasm yuklash mumkin';
    if (file.size > 5 * MB) return "Rasm hajmi 5 MB dan oshmasligi kerak";
    return '';
};

/** Telegram broadcast rasmi: JPG/PNG/WEBP, 10 MB gacha. */
export const validateBroadcastPhoto = (file) => {
    if (!file) return '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Faqat JPG, PNG yoki WEBP rasm yuklash mumkin';
    if (file.size > 10 * MB) return "Rasm hajmi 10 MB dan oshmasligi kerak";
    return '';
};

/** `Content-Disposition` sarlavhasidan fayl nomini oladi. */
export const filenameFromDisposition = (disposition, fallback) => {
    if (!disposition) return fallback;
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    if (utf8) {
        try { return decodeURIComponent(utf8[1].replace(/"/g, '')); } catch { /* ignore */ }
    }
    const plain = /filename="?([^";]+)"?/i.exec(disposition);
    return plain ? plain[1] : fallback;
};

export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_EXCEL_RANGE_DAYS = 93;

/**
 * Excel oralig'i: `YYYY-MM-DD`, boshlanish <= tugash, ko'pi bilan 93 kun (TZ 1.7, 2.7).
 * @returns {string} xato matni yoki bo'sh satr
 */
export const validateExcelRange = (startDate, endDate) => {
    if (!DATE_RE.test(startDate || '') || !DATE_RE.test(endDate || '')) return 'Sanalarni YYYY-MM-DD formatida tanlang';
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (start > end) return "Boshlanish sanasi tugash sanasidan oldin bo'lishi kerak";
    const days = Math.round((end - start) / 86400000) + 1;
    if (days > MAX_EXCEL_RANGE_DAYS) return `Oraliq ${MAX_EXCEL_RANGE_DAYS} kundan oshmasligi kerak (hozir ${days} kun)`;
    return '';
};

/** startDate dan keyingi eng kech ruxsat etilgan sana (input max uchun). */
export const maxRangeEnd = (startDate) => {
    if (!DATE_RE.test(startDate || '')) return undefined;
    const d = new Date(`${startDate}T00:00:00`);
    d.setDate(d.getDate() + MAX_EXCEL_RANGE_DAYS - 1);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
