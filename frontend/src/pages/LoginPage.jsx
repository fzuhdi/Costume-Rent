import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { LogIn, AlertCircle } from 'lucide-react';
import { Input, Button, Card, CardBody, Chip } from '@heroui/react';

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <Card className="w-full max-w-md mx-4">
        <CardBody className="gap-4">
          <div className="text-center">
            {settings.app_logo ? (
              <img src={settings.app_logo} alt={settings.app_name} className="h-16 mx-auto mb-2" />
            ) : (
              <h1 className="text-2xl font-bold text-[var(--primary)]">{settings.app_name}</h1>
            )}
            <p className="text-sm text-[var(--muted)]">{settings.app_tagline}</p>
          </div>

          {error && (
            <Chip color="danger" classNames={{ base: 'w-full' }} startContent={<AlertCircle size={18} />}>
              {error}
            </Chip>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@busana.com"
              required
            />
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
            <Button type="submit" color="primary" isLoading={loading} startContent={!loading && <LogIn size={18} />}>
              Login
            </Button>
          </form>

          <p className="text-center text-xs text-[var(--muted)]">Default: admin@busana.com / admin123</p>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPage;