import { useEffect, useState } from 'react';

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('Loading...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => setHealthStatus(data.status))
      .catch((err) => setHealthStatus('Error fetching health status: ' + err.message));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Monorepo Scaffold</h1>
        <p className="text-gray-600 mb-2">Frontend: Vite + React + TS + Tailwind</p>
        <p className="text-gray-600 mb-6">Backend: Spring Boot 3</p>
        <div className="p-4 bg-gray-50 rounded border border-gray-200">
          <span className="font-semibold text-gray-700">Backend Health: </span>
          <span className={`font-mono ${healthStatus === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
            {healthStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
