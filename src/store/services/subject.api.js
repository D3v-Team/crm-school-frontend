// store/services/subject.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const subjectApi = createApi({
    reducerPath: 'subjectApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Subject'],
    endpoints: (builder) => ({
        // POST /api/subject
        createSubject: builder.mutation({
            query: (data) => ({
                url: '/subject',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'Subject', id: 'LIST' }],
        }),
        // GET /api/subject
        getSubjects: builder.query({
            query: (params) => ({
                url: '/subject',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                if (!result) return [{ type: 'Subject', id: 'LIST' }];
                const records = result?.data?.records || [];
                if (records.length === 0) return [{ type: 'Subject', id: 'LIST' }];
                const subjectTags = records.map((subject) => ({ type: 'Subject', id: subject.id }));
                return [...subjectTags, { type: 'Subject', id: 'LIST' }];
            },
        }),
        // GET /api/subject/{id}
        getSubjectById: builder.query({
            query: (id) => ({
                url: `/subject/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Subject', id }],
        }),
        // PUT /api/subject/{id}
        updateSubject: builder.mutation({
            query: ({ id, data }) => ({
                url: `/subject/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Subject', id }],
        }),
        // DELETE /api/subject/{id}
        deleteSubject: builder.mutation({
            query: (id) => ({
                url: `/subject/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Subject', id }],
        }),
    }),
});

// Экспорт хуков
export const {
    useCreateSubjectMutation,
    useGetSubjectsQuery,
    useLazyGetSubjectsQuery,
    useGetSubjectByIdQuery,
    useLazyGetSubjectByIdQuery,
    useUpdateSubjectMutation,
    useDeleteSubjectMutation,
} = subjectApi;