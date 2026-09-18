import $api from "../api";

export const axiosBaseQuery = () => async ({ url, method, data, params, headers, responseType }) => {
    try {
        const result = await $api({
            url,
            method,
            data,
            params,
            headers,
            responseType,
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
        return { data: result.data };
    } catch (axiosError) {
        let err = axiosError;
        return {
            error: {
                status: err.response?.status,
                data: err.response?.data || err.message,
            },
        };
    }
};
