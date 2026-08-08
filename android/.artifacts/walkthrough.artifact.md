# Walkthrough - Phase 2 : Qualité & Performance StageLink Android

Cette phase a permis de renforcer la qualité du projet et d'optimiser l'expérience utilisateur.

## 1. Icônes Thématiques (Android 13+)
L'application supporte désormais les icônes thématiques qui s'adaptent à la palette de couleurs choisie par l'utilisateur sur son écran d'accueil.
- **Modification** : Ajout de la balise `<monochrome>` dans les icônes adaptatives.

## 2. Infrastructure de Performance (Baseline Profiles)
Préparation de l'application pour des démarrages ultra-rapides.
- **Action** : Ajout de la bibliothèque `androidx.profileinstaller`. Cela permet au système de pré-compiler les parties critiques de l'application (comme la WebView) dès l'installation.

## 3. Contrôle Qualité (Lint)
Mise en place d'une analyse statique du code (Lint) avec un fichier de référence (baseline).
- **Résultat** : Les futures erreurs potentielles (accessibilité, performance) seront détectées automatiquement lors de la compilation.
- **Configuration** : Fichier `app/lint-baseline.xml` généré.

## 4. Automatisation de la Release (Signing)
Préparation du build de production pour une signature automatisée.
- **Action** : Ajout du bloc `signingConfigs` utilisant des variables d'environnement pour la sécurité des secrets.
- **Avantage** : Permet de générer des APK/App Bundles signés prêts pour le Play Store en une seule commande.

---

> [!TIP]
> Pour générer un build de production signé, assurez-vous de définir les variables d'environnement suivantes dans votre terminal ou CI :
> - `RELEASE_STORE_PASSWORD`
> - `RELEASE_KEY_ALIAS`
> - `RELEASE_KEY_PASSWORD`

> [!NOTE]
> Les Phase 2 et 3 sont maintenant terminées. L'application est sécurisée, moderne, performante et possède son identité visuelle officielle.

## 5. Identité Visuelle (Logo StageLink)
Le projet est prêt à accueillir le nouveau logo officiel.
- **Harmonisation** : La couleur primaire et l'arrière-plan de l'icône ont été mis à jour avec le bleu officiel `#1B85E7`.
- **Adaptive Icon** : La structure XML est prête à utiliser le nouveau logo avec un support pour les icônes thématiques.
- **Splash Screen** : Configuration mise à jour pour centrer le nouveau logo.
