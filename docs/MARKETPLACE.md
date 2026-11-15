# VS Code Marketplace publishing

1. Create publisher on marketplace.visualstudio.com/manage
2. `npx @vscode/vsce login <publisher>`
3. `npm run compile && npx vsce package`
4. `npx vsce publish`

State clearly: analysis aid only, not ASIL qualification.
