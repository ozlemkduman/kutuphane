'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SchoolRegisterClient() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.schoolSlug as string;

  useEffect(() => {
    if (schoolSlug) {
      localStorage.setItem('onboarding_school_slug', schoolSlug);
    }
    router.replace('/login');
  }, [schoolSlug, router]);

  return null;
}
