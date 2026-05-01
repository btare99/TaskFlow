import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { init } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('tf_token', token);
      init().then(() => navigate('/dashboard'));
    } else {
      navigate('/login?error=oauth');
    }
  }, []);

  return (
    <div className="loading-page">
      <div className="spinner" />
    </div>
  );
}
