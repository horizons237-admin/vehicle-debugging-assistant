import { ConnectionManager } from './connectionManager';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResult {
  ok: boolean;
  text?: string;
  error?: string;
  provider?: string;
  model?: string;
}

/**
 * Calls configured local or remote LLM.
 * Preference: local if enabled and reachable, else remote.
 * Remote path requires vehicleDebug.llm.allowRemoteDataUpload (opt-in).
 */
export class LlmClient {
  constructor(private manager: ConnectionManager) {}

  async analyze(systemPrompt: string, userPrompt: string): Promise<LlmResult> {
    const localEnabled = this.manager.getSetting('vehicleDebug.llm.local.enabled') === 'true';
    const remoteEnabled = this.manager.getSetting('vehicleDebug.llm.remote.enabled') === 'true';
    const allowRemoteUpload =
      this.manager.getSetting('vehicleDebug.llm.allowRemoteDataUpload') === 'true';

    if (localEnabled) {
      const r = await this.callLocal(systemPrompt, userPrompt);
      if (r.ok) return r;
      if (!remoteEnabled) return r;
    }

    if (remoteEnabled) {
      if (!allowRemoteUpload) {
        return {
          ok: false,
          error:
            'Envoi vers LLM distant refusé : activez vehicleDebug.llm.allowRemoteDataUpload ' +
            '(opt-in) ou utilisez un LLM local. Des extraits de logs/DTC seraient transmis hors machine.'
        };
      }
      return this.callRemote(systemPrompt, userPrompt);
    }

    return {
      ok: false,
      error:
        'Aucun LLM activé. Activez vehicleDebug.llm.local.enabled ou vehicleDebug.llm.remote.enabled dans les settings.'
    };
  }

  private async callLocal(system: string, user: string): Promise<LlmResult> {
    const base = this.manager.getSetting('vehicleDebug.llm.local.baseUrl').replace(/\/$/, '');
    const model = this.manager.getSetting('vehicleDebug.llm.local.model') || 'llama3.1';
    const style = this.manager.getSetting('vehicleDebug.llm.local.apiStyle') || 'ollama';
    const def = this.manager.getDefs().find((d) => d.id === 'llm-local')!;
    const apiKey = await this.manager.getSecret(def);

    try {
      if (style === 'ollama') {
        const res = await fetch(`${base}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user }
            ]
          })
        });
        if (!res.ok) {
          return { ok: false, error: `Ollama HTTP ${res.status}`, provider: 'ollama', model };
        }
        const data = (await res.json()) as any;
        const text = data?.message?.content || data?.response || '';
        return { ok: true, text, provider: 'ollama', model };
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0.2
        })
      });
      if (!res.ok) {
        return { ok: false, error: `Local OpenAI-compat HTTP ${res.status}`, provider: 'local', model };
      }
      const data = (await res.json()) as any;
      const text = data?.choices?.[0]?.message?.content || '';
      return { ok: true, text, provider: 'local-openai-compat', model };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e), provider: 'local', model };
    }
  }

  private async callRemote(system: string, user: string): Promise<LlmResult> {
    const base = this.manager.getSetting('vehicleDebug.llm.remote.baseUrl').replace(/\/$/, '');
    const model = this.manager.getSetting('vehicleDebug.llm.remote.model') || 'gpt-4o';
    const provider = this.manager.getSetting('vehicleDebug.llm.remote.provider') || 'openai';
    const def = this.manager.getDefs().find((d) => d.id === 'llm-remote')!;
    const apiKey = await this.manager.getSecret(def);

    if (!apiKey && provider !== 'custom') {
      return {
        ok: false,
        error: 'Clé API LLM remote manquante (Set Connection Token / Password)',
        provider,
        model
      };
    }

    try {
      if (provider === 'anthropic') {
        const res = await fetch(`${base}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey || '',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: 2048,
            system,
            messages: [{ role: 'user', content: user }]
          })
        });
        if (!res.ok) {
          return { ok: false, error: `Anthropic HTTP ${res.status}`, provider, model };
        }
        const data = (await res.json()) as any;
        const text = data?.content?.[0]?.text || '';
        return { ok: true, text, provider, model };
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0.2
        })
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return {
          ok: false,
          error: `Remote LLM HTTP ${res.status}${body ? ': ' + body.slice(0, 200) : ''}`,
          provider,
          model
        };
      }
      const data = (await res.json()) as any;
      const text = data?.choices?.[0]?.message?.content || '';
      return { ok: true, text, provider, model };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e), provider, model };
    }
  }
}

export const ANALYSIS_SYSTEM_PROMPT = `Tu es un expert en diagnostic automobile et sûreté de fonctionnement (ISO 26262, AUTOSAR, UDS, OBD-II).
Tu analyses des erreurs, DTC, logs CAN et événements safety.
Réponds en français, de façon structurée et actionnable:
1. Synthèse (2-3 phrases)
2. Cause(s) probable(s)
3. Impact safety / ASIL estimé si pertinent
4. Actions recommandées (tests, vérifications, modules AUTOSAR concernés: DEM, DCM, WdgM, FiM…)
5. Questions de clarification si le contexte est insuffisant
Sois précis, technique, sans spéculation gratuite.`;
