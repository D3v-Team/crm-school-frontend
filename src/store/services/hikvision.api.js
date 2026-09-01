import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const hikvisionApi = createApi({
    reducerPath: 'hikvisionApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Face'],
    endpoints: (builder) => ({
        // POST /api/hikvision/face/{student_id}  multipart/form-data  photo: File
        uploadFace: builder.mutation({
            query: ({ student_id, photo }) => {
                const formData = new FormData();
                formData.append('photo', photo);
                return {
                    url: `/hikvision/face/${student_id}`,
                    method: 'POST',
                    data: formData,
                    headers: { 'Content-Type': 'multipart/form-data' },
                };
            },
            invalidatesTags: (r, e, { student_id }) => [{ type: 'Face', id: student_id }],
        }),
        // DELETE /api/hikvision/face/{student_id}
        deleteFace: builder.mutation({
            query: (student_id) => ({
                url: `/hikvision/face/${student_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (r, e, id) => [{ type: 'Face', id }],
        }),

        // POST /api/hikvision/user-face/{user_id}  multipart/form-data  photo: File
        uploadUserFace: builder.mutation({
            query: ({ user_id, photo }) => {
                const formData = new FormData();
                formData.append('photo', photo);
                return {
                    url: `/hikvision/user-face/${user_id}`,
                    method: 'POST',
                    data: formData,
                    headers: { 'Content-Type': 'multipart/form-data' },
                };
            },
            invalidatesTags: (r, e, { user_id }) => [{ type: 'Face', id: `user-${user_id}` }],
        }),
        // DELETE /api/hikvision/user-face/{user_id}
        deleteUserFace: builder.mutation({
            query: (user_id) => ({
                url: `/hikvision/user-face/${user_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (r, e, id) => [{ type: 'Face', id: `user-${id}` }],
        }),
        // GET /api/hikvision/ping — camera online/offline
        pingCamera: builder.query({
            query: () => ({
                url: '/hikvision/ping',
                method: 'GET',
            }),
            providesTags: [{ type: 'Face', id: 'PING' }],
        }),
    }),
});

export const {
    useUploadFaceMutation,
    useDeleteFaceMutation,
    useUploadUserFaceMutation,
    useDeleteUserFaceMutation,
    usePingCameraQuery,
    useLazyPingCameraQuery,
} = hikvisionApi;
