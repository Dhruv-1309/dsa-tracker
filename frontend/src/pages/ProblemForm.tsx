import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../api/useApiClient';
import type { Problem, ProblemRequest } from '../types/problem';

export default function ProblemForm() {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const fetchApi = useApiClient();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<ProblemRequest>({
        name: '',
        topic: '',
        link: '',
        difficulty: 1,
        approachNotes: '',
        status: 'Not Attempted',
    });

    // Fetch existing data if editing
    const { isLoading } = useQuery({
        queryKey: ['problem', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await fetchApi(`/problems/${id}`);
            if (!res.ok) throw new Error('Not found');
            const data: Problem = await res.json();
            setFormData({
                name: data.name,
                topic: data.topic || '',
                link: data.link || '',
                difficulty: data.difficulty || 1,
                approachNotes: data.approachNotes || '',
                status: data.status || 'Not Attempted',
            });
            return data;
        },
        enabled: isEdit
    });

    const mutation = useMutation({
        mutationFn: async (newProblem: ProblemRequest) => {
            const url = isEdit ? `/problems/${id}` : '/problems';
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetchApi(url, {
                method,
                body: JSON.stringify(newProblem)
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['problems'] });
            navigate('/dashboard');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    if (isEdit && isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Problem' : 'Add New Problem'}</h1>
                    <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">Cancel</Link>
                </div>

                {mutation.isError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                        Failed to save problem. Please try again.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Topic</label>
                            <input
                                type="text"
                                list="topics"
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                value={formData.topic}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            />
                            <datalist id="topics">
                                <option value="Arrays" />
                                <option value="Strings" />
                                <option value="Linked List" />
                                <option value="Trees" />
                                <option value="Graphs" />
                                <option value="Dynamic Programming" />
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                            <select
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: Number(e.target.value) })}
                            >
                                <option value={1}>Easy</option>
                                <option value={2}>Medium</option>
                                <option value={3}>Hard</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">URL Link</label>
                        <input
                            type="url"
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Not Attempted">Not Attempted</option>
                            <option value="Attempted">Attempted</option>
                            <option value="Solved">Solved</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Approach / Notes</label>
                        <textarea
                            rows={4}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={formData.approachNotes}
                            onChange={(e) => setFormData({ ...formData, approachNotes: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                        >
                            {mutation.isPending ? 'Saving...' : 'Save Problem'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
