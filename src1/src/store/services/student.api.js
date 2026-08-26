import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const studentApi = createApi({
    reducerPath: 'studentApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Student'],
    endpoints: (builder) => ({
        // GET /api/student
        getStudents: builder.query({
            query: (params) => ({
                url: '/student',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                if (!result) return [{ type: 'Student', id: 'LIST' }];
                const records = result?.data?.records || [];
                if (records.length === 0) return [{ type: 'Student', id: 'LIST' }];
                const studentTags = records.map((student) => ({ type: 'Student', id: student.id }));
                return [...studentTags, { type: 'Student', id: 'LIST' }];
            },
        }),
        // GET /api/student/{id}
        getStudentById: builder.query({
            query: (id) => ({
                url: `/student/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Student', id }],
        }),
        // POST /api/student
        createStudent: builder.mutation({
            query: (data) => ({
                url: '/student',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'Student', id: 'LIST' }],
        }),
        // PUT /api/student/{id}
        updateStudent: builder.mutation({
            query: ({ id, data }) => ({
                url: `/student/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Student', id }],
        }),
        // DELETE /api/student/{id}
        deleteStudent: builder.mutation({
            query: (id) => ({
                url: `/student/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Student', id }],
        }),
        // PATCH /api/student/{id}/assign-group
        assignGroup: builder.mutation({
            query: ({ id, data }) => ({
                url: `/student/${id}/assign-group`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Student', id }],
        }),
        // PATCH /api/student/{id}/assign-parent
        assignParent: builder.mutation({
            query: ({ id, data }) => ({
                url: `/student/${id}/assign-parent`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Student', id }],
        }),
        // PATCH /api/student/{id}/status
        updateStudentStatus: builder.mutation({
            query: ({ id, data }) => ({
                url: `/student/${id}/status`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Student', id }],
        }),
        // PATCH /api/student/{id}/unassign-group
        unassignGroup: builder.mutation({
            query: (id) => ({
                url: `/student/${id}/unassign-group`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Student', id }],
        }),
        // PATCH /api/student/{id}/unassign-parent
        unassignParent: builder.mutation({
            query: (id) => ({
                url: `/student/${id}/unassign-parent`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Student', id }],
        }),
    }),
});

// Экспорт хуков
export const {
    useGetStudentsQuery,
    useLazyGetStudentsQuery,
    useGetStudentByIdQuery,
    useLazyGetStudentByIdQuery,
    useCreateStudentMutation,
    useUpdateStudentMutation,
    useDeleteStudentMutation,
    useAssignGroupMutation,
    useAssignParentMutation,
    useUpdateStudentStatusMutation,
    useUnassignGroupMutation,
    useUnassignParentMutation,
} = studentApi;