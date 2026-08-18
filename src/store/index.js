// store/index.js
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
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
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
        ),
});

setupListeners(store.dispatch);
export default store;
