import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const groupApi = createApi({
    reducerPath: 'groupApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Group'],
    endpoints: (builder) => ({
        createGroup: builder.mutation({
            query: (data) => ({
                url: '/group',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'Group', id: 'LIST' }],
        }),
        getGroups: builder.query({
            query: (params) => ({
                url: '/group',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                const records = result?.data?.records || [];
                return [
                    ...records.map((group) => ({ type: 'Group', id: group.id })),
                    { type: 'Group', id: 'LIST' },
                ];
            },
        }),
        getGroupById: builder.query({
            query: (id) => ({
                url: `/group/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Group', id }],
        }),
        getGroupStudents: builder.query({
            query: (id) => ({
                url: `/group/${id}/students`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Group', id }],
        }),
        addStudentToGroup: builder.mutation({
            query: ({ groupId, student_id }) => ({
                url: `/group/${groupId}/students`,
                method: 'POST',
                data: { student_id },
            }),
            invalidatesTags: (result, error, { groupId }) => [
                { type: 'Group', id: groupId },
                { type: 'Group', id: 'LIST' },
            ],
        }),
        removeStudentFromGroup: builder.mutation({
            query: ({ groupId, studentId }) => ({
                url: `/group/${groupId}/students/${studentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { groupId }) => [
                { type: 'Group', id: groupId },
                { type: 'Group', id: 'LIST' },
            ],
        }),
        updateGroup: builder.mutation({
            query: ({ id, data }) => ({
                url: `/group/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Group', id },
                { type: 'Group', id: 'LIST' },
            ],
        }),
        deleteGroup: builder.mutation({
            query: (id) => ({
                url: `/group/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Group', id },
                { type: 'Group', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useCreateGroupMutation,
    useGetGroupsQuery,
    useLazyGetGroupsQuery,
    useGetGroupByIdQuery,
    useLazyGetGroupByIdQuery,
    useGetGroupStudentsQuery,
    useLazyGetGroupStudentsQuery,
    useAddStudentToGroupMutation,
    useRemoveStudentFromGroupMutation,
    useUpdateGroupMutation,
    useDeleteGroupMutation,
} = groupApi;
