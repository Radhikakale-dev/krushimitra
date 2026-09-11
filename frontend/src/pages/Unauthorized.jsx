import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-2xl p-8 border-red-500/20 text-center shadow-lg shadow-red-950/20">
        <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
          <ShieldAlert className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-bold text-content mb-2 font-sans">Access Denied</h1>
        <p className="text-content-muted text-sm mb-8 font-sans">You do not have the required permissions to view this resource. Please contact your shop administrator.</p>
        
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-surface-hover border border-divider hover:bg-dark-700 text-content font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
