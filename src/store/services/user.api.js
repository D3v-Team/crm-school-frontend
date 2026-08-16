import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['User'],
    endpoints: (builder) => ({
        createUser: builder.mutation({
            query: (data) => ({
                url: '/user',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['User'],
        }),
        getUsers: builder.query({
            query: (params) => ({
                url: '/user',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                if (!result) return [{ type: 'User', id: 'LIST' }];
                const records = result?.data?.records || [];
                if (records.length === 0) return [{ type: 'User', id: 'LIST' }];
                const userTags = records.map((user) => ({ type: 'User', id: user.id }));
                return [...userTags, { type: 'User', id: 'LIST' }];
            },
        }),
        getUserById: builder.query({
            query: (id) => ({
                url: `/user/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'User', id }],
        }),
        updateUser: builder.mutation({
            query: ({ id, data }) => ({
                url: `/user/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `/user/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'User', id }],
        }),
        resetChatId: builder.mutation({
            query: (id) => ({
                url: `/user/${id}/reset-chat-id`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'User', id }],
        }),
        resetPassword: builder.mutation({
            query: ({ id, data }) => ({
                url: `/user/reset-password/${id}`,
                method: 'POST',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
        }),
        updateIsPayment: builder.mutation({
            query: ({ id, data }) => ({
                url: `/user/is-payment/${id}`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
        }),
    }),
});

export const {
    useCreateUserMutation,
    useGetUsersQuery,
    useLazyGetUsersQuery,
    useGetUserByIdQuery,
    useLazyGetUserByIdQuery,
    useUpdateUserMutation,
    useUpdateIsPaymentMutation,
    useDeleteUserMutation,
    useResetChatIdMutation,
    useResetPasswordMutation,
} = userApi;