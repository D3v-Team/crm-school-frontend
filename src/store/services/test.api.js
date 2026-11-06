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
export const startPublicAttempt = (code, studentId) =>
    requestData($api.post(`/test/public/${code}/start`, { student_id: studentId }));
export const savePublicAnswer = (attemptId, answer) =>
    requestData($api.post(`/test/public/attempt/${attemptId}/answer`, answer));
export const finishPublicAttempt = (attemptId, answers) =>
    requestData($api.post(`/test/public/attempt/${attemptId}/finish`, answers?.length ? { answers } : undefined));
