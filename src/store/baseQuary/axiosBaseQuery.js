import $api from "../api";

export const axiosBaseQuery = () => async ({ url, method, data, params, headers, responseType, withCredentials }) => {
    try {
        const result = await $api({
            url,
            method,
            data,
            params,
            headers,
            responseType,
            ...(withCredentials && { withCredentials }),
            // Array params uchun: role=admin&role=teacher formatida serialize qiladi
            paramsSerializer: (p) => {
                const q = new URLSearchParams();
                Object.entries(p || {}).forEach(([key, val]) => {
                    if (Array.isArray(val)) {
                        val.forEach(v => q.append(key, v));
                    } else if (val !== undefined && val !== null && val !== '') {
                        q.append(key, val);
                    }
                });
                return q.toString();
            },
        });
        return { data: result.data, meta: { headers: result.headers } };
    } catch (axiosError) {
        let err = axiosError;
        return {
            error: {
                status: err.response?.status,
                data: err.response?.data || err.message,
                // 429 uchun Retry-After (soniya) — backend CORS orqali ochib bergan
                retryAfter: err.response?.headers?.['retry-after'] ?? null,
            },
        };
    }
};
