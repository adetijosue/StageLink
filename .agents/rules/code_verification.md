# Vérification Avant Déploiement

**Règle mise à jour (Apprentissage Utilisateur) :**
L'audit complet automatique (ex: lancer `npm run build` ou d'autres vérifications longues) après *chaque* modification est **suspendu**. Effectuez les modifications demandées sans lancer d'audit automatique, sauf si cela est explicitement requis pour diagnostiquer un problème spécifique.

## Procédure :
1. **Audit de Code :** Ne lancer la commande `cmd.exe /c "npm run build"` que sur demande expresse de l'utilisateur ou en fin de tâche majeure (lorsque les itérations sont terminées).
2. **Correction Proactive :** Si un audit est exécuté manuellement et échoue, analyser le message d'erreur, proposer une correction, appliquer la correction, et relancer l'audit.
3. **Déploiement Sécurisé :** Le code ne doit être commité et poussé (`git commit` + `git push`) que si cela a été validé ou si la compilation a réussi.
