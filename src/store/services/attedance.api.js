// store/services/attendance.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const attendanceApi = createApi({
    reducerPath: 'attendanceApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Attendance'],
    endpoints: (builder) => ({
        // POST /api/attendance
        createAttendance: builder.mutation({
            query: (data) => ({
                url: '/attendance',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'Attendance', id: 'LIST' }],
        }),
        // GET /api/attendance
        getAttendance: builder.query({
            query: (params) => ({
                url: '/attendance',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                if (!result) return [{ type: 'Attendance', id: 'LIST' }];
                const records = result?.data?.records || [];
                if (records.length === 0) return [{ type: 'Attendance', id: 'LIST' }];
                const tags = records.map((item) => ({ type: 'Attendance', id: item.id }));
                return [...tags, { type: 'Attendance', id: 'LIST' }];
            },
        }),
        // GET /api/attendance/{id}
        getAttendanceById: builder.query({
            query: (id) => ({
                url: `/attendance/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Attendance', id }],
        }),
        // PUT /api/attendance/{id}
        updateAttendance: builder.mutation({
            query: ({ id, data }) => ({
                url: `/attendance/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Attendance', id }],
        }),
        // DELETE /api/attendance/{id}
        deleteAttendance: builder.mutation({
            query: (id) => ({
                url: `/attendance/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Attendance', id }],
        }),
        // GET /api/attendance/my-children (для родителей)
        getMyChildrenAttendance: builder.query({
            query: (params) => ({
                url: '/attendance/my-children',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                // Кастомный тег для кэширования данных родителя
                return [{ type: 'Attendance', id: 'MY_CHILDREN' }];
            },
        }),
    }),
});

// Экспорт хуков
export const {
    useCreateAttendanceMutation,
    useGetAttendanceQuery,
    useLazyGetAttendanceQuery,
    useGetAttendanceByIdQuery,
    useLazyGetAttendanceByIdQuery,
    useUpdateAttendanceMutation,
    useDeleteAttendanceMutation,
    useGetMyChildrenAttendanceQuery,
    useLazyGetMyChildrenAttendanceQuery,
} = attendanceApi;