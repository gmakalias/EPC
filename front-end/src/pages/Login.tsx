import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FormInput } from '../components/Form/FormInput';
import Button from '../components/Button';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to call back-end/src/auth/auth.controller.ts
    const success = await login(email, password);
    if (success) navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="card" style={{ width: '400px', padding: '2.5rem' }}>
        <h1 className="modal-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>EPC Portal</h1>
        <form onSubmit={handleSubmit}>
          <FormInput label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <FormInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" style={{ width: '100%', marginTop: '1rem' }}>Sign In</Button>
        </form>
      </div>
    </div>
  );
};

export default Login;