import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    async function handleCallback() {
      if (error) {
        navigate('/?error=auth');
        return;
      }
      if (code && state) {
        try {
          // Delegate to server callback which sets the cookie
          const res = await fetch(`/api/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
            credentials: 'include'
          });
          if (res.redirected) {
            window.location.href = res.url;
            return;
          }
        } catch (_) {}
      }
      navigate('/');
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
}