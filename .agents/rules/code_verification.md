# Vérification Stricte Avant Déploiement

**Règle absolue :** À chaque fois qu'une modification est apportée au code source de l'application (React, Node, etc.), il est formellement interdit de faire un `git push` sans avoir d'abord effectué un audit de compilation.

## Procédure Obligatoire :
1. **Audit de Code :** Lancer systématiquement la commande `cmd.exe /c "npm run build"` (ou équivalent) après chaque modification pour détecter toute erreur de syntaxe ou bug critique (ex: variable indéfinie, erreur de parsing).
2. **Correction Proactive :** Si l'audit échoue, ne pas abandonner. Analyser le message d'erreur, proposer une correction, appliquer la correction, et relancer l'audit.
3. **Déploiement Sécurisé :** Le code ne doit être commité et poussé (`git commit` + `git push`) que lorsque l'audit de compilation (build) a réussi à 100%.
