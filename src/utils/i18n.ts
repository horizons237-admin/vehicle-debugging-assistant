import * as vscode from 'vscode';
import dicts from './i18n.dicts.json';

type Dict = Record<string, string>;

const en = (dicts as { en: Dict; fr: Dict }).en;
const fr = (dicts as { en: Dict; fr: Dict }).fr;

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

/** Keys available for tests / tooling */
export function getDictKeys(): string[] {
  return Object.keys(en).sort();
}
