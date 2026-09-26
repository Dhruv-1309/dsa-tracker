export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  timezone?: string;
  createdAt?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
