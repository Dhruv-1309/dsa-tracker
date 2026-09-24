export interface Attempt {
    id: string;
    problemId: string;
    attemptedAt: string;
    result: string;
    understood: boolean;
    logicFound: boolean;
    codeCompleted: boolean;
    timeTakenMin?: number;
    timeComplexity?: string;
    spaceComplexity?: string;
    confidence?: number;
    approach?: string;
    mistakes?: string;
    code?: string;
    language?: string;
    mistakeTags: string[];
}

export type AttemptRequest = {
    attemptedAt?: string;
    result: string;
    understood: boolean;
    logicFound: boolean;
    codeCompleted: boolean;
    timeTakenMin?: number;
    timeComplexity?: string;
    spaceComplexity?: string;
    confidence?: number;
    approach?: string;
    mistakes?: string;
    code?: string;
    language?: string;
    mistakeTagIds?: string[];
    nextRevisitDate?: string;
};
