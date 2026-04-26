import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { LogIn, AlertCircle } from 'lucide-react';
import './LoginPage.css';

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
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          {settings.app_logo ? (
            <img src={settings.app_logo} alt={settings.app_name} className="login-logo" />
          ) : (
            <h1 className="login-title">{settings.app_name}</h1>
          )}
          <p className="login-subtitle">{settings.app_tagline}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@busana.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? (
              <div className="spinner-small"></div>
            ) : (
              <>
                <LogIn size={18} />
                Login
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Default: admin@busana.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;