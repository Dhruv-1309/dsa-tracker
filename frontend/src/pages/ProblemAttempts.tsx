import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../api/useApiClient';
import type { Problem } from '../types/problem';
import type { Attempt, AttemptRequest } from '../types/attempt';

export default function ProblemAttempts() {
    const { id } = useParams<{ id: string }>();
    const fetchApi = useApiClient();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<AttemptRequest>({
        date: new Date().toISOString().split('T')[0],
        thinkingResult: 'Found Logic Immediately',
        codingResult: 'Implemented Optimally',
        timeComplexity: '',
        spaceComplexity: '',
        confidence: 'High',
        notes: '',
        nextRevisitDate: ''
    });

    const { data: problem } = useQuery({
        queryKey: ['problem', id],
        queryFn: async () => {
            const res = await fetchApi(`/problems/${id}`);
            if (!res.ok) throw new Error('Not found');
            return (await res.json()) as Problem;
        }
    });

    const { data: attempts, isLoading } = useQuery({
        queryKey: ['attempts', id],
        queryFn: async () => {
            const res = await fetchApi(`/problems/${id}/attempts`);
            if (!res.ok) throw new Error('Failed to fetch attempts');
            return (await res.json()) as Attempt[];
        }
    });

    const mutation = useMutation({
        mutationFn: async (newAttempt: AttemptRequest) => {
            const res = await fetchApi(`/problems/${id}/attempts`, {
                method: 'POST',
                body: JSON.stringify(newAttempt)
            });
            if (!res.ok) throw new Error('Failed to log attempt');
            return res.json();
        },
        onSuccess: () => {
            // Invalidate both attempts list and the parent problem (since its status changes)
            queryClient.invalidateQueries({ queryKey: ['attempts', id] });
            queryClient.invalidateQueries({ queryKey: ['problem', id] });
            queryClient.invalidateQueries({ queryKey: ['problems'] }); // Refresh the main list too
            
            // Reset form for next attempt
            setFormData(prev => ({
                ...prev,
                notes: '',
                timeComplexity: '',
                spaceComplexity: ''
            }));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {problem?.name ? `Attempts for: ${problem.name}` : 'Loading...'}
                        </h1>
                        <p className="text-gray-500 mt-1">Status: <span className="font-semibold text-gray-700">{problem?.status}</span></p>
                    </div>
                    <Link to="/dashboard" className="text-blue-600 hover:underline font-medium">&larr; Back to Dashboard</Link>
                </div>

                {/* Form Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Log New Attempt</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Next Revisit Date</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={formData.nextRevisitDate}
                                    onChange={e => setFormData({...formData, nextRevisitDate: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Thinking Result *</label>
                                <select
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={formData.thinkingResult}
                                    onChange={e => setFormData({...formData, thinkingResult: e.target.value})}
                                >
                                    <option value="Found Logic Immediately">Found Logic Immediately</option>
                                    <option value="Found Logic After Struggling">Found Logic After Struggling</option>
                                    <option value="Could Not Find Logic">Could Not Find Logic</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Coding Result *</label>
                                <select
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={formData.codingResult}
                                    onChange={e => setFormData({...formData, codingResult: e.target.value})}
                                >
                                    <option value="Implemented Optimally">Implemented Optimally</option>
                                    <option value="Implemented Suboptimally">Implemented Suboptimally</option>
                                    <option value="Attempted, Could Not Finish">Attempted, Could Not Finish</option>
                                    <option value="N/A">N/A</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Time Complexity</label>
                                <input
                                    type="text"
                                    placeholder="e.g. O(N)"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={formData.timeComplexity}
                                    onChange={e => setFormData({...formData, timeComplexity: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Space Complexity</label>
                                <input
                                    type="text"
                                    placeholder="e.g. O(1)"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={formData.spaceComplexity}
                                    onChange={e => setFormData({...formData, spaceComplexity: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confidence</label>
                                <select
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={formData.confidence}
                                    onChange={e => setFormData({...formData, confidence: e.target.value})}
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes / Learnings</label>
                            <textarea
                                rows={3}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium"
                            >
                                {mutation.isPending ? 'Logging...' : 'Log Attempt'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* History Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Attempt History</h2>
                    {isLoading ? (
                        <p className="text-gray-500">Loading history...</p>
                    ) : attempts?.length === 0 ? (
                        <p className="text-gray-500 italic">No attempts logged yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {attempts?.map(attempt => (
                                <div key={attempt.id} className="border border-gray-100 bg-gray-50 p-4 rounded-md">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-gray-800">{attempt.date}</span>
                                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-medium">Confidence: {attempt.confidence}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-2">
                                        <div><span className="font-medium">Thinking:</span> {attempt.thinkingResult}</div>
                                        <div><span className="font-medium">Coding:</span> {attempt.codingResult}</div>
                                    </div>
                                    {(attempt.timeComplexity || attempt.spaceComplexity) && (
                                        <div className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium">Complexity:</span> Time: {attempt.timeComplexity || 'N/A'}, Space: {attempt.spaceComplexity || 'N/A'}
                                        </div>
                                    )}
                                    {attempt.notes && (
                                        <div className="mt-2 text-sm text-gray-600 bg-white p-2 border border-gray-200 rounded">
                                            {attempt.notes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
