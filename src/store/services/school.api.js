// store/services/school.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const schoolApi = createApi({
    reducerPath: 'schoolApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['School'],
    endpoints: (builder) => ({
        // POST /api/school
        createSchool: builder.mutation({
            query: (data) => ({ url: '/school', method: 'POST', data }),
            invalidatesTags: [{ type: 'School', id: 'LIST' }],
        }),
        // GET /api/school
        getSchools: builder.query({
            query: (params) => ({ url: '/school', method: 'GET', params }),
            providesTags: (result) => {
                const records = result?.data?.records || result?.data || [];
                const list = Array.isArray(records) ? records : [];
                return [...list.map(s => ({ type: 'School', id: s.id })), { type: 'School', id: 'LIST' }];
            },
        }),
        // GET /api/school/:id
        getSchoolById: builder.query({
            query: (id) => ({ url: `/school/${id}`, method: 'GET' }),
            providesTags: (result, error, id) => [{ type: 'School', id }],
        }),
        // PUT /api/school/:id
        updateSchool: builder.mutation({
            query: ({ id, data }) => ({ url: `/school/${id}`, method: 'PUT', data }),
            invalidatesTags: (result, error, { id }) => [{ type: 'School', id }, { type: 'School', id: 'LIST' }],
        }),
        // DELETE /api/school/:id
        deleteSchool: builder.mutation({
            query: (id) => ({ url: `/school/${id}`, method: 'DELETE' }),
            invalidatesTags: (result, error, id) => [{ type: 'School', id }, { type: 'School', id: 'LIST' }],
        }),
    }),
});

export const {
    useCreateSchoolMutation,
    useGetSchoolsQuery,
    useLazyGetSchoolsQuery,
    useGetSchoolByIdQuery,
    useUpdateSchoolMutation,
    useDeleteSchoolMutation,
} = schoolApi;
