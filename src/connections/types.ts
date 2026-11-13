export type ConnectionKind =
  | 'jira-vwif'
  | 'jira-devstack'
  | 'confluence-vwif'
  | 'confluence-devstack'
  | 'codebeamer'
  | 'llm-local'
  | 'llm-remote';

export type ConnectionStatus = 'unknown' | 'configured' | 'ok' | 'error' | 'disabled';

export interface ConnectionDef {
  id: ConnectionKind;
  label: string;
  group: 'ALM' | 'Docs' | 'AI';
  settingsKeys: string[];
  secretKey: string;
  description: string;
}

export interface ConnectionState {
  id: ConnectionKind;
  status: ConnectionStatus;
  message?: string;
  lastChecked?: string;
}

export const CONNECTION_DEFS: ConnectionDef[] = [
  {
    id: 'jira-vwif',
    label: 'Jira VWIF',
    group: 'ALM',
    settingsKeys: [
      'vehicleDebug.jira.vwif.baseUrl',
      'vehicleDebug.jira.vwif.email',
      'vehicleDebug.jira.vwif.projectKey'
    ],
    secretKey: 'vehicleDebug.secret.jira.vwif.token',
    description: 'Jira instance VWIF (issues, bugs, safety tickets)'
  },
  {
    id: 'jira-devstack',
    label: 'Jira DevStack',
    group: 'ALM',
    settingsKeys: [
      'vehicleDebug.jira.devstack.baseUrl',
      'vehicleDebug.jira.devstack.email',
      'vehicleDebug.jira.devstack.projectKey'
    ],
    secretKey: 'vehicleDebug.secret.jira.devstack.token',
    description: 'Jira DevStack (développement / intégration)'
  },
  {
    id: 'confluence-vwif',
    label: 'Confluence VWIF',
    group: 'Docs',
    settingsKeys: [
      'vehicleDebug.confluence.vwif.baseUrl',
      'vehicleDebug.confluence.vwif.spaceKey'
    ],
    secretKey: 'vehicleDebug.secret.confluence.vwif.token',
    description: 'Confluence VWIF (documentation, safety case)'
  },
  {
    id: 'confluence-devstack',
    label: 'Confluence DevStack',
    group: 'Docs',
    settingsKeys: [
      'vehicleDebug.confluence.devstack.baseUrl',
      'vehicleDebug.confluence.devstack.spaceKey'
    ],
    secretKey: 'vehicleDebug.secret.confluence.devstack.token',
    description: 'Confluence DevStack'
  },
  {
    id: 'codebeamer',
    label: 'CodeBeamer',
    group: 'ALM',
    settingsKeys: [
      'vehicleDebug.codebeamer.baseUrl',
      'vehicleDebug.codebeamer.username',
      'vehicleDebug.codebeamer.projectId'
    ],
    secretKey: 'vehicleDebug.secret.codebeamer.password',
    description: 'CodeBeamer (exigences, traçabilité, ISO 26262)'
  },
  {
    id: 'llm-local',
    label: 'LLM Local',
    group: 'AI',
    settingsKeys: [
      'vehicleDebug.llm.local.enabled',
      'vehicleDebug.llm.local.baseUrl',
      'vehicleDebug.llm.local.model',
      'vehicleDebug.llm.local.apiStyle'
    ],
    secretKey: 'vehicleDebug.secret.llm.local.apiKey',
    description: 'LLM hébergé localement (Ollama, LM Studio, vLLM…)'
  },
  {
    id: 'llm-remote',
    label: 'LLM Remote',
    group: 'AI',
    settingsKeys: [
      'vehicleDebug.llm.remote.enabled',
      'vehicleDebug.llm.remote.baseUrl',
      'vehicleDebug.llm.remote.model',
      'vehicleDebug.llm.remote.provider'
    ],
    secretKey: 'vehicleDebug.secret.llm.remote.apiKey',
    description: 'LLM distant (OpenAI, Azure, Anthropic, custom)'
  }
];
