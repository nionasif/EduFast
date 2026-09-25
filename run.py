#!/usr/bin/env python3
"""
EduFast All-in-One Full-Stack Launcher
Starts Backend (Node.js/Socket.io) and Frontend (Vite/React) together with unified logs and clean Ctrl+C shutdown.
"""

import os
import sys
import shutil
import signal
import threading
import subprocess
import webbrowser
import time
from pathlib import Path

# Ensure UTF-8 output encoding across Windows consoles
if sys.platform == "win32":
    os.system("")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Styling
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "Forntend"

processes = []
shutting_down = False


def log_backend(message: str):
    print(f"{CYAN}[BACKEND]{RESET} {message}", flush=True)


def log_frontend(message: str):
    print(f"{MAGENTA}[FRONTEND]{RESET} {message}", flush=True)


def log_system(message: str):
    print(f"{GREEN}[EDUFAST]{RESET} {message}", flush=True)


def log_error(message: str):
    print(f"{RED}[ERROR]{RESET} {message}", flush=True)


def check_prerequisites():
    """Verify Node.js and npm are installed, setup .env, and check dependencies."""
    log_system("Checking system prerequisites...")

    if not shutil.which("node") or not shutil.which("npm"):
        log_error("Node.js / npm is not installed or not in PATH!")
        log_error("Please install Node.js from https://nodejs.org/")
        sys.exit(1)

    # 1. Check Backend .env
    backend_env = BACKEND_DIR / ".env"
    backend_env_example = BACKEND_DIR / ".env.example"
    if not backend_env.exists() and backend_env_example.exists():
        log_system("Creating backend/.env from .env.example...")
        shutil.copy(backend_env_example, backend_env)

    # 2. Check Backend node_modules
    if not (BACKEND_DIR / "node_modules").exists():
        log_system("Installing backend dependencies (npm install)...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_cmd, "install"], cwd=BACKEND_DIR, check=True)

    # 3. Check Frontend node_modules
    if not (FRONTEND_DIR / "node_modules").exists():
        log_system("Installing frontend dependencies (npm install)...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_cmd, "install"], cwd=FRONTEND_DIR, check=True)

    # 4. Clean up any leftover processes on ports 5001 / 5173
    free_ports([5001, 5173])


def free_ports(ports):
    """Frees specified ports if an old crashed process is still occupying them."""
    if sys.platform != "win32":
        return
    for port in ports:
        try:
            output = subprocess.check_output(f'netstat -ano | findstr ":{port}"', shell=True, text=True, stderr=subprocess.DEVNULL)
            for line in output.splitlines():
                if "LISTENING" in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    if pid and pid != "0" and int(pid) != os.getpid():
                        subprocess.run(["taskkill", "/F", "/PID", pid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass


def stream_logs(pipe, log_func):
    """Read logs from a process pipe line-by-line."""
    try:
        for line in iter(pipe.readline, ""):
            if shutting_down:
                break
            cleaned = line.rstrip()
            if cleaned:
                log_func(cleaned)
    except (ValueError, OSError):
        pass
    finally:
        pipe.close()


def stop_all(*args):
    """Cleanly terminate all processes and their child process trees."""
    global shutting_down
    if shutting_down:
        return
    shutting_down = True

    print(f"\n{YELLOW}{BOLD}Shutting down EduFast servers cleanly...{RESET}", flush=True)

    for proc in processes:
        if proc.poll() is None:
            try:
                if sys.platform == "win32":
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                else:
                    proc.terminate()
            except Exception:
                pass

    log_system("All services stopped. Goodbye!")
    sys.exit(0)


def main():
    check_prerequisites()

    print(f"\n{BOLD}{CYAN}===================================================={RESET}")
    print(f"{BOLD}{GREEN}           🚀 EduFast Platform Launcher              {RESET}")
    print(f"{BOLD}{CYAN}===================================================={RESET}")
    print(f"  • Backend URL:  {BOLD}http://localhost:5001{RESET}")
    print(f"  • Frontend URL: {BOLD}http://localhost:5173{RESET}")
    print(f"  • Stop Servers: Press {YELLOW}{BOLD}Ctrl + C{RESET} at any time")
    print(f"{BOLD}{CYAN}===================================================={RESET}\n")

    # Handle Ctrl+C and termination signals
    signal.signal(signal.SIGINT, stop_all)
    signal.signal(signal.SIGTERM, stop_all)

    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

    # Start Backend Process
    backend_proc = subprocess.Popen(
        [npm_cmd, "start"],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
    )
    processes.append(backend_proc)

    # Start Frontend Process
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
    )
    processes.append(frontend_proc)

    # Stream logs asynchronously
    threading.Thread(target=stream_logs, args=(backend_proc.stdout, log_backend), daemon=True).start()
    threading.Thread(target=stream_logs, args=(frontend_proc.stdout, log_frontend), daemon=True).start()

    # Open Browser automatically after brief initialization
    def open_browser():
        time.sleep(3)
        if not shutting_down:
            log_system("Opening browser at http://localhost:5173 ...")
            webbrowser.open("http://localhost:5173")

    threading.Thread(target=open_browser, daemon=True).start()

    # Keep main thread alive waiting for processes or Ctrl+C
    try:
        while not shutting_down:
            time.sleep(0.5)
            # If any process terminated prematurely
            for proc in processes:
                if proc.poll() is not None and not shutting_down:
                    stop_all()
    except KeyboardInterrupt:
        stop_all()


if __name__ == "__main__":
    main()
