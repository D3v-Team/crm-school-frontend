// store/services/student-attendance.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const studentAttendanceApi = createApi({
    reducerPath: 'studentAttendanceApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['StudentAttendance'],
    endpoints: (builder) => ({
        // GET /api/student-attendance/all?student_id=
        getStudentAttendanceAll: builder.query({
            query: (params) => ({
                url: '/student-attendance/all',
                method: 'GET',
                params,
            }),
            providesTags: (result, error, params) => [
                { type: 'StudentAttendance', id: `all-${params?.student_id}` },
            ],
        }),
        // GET /api/student-attendance/page?student_id=&page=
        getStudentAttendancePage: builder.query({
            query: (params) => ({
                url: '/student-attendance/page',
                method: 'GET',
                params,
            }),
            providesTags: (result, error, params) => [
                { type: 'StudentAttendance', id: `page-${params?.student_id}-${params?.page}` },
            ],
        }),
        // GET /api/student-attendance/excel?startDate=&endDate=
        getStudentAttendanceExcel: builder.query({
            query: (params) => ({
                url: '/student-attendance/excel',
                method: 'GET',
                params,
                responseType: 'blob',
            }),
            providesTags: () => [{ type: 'StudentAttendance', id: 'EXCEL' }],
        }),
        // GET /api/student-attendance/group/{group_id}?startDate=&endDate=
        getGroupEntryExit: builder.query({
            query: ({ group_id, ...params }) => ({
                url: `/student-attendance/group/${group_id}`,
                method: 'GET',
                params, // startDate, endDate
            }),
            providesTags: (result, error, { group_id }) => [
                { type: 'StudentAttendance', id: `entry-exit-${group_id}` },
            ],
        }),
    }),
});

export const {
    useGetStudentAttendanceAllQuery,
    useLazyGetStudentAttendanceAllQuery,
    useGetStudentAttendancePageQuery,
    useLazyGetStudentAttendancePageQuery,
    useGetStudentAttendanceExcelQuery,
    useLazyGetStudentAttendanceExcelQuery,
    useGetGroupEntryExitQuery,
    useLazyGetGroupEntryExitQuery,
} = studentAttendanceApi;
