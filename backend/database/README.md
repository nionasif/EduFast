# 🗄️ EduFast সেন্ট্রালাইজড ডাটাবেজ ডিরেক্টরি (Database Directory)

EduFast প্ল্যাটফর্মের সকল মডুলার ডাটাবেজ টেবিল, স্কিমা এবং একটিভ SQLite ফাইল এই ফোল্ডারে সুশৃঙ্খলভাবে সাজানো রয়েছে।

---

## ১. ডাটাবেজ ফাইলসমূহ (Active SQLite Files)
- **`students.db`**: প্রধান SQLite ডাটাবেজ ফাইল (উচ্চগতির WAL মোডে পরিচালিত)।

---

## ২. মডুলার স্কিমা ফাইলসমূহ (`/schemas` ফোল্ডারে):

| ফাইল | টেবিলের নাম | বিবরণ |
|---|---|---|
| [`01_users_auth.sql`](./schemas/01_users_auth.sql) | `users_auth` | শিক্ষার্থী, শিক্ষক, মেন্টর ও অ্যাডমিনদের লগইন, ইমেইল, মোবাইল ও এনক্রিপ্টেড পাসওয়ার্ড। |
| [`02_student_profiles.sql`](./schemas/02_student_profiles.sql) | `student_profiles` | শিক্ষার্থীদের নাম, রোল, রেজিস্ট্রেশন, এসএসসি ও এইচএসসি বোর্ড, জিপিএ এবং অ্যাকাডেমিক তথ্য। |
| [`03_question_bank.sql`](./schemas/03_question_bank.sql) | `question_bank` | বিষয়ভিত্তিক এমসিকিউ প্রশ্ন, অপশন A-D, সঠিক উত্তর, ব্যাখ্যা ও বিগত বছরের পরীক্ষার ট্যাগ। |
| [`04_courses.sql`](./schemas/04_courses.sql) | `courses` | কোর্স ক্যাটালগ, মূল্য, ছাড়ের অফার, ইনস্ট্রাক্টর ও কোর্স পরিচিতি। |
| [`05_course_curriculum.sql`](./schemas/05_course_curriculum.sql) | `course_curriculum` | প্রতিটি কোর্সের অধ্যায় ও টপিক অনুযায়ী ভিডিও লেকচার (ভিডিও লিংক/আপলোড ফাইল) ও লেকচার শিট। |
| [`06_universities.sql`](./schemas/06_universities.sql) | `universities` | ঢাকা বিশ্ববিদ্যালয় (A, B, C, E, IBA ইউনিট সহ) ও দেশের শীর্ষ বিশ্ববিদ্যালয়সমূহের ভর্তি সার্কুলার। |
| [`07_enrollments.sql`](./schemas/07_enrollments.sql) | `enrollments` | কোন শিক্ষার্থী কোন কোর্সে ভর্তি হয়েছে এবং তার শতকরা অগ্রগতি (Progress %)। |
| [`08_mentor_doubts.sql`](./schemas/08_mentor_doubts.sql) | `mentor_doubts` | শিক্ষার্থীদের ২৪/৭ ডাউট প্রশ্ন, মেন্টরদের সমাধান ও রেটিং হিস্ট্রি। |

---

## ৩. ভিডিও ফাইল স্টোরেজ লোকেশন:
কোর্সের ভিডিও ফাইল রাখার নির্দিষ্ট ফোল্ডার:
👉 **`EduFast\backend\uploads\videos\`**
এখানে `.mp4`, `.webm` ফাইল রাখলে সার্ভার থেকে `http://localhost:5001/uploads/videos/filename.mp4` এ সরাসরি প্লে হবে।
