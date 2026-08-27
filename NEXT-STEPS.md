# Maintenance Pro v2.5.3 — ขั้นตอนหลังอัปเดต

## 1) Deploy Frontend
1. สำรอง repository เดิมก่อน
2. นำไฟล์ทั้งหมดจาก ZIP v2.5.3 ไปแทนไฟล์เดิมใน branch `main`
3. ห้ามนำโฟลเดอร์ `dist` เก่ามาทับ เพราะ GitHub Actions จะ build ใหม่
4. Commit และ Push
5. เปิด GitHub > Actions > `Deploy Maintenance Pro to GitHub Pages`
6. งานต้องผ่านขั้น `Install`, `Test and build`, `Deploy`

## 2) ทดสอบหลัง Deploy
- Login Admin/Supervisor ได้
- บนคอมพิวเตอร์เห็นเมนู `Checklist` และ `LINE` บนแถบด้านบน
- เปิด Checklist > แก้ไขแม่แบบ > เพิ่ม/แก้/ลบหัวข้อ > บันทึกแล้วรีเฟรชยังอยู่
- Login ช่างด้วยรหัสพนักงานได้
- สร้างงานใหม่และมีผู้รับผิดชอบ
- เปิดงาน > กรอก Checklist ปกติ > บันทึกได้
- เลือกผล `ผิดปกติ` > แนบรูปในหัวข้อนั้น > ส่งตรวจได้
- ปิดแล้วเปิดงานเดิมอีกครั้ง > เห็นปุ่มเปิดรูปหลักฐานในหัวข้อเดิม
- หัวหน้า Approve / Return งานได้
- กด Test LINE และตรวจว่ากลุ่มได้รับข้อความ

## 3) Supabase ที่ทำแล้ว
- Cron LINE เปิดและทำงานทุก 1 นาที
- Edge Function login v5
- Edge Function LINE dispatch v4
- RPC เก่าจัดการช่างถูกปิดสิทธิ์
- RPC แบบ transaction สำหรับสร้าง Work Order / Checklist Template / Manual Duty เปิดใช้แล้ว
- RPC แก้ไข/ลบ Checklist Template เปิดใช้แล้ว (System Template แก้รายการได้แต่ลบไม่ได้)
- Attachment และ Audit guard เปิดใช้แล้ว

## 4) ค่าที่ควรเปิดเพิ่มใน Supabase Dashboard
เปิด Leaked Password Protection สำหรับบัญชี Admin/Supervisor ตามหน้า Auth Password Security ของ Supabase

## หมายเหตุ
`public/config.js` ใช้ Publishable Key เท่านั้น ห้ามใส่ `service_role` หรือ secret key ลงใน repository/frontend
