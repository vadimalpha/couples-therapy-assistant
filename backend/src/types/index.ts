import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  relationshipId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  token: string;
  inviterId: string;
  inviterEmail: string;
  partnerEmail: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface SurrealDBResponse<T> {
  result?: T;
  error?: string;
}

export type SessionType =
  | 'intake'
  | 'individual_a'
  | 'individual_b'
  | 'joint_context_a'
  | 'joint_context_b'
  | 'relationship_shared';

export type MessageRole = 'user' | 'ai' | 'partner-a' | 'partner-b';

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  senderId?: string;
  timestamp: string;
}

export interface ConversationSession {
  id: string;
  conflictId?: string;
  userId: string;
  sessionType: SessionType;
  status: 'active' | 'finalized';
  messages: ConversationMessage[];
  createdAt: string;
  finalizedAt?: string;
}

export type ConflictStatus =
  | 'partner_a_chatting'
  | 'pending_partner_b'
  | 'partner_b_chatting'
  | 'both_finalized';

export type ConflictPrivacy = 'private' | 'shared';

export interface Conflict {
  id: string;
  title: string;
  privacy: ConflictPrivacy;
  status: ConflictStatus;
  partner_a_id: string;
  partner_b_id?: string;
  partner_a_session_id?: string;
  partner_b_session_id?: string;
  relationship_id: string;
  created_at: string;
  updated_at: string;
}
