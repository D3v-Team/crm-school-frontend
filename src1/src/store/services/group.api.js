// store/services/group.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const groupApi = createApi({
    reducerPath: 'groupApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Group'],
    endpoints: (builder) => ({
        // POST /api/group
        createGroup: builder.mutation({
            query: (data) => ({
                url: '/group',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'Group', id: 'LIST' }],
        }),
        // GET /api/group
        getGroups: builder.query({
            query: (params) => ({
                url: '/group',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                if (!result) return [{ type: 'Group', id: 'LIST' }];
                const records = result?.data?.records || [];
                if (records.length === 0) return [{ type: 'Group', id: 'LIST' }];
                const groupTags = records.map((group) => ({ type: 'Group', id: group.id }));
                return [...groupTags, { type: 'Group', id: 'LIST' }];
            },
        }),
        // GET /api/group/{id}
        getGroupById: builder.query({
            query: (id) => ({
                url: `/group/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Group', id }],
        }),
        // PUT /api/group/{id}
        updateGroup: builder.mutation({
            query: ({ id, data }) => ({
                url: `/group/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Group', id }],
        }),
        // DELETE /api/group/{id}
        deleteGroup: builder.mutation({
            query: (id) => ({
                url: `/group/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Group', id }],
        }),
    }),
});

// Экспорт хуков
export const {
    useCreateGroupMutation,
    useGetGroupsQuery,
    useLazyGetGroupsQuery,
    useGetGroupByIdQuery,
    useLazyGetGroupByIdQuery,
    useUpdateGroupMutation,
    useDeleteGroupMutation,
} = groupApi;