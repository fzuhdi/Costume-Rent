import { useLocation } from 'react-router-dom';

export function useCheckoutLink() {
  const location = useLocation();
  return {
    to: { pathname: '/checkout', search: location.search },
    state: location.pathname === '/checkout' ? undefined : { backgroundLocation: location },
  };
}
