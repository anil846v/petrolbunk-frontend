import { Link } from 'react-router-dom';
import { Fuel } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-bg px-8">
      <div className="text-center">
        <p className="text-[8rem] font-light text-neutral-border leading-none select-none">404</p>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Fuel size={20} className="text-primary" />
          <h1 className="text-2xl font-bold text-neutral-text">Page Not Found</h1>
        </div>
        <p className="text-neutral-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white
            font-semibold px-6 py-2.5 rounded-lg text-sm transition shadow-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
