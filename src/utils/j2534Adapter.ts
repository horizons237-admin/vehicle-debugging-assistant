/** Lab stub for SAE J2534 Pass-Thru (no vendor library shipped). */

export type J2534Status = 'unavailable' | 'stub' | 'loaded';

export interface J2534ChannelInfo {
  protocol: 'ISO15765' | 'CAN' | 'ISO9141' | 'J1850PWM' | 'J1850VPW';
  baudRate: number;
}

export interface J2534Adapter {
  status: J2534Status;
  vendor?: string;
  openChannel(info: J2534ChannelInfo): Promise<{ ok: boolean; message: string }>;
  close(): Promise<void>;
}

export function createJ2534Stub(): J2534Adapter {
  return {
    status: 'stub',
    vendor: 'VDA-Lab-Stub',
    async openChannel(info) {
      return {
        ok: false,
        message:
          `J2534 stub: protocol=${info.protocol} baud=${info.baudRate}. ` +
          'Install a vendor Pass-Thru library and configure vehicleDebug.j2534.libraryPath to enable real VCI access.'
      };
    },
    async close() {
      /* no-op */
    }
  };
}

export function getJ2534StatusMessage(): string {
  return (
    'J2534 Pass-Thru: interface stub only. ' +
    'Cross-brand workshop access requires a vendor J2534 / D-PDU stack (not shipped with VDA).'
  );
}
