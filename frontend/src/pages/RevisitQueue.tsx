import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useApiClient } from '../api/useApiClient';
import type { Problem } from '../types/problem';

type Bucket = 'overdue' | 'due' | 'upcoming' | 'unscheduled';

export default function RevisitQueue() {
    const fetchApi = useApiClient();
    const [activeBucket, setActiveBucket] = useState<Bucket>('due');

    const { data: problems, isLoading, error } = useQuery<Problem[]>({
        queryKey: ['revisitQueue', activeBucket],
        queryFn: async () => {
            const res = await fetchApi(`/revisit-queue?bucket=${activeBucket}`);
            if (!res.ok) throw new Error('Failed to fetch queue');
            return res.json();
        }
    });

    const tabs: { id: Bucket; label: string }[] = [
        { id: 'overdue', label: 'Overdue' },
        { id: 'due', label: 'Due Today' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'unscheduled', label: 'Unscheduled' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Revisit Queue</h1>
                    <Link 
                        to="/dashboard" 
                        className="text-blue-600 hover:underline font-medium"
                    >
                        &larr; Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="flex border-b border-gray-200">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveBucket(tab.id)}
                                className={`flex-1 py-4 text-center font-medium text-sm transition-colors
                                    ${activeBucket === tab.id 
                                        ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-500">Loading problems...</div>
                        ) : error ? (
                            <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">Error loading queue.</div>
                        ) : problems?.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No problems found in the {activeBucket} bucket.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="p-4 font-semibold text-gray-700">Name</th>
                                            <th className="p-4 font-semibold text-gray-700">Topic</th>
                                            <th className="p-4 font-semibold text-gray-700">Difficulty</th>
                                            <th className="p-4 font-semibold text-gray-700">Status</th>
                                            <th className="p-4 font-semibold text-gray-700">Next Revisit</th>
                                            <th className="p-4 font-semibold text-gray-700 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {problems?.map(p => (
                                            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-4 font-medium text-gray-900">{p.name}</td>
                                                <td className="p-4 text-gray-600">{p.topic || '-'}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                                        ${p.difficulty === 1 ? 'bg-green-100 text-green-800' : 
                                                          p.difficulty === 2 ? 'bg-yellow-100 text-yellow-800' : 
                                                          p.difficulty === 3 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {p.difficulty === 1 ? 'Easy' : p.difficulty === 2 ? 'Medium' : p.difficulty === 3 ? 'Hard' : '-'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-sm ${p.status === 'Solved' ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium text-gray-700">
                                                    {p.nextRevisitDate || 'Unscheduled'}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Link to={`/problems/${p.id}/attempts`} className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                                                        Attempt Now &rarr;
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
