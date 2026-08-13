---
name: supabase-master-architect
description: Architecture avancée de bases de données Supabase / PostgreSQL, règles de sécurité Row Level Security (RLS) étanches, optimisation de performances, indexation et fonctions Edge/Database Triggers.
---

# Supabase Master Architect & RLS Policy Protocol

## Executive Summary & Mission
Ce SKILL régit la conception du schéma de données, l'implémentation de la sécurité Row Level Security (RLS), l'optimisation des performances SQL, les triggers automatisés et les fonctions Edge sur Supabase PostgreSQL. L'agent doit appliquer ce protocole lors de toute création de table, écriture de requêtes ou configuration de sécurité.

---

## 1. Principes Fondamentaux de Sécurité RLS (Zero Trust)

### A. Règle D'Or d'Activation
1. **RLS Obligatoire :** Toute table créée doit OBLIGATOIREMENT être sécurisée dès sa création :
   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   ```

2. **Deny by Default :** Par défaut, une fois RLS activé sans politique explicitée, aucun accès (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) n'est accordé à quiconque (`anon` ou `authenticated`).
3. **Séparation des Intentions :** Ne JAMAIS regrouper les droits avec `FOR ALL`. Définir des politiques granulaires et séparées pour `FOR SELECT`, `FOR INSERT`, `FOR UPDATE` et `FOR DELETE`.

---

## 2. Patterns Recommandés pour les Politiques RLS

### A. Pattern 1 : Données Personnelles Utilisateur (Single Tenant / User-owned)

```sql
-- Lecture : Un utilisateur ne peut lire que ses propres données
CREATE POLICY "Users can read own data"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Insertion : L'utilisateur ne peut insérer qu'avec son propre ID
CREATE POLICY "Users can insert own data"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### B. Pattern 2 : Multi-Tenant / Organisation / Équipe

Pour éviter les requêtes lentes lors de la vérification de l'appartenance à un groupe ou une équipe, utiliser une fonction `SECURITY DEFINER` dédiée et indexée.

```sql
-- Fonction optimisée pour vérifier l'appartenance à une organisation
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
SELECT EXISTS (
     SELECT 1 
     FROM organization_members 
     WHERE user_id = _user_id AND organization_id = _org_id
   );
$$;

-- Politique RLS utilisant la fonction
CREATE POLICY "Org members can view org projects"
ON projects FOR SELECT
TO authenticated
USING (is_org_member(auth.uid(), organization_id));
```

### C. Pattern 3 : Accès Public en Lecture Seule

```sql
CREATE POLICY "Public read access for published posts"
ON posts FOR SELECT
TO anon, authenticated
USING (status = 'published');
```

---

## 3. Automatisation & Triggers Indispensables

### A. Synchronisation Automatique de `auth.users` vers `public.profiles`

Toute création d'utilisateur via Supabase Auth doit automatiquement alimenter la table publique `profiles` :

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
   INSERT INTO public.profiles (id, full_name, avatar_url, updated_at)
   VALUES (
     new.id,
     new.raw_user_meta_data->>'full_name',
     new.raw_user_meta_data->>'avatar_url',
     now()
   );
   RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### B. Mise à Jour Automatique du Champ `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.my_table
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```

---

## 4. Performance & Indexation PostgreSQL

1. **Indexation des Clefs Étrangères & Colonnes RLS :**
* Toutes les colonnes référencées dans les règles RLS (`user_id`, `organization_id`, `tenant_id`) **DOIVENT** posséder un index B-Tree pour éviter les Sequential Scans systématiques.

```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_org_id ON projects(organization_id);
```

2. **Utilisation des UUIDs :**
* Utiliser `gen_random_uuid()` comme valeur par défaut pour les clés primaires ID.

3. **Optimisation des Jointures RLS :**
* Éviter d'interroger directement d'autres tables avec RLS dans une clause `USING` sans passer par des fonctions `STABLE` / `SECURITY DEFINER`.

---

## 5. Checklist d'Audit Supabase Avant Production

L'agent doit obligatoirement vérifier les points suivants :

* [ ] RLS est-il explicitement activé (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) sur TOUTES les tables du schéma `public` ?
* [ ] La clef `service_role` (Service Key) est-elle STRICTEMENT réservée aux environnements Backend/Edge Functions sécurisés et JAMAIS exposée côté Frontend ?
* [ ] Les fonctions `SECURITY DEFINER` ont-elles une définition explicite du `search_path` (`SET search_path = public`) pour prévenir les attaques par injection de schéma ?
* [ ] Des index existent-ils sur toutes les colonnes testées dans la clause `USING` ou `WITH CHECK` des politiques RLS ?
* [ ] Les données sensibles (tokens, identifiants de paiement) sont-elles isolées dans des tables spécifiques avec politiques restreintes ?

---

## 6. Modèle de Script DDL Recommandé (Output Standard)

Lorsque l'agent génère un schéma de données pour Supabase, il doit suivre ce format standardisé :

```sql
-- 1. Déclaration de la table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Activation RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. Index de performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);

-- 4. Politiques RLS granulaires
CREATE POLICY "Users can select own tasks" 
ON public.tasks FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" 
ON public.tasks FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" 
ON public.tasks FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" 
ON public.tasks FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 5. Trigger updated_at
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```
