import type { HeatmapEntry } from './stats';
import type { Attempt } from './attempt';

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
  problems?: FriendSummaryProblem[];
  solvedProblems?: FriendSummaryProblem[];
  heatmap: HeatmapEntry[];
}

export interface FriendProblemDetailResponse {
  id: string;
  title: string;
  platform: string;
  url: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  primaryTopicId?: string;
  primaryTopicName?: string;
  extraTopicNames?: string[];
  optimalTime?: string;
  optimalSpace?: string;
  currentStatus?: string;
  createdAt?: string;
  attempts: Attempt[];
}
