# Safety & ISO 26262

## Positionnement de l’outil

Vehicle Debugging Assistant est un **outil d’aide à l’analyse**, pas un moyen de confirmation de sécurité ni un outil automatiquement *qualifié* au sens ISO 26262.

| Usage autorisé (esprit du projet) | Usage non revendiqué |
|-----------------------------------|----------------------|
| Comprendre DTC, logs, ARXML | Valider un ASIL sans revue humaine |
| Préparer des tickets ALM traçables | Écrire en flash ECU de façon non contrôlée |
| Estimer un impact ASIL *indicatif* | Remplacer une analyse HAZOP / FMEA formelle |

## Classification ASIL

- Heuristique basée sur codes DTC, patterns de log (WdgM, timeout, etc.)
- Champ exposé à titre **indicatif** uniquement
- Toute décision process doit être validée par les experts safety du projet

## Mode simulation

Le mode simulation est **explicite** dans les réponses backend (`"mode": "simulation"`).  
Ne pas confondre données de démo et résultats obtenus sur véhicule / banc réel.

## Timeout & disponibilité

Les appels Python sont bornés (`pythonTimeoutMs`) pour éviter les blocages indéfinis du poste d’ingénierie — point de robustesse utile en environnement labo.

## Recommandations process

1. Consigner version de l’extension + mode (simu/réel) dans les tickets.
2. Joindre extraits de log / freeze frames comme evidence.
3. Ne pas activer LLM remote sur données classifiées sans accord compliance.
4. Pour un usage process formel : engager une **qualification d’outil** (TCL) hors scope de ce dépôt seul.
