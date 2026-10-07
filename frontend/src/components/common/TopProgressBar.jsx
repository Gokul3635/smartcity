import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function TopProgressBar() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(75), 100);
    const timer2 = setTimeout(() => setProgress(100), 250);
    const timer3 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 pointer-events-none overflow-hidden bg-slate-200/30">
      <div
        className="h-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 shadow-[0_0_10px_#2563eb] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
