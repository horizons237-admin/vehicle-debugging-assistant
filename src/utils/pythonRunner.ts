import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';
import { getConfig } from './config';

let extensionPath = '';

export function setExtensionPath(p: string): void {
  extensionPath = p;
}

export interface PythonResult {
  success: boolean;
  stdout: string;
  stderr: string;
  data?: any;
}

export async function runPythonScript(
  scriptName: string,
  args: string[] = [],
  stdinPayload?: Record<string, unknown>
): Promise<PythonResult> {
  const config = getConfig();
  const candidates = [
    path.join(extensionPath, 'src', 'python', scriptName),
    path.join(extensionPath, 'python', scriptName)
  ];

  let scriptPath = candidates[0];
  for (const c of candidates) {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(c));
      scriptPath = c;
      break;
    } catch {
      /* try next */
    }
  }

  return new Promise((resolve) => {
    const proc = spawn(config.pythonPath, [scriptPath, ...args], {
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    if (stdinPayload) {
      proc.stdin.write(JSON.stringify(stdinPayload));
      proc.stdin.end();
    } else {
      proc.stdin.end();
    }

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      let data: any;
      try {
        const lines = stdout.trim().split('\n');
        const last = lines[lines.length - 1];
        data = JSON.parse(last);
      } catch {
        data = undefined;
      }
      resolve({
        success: code === 0,
        stdout,
        stderr,
        data
      });
    });

    proc.on('error', (err) => {
      resolve({ success: false, stdout, stderr: err.message });
    });
  });
}
