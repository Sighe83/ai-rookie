import React from 'react';

const TestApp = () => {
  console.log('TestApp rendering...');
  
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🚀 AI Rookie Test</h1>
        <p className="text-slate-400 mb-4">Hvis du kan se dette, virker React!</p>
        <div className="bg-green-600 text-white px-4 py-2 rounded inline-block">
          ✅ Frontend fungerer
        </div>
      </div>
    </div>
  );
};

export default TestApp;
