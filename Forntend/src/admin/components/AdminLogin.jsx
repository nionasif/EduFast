import React from 'react';

export default function AdminLogin({
  loginForm,
  setLoginForm,
  loginError,
  handleLogin,
  isLoggingIn,
  showPassword,
  setShowPassword,
  onExitToPublic
}) {
  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <span className="admin-badge-pill">🔒 Secure System Access</span>
          <h1 className="admin-login-title">EduFast Admin Portal</h1>
          <p className="admin-login-subtitle">
            Sign in with administrative credentials to manage students, courses, universities & analytics.
          </p>
        </div>

        {loginError && (
          <div className="admin-error-box">
            <span>⚠️</span>
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label className="admin-form-label">Username or Admin Email</label>
            <div className="admin-input-wrapper">
              <span className="admin-input-icon">👤</span>
              <input
                type="text"
                className="admin-input"
                placeholder="admin or admin@edufast.com"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Secret Password</label>
            <div className="admin-input-wrapper">
              <span className="admin-input-icon">🔑</span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="admin-input"
                placeholder="Enter password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="admin-input-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="admin-btn-primary" disabled={isLoggingIn}>
            {isLoggingIn ? 'Verifying Credentials...' : 'Sign In to Portal ➔'}
          </button>
        </form>

        <div className="admin-hint-box">
          💡 Default Access: User <code>admin</code> | Pass <code>admin123</code>
        </div>

        <button
          type="button"
          className="admin-return-btn"
          onClick={onExitToPublic}
        >
          ← Return to EduFast Public Portal
        </button>
      </div>
    </div>
  );
}
