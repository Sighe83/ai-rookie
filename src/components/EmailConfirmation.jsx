import React from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const EmailConfirmation = ({ email, onBackToLogin, siteMode = 'b2c' }) => {
  const isB2B = siteMode === 'b2b';

  return (
    <div className="max-w-md mx-auto bg-slate-800 rounded-lg p-8 text-center">
      <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
        isB2B ? 'bg-green-600' : 'bg-blue-600'
      }`}>
        <Mail className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-4">
        Tjek din email
      </h2>
      
      <p className="text-slate-300 mb-2">
        Vi har sendt en bekræftelsesmail til:
      </p>
      
      <p className="text-white font-semibold mb-6 bg-slate-700 px-4 py-2 rounded-lg">
        {email}
      </p>
      
      <div className="bg-slate-700 rounded-lg p-4 mb-6 text-left">
        <div className="flex items-start gap-3">
          <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
            isB2B ? 'text-green-400' : 'text-blue-400'
          }`} />
          <div className="text-sm text-slate-300">
            <p className="font-medium mb-1">Næste skridt:</p>
            <p>Klik på linket i emailen for at bekræfte din konto og aktivere adgang til platformen.</p>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-slate-400 mb-6">
        <p>Kan du ikke finde emailen?</p>
        <p>Tjek din spam-mappe eller prøv at oprette kontoen igen.</p>
      </div>
      
      <button
        onClick={onBackToLogin}
        className={`w-full ${
          isB2B ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
      >
        <ArrowLeft className="w-4 h-4" />
        Jeg har bekræftet - log mig ind
      </button>
      
      <p className="text-xs text-slate-500 mt-4">
        Efter du har bekræftet din email, kan du logge ind med dine oplysninger.
      </p>
    </div>
  );
};

export default EmailConfirmation;