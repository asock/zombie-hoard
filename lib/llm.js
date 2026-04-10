// lib/llm.js — Unified LLM client
// Default: local OpenAI-compatible endpoint (Ollama, llama.cpp, vLLM, LM Studio).
// Fallback: Anthropic SDK, only if ANTHROPIC_API_KEY is set in the environment.
//
// Selection happens once per process. Override with ZOMBIE_PROVIDER=local|anthropic
// to skip detection.

import Anthropic from '@anthropic-ai/sdk';

const LOCAL_BASE_URL = process.env.ZOMBIE_BASE_URL || 'http://localhost:11434/v1';
const LOCAL_MODEL = process.env.ZOMBIE_MODEL || 'llama3.2';
const ANTHROPIC_MODEL = process.env.ZOMBIE_MODEL || 'claude-sonnet-4-20250514';
const FORCED_PROVIDER = (process.env.ZOMBIE_PROVIDER || '').toLowerCase() || null;

let resolvedProvider = null; // 'local' | 'anthropic'
let anthropicClient = null;

async function probeLocal() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 1500);
  try {
    const res = await fetch(`${LOCAL_BASE_URL}/models`, { signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function resolveProvider() {
  if (resolvedProvider) return resolvedProvider;

  if (FORCED_PROVIDER === 'local' || FORCED_PROVIDER === 'anthropic') {
    resolvedProvider = FORCED_PROVIDER;
    return resolvedProvider;
  }

  if (await probeLocal()) {
    resolvedProvider = 'local';
    return 'local';
  }

  if (process.env.ANTHROPIC_API_KEY) {
    resolvedProvider = 'anthropic';
    return 'anthropic';
  }

  throw new Error(
    `No LLM available. Tried local endpoint at ${LOCAL_BASE_URL} and no ANTHROPIC_API_KEY set.\n` +
    `Start a local OpenAI-compatible server (e.g. \`ollama serve\`) or set ANTHROPIC_API_KEY.`
  );
}

async function chatLocal({ system, userContent, maxTokens, timeout }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${LOCAL_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LOCAL_MODEL,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Local LLM ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return {
      text,
      tokens: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
      },
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Local LLM timed out after ${timeout / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

async function chatAnthropic({ system, userContent, maxTokens, timeout }) {
  if (!anthropicClient) anthropicClient = new Anthropic(); // auto-reads ANTHROPIC_API_KEY
  const apiCall = anthropicClient.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userContent }],
  });
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Anthropic API timed out after ${timeout / 1000}s`)), timeout)
  );
  const response = await Promise.race([apiCall, timeoutPromise]);
  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  return {
    text,
    tokens: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

export async function chatComplete({ system, userContent, maxTokens, timeout }) {
  const provider = await resolveProvider();
  return provider === 'local'
    ? chatLocal({ system, userContent, maxTokens, timeout })
    : chatAnthropic({ system, userContent, maxTokens, timeout });
}

export function getProviderInfo() {
  return {
    provider: resolvedProvider,
    localUrl: LOCAL_BASE_URL,
    localModel: LOCAL_MODEL,
    anthropicModel: ANTHROPIC_MODEL,
  };
}
