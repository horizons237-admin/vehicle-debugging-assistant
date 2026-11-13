# Développement

## Stack

- **TypeScript** (strict) → `out/`
- **Python 3** backends diagnostiques
- **VS Code Extension API** (^1.85)
- Packaging : `@vscode/vsce`

## Scripts npm

| Script | Action |
|--------|--------|
| `npm run compile` | `tsc -p ./` |
| `npm run watch` | Compilation continue |
| `npm run package` | Génération du `.vsix` |

## Arborescence source

```text
src/
  extension.ts
  commands/          # Une commande ≈ un fichier
  providers/         # TreeDataProviders
  connections/       # ALM + LLM
  utils/             # config, pythonRunner, sessionStore
  webviews/          # Rapport HTML
  python/            # Backends (packagés avec l’extension)
resources/           # sample_trace.log, sample_diagnostic.arxml, sample_cicd_report.json
```

## Contrat de contribution (rappel)

1. Ne pas committer de secrets.
2. Préférer des types stricts aux `any` sur le nouveau code.
3. Tout nouvel appel Python doit rester compatible timeout + JSON dernière ligne.
4. Documenter les commandes dans `package.json` **et** `extension.ts`.

## Tests manuels minimaux

1. Connect (simulation) → Read DTCs  
2. Analyze sample log → findings dans Errors  
3. Analyze sample ARXML  
4. Import sample CI JSON  
5. Rapport HTML s’affiche sans script injecté (échappement)

## Licence

MIT — voir [LICENSE](../LICENSE).
