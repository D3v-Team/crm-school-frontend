import { Alert, commonAlert } from '../Components/Other/UI/Alert/Alert';
import { getErrorMessage } from './errors';

/**
 * Davomat/baho bulk saqlash natijalarini yig'ish.
 * Backend javobi: { message, created_count, skipped: [{ student_id, reason }] }.
 * Xato (masalan 400 "Bu dars arxivlangan ...") butun so'rovni rad etadi.
 */
export const createBulkReport = () => ({ saved: 0, failed: 0, skipped: [], errors: [] });

export const addBulkSuccess = (report, response, sentCount) => {
    const data = response?.data && !Array.isArray(response.data) && 'skipped' in response.data ? response.data : response;
    const skipped = Array.isArray(data?.skipped) ? data.skipped : [];
    report.saved += typeof data?.created_count === 'number' ? data.created_count : Math.max(sentCount - skipped.length, 0);
    skipped.forEach((item) => report.skipped.push(item?.reason || "Sabab ko'rsatilmagan"));
};

export const addBulkError = (report, error, sentCount) => {
    report.failed += sentCount;
    report.errors.push(getErrorMessage(error));
};

/* Bir xil sabablarni sanab, qisqa ro'yxat qiladi: "Sabab (3 ta)" */
const groupReasons = (reasons) => {
    const counts = new Map();
    reasons.forEach((reason) => counts.set(reason, (counts.get(reason) || 0) + 1));
    return [...counts.entries()].map(([reason, count]) => (count > 1 ? `${reason} (${count} ta)` : reason));
};

export const showBulkReport = (report, noun = "yozuv") => {
    const problems = report.skipped.length + report.failed;
    if (!problems) {
        Alert(`${report.saved} ta ${noun} saqlandi`, 'success');
        return;
    }
    const lines = [`${report.saved} ta ${noun} saqlandi, ${problems} tasi saqlanmadi:`];
    groupReasons([...report.errors, ...report.skipped]).forEach((line) => lines.push(`• ${line}`));
    // Xabar uzun bo'lishi mumkin — o'qish uchun yopilmaydigan oynada
    commonAlert(lines.join('\n'), report.saved ? 'warning' : 'error');
};
