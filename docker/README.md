# 🐳 EduFast Docker Architecture & Deployment Guide

EduFast প্ল্যাটফর্মের সম্পূর্ণ পরিবেশ (Frontend, Backend API, SQLite Database এবং GUI Studio) ডকারের মাধ্যমে কনটেইনারাইজড করা হয়েছে।

---

## 🏗️ ডকার সার্ভিস আর্কিটেকচার

| সার্ভিস | কনটেইনার নাম | পোর্ট | টেকনোলজি | বিবরণ |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `edufast-frontend` | `80` ও `5173` | React 19 + Nginx (Alpine) | মাল্টি-স্টেজ অপ্টিমাইজড প্রোডাকশন বিল্ড এবং রিভার্স প্রক্সি |
| **Backend** | `edufast-backend` | `5000` | Node.js 20 + Express | SQLite ORM, রিয়েলটাইম Socket.IO, Authentication ও API |
| **DB Studio** | `edufast-db-studio` | `8080` | SQLite Web GUI | ব্রাউজারভিত্তিক ডাটাবেজ ভিউয়ার ও SQL কোয়েরি রানার |

---

## 🚀 কীভাবে চালু করবেন (How to Run)

### পদ্ধতি ১: ১-ক্লিকে চালু (Windows Batch Script)
1. নিশ্চিত করুন আপনার পিসিতে **Docker Desktop** ওপেন করা আছে।
2. এই ফোল্ডারে থাকা **`start_docker.bat`** ফাইলে ডাবল ক্লিক করুন।
3. সমস্ত কনটেইনার স্বয়ংক্রিয়ভাবে বিল্ড হয়ে ব্যাকগ্রাউন্ডে চালু হয়ে যাবে!

### পদ্ধতি ২: টার্মিনাল / কমান্ড লাইন থেকে
```bash
# প্রোজেক্ট রুট ফোল্ডার অথবা docker ফোল্ডার থেকে চালান:
docker compose up -d --build
```

---

## 🌐 সার্ভিস লিংকসমূহ:

* **ওয়েবসাইট (Frontend App):** [http://localhost](http://localhost) অথবা [http://localhost:5173](http://localhost:5173)
* **ব্যাকএন্ড API:** [http://localhost:5000/api](http://localhost:5000/api)
* **ডাটাবেজ স্টুডিও (SQLite Web GUI):** [http://localhost:8080](http://localhost:8080)

---

## 🛑 কীভাবে বন্ধ করবেন:
* **১-ক্লিকে:** **`stop_docker.bat`** ফাইলে ডাবল ক্লিক করুন।
* **টার্মিনালে:** `docker compose down` কমান্ডটি দিন।

---

## 💾 ডাটা স্থায়িত্ব (Data Persistence)
ডাটাবেজ ফাইল (`students.db`) সরাসরি আপনার হোস্ট পিসির `backend/database/` ডিরেক্টরিতে ভলিউম মাউন্ট করা রয়েছে। সুতরাং ডকার কনটেইনার ডিলিট বা রিস্টার্ট করলেও আপনার কোনো ডাটা মুছে যাবে না।
