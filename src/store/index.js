import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authApi } from './services/auth.api';
import { statisticApi } from './services/statistic.api';
import { userApi } from './services/user.api';
import authReducer from './slices/auth.slice';
import { studentApi } from './services/student.api';
import { subjectApi } from './services/subject.api';
import { groupApi } from './services/group.api';
import { teacherSubjectApi } from './services/teacher-subject.api';
import { teacherGroupApi } from './services/theacher-group.api';
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
        [teacherGroupApi.reducerPath]: teacherGroupApi.reducer,
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
    },
    middleware: (g) =>
        g().concat(
            authApi.middleware,
            userApi.middleware,
            statisticApi.middleware,
            studentApi.middleware,
            subjectApi.middleware,
            groupApi.middleware,
            teacherSubjectApi.middleware,
            teacherGroupApi.middleware,
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
        ),
});

setupListeners(store.dispatch);
export default store;
