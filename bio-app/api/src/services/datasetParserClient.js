const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

class ParserNotConfiguredError extends Error {
  constructor(message = 'Python parser is not configured') {
    super(message);
    this.name = 'ParserNotConfiguredError';
  }
}

class ParserInvocationError extends Error {
  constructor(message = 'Parser invocation failed') {
    super(message);
    this.name = 'ParserInvocationError';
  }
}

function resolveParserMode() {
  const mode = String(process.env.DATASET_PARSER_MODE || 'http').trim().toLowerCase();
  if (mode === 'http' || mode === 'cli') {
    return mode;
  }
  return 'disabled';
}

function resolveParserTimeoutMs() {
  const configured = Number(process.env.DATASET_PARSER_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }
  return 300000;
}

function validateParserResponse(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new ParserInvocationError('Parser returned an invalid response');
  }

  if (payload.status !== 'completed' && payload.status !== 'failed') {
    throw new ParserInvocationError('Parser response missing valid status');
  }

  return payload;
}

function normalizeDjangoParserResponse(payload) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.results)) {
    throw new ParserInvocationError('Parser returned an invalid response');
  }

  if (payload.success === true) {
    return {
      status: 'completed',
      result: {
        total: Number.isInteger(payload.total) ? payload.total : payload.results.length,
        results: payload.results,
      },
    };
  }

  const errors = payload.results
    .filter((item) => item && item.success === false)
    .map((item) => item.message || item.error || 'File parsing failed');

  return {
    status: 'failed',
    errors: errors.length > 0
      ? errors
      : [payload.message || payload.error || 'Dataset upload failed'],
  };
}

async function parseDatasetUploadHttp(payload) {
  const baseUrl = String(process.env.DATASET_PARSER_URL || 'http://127.0.0.1:8000')
    .trim()
    .replace(/\/+$/, '');
  if (!baseUrl) {
    throw new ParserNotConfiguredError('Python parser is not configured');
  }

  const timeoutMs = resolveParserTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const form = new FormData();
    form.append('type', String(payload.datasetType || ''));
    form.append('save_feature', payload.saveFeature ? 'true' : 'false');

    const files = Array.isArray(payload.files) ? payload.files : [];
    if (files.length === 0) {
      throw new ParserInvocationError('Parser request contains no files');
    }

    for (const file of files) {
      if (!file?.path) {
        throw new ParserInvocationError('Parser request contains an invalid file path');
      }

      const content = await fs.readFile(file.path);
      // The parser derives the database record name from this filename.
      // Keep the staging prefix (e.g. 1_) on disk only, never in the record name.
      const filename = file.originalName || file.name || path.basename(file.path);
      form.append('files', new Blob([content]), filename);
    }

    const response = await fetch(`${baseUrl}/upload/`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });

    let body = null;
    try {
      body = await response.json();
    } catch (err) {
      throw new ParserInvocationError(`Parser returned non-JSON response (${response.status})`);
    }

    if (!response.ok) {
      const message = body?.message || body?.error || `Parser request failed (${response.status})`;
      throw new ParserInvocationError(message);
    }

    return normalizeDjangoParserResponse(body);
  } catch (err) {
    if (err instanceof ParserInvocationError || err instanceof ParserNotConfiguredError) {
      throw err;
    }
    if (err.name === 'AbortError') {
      throw new ParserInvocationError('Parser request timed out');
    }
    throw new ParserInvocationError(err.message || 'Parser request failed');
  } finally {
    clearTimeout(timer);
  }
}

function parseDatasetUploadCli(payload) {
  const commandLine = String(process.env.DATASET_PARSER_COMMAND || '').trim();
  if (!commandLine) {
    throw new ParserNotConfiguredError('Python parser is not configured');
  }

  const timeoutMs = resolveParserTimeoutMs();

  return new Promise((resolve, reject) => {
    const child = spawn(commandLine, {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.kill('SIGKILL');
      reject(new ParserInvocationError('Parser command timed out'));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      reject(new ParserInvocationError(err.message || 'Failed to start parser command'));
    });

    child.on('close', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        const message = stderr.trim() || stdout.trim() || `Parser command exited with code ${code}`;
        reject(new ParserInvocationError(message));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(validateParserResponse(parsed));
      } catch (err) {
        reject(new ParserInvocationError('Parser command returned invalid JSON'));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

async function parseDatasetUpload(payload) {
  const mode = resolveParserMode();

  if (mode === 'disabled') {
    throw new ParserNotConfiguredError('Python parser is not configured');
  }

  if (mode === 'http') {
    return parseDatasetUploadHttp(payload);
  }

  return parseDatasetUploadCli(payload);
}

module.exports = {
  ParserInvocationError,
  ParserNotConfiguredError,
  normalizeDjangoParserResponse,
  parseDatasetUpload,
  parseDatasetUploadHttp,
  resolveParserMode,
};
