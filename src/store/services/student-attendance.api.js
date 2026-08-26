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
            }),
            providesTags: () => [{ type: 'StudentAttendance', id: 'EXCEL' }],
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
} = studentAttendanceApi;
