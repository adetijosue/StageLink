# Plan d'Intégration du Logo Officiel - StageLink

Ce plan détaille les étapes pour intégrer le nouveau logo StageLink comme icône de l'application (adaptive icon) et sur l'écran de démarrage (Splash Screen).

## User Review Required

> [!IMPORTANT]
> - Le logo fourni contient un arrière-plan intégré. Pour un rendu optimal en mode "Adaptive Icon" (Android 8+), l'icône sera centrée. Une partie des bords pourrait être rognée par le masque système (cercle, carré arrondi, etc.).
> - Je vais également mettre à jour l'écran de démarrage (Splash Screen) avec ce nouveau visuel.

## Proposed Changes

### 1. Ressources d'Icônes (Mipmaps)
Remplacer les fichiers `ic_launcher_foreground.png` par le nouveau logo dans toutes les densités (hdpi, xhdpi, xxhdpi, xxxhdpi).
- **Fichiers impactés** : `app/src/main/res/mipmap-*/ic_launcher_foreground.png`.

### 2. Arrière-plan de l'icône (Adaptive Icon)
Mettre à jour la couleur d'arrière-plan pour correspondre au bleu du logo officiel afin d'assurer une transition fluide si le logo ne couvre pas toute la zone de sécurité.
- **Fichiers impactés** : `app/src/main/res/values/colors.xml`, `app/src/main/res/drawable/ic_launcher_background.xml`.

### 3. Écran de démarrage (Splash Screen)
Remplacer le fichier `splash.png` par le nouveau logo pour assurer la cohérence visuelle dès l'ouverture.
- **Fichiers impactés** : `app/src/main/res/drawable/splash.png`.

---

## Verification Plan

### Manual Verification
- Vérifier l'affichage de l'icône sur l'écran d'accueil (différents masques si possible).
- Vérifier que le logo s'affiche correctement au lancement de l'application (Splash Screen).
