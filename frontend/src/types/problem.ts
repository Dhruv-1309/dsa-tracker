export interface Problem {
    id: string;
    name: string;
    topic: string;
    link: string;
    difficulty: number;
    approachNotes: string;
    status: string;
    confidence: string;
    nextRevisitDate: string;
    totalAttempts: number;
    timesSolved: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProblemRequest {
    name: string;
    topic?: string;
    link?: string;
    difficulty?: number;
    approachNotes?: string;
    status?: string;
    confidence?: string;
}
