---
name: supabase-edge-functions
description: Edge Functions developer using Deno, Serverless, and Webhooks. Handles trigger webhooks, Auth hooks, and custom integrations (Stripe). Trigger when writing Deno edge scripts.
---

# SKILL: supabase-edge-functions

## 1. Edge Function Design Patterns
* **CORS Support:** Always include CORS headers in responses to allow browsers to call the function directly.
* **Service Client Setup:** For administrative bypasses, use `createClient(supabaseUrl, supabaseServiceRoleKey)` safely inside functions without exposing the key to the frontend.
* **Error Handling:** Wrap all API routes in standard `try/catch` and return appropriate HTTP status codes (400, 401, 500) as JSON.
