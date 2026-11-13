import * as vscode from 'vscode';
import {
  CONNECTION_DEFS,
  ConnectionDef,
  ConnectionKind,
  ConnectionState,
  ConnectionStatus
} from './types';

export class ConnectionManager {
  private states = new Map<ConnectionKind, ConnectionState>();

  constructor(private context: vscode.ExtensionContext) {
    for (const d of CONNECTION_DEFS) {
      this.states.set(d.id, { id: d.id, status: 'unknown' });
    }
  }

  getDefs(): ConnectionDef[] {
    return CONNECTION_DEFS;
  }

  getState(id: ConnectionKind): ConnectionState {
    return this.states.get(id) || { id, status: 'unknown' };
  }

  getAllStates(): ConnectionState[] {
    return CONNECTION_DEFS.map((d) => this.getState(d.id));
  }

  getSetting(key: string): string {
    return vscode.workspace.getConfiguration().get<string>(key, '') || '';
  }

  isConfigured(def: ConnectionDef): boolean {
    return def.settingsKeys.every((k) => {
      const v = this.getSetting(k);
      if (k.includes('enabled')) return true;
      return !!v;
    });
  }

  async getSecret(def: ConnectionDef): Promise<string | undefined> {
    return this.context.secrets.get(def.secretKey);
  }

  async setSecret(def: ConnectionDef, value: string): Promise<void> {
    if (!value) {
      await this.context.secrets.delete(def.secretKey);
    } else {
      await this.context.secrets.store(def.secretKey, value);
    }
  }

  async hasSecret(def: ConnectionDef): Promise<boolean> {
    const v = await this.getSecret(def);
    return !!v;
  }

  async test(id: ConnectionKind): Promise<ConnectionState> {
    const def = CONNECTION_DEFS.find((d) => d.id === id)!;
    const state = await this.probe(def);
    this.states.set(id, state);
    return state;
  }

  private async probe(def: ConnectionDef): Promise<ConnectionState> {
    const now = new Date().toISOString();

    if (def.id === 'llm-local') {
      const base = this.getSetting('vehicleDebug.llm.local.baseUrl').replace(/\/$/, '');
      const style = this.getSetting('vehicleDebug.llm.local.apiStyle') || 'ollama';
      if (!base) {
        return { id: def.id, status: 'disabled', message: 'baseUrl manquant', lastChecked: now };
      }
      try {
        const url = style === 'ollama' ? `${base}/api/tags` : `${base}/models`;
        const r = await this.httpCheck(url);
        return {
          id: def.id,
          status: r.ok ? 'ok' : 'error',
          message: r.message,
          lastChecked: now
        };
      } catch (e: any) {
        return { id: def.id, status: 'error', message: e?.message || String(e), lastChecked: now };
      }
    }

    if (def.id === 'llm-remote') {
      const base = this.getSetting('vehicleDebug.llm.remote.baseUrl').replace(/\/$/, '');
      if (!base) {
        return { id: def.id, status: 'disabled', message: 'baseUrl manquant', lastChecked: now };
      }
      const secret = await this.getSecret(def);
      if (!secret) {
        return {
          id: def.id,
          status: 'configured',
          message: 'URL ok, token manquant',
          lastChecked: now
        };
      }
      return { id: def.id, status: 'configured', message: 'URL + token présents', lastChecked: now };
    }

    // Jira / Confluence / CodeBeamer – basic reachability
    let baseKey = '';
    if (def.id.startsWith('jira')) {
      baseKey = def.id === 'jira-vwif' ? 'vehicleDebug.jira.vwif.baseUrl' : 'vehicleDebug.jira.devstack.baseUrl';
    } else if (def.id.startsWith('confluence')) {
      baseKey =
        def.id === 'confluence-vwif'
          ? 'vehicleDebug.confluence.vwif.baseUrl'
          : 'vehicleDebug.confluence.devstack.baseUrl';
    } else if (def.id === 'codebeamer') {
      baseKey = 'vehicleDebug.codebeamer.baseUrl';
    }

    const base = this.getSetting(baseKey).replace(/\/$/, '');
    if (!base) {
      return { id: def.id, status: 'disabled', message: 'baseUrl manquant', lastChecked: now };
    }

    const secret = await this.getSecret(def);
    try {
      const r = await this.httpCheck(base);
      if (!r.ok) {
        return { id: def.id, status: 'error', message: r.message, lastChecked: now };
      }
      return {
        id: def.id,
        status: secret ? 'ok' : 'configured',
        message: secret ? 'URL joignable + secret présent' : 'URL joignable, secret manquant',
        lastChecked: now
      };
    } catch (e: any) {
      return { id: def.id, status: 'error', message: e?.message || String(e), lastChecked: now };
    }
  }

  private async httpCheck(url: string): Promise<{ ok: boolean; message: string }> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(t);
      if (res.ok || res.status === 401 || res.status === 403) {
        return { ok: true, message: `HTTP ${res.status}` };
      }
      return { ok: false, message: `HTTP ${res.status}` };
    } catch (e: any) {
      clearTimeout(t);
      return { ok: false, message: e?.message || String(e) };
    }
  }

  refreshConfiguredFlags(): void {
    for (const d of CONNECTION_DEFS) {
      const st = this.getState(d.id);
      if (st.status === 'unknown' || st.status === 'disabled') {
        const configured = this.isConfigured(d);
        this.states.set(d.id, {
          ...st,
          status: configured ? 'configured' : 'disabled'
        });
      }
    }
  }
}
