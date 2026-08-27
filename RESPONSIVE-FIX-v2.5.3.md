# Responsive Fix v2.5.3

แก้ปัญหา Modal ล้นหน้าจอและปุ่มปิด/ปุ่มบันทึกหาย โดยเฉพาะหน้า “สร้างเวรเอง”

## Manual Duty Modal
- ใช้ความสูงอิง `100dvh` ไม่เกิน viewport จริง
- Header และปุ่ม X แยกออกจากส่วน scroll จึงมองเห็นตลอด
- Footer ปุ่มยกเลิก/สร้างเวรอยู่ด้านล่างตลอด
- เลื่อนเฉพาะเนื้อหากลาง ไม่เลื่อน Modal ทั้งก้อน
- Desktop ใช้ความกว้างสูงสุดประมาณ 896px
- รายชื่อช่างเป็น 2 คอลัมน์ตั้งแต่หน้าจอ 640px ขึ้นไป
- ลดความสูงของรายชื่อช่างและให้ scroll ภายใน
- กด Escape หรือคลิกพื้นหลังเพื่อปิดได้ (เมื่อไม่ได้กำลังบันทึก)
- ล็อก scroll หน้าเว็บด้านหลังขณะเปิด Dialog

## Dialog อื่นที่ตรวจและปรับ
- Create Task
- Task Detail / Checklist execution
- PM Plan create
- Checklist view / edit / create
- Technician editor
- Team member editor
- Mobile More menu

ทุก Dialog หลักเปลี่ยนจากความสูง `vh` เป็น dynamic viewport `dvh` และกำหนดส่วน scroll ภายในเพื่อรองรับจอเตี้ย, Browser Zoom และมือถือ

## หมายเหตุ
- ไม่เปลี่ยนข้อมูล Supabase ใน hotfix นี้
- Manual Duty Mode, MPR, รายชื่อช่าง 20 คน และ LINE Cron ใช้ค่าจาก backend ปัจจุบันต่อเนื่อง
