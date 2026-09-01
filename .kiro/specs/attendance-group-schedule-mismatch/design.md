# Attendance Group Schedule Mismatch Bugfix Design

## Overview

`AttendanceTab` komponentida davomat saqlanayotganda backend `400 Bad Request` xatosi kelmoqda: `"O'quvchi ushbu dars jadvaliga tegishli guruhda emas"`. Bu xato backend validatsiyasida `group_schedule.group_id !== student.group_id` bo'lganda yuzaga keladi.

**Bug sababi:** `scheduleRecords` dagi har bir record `GET /group-schedule/by-group/{group_id}` dan keladi. Bu recordlardagi `id` field attendance POST da `group_schedule_id` sifatida yuboriladi. Backend bu `group_schedule_id` ga tegishli `group_id` ni topib, `student.group_id` bilan solishtiradi. Agar ular mos kelmasa — 400 xatosi.

**Muammo nuqtasi:** `GroupProfile/index.jsx` da `scheduleData` response strukturasi noto'g'ri parse qilinsa yoki `scheduleData` umuman yuklanmagan holda `scheduleRecords` bo'sh massiv sifatida uzatilsa, `AttendanceTab` ichida `fetchSchedule(groupId)` qayta chaqiriladi. Bu ikkinchi fetch ham xuddi shu endpoint bo'lsa ham, `scheduleApiData` dan olingan recordlar `s.id` orqali `schedule_id` sifatida ishlatiladi — bu to'g'ri bo'lishi kerak.

**Haqiqiy muammo:** `GroupProfile` dagi `scheduleData` parse logikasi `axiosBaseQuery` javobini `{ data: result.data }` shaklida qaytaradi. Ya'ni `hook.data = result.data = { status: 200, data: [...] }`. Shunda `scheduleRecords` useMemo logikasi `raw?.data` ya'ni `[...]` massivini topadi — bu to'g'ri. Lekin agar backend `{ status: 200, data: { records: [...] } }` qaytarsa, logika `d?.records` ya'ni `[...]` ni topadi — bu ham to'g'ri.

**Asosiy muammo — `weekly-topic` API ishlatilishi:** Agar `AttendanceTab` yoki boshqa joy `weekly-topic/group-week` endpointidan olingan ma'lumotlarni ishlatsa, u yerda `group_schedule_id` maydoni bor, lekin bu ID lar `group-schedule/by-group` dagi `id` lardan farq qilishi mumkin — ular bir xil bo'lishi shart, lekin kontekst chalg'itishi mumkin.

**To'g'ri muammo — student `group_id` mismatch:** `GET /student?group_id=X` so'rovi bilan olingan studentlarning `group_id` = X bo'ladi. `GET /group-schedule/by-group/X` so'rovi bilan olingan schedulelarning `group_id` = X bo'ladi. Backend ham `X === X` deb tekshiradi — mos kelishi kerak. Lekin agar `fetchStudents({ group_id: id })` da `id` — URL parametridagi guruh ID si bo'lsa va `fetchSchedule(id)` ham shu `id` bo'lsa — ular bir xil, muammo bo'lmasligi kerak.

**Haqiqiy ildiz sabab:** `scheduleRecords` parse qilinayotganda `s.id` o'rniga boshqa field ishlatilishi yoki `scheduleApiData` dan olingan records ichida `id` field yo'qligi. Yoki `AttendanceTab` o'zi fetch qilganida `scheduleApiData` strukturasi noto'g'ri parse qilinishi.

## Glossary

- **Bug_Condition (C)**: `group_schedule_id` ning backend `group_id` si bilan `student.group_id` mos kelmasligi — natijada 400 xatosi
- **Property (P)**: Attendance POST muvaffaqiyatli bo'lishi — `group_schedule_id` va `student_id` bir xil `group_id` ga tegishli bo'lishi
- **Preservation**: Mavjud davomat yangilash (PUT), baho saqlash, schedule filter, teacher roli funksiyalari o'zgarmagan holda ishlashi
- **scheduleRecords**: `GET /group-schedule/by-group/{group_id}` endpointidan olingan, har bir record `{ id, group_id, day_of_week, subject_id, subject: { name } }` strukturasida
- **dayScheduleMap**: `scheduleRecords` dan qurilgan `{ day_of_week → [{ schedule_id, subject_id, subject_name }] }` mapping
- **axiosBaseQuery**: `{ data: result.data }` qaytaradi — ya'ni `hook.data = backendResponse` (ikkita wrapper emas)

## Bug Details

### Bug Condition

Bug `POST /attendance` chaqirilganda yuzaga keladi. Frontend yuborgan `group_schedule_id` backend tomonida tekshiriladi: u tegishli `group_schedule` yozuvi topiladi va uning `group_id` si `student` ning `group_id` si bilan solishtiriladi. Mos kelmasa 400 xatosi.

**Formal Specification:**
```
FUNCTION isBugCondition(request)
  INPUT: request = { student_id, group_schedule_id, date, status }
  OUTPUT: boolean
  
  student_group_id   ← getStudentGroupId(request.student_id)
  schedule_group_id  ← getScheduleGroupId(request.group_schedule_id)
  
  RETURN student_group_id ≠ schedule_group_id
         OR request.group_schedule_id IS NULL
         OR request.group_schedule_id IS UNDEFINED
END FUNCTION
```

### Root Cause Analysis

`AttendanceTab` `scheduleApiData` dan olingan records ni parse qilayotganda `s.id` maydonini `schedule_id` sifatida ishlatadi. Muammo quyidagi holatlardan birida yuzaga keladi:

**Holat 1:** `AttendanceTab` o'zi `fetchSchedule(groupId)` chaqirganida `scheduleApiData` response `{ data: { status: 200, data: [...] } }` ko'rinishida keladi (axiosBaseQuery bir marta unwrap qiladi: `hook.data = result.data = { status, data: [...] }`). AttendanceTab ichidagi parse logikasi:
```js
const raw = scheduleApiData;           // = { status: 200, data: [...] }
const d = raw?.data;                   // = [...]  ← array
if (Array.isArray(d)) return d;        // ← shu branch ishlatiladi ✓
```
Bu to'g'ri ishlaydi.

**Holat 2 (Haqiqiy muammo):** `GroupProfile` dan `scheduleRecords` prop sifatida uzatilganida. `GroupProfile` dagi `scheduleData` parse logikasi:
```js
const raw = scheduleData;              // hook.data = { status: 200, data: [...] }
if (Array.isArray(raw)) return raw;    // ← array emas, o'tkazib yuboriladi
const d = raw?.data;                   // = [...] yoki { records: [...] }
if (Array.isArray(d)) return d;        // ← agar data massiv bo'lsa — to'g'ri ✓
if (Array.isArray(d?.records)) return d.records;  // ← agar data.records bo'lsa ✓
```
Bu ham to'g'ri ishlaydi.

**Holat 3 (Asosiy muammo kandidati):** Backend `group-schedule/by-group/{id}` response'da `id` field mavjud emas yoki boshqa nom bilan keladi (masalan `schedule_id`, `_id`). Shunda `s.id` = `undefined` bo'ladi va `group_schedule_id: undefined` yuboriladi — backend buni topa olmaydi.

**Holat 4:** `students` ro'yxati to'g'ri `group_id: X` bilan kelyapti, lekin `scheduleRecords` boshqa `group_id: Y` ga tegishli schedulelarni qaytaryapti — bu backend data muammosi.

### Examples

- `student_id: "aa5f4613..."` → `student.group_id = "group-X"`
- `group_schedule_id: "8d46ddd0..."` → `group_schedule.group_id = "group-Y"` (boshqa guruh!)
- Backend: `"group-X" ≠ "group-Y"` → 400 xatosi

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Allaqachon saqlangan davomat yozuvini yangilashda `PUT /attendance/{id}` ishlashi kerak
- `scheduleRecords` prop kelganida AttendanceTab uni o'z fetch qilmasdan ishlatishi kerak
- Merged rejimda baho saqlash ishlashi kerak
- Teacher rolida faqat o'z faniga tegishli darslar ko'rsatilishi kerak
- Status tugmachalari (present/absent/late) ishlashi kerak

**Scope:**
Bug condition `group_schedule_id` noto'g'ri bo'lgandagina yuzaga keladi. Mavjud attendance `id` si bilan yangilash (`PUT`), boshqa tablar (Grades, Schedule, Students, Teachers), va teacher dashboard funksiyalari bu fix dan ta'sirlanmasligi kerak.

## Hypothesized Root Cause

Kod tahlili asosida eng ehtimoliy sabab:

1. **`scheduleRecords` dagi `id` field yo'qligi yoki `undefined` bo'lishi**: Backend `group-schedule/by-group/{group_id}` response'da har bir record uchun `id` mavjud emas yoki boshqa nom bilan keladi. `dayScheduleMap` da `schedule_id: s.id` ishlatiladi — agar `s.id` undefined bo'lsa, attendance POST da `group_schedule_id: undefined` ketadi.

2. **Response struktura mismatch**: Backend javob `{ status, data: { data: [...] } }` yoki `{ status, data: { records: [...] } }` shaklida kelsa, parse logikasi noto'g'ri branchga tushishi va `scheduleRecords` bo'sh massiv qaytarishi mumkin. Bu holda `dayScheduleMap` bo'sh bo'ladi — lekin u holda yacheykalar ko'rinmaydi, foydalanuvchi status bosishi mumkin emas.

3. **Backend data inconsistency**: `group-schedule/by-group/{group_id}` endpointi shu `group_id` ga tegishli EMAS bo'lgan schedulelarni qaytarishi (backend bug). Bu holda frontend to'g'ri ishlaydi lekin backend validatsiyasi muvaffaqiyatsiz bo'ladi.

4. **`fetchStudents` da noto'g'ri `group_id`**: Agar `fetchStudents({ group_id: id })` da `id` undefined bo'lsa, studentlar `group_id` siz olinadi va ular boshqa group ga tegishli bo'lishi mumkin. Lekin kod `const { id } = useParams()` ishlatadi — bu URL dan to'g'ri keladi.

**Eng ehtimoliy:** Holat 1 — `scheduleRecords` dagi har bir element `id` field ini emas, balki `group_schedule_id` yoki boshqa nom bilan keladi. Yoki `AttendanceTab` fetch qilganida parse logikasi noto'g'ri branch qaytaradi va `id` undefined bo'lgan recordlar keladi.

## Correctness Properties

Property 1: Bug Condition - Attendance POST muvaffaqiyatli bo'lishi

_For any_ attendance POST so'rovida `group_schedule_id` va `student_id` bir xil guruh (`group_id`) ga tegishli bo'lganda, backend `201` muvaffaqiyatli javob qaytarishi kerak. Fix qilingan kod uchun: `scheduleRecords` dan olingan har bir `schedule_id` (`s.id`) validatsiyadan o'tishi kerak, ya'ni u haqiqiy, mavjud va to'g'ri `group_id` ga tegishli `group_schedule.id` bo'lishi kerak.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Mavjud funksionallik o'zgarmagan holda ishlashi

_For any_ davomat yangilash (PUT), baho saqlash, yoki boshqa tablar bilan ishlash operatsiyalarida — bug condition ushbu so'rovlarga tegishli EMAS — fix qilingan kod original kod bilan bir xil natija berishi kerak. Mavjud `attendance_id` mavjud bo'lganda UPDATE yo'li, bo'lmaganda CREATE yo'li ishlatilishi saqlanishi kerak.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**Asosiy strategiya:** `scheduleRecords` dagi har bir record uchun `schedule_id` = `s.id` ekanligini kafolatlash. Agar backend response'da `id` field boshqa nom bilan kelsa — fallback ishlatish. Shuningdek, `group_schedule_id` `undefined` bo'lib qolmasligi uchun `saveAll` da yanada kuchli validatsiya.

**File 1:** `src/Components/Common/GroupProfile/__components/AttendanceTab.jsx`

**Function:** `dayScheduleMap` useMemo va `saveAll`

**Specific Changes:**

1. **`dayScheduleMap` da `schedule_id` extraction mustahkamlash**:
   ```js
   // Avval: schedule_id: s.id
   // Keyin: schedule_id: s.id || s.schedule_id || s.group_schedule_id
   m[s.day_of_week].push({
     schedule_id:  s.id || s.schedule_id || s.group_schedule_id,
     subject_id:   s.subject_id,
     subject_name: s.subject?.name || s.subject_name || '—',
   });
   ```

2. **`saveAll` da `group_schedule_id` validatsiyasi kuchaytirish**:
   ```js
   // Avval: if (!schId || String(schId).startsWith('temp-'))
   // Keyin: if (!schId || schId === 'undefined' || String(schId).startsWith('temp-'))
   ```
   Bu allaqachon bor, lekin qo'shimcha debug logging qo'shish foydali.

3. **Console debug logging qo'shish** (muammoni aniq tasdiqlash uchun):
   ```js
   // saveAll ichida
   console.log('[Attendance] Saving:', { sid, date, schId, status: ch.status });
   ```

**File 2:** `src/Components/Common/GroupProfile/__components/GradesTab.jsx`

Xuddi shu `dayScheduleMap` o'zgartirishlarini GradesTab da ham qo'llash.

**File 3:** `src/Components/Common/GroupProfile/index.jsx`

`scheduleRecords` parse logikasiga debug logging qo'shish va response strukturasini console da ko'rsatish.

## Testing Strategy

### Validation Approach

Ikki bosqichli yondashuv: avval bugni tasdiqlovchi testlar yozish (unfixed kod da FAIL bo'ladi), so'ngra fix qilingan kod da ham preservation testlar o'tishini tekshirish.

### Exploratory Bug Condition Checking

**Goal**: Frontend dan yuborilayotgan `group_schedule_id` haqiqatan ham noto'g'ri yoki undefined ekanligini tasdiqlash. Bug ni console logging orqali o'rganish.

**Test Plan**: `AttendanceTab` `saveAll` funksiyasida `schId` qiymatini console da ko'rsatish va backend 400 xatosida response body ni to'liq ko'rsatish.

**Test Cases**:
1. **scheduleRecords parse testi**: `GroupProfile` dagi `scheduleData` response strukturasini console da ko'rsatish — qaysi branch ishlatilganini aniqlash (unfixed kod da noto'g'ri parse bo'lishi mumkin)
2. **group_schedule_id testi**: `saveAll` da `schId` qiymatini log qilish — `undefined` yoki boshqa noto'g'ri qiymat ekanligini tasdiqlash
3. **Backend response testi**: Network tab'da `POST /attendance` so'rovini ko'rib, yuborilgan `group_schedule_id` ni va backend 400 response'ini tekshirish

**Expected Counterexamples**:
- `schId` = `undefined` yoki haqiqiy UUID bo'lmagan qiymat
- Backend 400: `group_schedule.group_id` boshqa guruh ID si bilan qaytadi

### Fix Checking

**Goal**: Fix dan keyin `POST /attendance` `201` muvaffaqiyatli javob qaytarishini tekshirish.

**Pseudocode:**
```
FOR ALL attendance entry WHERE isBugCondition(request) WAS true DO
  result := createAttendance_fixed(student_id, group_schedule_id, date, status)
  ASSERT result.status = 201
  ASSERT no 400 error
END FOR
```

### Preservation Checking

**Goal**: Fix dan keyin mavjud funksionallik o'zgarmaganini tekshirish.

**Pseudocode:**
```
FOR ALL attendance entry WHERE attendance_id IS NOT NULL DO
  ASSERT updateAttendance(id, { status }) = original_behavior
END FOR

FOR ALL grade entry WHERE NOT isBugCondition DO
  ASSERT createGrade / updateGrade = original_behavior
END FOR
```

**Testing Approach**: Manuel testlash orqali — mavjud attendancelarni yangilash, baho saqlash, va boshqa tablar bilan ishlash funksiyalarini tekshirish.

**Test Cases**:
1. **PUT attendance preservation**: Mavjud davomat yozuvini yangilash ishlashi kerak
2. **Grades tab preservation**: Baholar tab va saqlash ishlashi kerak
3. **Teacher role preservation**: Teacher roli uchun faqat o'z faniga tegishli darslar ko'rsatilishi kerak
4. **scheduleRecords fallback preservation**: scheduleRecords prop bo'sh bo'lganda o'zi fetch qilishi ishlashi kerak

### Unit Tests

- `dayScheduleMap` da `schedule_id` to'g'ri extract qilinishini tekshirish (s.id || s.schedule_id || s.group_schedule_id)
- `saveAll` da undefined `schId` skip qilinishini tekshirish
- `scheduleRecords` parse logikasining turli response strukturalari uchun to'g'ri ishlashini tekshirish

### Property-Based Tests

- Turli `scheduleData` response strukturalari uchun `scheduleRecords` parse logikasi to'g'ri array qaytarishini tekshirish
- `dayScheduleMap` uchun: har qanday valid `scheduleRecord` uchun `schedule_id` undefined bo'lmasligini tekshirish

### Integration Tests

- To'liq flow: schedule fetch → dayScheduleMap qurilishi → attendance saqlash → 201 response
- Teacher flow: faqat o'z faniga tegishli darslar ko'rsatilishi → attendance saqlash
