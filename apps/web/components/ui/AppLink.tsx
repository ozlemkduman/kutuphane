'use client';

import { AnchorHTMLAttributes, ReactNode } from 'react';

interface AppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

/**
 * Static hosting compatible link component.
 * Uses regular <a> tags instead of Next.js Link to ensure
 * full page navigation works on Firebase Hosting.
 */
export default function AppLink({ href, children, ...props }: AppLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
