import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const groupScheduleApi = createApi({
    reducerPath: 'groupScheduleApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['GroupSchedule'],
    endpoints: (builder) => ({
        createGroupSchedule: builder.mutation({
            query: (data) => ({
                url: '/group-schedule',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'GroupSchedule', id: 'LIST' }],
        }),
        getGroupScheduleById: builder.query({
            query: (id) => ({
                url: `/group-schedule/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'GroupSchedule', id }],
        }),
        updateGroupSchedule: builder.mutation({
            query: ({ id, data }) => ({
                url: `/group-schedule/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'GroupSchedule', id }],
        }),
        deleteGroupSchedule: builder.mutation({
            query: (id) => ({
                url: `/group-schedule/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'GroupSchedule', id }],
        }),
        getGroupScheduleByGroupId: builder.query({
            query: (groupId) => ({
                url: `/group-schedule/by-group/${groupId}`,
                method: 'GET',
            }),
            providesTags: (result, error, groupId) => {
                const records = result?.data?.records || [];
                return [
                    ...records.map((item) => ({ type: 'GroupSchedule', id: item.id })),
                    { type: 'GroupSchedule', id: `by-group-${groupId}` },
                ];
            },
        }),
        getGroupScheduleByTeacher: builder.query({
            query: (teacherId) => ({
                url: `/group-schedule/by-teacher/${teacherId}`,
                method: 'GET',
            }),
            providesTags: (result, error, teacherId) => {
                const records = result?.data?.records || [];
                return [
                    ...records.map((item) => ({ type: 'GroupSchedule', id: item.id })),
                    { type: 'GroupSchedule', id: `by-teacher-${teacherId}` },
                ];
            },
        }),
        getGroupScheduleByStudent: builder.query({
            query: (studentId) => ({
                url: `/group-schedule/by-student/${studentId}`,
                method: 'GET',
            }),
            providesTags: (result, error, studentId) => [
                { type: 'GroupSchedule', id: `by-student-${studentId}` },
            ],
        }),
    }),
});

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
    useGetGroupScheduleByStudentQuery,
    useLazyGetGroupScheduleByStudentQuery,
} = groupScheduleApi;
