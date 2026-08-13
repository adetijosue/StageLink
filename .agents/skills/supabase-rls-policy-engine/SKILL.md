---
name: supabase-rls-policy-engine
description: Expert en conception et audit de politiques RLS (Row Level Security) sur Supabase PostgreSQL. À utiliser lors de la création de tables, de modifications de schémas ou d'audits de sécurité de la base de données.
---

# Supabase Row Level Security (RLS) Protocol

## Consignes Générales
1. Toute nouvelle table PostgreSQL DOIT avoir RLS activé immédiatement :
   `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Ne JAMAIS laisser de table sans politique d'accès explicite.
3. Séparer système les politiques pour `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

## Arbre de Décision
- **Données publiques en lecture seule** : Autoriser `SELECT` pour `anon` et `authenticated`.
- **Données propres à l'utilisateur** : Vérifier `auth.uid() = user_id`.
- **Multi-tenant / Équipes** : Vérifier l'appartenance de l'utilisateur à l'organisation via une fonction Security Definer optimisée.

## Checklist de Vérification
- [ ] RLS est-il activé (`ENABLE ROW LEVEL SECURITY`) ?
- [ ] Les requêtes de politique évitent-elles les récursions infinies ?
- [ ] Les colonnes clés utilisées dans les politiques sont-elles indexées ?
