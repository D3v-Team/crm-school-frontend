// store/services/teacher-group.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const teacherGroupApi = createApi({
    reducerPath: 'teacherGroupApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['TeacherGroup'],
    endpoints: (builder) => ({
        // POST /api/teacher-group
        createTeacherGroup: builder.mutation({
            query: (data) => ({
                url: '/teacher-group',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'TeacherGroup', id: 'LIST' }],
        }),
        // GET /api/teacher-group/{id}
        getTeacherGroupById: builder.query({
            query: (id) => ({
                url: `/teacher-group/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'TeacherGroup', id }],
        }),
        // PUT /api/teacher-group/{id}
        updateTeacherGroup: builder.mutation({
            query: ({ id, data }) => ({
                url: `/teacher-group/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'TeacherGroup', id }],
        }),
        // DELETE /api/teacher-group/{id}
        deleteTeacherGroup: builder.mutation({
            query: (id) => ({
                url: `/teacher-group/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'TeacherGroup', id }],
        }),
        // GET /api/teacher-group/by-group/{group_id}
        getTeacherGroupsByGroupId: builder.query({
            query: (groupId) => ({
                url: `/teacher-group/by-group/${groupId}`,
                method: 'GET',
            }),
            providesTags: (result, error, groupId) => {
                return result
                    ? [
                        ...(result?.data?.records || []).map((item) => ({
                            type: 'TeacherGroup',
                            id: item.id,
                        })),
                        { type: 'TeacherGroup', id: `by-group-${groupId}` },
                    ]
                    : [{ type: 'TeacherGroup', id: `by-group-${groupId}` }];
            },
        }),
        // GET /api/teacher-group/by-teacher/{teacher_id}
        getTeacherGroupsByTeacherId: builder.query({
            query: (teacherId) => ({
                url: `/teacher-group/by-teacher/${teacherId}`,
                method: 'GET',
            }),
            providesTags: (result, error, teacherId) => {
                return result
                    ? [
                        ...(result?.data?.records || []).map((item) => ({
                            type: 'TeacherGroup',
                            id: item.id,
                        })),
                        { type: 'TeacherGroup', id: `by-teacher-${teacherId}` },
                    ]
                    : [{ type: 'TeacherGroup', id: `by-teacher-${teacherId}` }];
            },
        }),
    }),
});

// Экспорт хуков
export const {
    useCreateTeacherGroupMutation,
    useGetTeacherGroupByIdQuery,
    useLazyGetTeacherGroupByIdQuery,
    useUpdateTeacherGroupMutation,
    useDeleteTeacherGroupMutation,
    useGetTeacherGroupsByGroupIdQuery,
    useLazyGetTeacherGroupsByGroupIdQuery,
    useGetTeacherGroupsByTeacherIdQuery,
    useLazyGetTeacherGroupsByTeacherIdQuery,
} = teacherGroupApi;