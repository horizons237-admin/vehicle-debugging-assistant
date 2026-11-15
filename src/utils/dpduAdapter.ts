/** ISO 22900 D-PDU API — lab stub (multi-vendor VCI abstraction). */
export function getDpduStatusMessage(): string {
  return (
    'D-PDU API (ISO 22900): not loaded. ' +
    'Cross-brand modular VCI access requires a vendor D-PDU module. ' +
    'VDA exposes a stub for architecture alignment only.'
  );
}

export function createDpduStubReport() {
  return {
    status: 'stub',
    standard: 'ISO 22900-2 D-PDU API',
    modules: [],
    message: getDpduStatusMessage(),
    related: ['SAE J2534 Pass-Thru (also stub in VDA)', 'MVCI (ASAM) — future']
  };
}
