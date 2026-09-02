import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from '../api/useApiClient';

export default function Dashboard() {
    const { logout } = useAuth();
    const fetchApi = useApiClient();
    const [message, setMessage] = useState('Loading protected data...');

    useEffect(() => {
        const fetchProtectedData = async () => {
            try {
                const res = await fetchApi('/test/protected');
                if (res.ok) {
                    const text = await res.text();
                    setMessage(text);
                } else {
                    setMessage('Failed to load protected data.');
                }
            } catch (err) {
                setMessage('Error loading protected data.');
            }
        };

        fetchProtectedData();
    }, [fetchApi]);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <button 
                        onClick={logout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                    <p className="text-green-700 font-semibold">Logged in successfully!</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <h2 className="font-bold text-blue-800 mb-2">Backend Protected Endpoint Response:</h2>
                    <p className="text-blue-700 font-mono">{message}</p>
                </div>
            </div>
        </div>
    );
}
