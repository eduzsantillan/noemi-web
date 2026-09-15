import { execFileSync } from 'node:child_process';

const ports = [4311, 5174];
const projectPath = process.cwd();

function getPids(port) {
  try {
    return execFileSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' })
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getCommand(pid) {
  try {
    return execFileSync('ps', ['-p', pid, '-o', 'command='], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

for (const port of ports) {
  for (const pid of getPids(port)) {
    const command = getCommand(pid);
    const isThisProject = command.includes(projectPath) || command.includes('server/index.mjs') || command.includes('vite');

    if (!isThisProject) {
      console.warn(`Port ${port} is busy, but process ${pid} does not look like this app. Leaving it running.`);
      continue;
    }

    try {
      process.kill(Number(pid), 'SIGTERM');
      console.log(`Closed old local dev process ${pid} on port ${port}.`);
    } catch {
      // Process already ended.
    }
  }
}
