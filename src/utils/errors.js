/**
 * Backend xato javobidan foydalanuvchiga ko'rsatiladigan matnni oladi.
 * `message` matn yoki massiv bo'lishi mumkin (TZ 2.8).
 * RTK Query ({ status, data }) va axios ({ response: { status, data } }) xatolarini qo'llaydi.
 */
export const getErrorStatus = (error) => error?.status ?? error?.response?.status ?? null;

export const getErrorMessages = (error) => {
    const data = error?.data ?? error?.response?.data;
    const message = data?.message ?? (typeof data === 'string' ? data : null);
    if (Array.isArray(message)) return message.filter(Boolean).map(String);
    if (message) return [String(message)];
    return [];
};

export const getRetryAfterSeconds = (error, fallback = 60) => {
    const data = error?.data ?? error?.response?.data;
    const retryAfter = Number(data?.retry_after);
    return Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : fallback;
};

export const isUsernameTakenError = (error) => {
    const messages = getErrorMessages(error);
    return getErrorStatus(error) === 400 && messages.some((message) => /username\s+band/i.test(message));
};

const STATUS_FALLBACK = {
    413: "So'rov hajmi juda katta",
    429: "Juda ko'p so'rov yuborildi. Bir necha soniyadan keyin qayta urinib ko'ring",
    500: 'Serverda ichki xatolik yuz berdi',
};

export const getErrorMessage = (error, fallback = 'Xatolik yuz berdi') => {
    const messages = getErrorMessages(error);
    if (messages.length) return messages.join('\n');
    return STATUS_FALLBACK[getErrorStatus(error)] || fallback;
};

/** Blob (responseType: 'blob') ko'rinishida kelgan xato javobini o'qiydi. */
export const readBlobError = async (error, fallback = 'Xatolik yuz berdi') => {
    const data = error?.data ?? error?.response?.data;
    if (data instanceof Blob) {
        try {
            const parsed = JSON.parse(await data.text());
            return getErrorMessage({ data: parsed, status: getErrorStatus(error) }, fallback);
        } catch {
            return STATUS_FALLBACK[getErrorStatus(error)] || fallback;
        }
    }
    return getErrorMessage(error, fallback);
};
