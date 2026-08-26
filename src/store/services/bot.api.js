import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const botApi = createApi({
    reducerPath: 'botApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Bot'],
    endpoints: (builder) => ({
        // POST /api/bot/notify/broadcast
        // Fields: text (required), buttons (optional JSON string), photo (optional binary)
        sendBroadcast: builder.mutation({
            query: (formData) => ({
                url: '/bot/notify/broadcast',
                method: 'POST',
                data: formData,
                headers: formData instanceof FormData
                    ? { 'Content-Type': 'multipart/form-data' }
                    : { 'Content-Type': 'application/json' },
            }),
        }),
        // POST /api/bot/notify/payment-reminder
        // Body: { group_id }
        sendPaymentReminder: builder.mutation({
            query: (data) => ({
                url: '/bot/notify/payment-reminder',
                method: 'POST',
                data,
            }),
        }),
    }),
});

export const {
    useSendBroadcastMutation,
    useSendPaymentReminderMutation,
} = botApi;
