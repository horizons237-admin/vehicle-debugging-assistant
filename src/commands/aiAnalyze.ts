import * as vscode from 'vscode';
import { LlmClient, ANALYSIS_SYSTEM_PROMPT } from '../connections/llmClient';
import { ConnectionManager } from '../connections/connectionManager';
import { AnalyzedError } from '../providers/errorTreeProvider';
import { DtcItem } from '../providers/dtcTreeProvider';
import { setLastAiSummary } from '../utils/sessionStore';

export async function aiAnalyzeError(
  manager: ConnectionManager,
  error: AnalyzedError
): Promise<void> {
  const client = new LlmClient(manager);
  const userPrompt = buildErrorPrompt(error);
  await runAnalysis(client, userPrompt, `AI Analysis – ${error.category}`);
}

export async function aiAnalyzeDtc(
  manager: ConnectionManager,
  dtc: DtcItem
): Promise<void> {
  const client = new LlmClient(manager);
  const userPrompt = `Analyse ce Diagnostic Trouble Code (DTC) :

Code: ${dtc.code}
Statut: ${dtc.status}
Description: ${dtc.description}
Sévérité: ${dtc.severity}
Freeze frame: ${dtc.freezeFrame || 'N/A'}

Contexte: développement ECU AUTOSAR, diagnostics UDS/OBD, projet safety-critical.`;
  await runAnalysis(client, userPrompt, `AI Analysis – DTC ${dtc.code}`);
}

export async function aiAnalyzeSelection(manager: ConnectionManager): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  let text = '';
  if (editor && !editor.selection.isEmpty) {
    text = editor.document.getText(editor.selection);
  } else {
    text =
      (await vscode.window.showInputBox({
        prompt: 'Coller le log / message d’erreur à analyser',
        placeHolder: 'NRC, stack trace, extrait de log CAN…',
        ignoreFocusOut: true
      })) || '';
  }
  if (!text.trim()) {
    vscode.window.showWarningMessage('Aucun texte à analyser');
    return;
  }

  const client = new LlmClient(manager);
  const userPrompt = `Analyse cet extrait de log / erreur automobile :

\`\`\`
${text.slice(0, 6000)}
\`\`\`

Contexte: AUTOSAR, UDS, OBD-II, ISO 26262.`;
  await runAnalysis(client, userPrompt, 'AI Analysis – Log / Selection');
}

export async function aiAnalyzeAllErrors(
  manager: ConnectionManager,
  errors: AnalyzedError[],
  dtcs: DtcItem[]
): Promise<void> {
  if (errors.length === 0 && dtcs.length === 0) {
    vscode.window.showWarningMessage('Aucune erreur ni DTC à analyser');
    return;
  }

  const client = new LlmClient(manager);
  const errBlock = errors
    .slice(0, 20)
    .map(
      (e, i) =>
        `${i + 1}. [${e.severity}/${e.category}] ASIL=${e.asilImpact || 'N/A'} – ${e.description}`
    )
    .join('\n');
  const dtcBlock = dtcs
    .slice(0, 15)
    .map((d) => `- ${d.code} (${d.status}, ${d.severity}): ${d.description}`)
    .join('\n');

  const userPrompt = `Analyse l’ensemble de ces résultats de diagnostic véhicule.

## Erreurs classifiées
${errBlock || '(aucune)'}

## DTCs
${dtcBlock || '(aucun)'}

Fournis:
- Vue d’ensemble des risques
- Corrélations possibles entre erreurs/DTC
- Priorisation des actions
- Points de vigilance ISO 26262 / AUTOSAR`;

  await runAnalysis(client, userPrompt, 'AI Analysis – Full Report');
}

async function runAnalysis(client: LlmClient, userPrompt: string, title: string): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Analyse IA en cours…',
      cancellable: false
    },
    async () => {
      const result = await client.analyze(ANALYSIS_SYSTEM_PROMPT, userPrompt);
      if (!result.ok) {
        vscode.window.showErrorMessage(`Analyse IA échouée: ${result.error}`);
        return;
      }

      const channel = vscode.window.createOutputChannel('Vehicle Debug AI');
      channel.clear();
      channel.appendLine(`=== ${title} ===`);
      channel.appendLine(`Provider: ${result.provider || '?'} | Model: ${result.model || '?'}`);
      channel.appendLine(`Date: ${new Date().toLocaleString()}`);
      channel.appendLine('');
      channel.appendLine(result.text || '(réponse vide)');
      channel.show(true);
      setLastAiSummary(result.text);

      const doc = await vscode.workspace.openTextDocument({
        content: `# ${title}\n\n_Provider: ${result.provider} · Model: ${result.model}_\n\n${result.text}`,
        language: 'markdown'
      });
      await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
    }
  );
}

function buildErrorPrompt(error: AnalyzedError): string {
  return `Analyse cette erreur de diagnostic / développement automobile :

Catégorie: ${error.category}
Sévérité: ${error.severity}
Impact ASIL estimé: ${error.asilImpact || 'N/A'}
Source: ${error.source}
Description: ${error.description}
Recommandation actuelle: ${error.recommendation || 'N/A'}
Evidence: ${JSON.stringify(error.evidence || {}, null, 2)}
Timestamp: ${error.timestamp}

Contexte projet: AUTOSAR, UDS/OBD, pipeline CI/CD, safety-critical ISO 26262.`;
}
