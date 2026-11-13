import * as vscode from 'vscode';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { getConfig } from './config';

export interface PythonResult {
  success: boolean;
  stdout: string;
  stderr: string;
  data?: unknown;
  timedOut?: boolean;
  cancelled?: boolean;
}

let _extensionPath: string | undefined;

export function setExtensionPath(p: string) {
  _extensionPath = p;
}

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_STDOUT_CHARS = 8_000_000;

/**
 * Runs a Python script located in the extension's python/ folder.
 * Supports timeout, stdout limit, and CancellationToken (P0/P2).
 */
export async function runPythonScript(
  scriptName: string,
  args: string[] = [],
  inputJson?: object,
  timeoutMs?: number,
  token?: vscode.CancellationToken
): Promise<PythonResult> {
  const config = getConfig();
  const extensionPath =
    _extensionPath ||
    vscode.extensions.getExtension('vehicle-debug.vehicle-debugging-assistant')?.extensionPath ||
    path.join(__dirname, '..', '..');

  const candidates = [
    path.join(extensionPath, 'src', 'python', scriptName),
    path.join(extensionPath, 'python', scriptName),
    path.join(extensionPath, 'out', 'python', scriptName)
  ];

  const scriptPath = candidates.find((p) => fs.existsSync(p)) || candidates[0];

  if (!fs.existsSync(scriptPath)) {
    return {
      success: false,
      stdout: '',
      stderr: `Python script not found: ${scriptName} (looked in src/python, python/, out/python)`
    };
  }

  const effectiveTimeout =
    typeof timeoutMs === 'number' && timeoutMs > 0
      ? timeoutMs
      : config.pythonTimeoutMs > 0
        ? config.pythonTimeoutMs
        : DEFAULT_TIMEOUT_MS;

  return new Promise((resolve) => {
    let settled = false;
    let timedOut = false;
    let stdout = '';
    let stderr = '';
    let softKillTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (result: PythonResult) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (softKillTimer) {
        clearTimeout(softKillTimer);
      }
      resolve(result);
    };

    let proc: ChildProcessWithoutNullStreams;
    try {
      proc = spawn(config.pythonPath, [scriptPath, ...args], {
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      finish({ success: false, stdout: '', stderr: message });
      return;
    }

    const onCancel = () => {
      timedOut = false;
      stderr += '\n[Vehicle Debug] Cancelled by user';
      try {
        proc.kill('SIGTERM');
      } catch {
        /* ignore */
      }
      softKillTimer = setTimeout(() => {
        try {
          proc.kill('SIGKILL');
        } catch {
          /* ignore */
        }
      }, 2_000);
      finish({
        success: false,
        stdout,
        stderr: stderr.trim() || 'Cancelled by user',
        cancelled: true
      });
    };

    if (token) {
      if (token.isCancellationRequested) {
        onCancel();
        return;
      }
      token.onCancellationRequested(onCancel);
    }

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      stderr += `\n[Vehicle Debug] Python timeout after ${effectiveTimeout} ms — sending SIGTERM`;
      try {
        proc.kill('SIGTERM');
      } catch {
        /* ignore */
      }
      softKillTimer = setTimeout(() => {
        try {
          proc.kill('SIGKILL');
        } catch {
          /* ignore */
        }
      }, 2_000);
    }, effectiveTimeout);

    if (inputJson) {
      try {
        proc.stdin.write(JSON.stringify(inputJson));
        proc.stdin.end();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        stderr += `\nstdin write failed: ${message}`;
      }
    } else {
      proc.stdin.end();
    }

    proc.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length < MAX_STDOUT_CHARS) {
        stdout += chunk.toString();
        if (stdout.length >= MAX_STDOUT_CHARS) {
          stdout += '\n[Vehicle Debug] stdout truncated (size limit)';
        }
      }
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code, signal) => {
      let data: unknown = undefined;
      if (stdout.trim()) {
        try {
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          data = JSON.parse(lastLine);
        } catch {
          // keep raw stdout
        }
      }

      if (timedOut) {
        finish({
          success: false,
          stdout,
          stderr:
            stderr.trim() ||
            `Python process timed out after ${effectiveTimeout} ms` +
              (signal ? ` (signal ${signal})` : ''),
          data,
          timedOut: true
        });
        return;
      }

      finish({
        success: code === 0,
        stdout,
        stderr,
        data
      });
    });

    proc.on('error', (err) => {
      finish({
        success: false,
        stdout,
        stderr: err.message || String(err),
        timedOut
      });
    });
  });
}

export async function checkPythonDependencies(): Promise<boolean> {
  const result = await runPythonScript('check_deps.py', [], undefined, 15_000);
  return result.success && (result.data as { ok?: boolean } | undefined)?.ok === true;
}
