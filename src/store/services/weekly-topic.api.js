// store/services/weekly-topic.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const weeklyTopicApi = createApi({
    reducerPath: 'weeklyTopicApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['WeeklyTopic'],
    endpoints: (builder) => ({
        // GET /api/weekly-topic?page=&group_id=&teacher_id=&week_start_date=
        getWeeklyTopics: builder.query({
            query: (params) => ({
                url: '/weekly-topic',
                method: 'GET',
                params,
            }),
            providesTags: (result, error, params) => {
                const records = result?.data?.records || [];
                return [
                    ...records.map((item) => ({ type: 'WeeklyTopic', id: item.id })),
                    { type: 'WeeklyTopic', id: `week-${params?.week_start_date}-teacher-${params?.teacher_id}` },
                ];
            },
        }),
    }),
});

export const {
    useGetWeeklyTopicsQuery,
    useLazyGetWeeklyTopicsQuery,
} = weeklyTopicApi;
