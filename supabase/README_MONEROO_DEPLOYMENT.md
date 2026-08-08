# Guide de Déploiement Moneroo - StageLink

Ce guide détaille les étapes pour appliquer la migration SQL et déployer les Supabase Edge Functions avec Moneroo.

---

## 1. Migration SQL de la table `subscriptions`

Exécutez le script SQL situé dans `supabase/migrations/20260724_create_subscriptions_table.sql` directement dans le Dashboard Supabase (Editeur SQL) ou via la CLI Supabase :

```bash
supabase db push
```

---

## 2. Configuration de la clef secrète Moneroo (`MONEROO_SECRET_KEY`)

Configurez la variable d'environnement `MONEROO_SECRET_KEY` dans votre projet Supabase avec votre clé secrète Moneroo :

```bash
supabase secrets set MONEROO_SECRET_KEY=sk_live_votre_cle_secrete_moneroo
```

---

## 3. Déploiement des Edge Functions Supabase

Déployez les deux Edge Functions `create-checkout` et `moneroo-webhook` :

```bash
# Déploiement de la fonction d'initialisation du paiement
supabase functions deploy create-checkout

# Déploiement du Webhook de validation des paiements et de signature HMAC
supabase functions deploy moneroo-webhook
```

---

## 4. Configuration de l'URL Webhook dans le Dashboard Moneroo

Dans votre console d'administration Moneroo (Section Webhooks) :
- **URL du Webhook** : `https://<VOTRE_PROJECT_REF>.supabase.co/functions/v1/moneroo-webhook`
- **Événements à écouter** : `payment.success`, `payment.completed`
- **Clef de signature HMAC** : Utilisez la même clef `MONEROO_SECRET_KEY`.

---

## 5. Logique des Formules d'Abonnement

- **Mensuel** : 6.00$ / mois
- **Annuel (Premier Abonnement)** : 0$ les 2 premiers mois d'essai (Trial), puis renouvellement annuel.
