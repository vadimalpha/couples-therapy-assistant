export interface IndividualGuidanceJob {
  type: 'individual_guidance';
  sessionId: string;
  conflictId: string;
  partnerId: 'a' | 'b';
}

export interface JointContextGuidanceJob {
  type: 'joint_context_guidance';
  conflictId: string;
  partnerId: string;
}

export type GuidanceJob = IndividualGuidanceJob | JointContextGuidanceJob;
