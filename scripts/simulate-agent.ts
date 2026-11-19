/**
 * Simulator script for testing the LEGO Bridge SSE & 3D Studio behavior without OpenBot.
 * Usage:
 *   BRIDGE_TOKEN=dev-secret npm run simulate-agent
 */

const BRIDGE_URL = process.env.LEGO_BRIDGE_URL ?? 'http://localhost:4310';
const TOKEN = process.env.BRIDGE_TOKEN ?? process.env.LEGO_BRIDGE_TOKEN ?? '';

if (!TOKEN) {
  console.error('Error: set BRIDGE_TOKEN (or LEGO_BRIDGE_TOKEN) environment variable first.');
  process.exit(1);
}

const SIM_AGENTS = [
  { agentId: 'ada-dev', name: 'Ada', title: 'Full-Stack Engineer' },
  { agentId: 'kai-qa', name: 'Kai', title: 'QA & Release Agent' },
  { agentId: 'nadia-ux', name: 'Nadia', title: 'Product Designer' },
];

const SAMPLE_TASKS = [
  'Memperbaiki test login yang gagal di Safari',
  'Mengoptimalkan query dashboard analitik bulanan',
  'Menulis dokumentasi REST API dan SSE bridge',
  'Merapikan komponen responsif untuk layar mobile',
  'Menjalankan regression test sebelum rilis v2.0',
  'Meninjau pull request fitur ekspor JSON',
];

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${BRIDGE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${path} -> HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log(`[sim] Registering ${SIM_AGENTS.length} agents against ${BRIDGE_URL}...`);
  for (const ag of SIM_AGENTS) {
    await postJson('/api/agents/register', ag);
  }

  const states = new Map<string, 'working' | 'idle'>(
    SIM_AGENTS.map((a) => [a.agentId, 'idle'])
  );

  // Immediately kick off one agent working so user sees instant reaction!
  const firstTask = SAMPLE_TASKS[0];
  await postJson(`/api/agents/${SIM_AGENTS[0].agentId}/status`, {
    status: 'working',
    task: firstTask,
  });
  states.set(SIM_AGENTS[0].agentId, 'working');
  console.log(`[sim] ${SIM_AGENTS[0].name} -> working: "${firstTask}"`);

  // Randomly toggle one agent every 10 seconds
  setInterval(async () => {
    const ag = SIM_AGENTS[Math.floor(Math.random() * SIM_AGENTS.length)];
    const prev = states.get(ag.agentId) ?? 'idle';
    const next = prev === 'working' ? 'idle' : 'working';
    const task =
      next === 'working'
        ? SAMPLE_TASKS[Math.floor(Math.random() * SAMPLE_TASKS.length)]
        : undefined;

    try {
      await postJson(`/api/agents/${ag.agentId}/status`, { status: next, task });
      states.set(ag.agentId, next);
      console.log(
        `[sim] ${ag.name} -> ${next}${task ? `: "${task}"` : ''}`
      );
    } catch (err) {
      console.error('[sim] Failed update:', err);
    }
  }, 10_000);
}

main().catch((err) => {
  console.error('[sim] Fatal error:', err);
  process.exit(1);
});
