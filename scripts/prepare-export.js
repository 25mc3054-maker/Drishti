const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const appApi = path.join(repoRoot, 'app', 'api');
const backup = path.join(repoRoot, 'app', '_api_backup_for_export');

function run(cmd) {
  console.log('>', cmd);
  execSync(cmd, { stdio: 'inherit', cwd: repoRoot });
}

try {
  if (fs.existsSync(appApi)) {
    console.log('Backing up `app/api` to temporary location...');
    fs.renameSync(appApi, backup);
  }

  console.log('Building with `next build` (static export mode)...');
  run('npm run build');

  console.log('Running static export...');
  run('npx next export');

  console.log('Static export finished.');
} finally {
  if (fs.existsSync(backup)) {
    // If a leftover api folder exists (unlikely), remove it first
    if (fs.existsSync(appApi)) {
      fs.rmSync(appApi, { recursive: true, force: true });
    }
    console.log('Restoring `app/api` from backup...');
    fs.renameSync(backup, appApi);
  }
}

console.log('Done. `out/` folder is ready for publishing.');
