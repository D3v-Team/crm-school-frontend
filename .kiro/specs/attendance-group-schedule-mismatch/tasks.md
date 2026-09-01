# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Attendance POST group_schedule_id Mismatch
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — any attendance POST where `schId` is undefined or mismatched
  - Add console.log in `AttendanceTab.saveAll` to log `{ sid, date, schId, status }` before each API call
  - Add console.log in `GroupProfile` to log `scheduleData` raw response and parsed `scheduleRecords`
  - Add error logging in `saveAll` catch block: `console.error('[Attendance] 400 error:', e?.data)`
  - Open browser Network tab, go to GroupProfile → AttendanceTab, mark a student attendance and click Save
  - Observe: `schId` qiymati — undefined yoki haqiqiy UUID ekanligini tekshiring
  - Observe: `POST /attendance` request body'dagi `group_schedule_id` to'g'riligini tekshiring
  - Observe: Backend 400 response'i — qaysi `group_schedule_id` va `student_id` muammo ekanligini tasdiqlash
  - **EXPECTED OUTCOME**: Console da `schId: undefined` yoki Network tab da `400` xatosi ko'rinadi (bu to'g'ri — bug tasdiqlangan)
  - Document counterexamples found (masalan: "schId = undefined chunki s.id yo'q" yoki "scheduleRecords bo'sh qaytdi")
  - Mark task complete when logging is added, bug is reproduced and documented
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Attendance Update and Other Tab Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: allaqachon saqlangan davomat yozuvini yangilash (`PUT /attendance/{id}`) ishlayotganini tekshiring — agar ishlayotgan bo'lsa, bu saqlanishi kerak
  - Observe: GradesTab da baho saqlash ishlayotganini tekshiring
  - Observe: Teacher roli uchun AttendanceTab to'g'ri ishlayotganini tekshiring
  - Observe: `scheduleRecords` prop bo'sh bo'lganda `fetchSchedule(groupId)` chaqirilishini tekshiring
  - Write observation notes: "PUT /attendance ishlaydi — status 200 qaytaradi"
  - Write observation notes: "GradesTab createGrade ishlaydi — status 201 qaytaradi"
  - These observations become the preservation baseline that must not regress after fix
  - Run these manual checks on UNFIXED code
  - **EXPECTED OUTCOME**: PUT attendance, grades save, teacher flow — barchasi ishlaydi (baseline established)
  - Mark task complete when baseline behavior is observed and documented
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for attendance group_schedule_id mismatch

  - [ ] 3.1 Debug va ildiz sababni aniq aniqlash
    - Exploration testdan (task 1) console log natijalarini ko'ring
    - `scheduleRecords` bo'shmi yoki `s.id` undefined mi — aniqlab oling
    - Agar `scheduleRecords` to'g'ri kelsa lekin `s.id` undefined bo'lsa → Holat 1 (fix: fallback field names)
    - Agar `scheduleRecords` bo'sh bo'lsa → parse logikasi noto'g'ri branch → fix response parse
    - Agar `scheduleRecords` to'g'ri kelsa va `s.id` UUID bo'lsa → backend inconsistency → backend team bilan murojaat
    - _Bug_Condition: isBugCondition(request) where group_schedule.group_id ≠ student.group_id_
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 3.2 AttendanceTab dayScheduleMap da schedule_id extraction mustahkamlash
    - **File**: `src/Components/Common/GroupProfile/__components/AttendanceTab.jsx`
    - `dayScheduleMap` useMemo ichida `schedule_id` extraction o'zgartiring:
      ```js
      // Eski:
      schedule_id: s.id,
      // Yangi:
      schedule_id: s.id || s.schedule_id || s.group_schedule_id,
      ```
    - Bu change: backend response'da `id` boshqa nom bilan kelsa ham to'g'ri ishlaydi
    - _Bug_Condition: isBugCondition(request) where s.id is undefined_
    - _Expected_Behavior: schedule_id always a valid UUID from scheduleRecords_
    - _Preservation: dayScheduleMap structure unchanged, only schedule_id extraction improved_
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 GradesTab dayScheduleMap da xuddi shu fix
    - **File**: `src/Components/Common/GroupProfile/__components/GradesTab.jsx`
    - Xuddi 3.2 dagi o'zgarishni GradesTab da ham qo'llash:
      ```js
      schedule_id: s.id || s.schedule_id || s.group_schedule_id,
      ```
    - _Requirements: 2.1, 2.2_

  - [ ] 3.4 AttendanceTab saveAll da kuchaytirilgan validatsiya
    - **File**: `src/Components/Common/GroupProfile/__components/AttendanceTab.jsx`
    - `saveAll` da `schId` tekshiruvini kuchaytiring:
      ```js
      // Eski:
      if (!schId || String(schId).startsWith('temp-')) { fail++; continue; }
      // Yangi:
      if (!schId || schId === 'undefined' || String(schId).startsWith('temp-')) { fail++; continue; }
      ```
    - Error catch da to'liq xato ma'lumotini ko'rsatish:
      ```js
      catch(e) {
        const msg = e?.data?.message || e?.message || e;
        console.error('[Attendance] att err:', msg, { sid, date, schId });
        Alert(`Xatolik: ${msg}`, 'error');
        fail++;
      }
      ```
    - _Preservation: existing undefined/temp- filter logic preserved and strengthened_
    - _Requirements: 2.1, 3.1_

  - [ ] 3.5 GroupProfile scheduleRecords parse logikasini tekshirish va zarur bo'lsa tuzatish
    - **File**: `src/Components/Common/GroupProfile/index.jsx`
    - `scheduleRecords` useMemo da console.log qo'shing (debug uchun, keyin o'chiriladi):
      ```js
      console.log('[GroupProfile] scheduleData raw:', scheduleData);
      console.log('[GroupProfile] scheduleRecords parsed:', result);
      ```
    - Agar backend `{ status, data: { records: [...] } }` qaytarsa va `d.records` branch ishlamasa — logikani tekshiring
    - `scheduleRecords` parse'dan so'ng `AttendanceTab` ga uzatishdan oldin validatsiya:
      ```js
      const validScheduleRecords = (Array.isArray(scheduleRecords) ? scheduleRecords : [])
        .filter(s => s.id || s.schedule_id || s.group_schedule_id);
      ```
    - _Bug_Condition: scheduleRecords empty or with undefined ids_
    - _Expected_Behavior: scheduleRecords always contains records with valid id fields_
    - _Requirements: 2.3, 3.5_

  - [ ] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Attendance POST 201 Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Browser da AttendanceTab ga o'ting, o'quvchi uchun davomat holatini tanlang va "Saqlash" ni bosing
    - **EXPECTED OUTCOME**: Network tab da `POST /attendance` → `201` muvaffaqiyatli response ko'rinadi (bug fixed)
    - Console da endi 400 xatosi ko'rinmaydi
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME checks from task 2 - do NOT write new tests
    - Mavjud davomat yozuvini yangilash (`PUT /attendance/{id}`) hali ham ishlayotganini tekshiring
    - GradesTab da baho saqlash ishlayotganini tekshiring
    - Teacher roli uchun AttendanceTab to'g'ri ishlayotganini tekshiring
    - scheduleRecords prop bo'sh bo'lganda fetchSchedule chaqirilishini tekshiring
    - **EXPECTED OUTCOME**: Barcha preservation checks PASS (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Browser da GroupProfile → AttendanceTab ga o'ting
  - O'quvchi uchun present/absent/late holatini tanlang va "Saqlash" ni bosing → 201 kutiladi
  - Mavjud davomat yozuvini o'zgartiring → 200 PUT kutiladi
  - GradesTab da baho kiriting → 201 kutiladi
  - Console da hech qanday 400 xatosi ko'rinmasligini tekshiring
  - Debug console.log larni o'chiring (task 3.5 da qo'shilgan)
  - Ensure all tests pass, ask the user if questions arise.
