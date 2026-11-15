export interface ChecklistItem {
  id: string;
  section: string;
  text: string;
  evidenceHint?: string;
}

export const UN_R155_AIDE_ITEMS: ChecklistItem[] = [
  {
    id: 'r155-csms',
    section: 'CSMS',
    text: 'Cybersecurity Management System documented and roles assigned',
    evidenceHint: 'Org chart, CSMS policy reference'
  },
  {
    id: 'r155-risk',
    section: 'Risk assessment',
    text: 'Threat analysis / risk assessment available for the item under analysis',
    evidenceHint: 'TARA / threat model link'
  },
  {
    id: 'r155-vuln',
    section: 'Vulnerabilities',
    text: 'Process to monitor, assess and respond to vulnerabilities',
    evidenceHint: 'Ticket queue, SBOM, CVE monitoring'
  },
  {
    id: 'r155-incident',
    section: 'Incidents',
    text: 'Incident response and escalation path defined',
    evidenceHint: 'IR playbook, on-call'
  },
  {
    id: 'r155-supply',
    section: 'Supply chain',
    text: 'Supplier cyber requirements and evidence collected',
    evidenceHint: 'Supplier questionnaire, contracts'
  },
  {
    id: 'r155-update',
    section: 'Updates',
    text: 'Secure update / OTA process described (integrity, auth)',
    evidenceHint: 'OTA security concept'
  },
  {
    id: 'r155-logging',
    section: 'Logging',
    text: 'Security-relevant events logged and retained per policy',
    evidenceHint: 'Log architecture note'
  },
  {
    id: 'r155-test',
    section: 'Verification',
    text: 'Cyber tests / penetration tests planned or completed for the release',
    evidenceHint: 'Test report ID'
  },
  {
    id: 'iso21434-align',
    section: 'ISO 21434',
    text: 'Work products aligned with ISO/SAE 21434 where applicable',
    evidenceHint: 'WP checklist'
  },
  {
    id: 'vda-scope',
    section: 'Tool boundary',
    text: 'Vehicle Debugging Assistant used only as analysis aid — not as CSMS or VSOC',
    evidenceHint: 'This checklist export'
  }
];

export function checklistToMarkdown(
  checked: Record<string, boolean>,
  notes: Record<string, string>
): string {
  const lines = [
    '# Cyber / UN R155 — process aide-mémoire',
    '',
    '_Not a certification tool, not a VSOC. Manual checklist for lab / engineering discussion._',
    '',
    '| Done | ID | Section | Item |',
    '|------|----|---------|------|'
  ];
  for (const item of UN_R155_AIDE_ITEMS) {
    const mark = checked[item.id] ? 'x' : ' ';
    lines.push(`| [${mark}] | ${item.id} | ${item.section} | ${item.text} |`);
    if (notes[item.id]) lines.push(`| | | | _Note: ${notes[item.id]}_ |`);
  }
  lines.push('', '## Evidence hints');
  for (const item of UN_R155_AIDE_ITEMS) {
    if (item.evidenceHint) lines.push(`- **${item.id}**: ${item.evidenceHint}`);
  }
  return lines.join('\n');
}
