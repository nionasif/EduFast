#!/usr/bin/env python3
"""
EduFast All-in-One Full-Stack Launcher
Starts Backend (Node.js/Socket.io/AI) and Frontend (Vite/React) together with unified logs and clean Ctrl+C shutdown.
Includes automatic crash recovery & port clearing.
"""

import os
import sys
import shutil
import signal
import threading
import subprocess
import webbrowser
import time
import socket
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
_lock_socket = None


def acquire_single_instance_lock():
    """Ensure only one instance of run.py can run at a time to prevent port fighting."""
    global _lock_socket
    _lock_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        _lock_socket.bind(("127.0.0.1", 50999))
    except socket.error:
        print(f"\n{RED}{BOLD}[EDUFAST WARNING] Another instance of run.py is already active!{RESET}")
        print(f"{YELLOW}A duplicate process was prevented to avoid port 5001/5173 conflicts.{RESET}")
        print(f"{YELLOW}If you want to restart, please close the other running terminal window first.{RESET}\n")
        sys.exit(0)


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
    killed_any = False
    for port in ports:
        try:
            output = subprocess.check_output(f'netstat -ano | findstr ":{port}"', shell=True, text=True, stderr=subprocess.DEVNULL)
            for line in output.splitlines():
                if "LISTENING" in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    if pid and pid != "0" and int(pid) != os.getpid():
                        subprocess.run(["taskkill", "/F", "/T", "/PID", pid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        killed_any = True
        except Exception:
            pass
    if killed_any:
        time.sleep(1.0)


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

    for proc in list(processes):
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
    acquire_single_instance_lock()
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

    node_cmd = shutil.which("node") or "node"
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

    def start_backend():
        free_ports([5001])
        proc = subprocess.Popen(
            [node_cmd, "server.js"],
            cwd=BACKEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        processes.append(proc)
        threading.Thread(target=stream_logs, args=(proc.stdout, log_backend), daemon=True).start()
        return proc

    def start_frontend():
        free_ports([5173])
        vite_bin = FRONTEND_DIR / "node_modules" / "vite" / "bin" / "vite.js"
        cmd = [node_cmd, str(vite_bin)] if vite_bin.exists() else [npm_cmd, "run", "dev"]
        proc = subprocess.Popen(
            cmd,
            cwd=FRONTEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        processes.append(proc)
        threading.Thread(target=stream_logs, args=(proc.stdout, log_frontend), daemon=True).start()
        return proc

    backend_proc = start_backend()
    frontend_proc = start_frontend()

    # Open Browser automatically after brief initialization
    def open_browser():
        time.sleep(3.0)
        if not shutting_down:
            log_system("Opening browser at http://localhost:5173 ...")
            webbrowser.open("http://localhost:5173")

    threading.Thread(target=open_browser, daemon=True).start()

    # Keep main thread alive waiting for Ctrl+C and supervise processes
    try:
        while not shutting_down:
            time.sleep(1.0)
            if not shutting_down and backend_proc.poll() is not None:
                log_error(f"Backend Server stopped unexpectedly (code {backend_proc.poll()}). Auto-recovering in 2s...")
                time.sleep(2.0)
                if not shutting_down:
                    backend_proc = start_backend()

            if not shutting_down and frontend_proc.poll() is not None:
                log_error(f"Frontend Vite stopped unexpectedly (code {frontend_proc.poll()}). Auto-recovering in 2s...")
                time.sleep(2.0)
                if not shutting_down:
                    frontend_proc = start_frontend()
    except KeyboardInterrupt:
        stop_all()


if __name__ == "__main__":
    main()
