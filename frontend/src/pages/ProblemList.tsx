import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useApiClient } from '../api/useApiClient';
import type { Problem } from '../types/problem';
import { useAuth } from '../context/AuthContext';

export default function ProblemList() {
    const fetchApi = useApiClient();
    const queryClient = useQueryClient();
    const { logout } = useAuth();
    
    const [search, setSearch] = useState('');
    const [topic, setTopic] = useState('');
    const [status, setStatus] = useState('');

    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (topic) queryParams.append('topic', topic);
    if (status) queryParams.append('status', status);
    // Add sorting by default to most recently created
    queryParams.append('sort', 'createdAt,desc');

    const { data: problems, isLoading, error } = useQuery<Problem[]>({
        queryKey: ['problems', search, topic, status],
        queryFn: async () => {
            const res = await fetchApi(`/problems?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch problems');
            return res.json();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetchApi(`/problems/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete problem');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['problems'] });
        }
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Problems</h1>
                    <div className="flex space-x-4">
                        <Link 
                            to="/problems/new" 
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                        >
                            + Add Problem
                        </Link>
                        <button 
                            onClick={logout}
                            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-end border border-gray-100">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input 
                            type="text" 
                            placeholder="Problem name..."
                            className="w-full border border-gray-300 rounded-md p-2"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                        <select 
                            className="w-full border border-gray-300 rounded-md p-2"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        >
                            <option value="">All Topics</option>
                            <option value="Arrays">Arrays</option>
                            <option value="Strings">Strings</option>
                            <option value="Linked List">Linked List</option>
                            <option value="Trees">Trees</option>
                            <option value="Graphs">Graphs</option>
                            <option value="Dynamic Programming">Dynamic Programming</option>
                        </select>
                    </div>
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                            className="w-full border border-gray-300 rounded-md p-2"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Not Attempted">Not Attempted</option>
                            <option value="Attempted">Attempted</option>
                            <option value="Solved">Solved</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading problems...</div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-md">Error loading problems.</div>
                ) : problems?.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-500 mb-4">No problems found matching your criteria.</p>
                        <Link to="/problems/new" className="text-blue-600 hover:underline">Add your first problem</Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 font-semibold text-gray-700">Name</th>
                                    <th className="p-4 font-semibold text-gray-700">Topic</th>
                                    <th className="p-4 font-semibold text-gray-700">Difficulty</th>
                                    <th className="p-4 font-semibold text-gray-700">Status</th>
                                    <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {problems?.map(p => (
                                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4">
                                            {p.link ? (
                                                <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                                    {p.name}
                                                </a>
                                            ) : (
                                                <span className="font-medium text-gray-900">{p.name}</span>
                                            )}
                                        </td>
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
                                        <td className="p-4 text-right space-x-3">
                                            <Link to={`/problems/${p.id}/attempts`} className="text-green-600 hover:text-green-900 text-sm font-medium mr-2">
                                                Attempts
                                            </Link>
                                            <Link to={`/problems/${p.id}/edit`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                                                Edit
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(p.id, p.name)}
                                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                disabled={deleteMutation.isPending}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
