# Guide d'Intégration Supabase & Architecture Flutter StageLink

Ce document récapitule la configuration complète de la base de données PostgreSQL Supabase, des Storage Buckets et de la couche réseau Temps Réel pour StageLink.

---

## ÉTAPE 1 : Script d'Initialisation SQL (`supabase_schema.sql`)

Le script SQL a été synchronisé à la racine du projet dans [`supabase_schema.sql`](file:///d:/PC%20Toshiba/JABE%20PRODUCTION/StageLink/supabase_schema.sql).

### Tables Créées & Configurées :
1. **`public.profiles`** : Identités des artistes, bio, badges (`gold`, `blue`, `none`), instruments, compétences et genres musicaux.
2. **`public.posts`** : Publications du fil d'actualité, visuels, extraits audio et compteurs de j'aime.
3. **`public.stories`** : Stories éphémères expirant automatiquement au bout de 24 heures (`expires_at = NOW() + INTERVAL '24 hours'`).
4. **`public.matches`** : Correspondances et candidatures de co-création avec score d'affinité.
5. **`public.messages`** : Messagerie privée et messages éphémères avec TTL en secondes.

### Publications Temps Réel :
- `messages` et `matches` sont ajoutés à la publication `supabase_realtime` pour la synchronisation instantanée sans rechargement.

---

## ÉTAPE 2 : Configuration des Buckets de Stockage (Supabase Storage)

Créez les 4 buckets ci-dessous dans votre console Supabase (**Storage > New Bucket**) :

| Bucket Name | Visibilité | Usage |
| :--- | :--- | :--- |
| `avatars` | **Public** | Photos de profil et avatars des artistes |
| `posts_media` | **Public** | Images et fichiers audio publiés dans le Fil d'actualité |
| `stories_media` | **Public** | Photos et vidéos courtes des Stories éphémères |
| `chat_attachments` | **Privé** | Photos, documents et notes vocales partagés en tchat privé |

---

## ÉTAPE 3 : Variables d'Environnement (`.env`)

Le fichier [`.env`](file:///d:/PC%20Toshiba/JABE%20PRODUCTION/StageLink/.env) a été mis à jour à la racine :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-cle-anon-publique
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

---

## ÉTAPE 4 : Couche de Connexion Flutter / Dart & Riverpod

Pour l'implémentation dans l'application mobile Flutter :

1. **Inclusion des dépendances (`pubspec.yaml`)** :
   - `supabase_flutter: ^2.8.0`
   - `flutter_riverpod: ^2.5.1`
   - `freezed_annotation: ^2.4.1`
   - `json_annotation: ^4.9.0`
   - `flutter_dotenv: ^5.1.0`

2. **Modèles Dart Typés (`@freezed`)** :
   - `UserProfileModel`
   - `PostModel`
   - `StoryModel`
   - `MessageModel`
   - `MatchModel`

3. **Écoute Temps Réel des Messages (`MessagingRepository`)** :
   ```dart
   final messagesStream = supabase
       .from('messages')
       .stream(primaryKey: ['id'])
       .eq('receiver_id', currentUserId)
       .order('created_at');
   ```
