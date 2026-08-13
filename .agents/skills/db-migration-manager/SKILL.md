---
name: db-migration-manager
description: Versioning & Migration manager using Supabase CLI. Guides migration history, seed data, and schema alignment. Trigger when updating schemas or running db setup commands.
---

# SKILL: db-migration-manager

## 1. CLI Migration Workflow
* **Creating Migrations:** Always use the CLI to generate empty migrations:
  ```bash
  supabase migration new migration_name
  ```
* **Idempotency:** Ensure all migration SQL files are idempotent (use `IF NOT EXISTS` or `DROP TABLE IF EXISTS` where relevant).
* **Seeding:** Place mock test data in `supabase/seed.sql` to populate local DB instances without writing to production environments.
