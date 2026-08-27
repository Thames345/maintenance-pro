/// <reference types="vite/client" />

interface Window {
  APP_CONFIG?: {
    appName?: string;
    environment?: string;
    supabaseUrl?: string;
    supabasePublishableKey?: string;
    employeeLoginFunction?: string;
    lineDispatchFunction?: string;
    lineWebhookUrl?: string;
    lineGroupName?: string;
    publicAppUrl?: string;
  };
}
