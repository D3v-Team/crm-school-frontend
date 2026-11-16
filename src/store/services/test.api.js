import $api from '../api';

const requestData = (request) => request.then((response) => response.data);

export const getTests = (params) => requestData($api.get('/test', { params }));
export const getTest = (id) => requestData($api.get(`/test/${id}`));
export const createTest = (data) => requestData($api.post('/test', data));
export const updateTest = (id, data) => requestData($api.put(`/test/${id}`, data));
export const deleteTest = (id) => requestData($api.delete(`/test/${id}`));
export const getTestResults = (id) => requestData($api.get(`/test/${id}/results`));
export const getTestAttempt = (attemptId) => requestData($api.get(`/test/attempt/${attemptId}`));
export const deleteTestAttempt = (attemptId) => requestData($api.delete(`/test/attempt/${attemptId}`));

export const getPublicTest = (code) => requestData($api.get(`/test/public/${code}`));
// Har bir urinish uni boshlagan qurilmaga bog'langan: `attempt_token` start javobida keladi,
// davom ettirish, javob saqlash va yakunlashda qaytarib yuboriladi (TZ 2.4).
export const startPublicAttempt = (code, studentId, attemptToken) =>
    requestData($api.post(`/test/public/${code}/start`, {
        student_id: studentId,
        ...(attemptToken && { attempt_token: attemptToken }),
    }));
export const savePublicAnswer = (attemptId, answer, attemptToken) =>
    requestData($api.post(`/test/public/attempt/${attemptId}/answer`, { ...answer, attempt_token: attemptToken }));
export const finishPublicAttempt = (attemptId, answers, attemptToken) =>
    requestData($api.post(`/test/public/attempt/${attemptId}/finish`, {
        attempt_token: attemptToken,
        ...(answers?.length && { answers }),
    }));
