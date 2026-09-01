# Bugfix Requirements Document

## Introduction

GroupProfile sahifasida AttendanceTab orqali davomat kiritishda backend `400 Bad Request` xatosi qaytaradi: `"O'quvchi ushbu dars jadvaliga tegishli guruhda emas"`. Bu xato attendance POST so'rovida yuborilayotgan `group_schedule_id` va `student_id` backend validatsiyasidan o'ta olmayotganini ko'rsatadi. Backend `group_schedule.group_id === student.group_id` ekanligini tekshiradi, lekin frontend bu mos kelishni kafolatlamaydi — chunki `scheduleRecords` va `students` ma'lumotlari turli API endpointlardan keladi va ular orasida `group_id` bog'liqligini frontend tomonidan tekshirishning mexanizmi yo'q.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN admin AttendanceTab da o'quvchi uchun davomat holatini tanlaydi va "Saqlash" tugmasini bosadi THEN backend `400 Bad Request` qaytaradi: `"O'quvchi ushbu dars jadvaliga tegishli guruhda emas"`

1.2 WHEN `POST /attendance` so'rovida `group_schedule_id` va `student_id` yuboriladi THEN backend `group_schedule.group_id !== student.group_id` deb hisoblab, so'rovni rad etadi

1.3 WHEN `GET /group-schedule/by-group/{group_id}` chaqiriladi THEN qaytarilgan schedule recordlardagi `group_id` frontend'da o'qilayotgan guruh `id` siga mos kelmaydi yoki studentlar boshqa `group_id` bilan ro'yxatdan o'tkazilgan

### Expected Behavior (Correct)

2.1 WHEN admin AttendanceTab da o'quvchi uchun davomat holatini tanlaydi va "Saqlash" tugmasini bosadi THEN backend muvaffaqiyatli `201` javob qaytarishi kerak va davomat saqlanishi kerak

2.2 WHEN `POST /attendance` so'rovida `group_schedule_id` va `student_id` yuboriladi THEN backend `group_schedule.group_id === student.group_id` validatsiyasini muvaffaqiyatli o'tkazishi kerak

2.3 WHEN attendance yuborilishidan oldin `group_schedule_id` tekshiriladi THEN faqat joriy guruhga tegishli `group_schedule_id` ishlatilishi kerak, shuningdek `student_id` ham faqat joriy guruhga tegishli studentlar bo'lishi kerak

### Unchanged Behavior (Regression Prevention)

3.1 WHEN davomat jadvalidagi yacheykada status (present/absent/late) o'zgartirilmagan bo'lsa THEN o'sha yacheykalarga oid hech qanday API so'rov yuborilmasligi kerak

3.2 WHEN allaqachon saqlangan davomat yozuvini yangilash kerak bo'lsa THEN `attendance_id` mavjud bo'lganda `PUT /attendance/{id}` ishlatilishi kerak

3.3 WHEN merged rejimda davomat va baholar birgalikda ko'rsatiladi THEN baholar saqlash funksiyasi o'zgarmagan holda ishlashi kerak

3.4 WHEN teacher roli AttendanceTab dan foydalanadi THEN faqat o'z faniga tegishli dars kunlari ko'rsatilishi kerak

3.5 WHEN scheduleRecords prop bo'sh bo'lganda THEN AttendanceTab o'zi `fetchSchedule(groupId)` orqali jadval ma'lumotlarini yuklab olishi kerak
