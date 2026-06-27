import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Signup() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
