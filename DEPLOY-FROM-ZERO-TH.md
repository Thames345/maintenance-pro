# วิธีนำ Maintenance Pro ขึ้น GitHub Pages ครั้งแรก

เวอร์ชันนี้ไม่ฝังชื่อ Repository หรือ URL เดิม

## 1. สร้าง Repository ใหม่
1. เข้า GitHub และกด New repository
2. ตั้งชื่อ เช่น `maintenance-pro`
3. เลือก Public
4. ไม่ต้องเลือก Add README / .gitignore / License
5. กด Create repository

## 2. อัปโหลด Source
แนะนำใช้ GitHub Desktop เพราะต้องอัปโหลดโฟลเดอร์ `.github` ด้วย

### GitHub Desktop
1. File > Add local repository
2. ถ้ายังไม่เป็น Git repository ให้เลือก create a repository จากโฟลเดอร์นี้
3. Publish repository ไปยัง Repository ที่สร้างไว้
4. Commit และ Push/Publish ไฟล์ทั้งหมดขึ้น branch `main`

หรือใช้ Git command ในโฟลเดอร์นี้:

```bash
git init
git add .
git commit -m "Initial Maintenance Pro deploy"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPOSITORY>.git
git push -u origin main
```

## 3. เปิด GitHub Pages
Repository > Settings > Pages > Build and deployment > Source = GitHub Actions

ไฟล์ `.github/workflows/deploy-pages.yml` จะ build และ deploy ให้อัตโนมัติทุกครั้งที่ push เข้า main

## 4. รอ GitHub Actions
ไปที่ Actions > `Deploy Maintenance Pro to GitHub Pages`
ต้องผ่าน Install > Test and build > Deploy

## 5. เปิดเว็บ
GitHub Pages จะให้ URL รูปแบบ:
`https://<USERNAME>.github.io/<REPOSITORY>/`

หลังได้ URL จริง ให้ส่ง URL นี้กลับมา เพื่ออัปเดตปุ่ม `เปิดทำใบงาน` ใน LINE ให้ชี้เว็บถูกตัว

## หมายเหตุ
- Supabase Production เดิมยังใช้ตัวเดิม ไม่ต้องสร้างใหม่
- LINE ยังแจ้งข้อความได้ แต่ deep link ถูกปิดชั่วคราวจนกว่าจะทราบ URL เว็บไซต์จริง
- `public/config.js` คำนวณ URL ของเว็บเองจาก browser จึงไม่ต้องแก้เมื่อเปลี่ยนชื่อ Repository
