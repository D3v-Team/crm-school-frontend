import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const statisticApi = createApi({
    reducerPath: 'statisticApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Statistic'],
    endpoints: (builder) => ({
        getOverview: builder.query({
            query: (params) => ({
                url: '/statistic/overview',
                method: 'GET',
                params, // { year, month, date, top }
            }),
            providesTags: (result) =>
                result ? [{ type: 'Statistic', id: 'OVERVIEW' }] : [{ type: 'Statistic', id: 'OVERVIEW' }],
        }),
        getParent: builder.query({
            query: (params) => ({
                url: '/statistic/parent',
                method: 'GET',
                params, // { year, month }
            }),
            providesTags: (result) =>
                result ? [{ type: 'Statistic', id: 'PARENT' }] : [{ type: 'Statistic', id: 'PARENT' }],
        }),
        getTeacher: builder.query({
            query: (params) => ({
                url: '/statistic/teacher',
                method: 'GET',
                params, // { year, month }
            }),
            providesTags: (result) =>
                result ? [{ type: 'Statistic', id: 'TEACHER' }] : [{ type: 'Statistic', id: 'TEACHER' }],
        }),
    }),
});

export const {
    useGetOverviewQuery,
    useLazyGetOverviewQuery,
    useGetParentQuery,
    useLazyGetParentQuery,
    useGetTeacherQuery,
    useLazyGetTeacherQuery,
} = statisticApi;