/**
 * O'qituvchi faqat o'z darslarini ko'radi.
 * Backend eski sinflarda (guruh o'qituvchisi = sinf rahbari) o'qituvchiga guruhning BARCHA
 * darslarini qaytaradi, lekin yozishni faqat o'z darsiga ruxsat beradi (aks holda 403).
 * Shuning uchun ko'rinishda boshqa o'qituvchilarning darslarini yashiramiz.
 */
export const lessonTeacherId = (lesson) => lesson?.teacher_id ?? lesson?.teacher?.id ?? null;

/* teacher_id bo'lmasa (eski javob) — yashirmaymiz, faqat aniq boshqa o'qituvchiniki bo'lsa yashiramiz */
export const isOwnLesson = (lesson, userId) => {
    const teacherId = lessonTeacherId(lesson);
    return !teacherId || !userId || String(teacherId) === String(userId);
};

export const ownLessons = (lessons, userId) => (lessons || []).filter((lesson) => isOwnLesson(lesson, userId));

/* { 'YYYY-MM-DD': [lesson, ...] } ko'rinishidagi xaritani filtrlaydi */
export const ownLessonsByDate = (byDate, userId) =>
    Object.fromEntries(Object.entries(byDate || {}).map(([date, lessons]) => [date, ownLessons(lessons, userId)]));
