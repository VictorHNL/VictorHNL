import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const token = process.env.GH_STATS_TOKEN || process.env.GITHUB_TOKEN || '';

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ['scripts/fetch-stats.mjs']);
const cli = resolve(root, 'node_modules/readme-aura/dist/cli.js');
const args = [cli, 'build', '--source', 'readme.build.source.md', '--output', 'README.md', '--assets', '.github/assets', '--fonts-dir', '.github/fonts'];
if (token) {
  args.push('--github-user', 'VictorHNL');
} else {
  // Avoid readme-aura's development mock values when there is no API token.
  args.push('--github-user', '', '--owner', '', '--repo', '');
}
run(process.execPath, args, {
  ...process.env,
  GITHUB_TOKEN: token,
});
run(process.execPath, ['scripts/postprocess-readme.mjs']);
