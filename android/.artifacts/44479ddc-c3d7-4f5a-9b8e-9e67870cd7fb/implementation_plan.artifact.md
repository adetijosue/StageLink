# Plan de Passage à une Sélection par Listes (Drop Down)

Ce plan vise à remplacer la saisie libre des instruments et des genres par une sélection parmi des listes prédéfinies, offrant ainsi une meilleure structure des données et une expérience utilisateur plus fluide.

## User Review Required

> [!IMPORTANT]
> Nous allons introduire des listes fixes pour les **instruments** et les **genres musicaux**. Si votre spécialité n'est pas dans la liste, nous ajouterons une option "Autre" ou nous pourrons enrichir la liste selon vos besoins.

> [!TIP]
> La sélection se fera via un système de "Tags cliquables" ou un menu déroulant multi-sélection dans la Bottom Sheet de modification.

## Proposed Changes

### 1. Données de Référence

#### [NEW] [musicData.js](file:///D:/PC Toshiba/JABE PRODUCTION/StageLink/src/services/musicData.js)
- Création d'un fichier contenant les listes officielles :
    - `INSTRUMENTS_LIST` : Piano, Guitare, Chanteur, Beatmaker, etc.
    - `GENRES_LIST` : Afrobeat, Gospel, Jazz, R&B, etc.

### 2. Interface de Modification

#### [MODIFY] [ProfileView.jsx](file:///D:/PC Toshiba/JABE PRODUCTION/StageLink/src/components/premium/ProfileView.jsx)
- **Remplacement des champs texte** par des sélecteurs visuels.
- **Système de Multi-sélection** : L'utilisateur pourra cocher plusieurs instruments/genres. Les éléments sélectionnés apparaîtront avec une icône de suppression ("X").
- **Design Adapté** : Utilisation de "Chips" (badges) dans le formulaire pour voir immédiatement ce qui est sélectionné.

### 3. Logique de Données

#### [MODIFY] [AuthContext.jsx](file:///D:/PC Toshiba/JABE PRODUCTION/StageLink/src/context/AuthContext.jsx)
- Adaptation mineure pour s'assurer que les données provenant des nouveaux sélecteurs sont toujours traitées comme des tableaux propres.

## Verification Plan

### Manual Verification
- Ouvrir le menu **Modifier** du profil.
- Cliquer sur un instrument pour l'ajouter à sa liste.
- Vérifier que les badges se mettent à jour sur la page de profil après enregistrement.
- Tester la suppression d'un instrument depuis le formulaire.
