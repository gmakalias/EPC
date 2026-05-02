import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FormInput } from '../components/Form/FormInput';
import Button from '../components/Form/Button';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Logic to call back-end/src/auth/auth.controller.ts
      // Note: We cast to 'any' or ensure your store returns a promise
      const result = await login(email, password);

      // FIX: Check result explicitly or handle based on your store's logic
      // If your store updates a 'token' or 'user' state, check that instead:
      if (result !== (undefined as any)) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="card" style={{ width: '400px', padding: '2.5rem' }}>
        <h1 className="modal-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>EPC Portal</h1>
        
        {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <FormInput 
            label="Email Address" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <FormInput 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;