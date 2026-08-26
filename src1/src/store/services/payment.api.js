// store/services/payment.api.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const paymentApi = createApi({
    reducerPath: 'paymentApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Payment'],
    endpoints: (builder) => ({
        // POST /api/payment
        createPayment: builder.mutation({
            query: (data) => ({
                url: '/payment',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'Payment', id: 'LIST' }],
        }),
        // GET /api/payment
        getPayments: builder.query({
            query: (params) => ({
                url: '/payment',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                if (!result) return [{ type: 'Payment', id: 'LIST' }];
                const records = result?.data?.records || [];
                if (records.length === 0) return [{ type: 'Payment', id: 'LIST' }];
                const paymentTags = records.map((payment) => ({ type: 'Payment', id: payment.id }));
                return [...paymentTags, { type: 'Payment', id: 'LIST' }];
            },
        }),
        // GET /api/payment/{id}
        getPaymentById: builder.query({
            query: (id) => ({
                url: `/payment/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Payment', id }],
        }),
        // PUT /api/payment/{id}
        updatePayment: builder.mutation({
            query: ({ id, data }) => ({
                url: `/payment/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Payment', id }],
        }),
        // DELETE /api/payment/{id}
        deletePayment: builder.mutation({
            query: (id) => ({
                url: `/payment/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Payment', id }],
        }),
        // GET /api/payment/group-debtors
        getGroupDebtors: builder.query({
            query: ({ group_id, year, month }) => ({
                url: '/payment/group-debtors',
                method: 'GET',
                params: { group_id, year, month },
            }),
            providesTags: (result, error, { group_id, year, month }) => [
                { type: 'Payment', id: `debtors-${group_id}-${year}-${month}` },
            ],
        }),
    }),
});

// Экспорт хуков
export const {
    useCreatePaymentMutation,
    useGetPaymentsQuery,
    useLazyGetPaymentsQuery,
    useGetPaymentByIdQuery,
    useLazyGetPaymentByIdQuery,
    useUpdatePaymentMutation,
    useDeletePaymentMutation,
    useGetGroupDebtorsQuery,
    useLazyGetGroupDebtorsQuery,
} = paymentApi;