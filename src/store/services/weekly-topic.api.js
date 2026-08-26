// store/services/weekly-topic.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const weeklyTopicApi = createApi({
    reducerPath: 'weeklyTopicApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['WeeklyTopic'],
    endpoints: (builder) => ({
        // GET /api/weekly-topic/my-week?week_start_date=  (teacher uchun)
        getMyWeekTopics: builder.query({
            query: (params) => ({
                url: '/weekly-topic/my-week',
                method: 'GET',
                params,
            }),
            providesTags: (result, error, params) => [
                { type: 'WeeklyTopic', id: `my-week-${params?.week_start_date}` },
                { type: 'WeeklyTopic', id: 'LIST' },
            ],
        }),
        // GET /api/weekly-topic
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
                    { type: 'WeeklyTopic', id: 'LIST' },
                ];
            },
        }),
        // POST /api/weekly-topic
        createWeeklyTopic: builder.mutation({
            query: (data) => ({
                url: '/weekly-topic',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'WeeklyTopic', id: 'LIST' }],
        }),
        // DELETE /api/weekly-topic/:id
        deleteWeeklyTopic: builder.mutation({
            query: (id) => ({
                url: `/weekly-topic/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'WeeklyTopic', id },
                { type: 'WeeklyTopic', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetMyWeekTopicsQuery,
    useLazyGetMyWeekTopicsQuery,
    useGetWeeklyTopicsQuery,
    useLazyGetWeeklyTopicsQuery,
    useCreateWeeklyTopicMutation,
    useDeleteWeeklyTopicMutation,
} = weeklyTopicApi;
