"use client";

import { useRouter, useParams as useNextParams, usePathname, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import { useEffect } from 'react';

export function useNavigate() {
  const router = useRouter();
  return (path, options) => {
    if (path === -1) {
      router.back();
      return;
    }
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}

export function useParams() {
  return useNextParams() || {};
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return { 
    pathname, 
    search: searchParams && searchParams.toString() ? `?${searchParams.toString()}` : '',
    state: {} // Next.js doesn't support location state like RR, stub it to prevent crashes
  };
}

export function Link({ to, children, className, ...props }) {
  return <NextLink href={to} className={className} {...props}>{children}</NextLink>;
}

export function NavLink({ to, children, className, ...props }) {
  const pathname = usePathname();
  const isActive = pathname === to || pathname?.startsWith(to + '/');
  
  const computedClassName = typeof className === 'function' 
    ? className({ isActive }) 
    : className;

  return (
    <NextLink href={to} className={computedClassName} {...props}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </NextLink>
  );
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);
  return null;
}
