# Connexions externes

## Types supportés

| ID | Service |
|----|---------|
| `jira-vwif` | Jira instance VWIF |
| `jira-devstack` | Jira DevStack |
| `confluence-vwif` | Confluence VWIF |
| `confluence-devstack` | Confluence DevStack |
| `codebeamer` | CodeBeamer |
| `llm-local` | LLM local (Ollama, LM Studio, …) |
| `llm-remote` | LLM distant (OpenAI, Azure, Anthropic, custom) |

## Configuration

1. Commande **Configure Connections…**
2. Renseigner URLs, emails, project keys / space keys dans les settings
3. **Set Connection Token / Password** → stockage via **VS Code Secret Storage** (jamais en clair dans `settings.json`)

## LLM

| Mode | Exemple d’URL | Style API |
|------|---------------|-----------|
| Local | `http://localhost:11434` | `ollama` ou `openai-compat` |
| Remote | `https://api.openai.com/v1` | OpenAI / Azure / Anthropic / custom |

Activer explicitement `vehicleDebug.llm.local.enabled` ou `vehicleDebug.llm.remote.enabled`.

## ALM

- **Jira** : création d’issue à partir d’une erreur ou d’un DTC  
- **CodeBeamer** : ticket lié au projet configuré  
- **Confluence** : page de rapport (storage format ou wiki markup selon instance)

## Sécurité des données

Les analyses LLM **remote** peuvent envoyer des extraits de logs / DTC hors machine.  
À réserver aux environnements où la politique de données l’autorise ; préférer un LLM **local** pour données sensibles.
