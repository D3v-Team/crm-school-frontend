// store/services/group-schedule.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const groupScheduleApi = createApi({
    reducerPath: 'groupScheduleApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['GroupSchedule'],
    endpoints: (builder) => ({
        // POST /api/group-schedule
        createGroupSchedule: builder.mutation({
            query: (data) => ({
                url: '/group-schedule',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'GroupSchedule', id: 'LIST' }],
        }),
        // GET /api/group-schedule/{id}
        getGroupScheduleById: builder.query({
            query: (id) => ({
                url: `/group-schedule/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'GroupSchedule', id }],
        }),
        // PUT /api/group-schedule/{id}
        updateGroupSchedule: builder.mutation({
            query: ({ id, data }) => ({
                url: `/group-schedule/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'GroupSchedule', id }],
        }),
        // DELETE /api/group-schedule/{id}
        deleteGroupSchedule: builder.mutation({
            query: (id) => ({
                url: `/group-schedule/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'GroupSchedule', id }],
        }),
        // GET /api/group-schedule/by-group/{group_id}
        getGroupScheduleByGroupId: builder.query({
            query: (groupId) => ({
                url: `/group-schedule/by-group/${groupId}`,
                method: 'GET',
            }),
            providesTags: (result, error, groupId) => {
                return result
                    ? [
                        ...(result?.data?.records || []).map((item) => ({
                            type: 'GroupSchedule',
                            id: item.id,
                        })),
                        { type: 'GroupSchedule', id: `by-group-${groupId}` },
                    ]
                    : [{ type: 'GroupSchedule', id: `by-group-${groupId}` }];
            },
        }),
        // GET /api/group-schedule/by-teacher/{teacher_id}?date=YYYY-MM-DD
        getGroupScheduleByTeacher: builder.query({
            query: ({ teacherId, date }) => ({
                url: `/group-schedule/by-teacher/${teacherId}`,
                method: 'GET',
                params: { date },
            }),
            providesTags: (result, error, { teacherId, date }) => {
                return result
                    ? [
                        ...(result?.data?.records || []).map((item) => ({
                            type: 'GroupSchedule',
                            id: item.id,
                        })),
                        { type: 'GroupSchedule', id: `by-teacher-${teacherId}-${date}` },
                    ]
                    : [{ type: 'GroupSchedule', id: `by-teacher-${teacherId}-${date}` }];
            },
        }),
    }),
});

// Экспорт хуков
export const {
    useCreateGroupScheduleMutation,
    useGetGroupScheduleByIdQuery,
    useLazyGetGroupScheduleByIdQuery,
    useUpdateGroupScheduleMutation,
    useDeleteGroupScheduleMutation,
    useGetGroupScheduleByGroupIdQuery,
    useLazyGetGroupScheduleByGroupIdQuery,
    useGetGroupScheduleByTeacherQuery,
    useLazyGetGroupScheduleByTeacherQuery,
} = groupScheduleApi;