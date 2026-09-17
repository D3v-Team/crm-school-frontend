import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';
import $api from '../api';

export const expenseApi = createApi({
    reducerPath: 'expenseApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Expense'],
    endpoints: (builder) => ({
        // GET /api/expense
        getExpenses: builder.query({
            query: (params) => ({
                url: '/expense',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                if (!result) return [{ type: 'Expense', id: 'LIST' }];
                const records = result?.data?.records || [];
                return [
                    ...records.map((e) => ({ type: 'Expense', id: e.id })),
                    { type: 'Expense', id: 'LIST' },
                ];
            },
        }),
        // POST /api/expense
        createExpense: builder.mutation({
            query: (data) => ({
                url: '/expense',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
        }),
        // PUT /api/expense/{id}
        updateExpense: builder.mutation({
            query: ({ id, data }) => ({
                url: `/expense/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Expense', id },
                { type: 'Expense', id: 'LIST' },
            ],
        }),
        // DELETE /api/expense/{id}
        deleteExpense: builder.mutation({
            query: (id) => ({
                url: `/expense/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Expense', id },
                { type: 'Expense', id: 'LIST' },
            ],
        }),
    }),
});

// Excel export — axiosBaseQuery responseType bilan ishlamaydi (blob),
// shuning uchun to'g'ridan-to'g'ri $api ishlatamiz
export const exportExpenseExcel = async (params) => {
    const response = await $api.get('/expense/export/excel', {
        params,
        responseType: 'blob',
    });
    return response.data;
};

export const {
    useGetExpensesQuery,
    useLazyGetExpensesQuery,
    useCreateExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
} = expenseApi;
