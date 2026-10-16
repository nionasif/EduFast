/**
 * EduFast All-in-One Full-Stack Launcher (Node.js)
 * Starts Backend (Node.js/Socket.io/AI) and Frontend (Vite/React) together with unified logs and clean Ctrl+C shutdown.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const BASE_DIR = __dirname;
const BACKEND_DIR = path.join(BASE_DIR, 'backend');
const FRONTEND_DIR = path.join(BASE_DIR, 'Forntend');

const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const MAGENTA = '\x1b[95m';
const RED = '\x1b[91m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let backendProcess = null;
let frontendProcess = null;
let isShuttingDown = false;

function freePorts(ports) {
  if (process.platform !== 'win32') return;
  ports.forEach((port) => {
    try {
      const output = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      output.split('\n').forEach((line) => {
        if (line.includes('LISTENING') || line.includes('ESTABLISHED')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid) && parseInt(pid) !== process.pid && parseInt(pid) !== 0) {
            try {
              execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
            } catch (e) {}
          }
        }
      });
    } catch (e) {}
  });
}

function checkPrerequisites() {
  console.log(`${GREEN}[EDUFAST]${RESET} Checking system prerequisites...`);

  // Ensure backend .env exists
  const envPath = path.join(BACKEND_DIR, '.env');
  const envExample = path.join(BACKEND_DIR, '.env.example');
  if (!fs.existsSync(envPath) && fs.existsSync(envExample)) {
    console.log(`${GREEN}[EDUFAST]${RESET} Creating backend/.env from .env.example...`);
    fs.copyFileSync(envExample, envPath);
  }

  // Check backend node_modules
  if (!fs.existsSync(path.join(BACKEND_DIR, 'node_modules'))) {
    console.log(`${GREEN}[EDUFAST]${RESET} Installing backend dependencies...`);
    execSync('npm install', { cwd: BACKEND_DIR, stdio: 'inherit' });
  }

  // Check frontend node_modules
  if (!fs.existsSync(path.join(FRONTEND_DIR, 'node_modules'))) {
    console.log(`${GREEN}[EDUFAST]${RESET} Installing frontend dependencies...`);
    execSync('npm install', { cwd: FRONTEND_DIR, stdio: 'inherit' });
  }

  freePorts([5001, 5173, 50999]);
}

function openBrowser(url) {
  const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  try {
    const { exec } = require('child_process');
    exec(`${startCmd} ${url}`);
  } catch (e) {}
}

function startBackend() {
  freePorts([5001]);
  backendProcess = spawn(process.execPath, ['server.js'], {
    cwd: BACKEND_DIR,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((l) => console.log(`${CYAN}[BACKEND]${RESET} ${l}`));
  });

  backendProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((l) => console.error(`${RED}[BACKEND ERROR]${RESET} ${l}`));
  });

  backendProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`${RED}[BACKEND] Server exited with code ${code}. Recovering in 2s...${RESET}`);
      setTimeout(startBackend, 2000);
    }
  });
}

function startFrontend() {
  freePorts([5173]);
  const viteBin = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const args = fs.existsSync(viteBin)
    ? [viteBin, '--host', '127.0.0.1', '--port', '5173']
    : ['run', 'dev'];
  const cmd = fs.existsSync(viteBin) ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');

  frontendProcess = spawn(cmd, args, {
    cwd: FRONTEND_DIR,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  frontendProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((l) => console.log(`${MAGENTA}[FRONTEND]${RESET} ${l}`));
  });

  frontendProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((l) => console.error(`${RED}[FRONTEND ERROR]${RESET} ${l}`));
  });

  frontendProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`${RED}[FRONTEND] Vite exited with code ${code}. Recovering in 2s...${RESET}`);
      setTimeout(startFrontend, 2000);
    }
  });
}

function stopAll() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${YELLOW}${BOLD}Shutting down EduFast servers cleanly...${RESET}`);

  if (backendProcess && backendProcess.pid) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /F /T /PID ${backendProcess.pid}`, { stdio: 'ignore' });
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch (e) {}
  }

  if (frontendProcess && frontendProcess.pid) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /F /T /PID ${frontendProcess.pid}`, { stdio: 'ignore' });
      } else {
        frontendProcess.kill('SIGTERM');
      }
    } catch (e) {}
  }

  freePorts([5001, 5173, 50999]);
  console.log(`${GREEN}[EDUFAST]${RESET} All services stopped. Goodbye!`);
  process.exit(0);
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);

function checkFrontendReady(retries = 30) {
  if (isShuttingDown) return;
  const req = http.get('http://127.0.0.1:5173', (res) => {
    console.log(`${GREEN}[EDUFAST]${RESET} Frontend is ready! Opening browser at http://localhost:5173 ...`);
    openBrowser('http://localhost:5173');
  });

  req.on('error', () => {
    if (retries > 0 && !isShuttingDown) {
      setTimeout(() => checkFrontendReady(retries - 1), 500);
    }
  });
}

function main() {
  checkPrerequisites();

  console.log(`\n${BOLD}${CYAN}====================================================${RESET}`);
  console.log(`${BOLD}${GREEN}           🚀 EduFast Platform Launcher              ${RESET}`);
  console.log(`${BOLD}${CYAN}====================================================${RESET}`);
  console.log(`  • Backend URL:  ${BOLD}http://localhost:5001${RESET}`);
  console.log(`  • Frontend URL: ${BOLD}http://localhost:5173${RESET}`);
  console.log(`  • Stop Servers: Press ${YELLOW}${BOLD}Ctrl + C${RESET} at any time`);
  console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);

  startBackend();
  startFrontend();
  checkFrontendReady();
}

main();
