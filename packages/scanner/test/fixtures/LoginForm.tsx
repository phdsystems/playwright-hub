import React, { useState } from 'react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form data-testid="login-form" onSubmit={handleSubmit}>
      <h2>Login</h2>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        data-testid="email-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        data-testid="password-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
      />

      <div>
        <input
          type="checkbox"
          id="remember"
          data-testid="remember-checkbox"
        />
        <label htmlFor="remember">Remember me</label>
      </div>

      <button type="submit" data-testid="submit-button">
        Sign In
      </button>

      <a href="/forgot-password" data-testid="forgot-password-link">
        Forgot Password?
      </a>
    </form>
  );
}
