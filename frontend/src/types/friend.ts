import type { HeatmapEntry } from './stats';

export interface FriendCodeResponse {
  friendCode: string;
  code: string;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  createdAt: string;
}

export interface Friend {
  id: string;
  friendUserId: string;
  displayName: string;
  email: string;
  respondedAt: string;
}

export interface FriendSummaryProblem {
  id: string;
  title: string;
  platform: string;
  url: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  primaryTopicName: string;
  currentStatus: string;
}

export interface FriendSummaryResponse {
  friendUserId: string;
  displayName: string;
  email: string;
  solvedProblems: FriendSummaryProblem[];
  heatmap: HeatmapEntry[];
}
