# Maintenance Pro React

เว็บจัดการงานซ่อมบำรุงสำหรับ MVR, MSR และ MVR-LOTUS โดยยึดโครงหน้า React Bento จากต้นฉบับ `maintenance.zip` ปรับเป็นธีมสว่าง อ่านง่ายบนโทรศัพท์ และเชื่อมฟังก์ชันกับ Supabase/LINE ระบบเดิม

## ดีไซน์เวอร์ชัน 2.5.4

- Desktop Navigation แบบบนชุดเดียว มี Checklist และ LINE ให้เข้าถึงตรงจากแถบด้านบน ไม่บีบหรือดันเนื้อหาออกนอกจอ
- หน้า Login, งานซ่อม, PM Plan/Calendar, เวร 5S, Checklist, รายงาน, LINE และ Settings ใช้ Design System เดียวกัน
- Responsive ตั้งแต่หน้าจอ 320px พร้อม Bottom Navigation 5 ปุ่มและเมนูเพิ่มเติมแบบ Bottom Sheet
- ธีมสว่างพื้นหลังฟ้าอ่อน การ์ดสีขาว และสีม่วง/เขียวสำหรับปุ่มสำคัญ
- ชุดไอคอน Streamline Ultimate Colors แบบ PNG โปร่งใสครบทั้งเมนู ปุ่ม สถานะ และหน้า Login
- โหลดไอคอนรายไฟล์โดยตรง ไม่ใช้ Sprite จึงแสดงผลคมชัดและไม่ตัดผิดตำแหน่งบนมือถือ
- ปุ่ม สถานะ ตัวกรอง และข้อความ Empty State แยกสีตามความหมาย
- ตัวเลือกช่างแบบค้นหาและแตะการ์ด รองรับเลือกคนเดียว/หลายคน เห็นรายการที่เลือกทันที
- ตัวเลือกทีมแบบการ์ด แยกตามแผนก ไม่ต้องใช้กล่องรายชื่อหรือกด Ctrl/Cmd

## ฟังก์ชันที่เชื่อมแล้ว

- Login ด้วยรหัสพนักงาน และ Login ผู้ดูแลด้วยชื่อผู้ใช้/รหัสผ่าน
- อ่านสิทธิ์ Admin / Supervisor / Technician และใช้ RLS เดิม
- Dashboard จากข้อมูลจริง
- สร้างงานรายบุคคล หลายคน หรือเป็นทีม
- เริ่มงาน กรอก Checklist บันทึกร่าง ส่งตรวจ อนุมัติ และส่งกลับแก้ไข
- ตรวจค่าตัวเลขเทียบ Min/Max และบันทึกรายการผิดปกติ
- แนบรูป JPG/PNG/WebP หรือ PDF ไปยัง Supabase Storage
- สร้างแผน PM และสร้างใบงาน PM ตามรอบ
- ดูปฏิทิน PM
- สร้างเวรด้วยตนเองเท่านั้นทุกแผนก (MVR / MSR / MVR-LOTUS / MPR)
- LINE ยังส่งแจ้งเตือนจากคิวอัตโนมัติ แม้งานเวรจะเป็น Manual Mode
- สร้าง/ดู/แก้ไขแม่แบบ Checklist, เพิ่ม-ลบหัวข้อตรวจ และลบแม่แบบที่ยังไม่ถูกใช้งาน
- ตั้งเวลาแจ้งเตือน LINE และทดสอบ/ประมวลผลคิว
- ตั้งเวลากะและสมาชิกทีม (สมาชิกเท่ากัน ไม่มีหัวหน้าทีม)
- เลือกผู้ร่วมงานด้วยช่องค้นหาและการ์ดแตะเลือก ไม่ต้องกด Ctrl/Cmd
- จัดสมาชิกทีม A/B/O แยกถูกต้องตามแผนกและกลุ่ม พร้อมหน้าต่างจัดทีมที่ใช้บนโทรศัพท์ได้
- Admin เพิ่มและแก้ไขช่างได้เอง: รหัสพนักงาน ชื่อ แผนก ทีม A/B/O ตำแหน่ง สถานะ และรูปประจำตัว
- เปลี่ยนแผนกหรือกลุ่ม A/B/O แล้วระบบย้ายสมาชิกทีมให้ตรงกันอัตโนมัติ
- ปิดใช้งานช่างได้โดยไม่ทำให้ประวัติงานย้อนหลังหาย
- ลบถาวรได้เฉพาะช่างที่ยังไม่มีใบงาน แผน PM หรือบัญชี Login
- กรองรายงานและส่งออก CSV, Excel, PDF/พิมพ์
- เปิดใบงานจาก LINE ด้วย `?workOrder=<UUID>`
- Responsive สำหรับโทรศัพท์ แท็บเล็ต และคอมพิวเตอร์
- Checklist แบบอ่านอย่างเดียวใช้พื้นสว่างและตัวอักษรชัดเจน
- Session Refresh แบบ single-flight, timeout และ retry เฉพาะคำขออ่านข้อมูลที่ปลอดภัย
- บันทึก Checklist แบบชุดเดียวและเก็บประวัติสมาชิกทีมเมื่อแก้การจัดทีม
- พร้อม Deploy บน GitHub Pages

## เริ่มใช้งานในเครื่อง

ต้องใช้ Node.js 22.13 ขึ้นไป

```bash
npm install
npm run dev
```

ถ้า Windows PowerShell แจ้งว่า `npm.ps1 cannot be loaded` ให้ใช้:

```powershell
npm.cmd install
npm.cmd run dev
```

เปิด `http://localhost:3000`

## ตั้งค่า Supabase

แก้เฉพาะไฟล์ `public/config.js`

```js
window.APP_CONFIG = Object.freeze({
  supabaseUrl: "https://PROJECT.supabase.co",
  supabasePublishableKey: "sb_publishable_...",
  employeeLoginFunction: "mt-employee-code-login",
  lineDispatchFunction: "mt-line-dispatch",
  lineWebhookUrl: "https://PROJECT.supabase.co/functions/v1/mt-line-webhook",
  lineGroupName: "MVR–MSR Maintenance",
  publicAppUrl: "https://ชื่อผู้ใช้.github.io/ชื่อ-repository/"
});
```

ห้ามใส่ `service_role` key ในเว็บ คีย์ Publishable/Anon เท่านั้นที่ใช้ในไฟล์นี้ได้

โปรเจกต์ MPRLine ที่เชื่อมในชุดส่งมอบนี้ติดตั้งส่วน “จัดการช่าง” และ Private Storage แล้ว หากนำซอร์สไปใช้กับ Supabase โปรเจกต์อื่น ให้ทำตาม [TECHNICIAN-SETUP.md](./TECHNICIAN-SETUP.md)

## ตรวจสอบก่อน Deploy

```bash
npm test
```

คำสั่งนี้จะตรวจ TypeScript และ Production Build ต่อเนื่องกัน

ดูขั้นตอนสร้างลิงก์เว็บที่ [DEPLOY-FROM-ZERO-TH.md](./DEPLOY-FROM-ZERO-TH.md)



## v2.5.6 – Automatic Duty Rotation + Shared MSR Checklist

- Duty Checklist ของ MVR, MSR, MVR-LOTUS และ MPR ใช้รายการมาตรฐาน 6 ข้อเดียวกันกับ `DUTY-MSR`
- เพิ่ม `mt_duty_rules` สำหรับกำหนดวัน, กะ และรูปแบบการสร้างเวรจากหน้า Settings
- MVR/MSR ใช้พื้นที่ห้องช่างเดียวกันและสลับกันทุกวัน: 27/08/2026 = MVR, 28/08/2026 = MSR
- MVR-LOTUS อยู่คนละพื้นที่ จึงสร้างเวรทุกวันทั้ง DAY/NIGHT
- MPR ใช้ Manual เป็นค่าเริ่มต้น แต่มี Checklist มาตรฐานเดียวกัน
- LINE dispatcher สร้างเวรตามกฎและส่งข้อความ LINE อัตโนมัติ พร้อมลิงก์เปิดใบงาน
- หน้า `ตั้งค่า → กำหนดเวร` แก้วัน จ.–อา., กะ DAY/NIGHT, Rotation Group, ลำดับ และวันเริ่มรอบได้
- มี Preview เวรล่วงหน้า 8 วันก่อนบันทึก


## v2.5.4 – Brand Logo + LINE Flex + Open Work Order

- ใช้โลโก้ Maintenance รูปเฟือง/ประแจ/มือที่กำหนดเป็นโลโก้หลักของหน้าเว็บ, Login, Header, Mobile Menu และหน้าเวร
- เพิ่ม Favicon และ Apple Touch Icon จากโลโก้เดียวกัน
- LINE เปลี่ยนข้อความงานเป็น Flex Message แบบการ์ด พร้อมโลโก้ ชื่องาน เลขที่งาน แผนก ผู้รับผิดชอบ กำหนดส่ง และสถานะ
- ปุ่ม `เปิดทำใบงาน` ใน LINE เปิดลิงก์ `?workOrder=<UUID>` ไปยังใบงานนั้นโดยตรง
- รองรับ LINE บนมือถือและ LINE Desktop ด้วย URI action/desktop URI
- หากยังไม่ได้ Login ระบบเก็บ Deep Link ไว้และเปิดใบงานเดิมต่อหลัง Login สำเร็จ
- หน้า LINE ในเว็บมีตัวอย่าง Flex Card และแสดง Production App URL ที่ใช้ทำ Deep Link
- โลโก้สำหรับ LINE เสิร์ฟผ่าน Supabase Edge Function `mt-brand-logo` เพื่อให้เป็น HTTPS public URL ที่เสถียร
- หมายเหตุ: v2.5.4 เคยใช้ Flex Message; Production ปัจจุบันกลับมาใช้ข้อความ LINE แบบธรรมดาพร้อมลิงก์เปิดใบงานเพื่อความเสถียร

## v2.5.3 – Viewport Safe Modal / Responsive Fix
- แก้หน้าสร้างเวรเองที่สูงเกินจอจนปุ่มปิดและปุ่มบันทึกหาย
- Modal สร้างเวรใช้ Header และ Footer แบบคงที่ โดยเลื่อนเฉพาะเนื้อหาตรงกลาง
- Desktop ขยายหน้าต่างสร้างเวรและแสดงรายชื่อช่าง 2 คอลัมน์เพื่อลดความสูง
- รองรับ Escape เพื่อปิดหน้าต่าง และล็อกการเลื่อนหน้าเว็บด้านหลังขณะ Modal เปิด
- เปลี่ยน Modal หลักทุกหน้าจาก vh เป็น dynamic viewport (dvh) เพื่อไม่ล้น Chrome/Edge/มือถือ
- ปรับ Create Task, Task Detail, PM Plan, Checklist, Technician และ Team modal ให้ scroll ภายในอย่างปลอดภัย
- Mobile More Menu จำกัดความสูงตาม viewport และ scroll ภายในได้

## v2.5.2 – Manual Duty Mode
- Technician master updated for MVR, MSR, MVR-LOTUS and MPR.
- Duty schedules are manager-created only; automatic duty generation is disabled.
- LINE queue dispatch remains automatic.
- MPR is available in task, duty, checklist and report department selectors.
