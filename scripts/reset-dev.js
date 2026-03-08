const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const devDir = path.join(projectRoot, '.next', 'dev');

function run(command) {
  return execSync(command, { stdio: 'pipe', encoding: 'utf8' });
}

function stopWorkspaceNextDevOnWindows() {
  if (process.platform !== 'win32') return;

  const escapedRoot = projectRoot.replace(/'/g, "''");
  const command = [
    "$root = '" + escapedRoot + "'",
    "$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'next\\\\dist\\\\bin\\\\next' -and $_.CommandLine -match '\\bdev\\b' -and $_.CommandLine -match [regex]::Escape($root) }",
    "if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Output ('Stopped PID ' + $_.ProcessId) } } else { Write-Output 'No workspace next dev process found' }",
  ].join('; ');

  const output = run(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${command}"`);
  if (output.trim()) {
    process.stdout.write(output.trim() + '\n');
  }
}

function clearNextDevState() {
  if (fs.existsSync(devDir)) {
    fs.rmSync(devDir, { recursive: true, force: true });
    process.stdout.write('Removed .next/dev directory\n');
  } else {
    process.stdout.write('.next/dev directory absent\n');
  }
}

function startDev() {
  const nextBin = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [nextBin, 'dev'], { stdio: 'inherit', cwd: projectRoot });
  child.on('exit', (code) => process.exit(code ?? 0));
}

try {
  stopWorkspaceNextDevOnWindows();
  clearNextDevState();
  startDev();
} catch (error) {
  process.stderr.write((error && error.message ? error.message : String(error)) + '\n');
  process.exit(1);
}
