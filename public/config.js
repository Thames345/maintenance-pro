/*
  ตั้งค่าการเชื่อมต่อ Supabase ที่ไฟล์นี้เท่านั้น
  คำเตือน: ห้ามนำ service_role key มาใส่ในเว็บ
*/
window.APP_CONFIG = Object.freeze({
  appName: "Maintenance Pro",
  environment: "production",
  supabaseUrl: "https://fyntvktkourwvgtnylcc.supabase.co",
  supabasePublishableKey: "sb_publishable_x-27iNQ-jrcE3NhsKXVzng_7YgMMMQZ",
  employeeLoginFunction: "mt-employee-code-login",
  lineDispatchFunction: "mt-line-dispatch",
  lineWebhookUrl: "https://fyntvktkourwvgtnylcc.supabase.co/functions/v1/mt-line-webhook",
  lineGroupName: "MVR–MSR Maintenance",
  publicAppUrl: new URL("./", window.location.href).toString()
});
