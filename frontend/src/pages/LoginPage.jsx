import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { LogIn } from 'lucide-react';
import { TextField, Label, Input, Button, Card, Alert } from '@heroui/react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/catalogue');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      aria-label="Login page"
    >
      <Card className="w-full max-w-md mx-4" aria-label="Login form">
        <Card.Content className="flex flex-col gap-6 py-8 px-6">

          {/* Header */}
          <div className="text-center">
            {settings.app_logo ? (
              <img src={settings.app_logo} alt={settings.app_name} className="h-16 mx-auto mb-2" />
            ) : (
              <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                {settings.app_name}
              </h1>
            )}
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{settings.app_tagline}</p>
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
            <TextField
              name="email"
              type="email"
              isRequired
              value={email}
              onChange={setEmail}
              aria-label="Email address"
            >
              <Label>Email</Label>
              <Input placeholder="admin@busana.com" aria-label="Email address" />
            </TextField>

            <TextField
              name="password"
              type="password"
              isRequired
              value={password}
              onChange={setPassword}
              aria-label="Password"
            >
              <Label>Password</Label>
              <Input placeholder="Enter password" aria-label="Password" />
            </TextField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
              startContent={!loading && <LogIn size={18} />}
              aria-label="Login to your account"
            >
              Login
            </Button>
          </form>

          <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
            Default: admin@busana.com / admin123
          </p>

        </Card.Content>
      </Card>
    </div>
  );
};

export default LoginPage;
