export interface StatsSummary {
    statusCounts: Record<string, number>;
    difficultyCounts: Record<string, number>;
    platformCounts: Record<string, number>;
    totalProblems: number;
    dueOrOverdueCount: number;
}

export interface HeatmapEntry {
    date: string; // YYYY-MM-DD
    count: number;
}

export interface TopicProgress {
    topicId: string;
    topicName: string;
    totalProblems: number;
    solvedProblems: number;
}

export interface MistakeFrequency {
    mistakeTagName: string;
    count: number;
}
