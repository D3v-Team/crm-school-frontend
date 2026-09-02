// store/services/grades.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const gradesApi = createApi({
    reducerPath: 'gradesApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Grade'],
    endpoints: (builder) => ({
        // POST /api/grade – создать оценку
        createGrade: builder.mutation({
            query: (data) => ({
                url: '/grade',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'Grade', id: 'LIST' }],
        }),
        // GET /api/grade – получить оценки (с фильтрами)
        getGrades: builder.query({
            query: (params) => ({
                url: '/grade',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                if (!result) return [{ type: 'Grade', id: 'LIST' }];
                const records = result?.data?.records || [];
                if (records.length === 0) return [{ type: 'Grade', id: 'LIST' }];
                const gradeTags = records.map((grade) => ({ type: 'Grade', id: grade.id }));
                return [...gradeTags, { type: 'Grade', id: 'LIST' }];
            },
        }),
        // GET /api/grade/{id} – получить оценку по ID
        getGradeById: builder.query({
            query: (id) => ({
                url: `/grade/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Grade', id }],
        }),
        // PUT /api/grade/{id} – обновить оценку
        updateGrade: builder.mutation({
            query: ({ id, data }) => ({
                url: `/grade/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Grade', id }],
        }),
        // DELETE /api/grade/{id} – удалить оценку
        deleteGrade: builder.mutation({
            query: (id) => ({
                url: `/grade/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Grade', id }],
        }),
        // GET /api/grade/my-children
        getMyChildrenGrades: builder.query({
            query: (params) => ({ url: '/grade/my-children', method: 'GET', params }),
            providesTags: () => [{ type: 'Grade', id: 'MY_CHILDREN' }],
        }),
        // POST /api/grade/bulk
        bulkGrade: builder.mutation({
            query: (data) => ({
                url: '/grade/bulk',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'Grade', id: 'LIST' }],
        }),
    }),
});

export const {
    useCreateGradeMutation,
    useGetGradesQuery,
    useLazyGetGradesQuery,
    useGetGradeByIdQuery,
    useLazyGetGradeByIdQuery,
    useUpdateGradeMutation,
    useDeleteGradeMutation,
    useGetMyChildrenGradesQuery,
    useLazyGetMyChildrenGradesQuery,
    useBulkGradeMutation,
} = gradesApi;