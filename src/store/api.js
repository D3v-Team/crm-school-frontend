import axios from "axios";
import Cookies from "js-cookie";
import { logout, setRole } from "./slices/auth.slice";

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

export const AUTH_COOKIE_KEYS = ["token", "refresh_token", "userId", "us_nesw", "jti", "role", "is_payment", "nesw"];
let authStore = null;
let roleRefreshPromise = null;

export const registerAuthStore = (store) => {
    authStore = store;
};

const refreshRoleAfterForbidden = async () => {
    if (!authStore) return;
    if (!roleRefreshPromise) {
        const userId = authStore.getState()?.auth?.userId || Cookies.get("userId") || Cookies.get("us_nesw");
        if (!userId) return;
        roleRefreshPromise = $api.get(`/user/${userId}`, { _roleRefresh: true })
            .then((response) => {
                const profile = response.data?.data ?? response.data;
                if (profile?.role) authStore.dispatch(setRole(profile.role));
            })
            .catch((error) => {
                if ([401, 403].includes(error.response?.status)) {
                    authStore.dispatch(logout());
                    window.location.replace("/login");
                } else {
                    console.error(
                        "Profil rolini 403 javobidan keyin yangilab bo'lmadi",
                        error.response?.status || "tarmoq xatosi",
                    );
                }
            })
            .finally(() => {
                roleRefreshPromise = null;
            });
    }
    await roleRefreshPromise;
};

/* Refresh qilinmaydigan so'rovlar: login/refresh/logout o'zi va ochiq test sahifasi */
const NO_REFRESH_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout", "/test/public/"];
const skipsRefresh = (url = "") => NO_REFRESH_PATHS.some((path) => url.includes(path));

const bearerOf = (config) => {
    const header = config?.headers?.Authorization || config?.headers?.authorization || "";
    return String(header).replace(/^Bearer\s+/i, "") || null;
};

export const clearAuthCookies = () => AUTH_COOKIE_KEYS.forEach((key) => Cookies.remove(key));

let loggingOut = false;
const forceLogout = () => {
    if (loggingOut) return;
    loggingOut = true;
    clearAuthCookies();
    if (window.location.pathname !== "/login") window.location.href = "/login";
};

/* ===============================
   SINGLE-FLIGHT REFRESH (TZ 2.3)
   - Bir tabda: bir vaqtda faqat bitta refresh, qolganlar shu promise'ni kutadi.
   - Bir nechta tab: localStorage dagi qulf orqali; boshqa tab yangilagan bo'lsa
     cookie dagi yangi tokenni ishlatamiz (eski refresh token qayta yuborilmaydi).
================================ */
const REFRESH_LOCK_KEY = "auth:refresh-lock";
const LOCK_TTL_MS = 15000;
const tabId = Math.random().toString(36).slice(2);
let refreshPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readLock = () => {
    try { return JSON.parse(localStorage.getItem(REFRESH_LOCK_KEY) || "null"); } catch { return null; }
};
const acquireLock = () => {
    try {
        const lock = readLock();
        if (lock && lock.tab !== tabId && Date.now() - lock.at < LOCK_TTL_MS) return false;
        localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ tab: tabId, at: Date.now() }));
        return readLock()?.tab === tabId;
    } catch {
        return true; // localStorage yo'q — oddiy single-flight bilan davom etamiz
    }
};
const releaseLock = () => {
    try { if (readLock()?.tab === tabId) localStorage.removeItem(REFRESH_LOCK_KEY); } catch { /* ignore */ }
};

/* Boshqa tab refresh qilayotgan bo'lsa, cookie dagi token o'zgarishini kutamiz */
const waitForOtherTab = async (staleToken) => {
    const deadline = Date.now() + LOCK_TTL_MS;
    while (Date.now() < deadline) {
        await sleep(250);
        const current = Cookies.get("token");
        if (current && current !== staleToken) return current;
        const lock = readLock();
        if (!lock || Date.now() - lock.at >= LOCK_TTL_MS) break;
    }
    return null;
};

const doRefresh = async (staleToken) => {
    if (!acquireLock()) {
        const fromOtherTab = await waitForOtherTab(staleToken);
        if (fromOtherTab) return fromOtherTab;
        if (!acquireLock()) throw new Error("Refresh lock busy");
    }
    try {
        // Qulfni olgunimizcha boshqa tab yangilab qo'ygan bo'lishi mumkin
        const current = Cookies.get("token");
        if (current && staleToken && current !== staleToken) return current;

        const refreshToken = Cookies.get("refresh_token");
        const userId = Cookies.get("userId") || Cookies.get("us_nesw");
        const body = {
            ...(refreshToken && { refreshToken }),
            ...(userId && { userId }), // ixtiyoriy
        };

        // Refresh token httpOnly cookie da ham keladi, shuning uchun withCredentials (TZ 2.3).
        // CORS credential'larni qabul qilmasa (javobsiz tarmoq xatosi), body dagi token bilan qayta urinamiz.
        const url = `${BASE_URL}/api/auth/refresh`;
        const { data } = await axios.post(url, body, { withCredentials: true }).catch((err) => {
            if (!err.response && refreshToken) return axios.post(url, body);
            throw err;
        });
        const payload = data?.data ?? data;
        const accessToken = payload?.access_token || payload?.tokens?.access_token || payload?.token || null;
        const newRefreshToken = payload?.refresh_token || payload?.tokens?.refresh_token || null;
        const newJti = payload?.jti || payload?.tokens?.jti || null;

        if (!accessToken) throw new Error("No access token in refresh response");

        // Yangi juftni darhol saqlaymiz — eski refresh token endi o'lik
        Cookies.set("token", accessToken);
        if (newRefreshToken) Cookies.set("refresh_token", newRefreshToken);
        if (newJti) Cookies.set("jti", newJti);
        return accessToken;
    } catch (error) {
        // Parallel tab bizdan oldin yangilagan bo'lsa ("Token allaqachon yangilangan")
        const current = Cookies.get("token");
        if (current && staleToken && current !== staleToken) return current;
        throw error;
    } finally {
        releaseLock();
    }
};

export const refreshAccessToken = (staleToken = Cookies.get("token")) => {
    if (!refreshPromise) {
        refreshPromise = doRefresh(staleToken).finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
};

/* ===============================
   REQUEST INTERCEPTOR
================================ */
$api.interceptors.request.use(
    (config) => {
        const token = Cookies.get("token");
        if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

/* ===============================
   RESPONSE INTERCEPTOR
   401 → bitta refresh urinish → qayta yuborish. Refresh ham xato → login.
================================ */
$api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 403 && !originalRequest?._roleRefresh) {
            await refreshRoleAfterForbidden();
        }
        if (!originalRequest || error.response?.status !== 401 || originalRequest._retry || skipsRefresh(originalRequest.url)) {
            return Promise.reject(error);
        }
        originalRequest._retry = true;

        const usedToken = bearerOf(originalRequest);
        const currentToken = Cookies.get("token");

        // So'rov eski token bilan ketgan, lekin token allaqachon yangilangan — refresh shart emas
        if (currentToken && usedToken && currentToken !== usedToken) {
            originalRequest.headers.Authorization = `Bearer ${currentToken}`;
            return $api(originalRequest);
        }

        try {
            const accessToken = await refreshAccessToken(usedToken || currentToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return $api(originalRequest);
        } catch (refreshError) {
            forceLogout();
            return Promise.reject(refreshError);
        }
    }
);

export default $api;
