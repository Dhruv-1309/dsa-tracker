export interface Attempt {
    id: string;
    problemId: string;
    date: string;
    thinkingResult: string;
    codingResult: string;
    timeComplexity: string;
    spaceComplexity: string;
    confidence: string;
    notes: string;
    nextRevisitDate: string;
    createdAt: string;
}

export type AttemptRequest = Partial<Omit<Attempt, 'id' | 'problemId' | 'createdAt'>>;
