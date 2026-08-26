import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const userAttendanceApi = createApi({
    reducerPath: 'userAttendanceApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['UserAttendance'],
    endpoints: (builder) => ({
        // GET /api/user-attendance/all?user_id=
        getUserAttendanceAll: builder.query({
            query: (params) => ({
                url: '/user-attendance/all',
                method: 'GET',
                params,
            }),
            providesTags: (result, error, params) => [
                { type: 'UserAttendance', id: `all-${params?.user_id}` },
            ],
        }),
        // GET /api/user-attendance/page?user_id=&page=&limit=
        getUserAttendancePage: builder.query({
            query: (params) => ({
                url: '/user-attendance/page',
                method: 'GET',
                params,
            }),
            providesTags: (result, error, params) => [
                { type: 'UserAttendance', id: `page-${params?.user_id}-${params?.page}` },
            ],
        }),
        // GET /api/user-attendance/excel?startDate=&endDate= — blob
        getUserAttendanceExcel: builder.query({
            query: (params) => ({
                url: '/user-attendance/excel',
                method: 'GET',
                params,
                headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                responseType: 'blob',
            }),
            providesTags: () => [{ type: 'UserAttendance', id: 'EXCEL' }],
        }),
    }),
});

export const {
    useGetUserAttendanceAllQuery,
    useLazyGetUserAttendanceAllQuery,
    useGetUserAttendancePageQuery,
    useLazyGetUserAttendancePageQuery,
    useGetUserAttendanceExcelQuery,
    useLazyGetUserAttendanceExcelQuery,
} = userAttendanceApi;
