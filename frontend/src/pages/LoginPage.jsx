import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { LogIn, Layers } from 'lucide-react';
import { TextField, Label, Input, Button, Card, Alert } from '@heroui/react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/catalogue');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen" aria-label="Login page">
      <Card className="w-full max-w-md mx-4" aria-label="Login form">
        <Card.Content className="flex flex-col gap-6 py-8 px-6">

          {/* Header */}
          <div className="text-center">
            {settings.app_logo ? (
              <img src={settings.app_logo} alt={settings.app_name} className="h-16 mx-auto mb-2" />
            ) : (
              <div className="flex flex-col items-center gap-3 mb-2">
                <div className="bg-[var(--primary)] p-3 rounded-2xl shadow-sm shadow-[var(--primary)]/20">
                  <Layers size={40} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
                  {settings.app_name}
                </h1>
              </div>
            )}
            <p className="text-sm text-[var(--muted)]">{settings.app_tagline}</p>
          </div>

          {/* Error */}
          {error && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <TextField name="username" type="text" isRequired aria-label="Username or Email">
              <Label>Username or Email</Label>
              <Input type="text" placeholder="admin or admin@busana.com" value={username} onChange={(e) => setUsername(e.target.value)} />
            </TextField>

            <TextField name="password" type="password" isRequired aria-label="Password">
              <Label>Password</Label>
              <Input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </TextField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
              aria-label="Login"
            >
              {!loading && <LogIn size={18} />}
              Login
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
};

export default LoginPage;
