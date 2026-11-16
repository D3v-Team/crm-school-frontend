import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { registerAuthStore } from './api';
import { authApi } from './services/auth.api';
import { statisticApi } from './services/statistic.api';
import { userApi } from './services/user.api';
import authReducer, { logout } from './slices/auth.slice';
import { studentApi } from './services/student.api';
import { subjectApi } from './services/subject.api';
import { groupApi } from './services/group.api';
import { teacherSubjectApi } from './services/teacher-subject.api';
import { groupScheduleApi } from './services/group-schedule.api';
import { weeklyTopicApi } from './services/weekly-topic.api';
import { paymentApi } from './services/payment.api';
import { attendanceApi } from './services/attedance.api';
import { gradesApi } from './services/grades.api';
import { botApi } from './services/bot.api';
import { hikvisionApi } from './services/hikvision.api';
import { studentAttendanceApi } from './services/student-attendance.api';
import { schoolApi } from './services/school.api';
import { userAttendanceApi } from './services/user-attendance.api';
import { expenseApi } from './services/expense.api';

/* ── API'lar orasidagi kesh invalidatsiyasi ──
   O'quvchi guruh a'zoligi ikki tomondan o'zgaradi (student.api va group.api),
   guruh o'qituvchisi/fani o'zgarsa jadval ham yangilanadi, Face ID esa user/student
   ma'lumotidagi `hikvision_code` / `has_face_id` ni o'zgartiradi. */
const crossInvalidation = createListenerMiddleware();

const membershipChangedFromStudent = isAnyOf(
    studentApi.endpoints.assignGroup.matchFulfilled,
    studentApi.endpoints.unassignGroup.matchFulfilled,
    studentApi.endpoints.updateStudentStatus.matchFulfilled,
    studentApi.endpoints.deleteStudent.matchFulfilled,
);
const membershipChangedFromGroup = isAnyOf(
    groupApi.endpoints.addStudentToGroup.matchFulfilled,
    groupApi.endpoints.removeStudentFromGroup.matchFulfilled,
    groupApi.endpoints.deleteGroup.matchFulfilled,
    groupApi.endpoints.updateGroup.matchFulfilled,
);

crossInvalidation.startListening({
    matcher: membershipChangedFromStudent,
    effect: (_, api) => {
        api.dispatch(groupApi.util.invalidateTags(['Group']));
        api.dispatch(groupScheduleApi.util.invalidateTags([{ type: 'GroupSchedule', id: 'LIST' }]));
    },
});
crossInvalidation.startListening({
    matcher: membershipChangedFromGroup,
    effect: (_, api) => {
        api.dispatch(studentApi.util.invalidateTags(['Student']));
        api.dispatch(groupScheduleApi.util.invalidateTags([{ type: 'GroupSchedule', id: 'LIST' }]));
    },
});
crossInvalidation.startListening({
    matcher: isAnyOf(
        hikvisionApi.endpoints.uploadUserFace.matchFulfilled,
        hikvisionApi.endpoints.deleteUserFace.matchFulfilled,
    ),
    effect: (action, api) => {
        const arg = action.meta?.arg?.originalArgs;
        const userId = typeof arg === 'object' ? arg?.user_id : arg;
        api.dispatch(userApi.util.invalidateTags([{ type: 'User', id: userId }, { type: 'User', id: 'STAFF' }, { type: 'User', id: 'LIST' }]));
    },
});
crossInvalidation.startListening({
    matcher: isAnyOf(
        hikvisionApi.endpoints.uploadFace.matchFulfilled,
        hikvisionApi.endpoints.deleteFace.matchFulfilled,
    ),
    effect: (action, api) => {
        const arg = action.meta?.arg?.originalArgs;
        const studentId = typeof arg === 'object' ? arg?.student_id : arg;
        api.dispatch(studentApi.util.invalidateTags([{ type: 'Student', id: studentId }, { type: 'Student', id: 'LIST' }]));
    },
});
crossInvalidation.startListening({
    matcher: userApi.endpoints.resetPassword.matchFulfilled,
    effect: (action, api) => {
        const userId = action.meta?.arg?.originalArgs?.id;
        const authUserId = api.getState()?.auth?.userId;
        if (userId && authUserId && String(userId) === String(authUserId)) {
            api.dispatch(logout());
            window.location.replace('/login');
        }
    },
});

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [authApi.reducerPath]: authApi.reducer,
        [statisticApi.reducerPath]: statisticApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [studentApi.reducerPath]: studentApi.reducer,
        [subjectApi.reducerPath]: subjectApi.reducer,
        [groupApi.reducerPath]: groupApi.reducer,
        [teacherSubjectApi.reducerPath]: teacherSubjectApi.reducer,
        [groupScheduleApi.reducerPath]: groupScheduleApi.reducer,
        [weeklyTopicApi.reducerPath]: weeklyTopicApi.reducer,
        [paymentApi.reducerPath]: paymentApi.reducer,
        [attendanceApi.reducerPath]: attendanceApi.reducer,
        [gradesApi.reducerPath]: gradesApi.reducer,
        [botApi.reducerPath]: botApi.reducer,
        [hikvisionApi.reducerPath]: hikvisionApi.reducer,
        [studentAttendanceApi.reducerPath]: studentAttendanceApi.reducer,
        [schoolApi.reducerPath]: schoolApi.reducer,
        [userAttendanceApi.reducerPath]: userAttendanceApi.reducer,
        [expenseApi.reducerPath]: expenseApi.reducer,
    },
    middleware: (g) =>
        g().prepend(crossInvalidation.middleware).concat(
            authApi.middleware,
            userApi.middleware,
            statisticApi.middleware,
            studentApi.middleware,
            subjectApi.middleware,
            groupApi.middleware,
            teacherSubjectApi.middleware,
            groupScheduleApi.middleware,
            weeklyTopicApi.middleware,
            paymentApi.middleware,
            attendanceApi.middleware,
            gradesApi.middleware,
            botApi.middleware,
            hikvisionApi.middleware,
            studentAttendanceApi.middleware,
            schoolApi.middleware,
            userAttendanceApi.middleware,
            expenseApi.middleware,
        ),
});

registerAuthStore(store);
setupListeners(store.dispatch);
export default store;
