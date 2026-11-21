import * as vscode from 'vscode';
import dicts from './i18n.dicts.json';

type Dict = Record<string, string>;

const en = (dicts as { en: Dict; fr: Dict }).en;
const fr = (dicts as { en: Dict; fr: Dict }).fr;

export function t(key: string, params?: Record<string, string>): string {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  const lang = (cfg.get<string>('locale') || vscode.env.language || 'en').toLowerCase();
  const dict = lang.startsWith('fr') ? fr : en;
  let s = dict[key] || en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return s;
}

export function currentLocale(): 'fr' | 'en' {
  const cfg = vscode.workspace.getConfiguration('vehicleDebug');
  const lang = (cfg.get<string>('locale') || vscode.env.language || 'en').toLowerCase();
  return lang.startsWith('fr') ? 'fr' : 'en';
}

export function getDictKeys(): string[] {
  return Object.keys(en).sort();
}
