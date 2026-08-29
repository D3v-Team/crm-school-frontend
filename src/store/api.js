import axios from "axios";
import Cookies from "js-cookie";

/* ===============================
   CONFIG
================================ */
export const BASE_URL = "https://dev.investingschool.uz";

export const $api = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

/* ===============================
   GLOBAL REFRESH STATE
================================ */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    failedQueue = [];
};

const forceLogout = () => {
    ["token", "refresh_token", "userId", "us_nesw", "jti", "role", "nesw"].forEach((key) =>
        Cookies.remove(key)
    );
    window.location.href = "/login";
};

/* ===============================
   REQUEST INTERCEPTOR
================================ */
$api.interceptors.request.use(
    (config) => {
        const token = Cookies.get("token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

/* ===============================
   RESPONSE INTERCEPTOR
================================ */
$api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve($api(originalRequest));
                        },
                        reject,
                    });
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = Cookies.get("refresh_token");
                const userId = Cookies.get("userId") || Cookies.get("us_nesw");

                if (!refreshToken || !userId) throw new Error("No refresh token or userId");

                const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
                    userId,
                    refreshToken,
                });

                /* Server response may nest tokens differently */
                const accessToken =
                    data?.access_token ||
                    data?.tokens?.access_token ||
                    data?.token ||
                    null;

                const newRefreshToken =
                    data?.refresh_token ||
                    data?.tokens?.refresh_token ||
                    null;

                const newJti =
                    data?.jti ||
                    data?.tokens?.jti ||
                    null;

                if (!accessToken) throw new Error("No access token in refresh response");

                Cookies.set("token", accessToken);
                if (newRefreshToken) Cookies.set("refresh_token", newRefreshToken);
                if (newJti)          Cookies.set("jti", newJti);

                $api.defaults.headers.Authorization = `Bearer ${accessToken}`;
                processQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return $api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                forceLogout();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default $api;
