export interface Problem {
    id: string;
    title: string;
    platform: string;
    url: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    primaryTopicId: string;
    primaryTopicName: string;
    extraTopicNames: string[];
    optimalTime?: string;
    optimalSpace?: string;
    currentStatus: string;
    lastSuccessfulAt?: string;
    nextRevisitDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProblemRequest {
    title: string;
    platform?: string;
    url?: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    primaryTopicId: string;
    extraTopicIds?: string[];
    optimalTime?: string;
    optimalSpace?: string;
}
