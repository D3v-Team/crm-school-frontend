// store/services/group-schedule.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const groupScheduleApi = createApi({
    reducerPath: 'groupScheduleApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['GroupSchedule'],
    endpoints: (builder) => ({
        // GET /api/group-schedule/by-teacher/{teacher_id}?date=YYYY-MM-DD
        getScheduleByTeacher: builder.query({
            query: ({ teacher_id, date }) => ({
                url: `/group-schedule/by-teacher/${teacher_id}`,
                method: 'GET',
                params: { date },
            }),
            providesTags: (result, error, { teacher_id }) => [
                { type: 'GroupSchedule', id: `by-teacher-${teacher_id}` },
            ],
        }),
    }),
});

export const {
    useGetScheduleByTeacherQuery,
    useLazyGetScheduleByTeacherQuery,
} = groupScheduleApi;
