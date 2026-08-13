-- ====================================================================
-- STAGELINK: SCRIPT DE RÉINITIALISATION COMPLÈTE (RESET TOUTES LES DONNÉES)
-- ====================================================================
-- ATTENTION: Ce script efface définitivement toutes les données utilisateur
-- de l'application (messages, stories, posts, likes, notifications, profils).
-- Seule la structure des tables et des fonctions RLS sera conservée.

BEGIN;

-- 1. Suppression des messages et discussions
TRUNCATE TABLE public.messages RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.chat_states RESTART IDENTITY CASCADE;

-- 2. Suppression des notifications
TRUNCATE TABLE public.notifications RESTART IDENTITY CASCADE;

-- 3. Suppression des posts, commentaires et likes
TRUNCATE TABLE public.post_comments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.post_likes RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.posts RESTART IDENTITY CASCADE;

-- 4. Suppression des stories, vues et likes
TRUNCATE TABLE public.story_views RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.story_likes RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.stories RESTART IDENTITY CASCADE;

-- 5. Suppression des opportunités/matchs et abonnements
TRUNCATE TABLE public.matches RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.followers RESTART IDENTITY CASCADE;

-- 6. Suppression des profils utilisateurs publics
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;

-- Optionnel: Si vous souhaitez également réinitialiser les comptes d'authentification Supabase (auth.users)
-- Décommentez la ligne ci-dessous si vous souhaitez effacer les comptes utilisateurs créés dans Supabase Auth:
-- DELETE FROM auth.users;

COMMIT;

-- Résultat: Base de données réinitialisée à 100% avec succès.
