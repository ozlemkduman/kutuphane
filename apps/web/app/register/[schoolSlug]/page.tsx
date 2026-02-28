'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SchoolRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.schoolSlug as string;

  useEffect(() => {
    // Save school slug so onboarding page can pre-select it
    if (schoolSlug) {
      localStorage.setItem('onboarding_school_slug', schoolSlug);
    }
    router.replace('/login');
  }, [schoolSlug, router]);

  return null;
}
