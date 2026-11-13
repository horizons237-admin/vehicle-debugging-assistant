# Dépannage

## « Not connected »

Exécuter **Connect to ECU**.  
Si les libs CAN manquent, accepter le mode simulation proposé.

## Échec Python / script introuvable

1. Vérifier `vehicleDebug.pythonPath` (`python3 --version`).
2. S’assurer que `src/python/*.py` est présent (sources ou VSIX).
3. Regarder le message d’erreur (stderr) dans la notification VS Code.

## Timeout Python

Message du type *Python timeout after 60000 ms*.

- Augmenter `vehicleDebug.pythonTimeoutMs`
- Vérifier qu’aucun appel bus ne reste bloqué sans réponse
- Sur log très volumineux : préférer un extrait

## LLM ne répond pas

- Activer `llm.local.enabled` ou `llm.remote.enabled`
- Tester l’URL (Ollama : `curl http://localhost:11434`)
- Renseigner le secret API pour le remote
- Vérifier le modèle configuré

## 401 / 403 Jira ou Confluence

- Régénérer le token / mot de passe
- **Set Connection Token / Password** à nouveau
- Contrôler `baseUrl`, email et project/space key

## Compile TypeScript

```bash
npm ci          # ou npm install
npm run compile
```

`tsc` doit être disponible via `node_modules/.bin` après install.

## Vues vides

**Refresh Views** après une analyse.  
Vérifier qu’une analyse a bien produit des findings (log / ARXML / CI / DTC).
