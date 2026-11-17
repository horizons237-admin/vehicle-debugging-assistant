import * as vscode from 'vscode';

type Dict = Record<string, string>;

const en: Dict = {
  'cmd.connect': 'Connect to ECU',
  'cmd.obd': 'OBD-II tools',
  'health.empty': 'No findings yet — run diagnostics or import a CI report',
  'safety.disclaimer': 'Analysis aid only — not an ASIL confirmation tool',
  'audit.opened': 'Audit log opened',
  'dbc.loaded': 'DBC symbols loaded',
  'ci.watching': 'Watching folder for CI reports',
  'dashboard.title': 'Vehicle Debug Dashboard'
};

const fr: Dict = {
  'cmd.connect': 'Connecter à l\'ECU',
  'cmd.obd': 'Outils OBD-II',
  'health.empty': 'Aucun finding — lancez un diagnostic ou importez un rapport CI',
  'safety.disclaimer': 'Aide à l\'analyse uniquement — pas un outil de confirmation ASIL',
  'audit.opened': 'Journal d\'audit ouvert',
  'dbc.loaded': 'Symboles DBC chargés',
  'ci.watching': 'Surveillance du dossier des rapports CI',
  'dashboard.title': 'Tableau de bord Vehicle Debug'
};

export function t(key: string): string {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  const lang = (cfg.get<string>('locale') || vscode.env.language || 'en').toLowerCase();
  const dict = lang.startsWith('fr') ? fr : en;
  return dict[key] || en[key] || key;
}

export function currentLocale(): 'fr' | 'en' {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  const lang = (cfg.get<string>('locale') || vscode.env.language || 'en').toLowerCase();
  return lang.startsWith('fr') ? 'fr' : 'en';
}
