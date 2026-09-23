import os
import sys
import time
import subprocess
import webbrowser
import signal

# EduFast Full Stack Runner
# Runs Backend (Port 5001) and Frontend (Port 5173) simultaneously

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "Forntend")

def free_port_windows(port):
    """Kills any existing process occupying the given port on Windows."""
    try:
        out = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True, text=True, stderr=subprocess.DEVNULL)
        for line in out.strip().splitlines():
            parts = line.split()
            if len(parts) >= 5 and 'LISTENING' in line:
                pid = parts[-1]
                if pid and pid != '0':
                    subprocess.run(f'taskkill /F /PID {pid}', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    print(f"[*] Cleared previously occupied port {port} (PID: {pid})")
    except Exception:
        pass

def main():
    print("=" * 60)
    print("         🚀 STARTING EDUFAST PLATFORM")
    print("=" * 60)

    # 1. Clear ports 5001 and 5173 to avoid EADDRINUSE conflicts
    free_port_windows(5001)

    # 2. Start Backend Server
    print("\n[1/2] Starting EduFast Backend (Node.js + SQLite + Gmail SMTP)...")
    backend_proc = subprocess.Popen(
        ["node", "server.js"],
        cwd=BACKEND_DIR,
        shell=True
    )

    time.sleep(2)

    # 3. Start Frontend Dev Server
    print("[2/2] Starting EduFast Frontend (Vite + React)...")
    frontend_proc = subprocess.Popen(
        ["npm.cmd" if os.name == "nt" else "npm", "run", "dev"],
        cwd=FRONTEND_DIR,
        shell=True
    )

    time.sleep(3)

    print("\n" + "=" * 60)
    print("  ✅ Backend running at:  http://localhost:5001")
    print("  ✅ Frontend running at: http://localhost:5173")
    print("  ✉️  Email OTP Service:  asifhossainkhannion@gmail.com")
    print("=" * 60)
    print("Press Ctrl+C to terminate both servers.\n")

    # Automatically open the browser
    webbrowser.open("http://localhost:5173")

    def handle_exit(signum, frame):
        print("\n\nStopping EduFast servers...")
        try:
            backend_proc.terminate()
            frontend_proc.terminate()
        except Exception:
            pass
        free_port_windows(5001)
        print("Servers stopped successfully. Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        handle_exit(None, None)

if __name__ == "__main__":
    main()