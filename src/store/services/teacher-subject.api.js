import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const teacherSubjectApi = createApi({
    reducerPath: 'teacherSubjectApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['TeacherSubject'],
    endpoints: (builder) => ({
        // POST /api/teacher-subject
        createTeacherSubject: builder.mutation({
            query: (data) => ({
                url: '/teacher-subject',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'TeacherSubject', id: 'LIST' }],
        }),
        // GET /api/teacher-subject (pagination)
        getTeacherSubjects: builder.query({
            query: (params) => ({
                url: '/teacher-subject',
                method: 'GET',
                params,
            }),
            providesTags: (result) => {
                if (!result) return [{ type: 'TeacherSubject', id: 'LIST' }];
                const records = result?.data?.records || [];
                if (records.length === 0) return [{ type: 'TeacherSubject', id: 'LIST' }];
                const tags = records.map((item) => ({ type: 'TeacherSubject', id: item.id }));
                return [...tags, { type: 'TeacherSubject', id: 'LIST' }];
            },
        }),
        // GET /api/teacher-subject/{id}
        getTeacherSubjectById: builder.query({
            query: (id) => ({
                url: `/teacher-subject/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'TeacherSubject', id }],
        }),
        // PUT /api/teacher-subject/{id}
        updateTeacherSubject: builder.mutation({
            query: ({ id, data }) => ({
                url: `/teacher-subject/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'TeacherSubject', id }],
        }),
        // DELETE /api/teacher-subject/{id}
        deleteTeacherSubject: builder.mutation({
            query: (id) => ({
                url: `/teacher-subject/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'TeacherSubject', id }],
        }),
        // GET /api/teacher-subject/by-teacher/{teacher_id}
        getTeacherSubjectsByTeacherId: builder.query({
            query: (teacherId) => ({
                url: `/teacher-subject/by-teacher/${teacherId}`,
                method: 'GET',
            }),
            providesTags: (result, error, teacherId) => {
                // Можно добавить кастомный тег для конкретного учителя
                return result
                    ? [
                        ...(result?.data?.records || []).map((item) => ({
                            type: 'TeacherSubject',
                            id: item.id,
                        })),
                        { type: 'TeacherSubject', id: `by-teacher-${teacherId}` },
                    ]
                    : [{ type: 'TeacherSubject', id: `by-teacher-${teacherId}` }];
            },
        }),
        // GET /api/teacher-subject/available-teachers?subject_id=&group_id=
        getAvailableTeachers: builder.query({
            query: (params) => ({
                url: '/teacher-subject/available-teachers',
                method: 'GET',
                params,
            }),
            providesTags: (result, error, params) => [
                { type: 'TeacherSubject', id: `available-${params?.subject_id}-${params?.group_id}` },
            ],
        }),
    }),
});

// Экспорт хуков
export const {
    useCreateTeacherSubjectMutation,
    useGetTeacherSubjectsQuery,
    useLazyGetTeacherSubjectsQuery,
    useGetTeacherSubjectByIdQuery,
    useLazyGetTeacherSubjectByIdQuery,
    useUpdateTeacherSubjectMutation,
    useDeleteTeacherSubjectMutation,
    useGetTeacherSubjectsByTeacherIdQuery,
    useLazyGetTeacherSubjectsByTeacherIdQuery,
    useGetAvailableTeachersQuery,
    useLazyGetAvailableTeachersQuery,
} = teacherSubjectApi;