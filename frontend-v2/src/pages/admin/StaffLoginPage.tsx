import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthCard, Field } from '../../components/shared';
import type { StateSetter } from '../../types/app';
import type { StaffSession, TFunction } from '../../types/domain';

type StaffLoginPageProps = {
  t: TFunction;
  staffSession: StaffSession;
  setStaffSession: StateSetter<StaffSession>;
};

export default function StaffLoginPage({ t, staffSession, setStaffSession }: StaffLoginPageProps) {
  const location = useLocation();
  const [username, setUsername] = useState(staffSession.username || 'admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.classList.remove('customer-page');
    document.body.classList.add('admin-page');
    document.title = `${t('brand.name')} - ${t('staffLogin.pageTitle')}`;
  }, [t]);

  if (staffSession.isAuthenticated) {
    return <Navigate to={`/admin/requests${location.search}`} replace />;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || password.length < 4) {
      setError(t('staffLogin.errorRequired'));
      return;
    }
    setError('');
    setStaffSession({ isAuthenticated: true, username: username.trim() });
  };

  return (
    <main className="staff-login-page">
      <AuthCard
        className="staff-login-card"
        kicker={t('staffLogin.kicker')}
        title={t('brand.name')}
        copy={t('staffLogin.copy')}
      >
        <form className="checkout-card" onSubmit={onSubmit}>
          <Field label={t('staffLogin.username')}>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </Field>
          <Field label={t('staffLogin.password')}>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
          </Field>
          {error ? <p className="validation-message">{error}</p> : null}
          <button className="primary-button full" type="submit">{t('staffLogin.submit')}</button>
        </form>
      </AuthCard>
    </main>
  );
}
