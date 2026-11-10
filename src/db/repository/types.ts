import type {
  AiConversation,
  AiMessage,
  AnswerValue,
  BehaviorEvent,
  BehaviorEventType,
  CareerPostSurvey,
  CareerPostSurveyInput,
  ConfirmDepartmentPlanInput,
  DepartmentSelection,
  PreSurvey,
  ProjectSession,
  SessionStatus,
  StepProgress,
  StepStatus,
  Submission,
  TaskAnswer,
  TaskAnswerRevision,
  User,
  UserCredential,
} from '@/types/runtime';

export type CreateSessionInput = {
  userId: string;
  departmentSlug: string;
  projectKey: string;
  scenarioKey: string;
  scenarioVersion: number;
  deadlineHours: number;
  initialStepKey: string;
};

export type SaveAnswerInput = {
  sessionId: string;
  taskKey: string;
  value: AnswerValue;
  status: 'draft' | 'submitted';
};

export type RecordEventInput = {
  userId: string;
  sessionId: string | null;
  departmentSlug?: string | null;
  stepKey?: string | null;
  taskKey?: string | null;
  eventType: BehaviorEventType;
  metadata?: Record<string, unknown>;
};

export type EventFilter = {
  sessionId?: string;
  userId?: string;
  limit?: number;
};

/**
 * Persistence contract for all student runtime state.
 *
 * Two implementations exist and must stay behaviourally identical:
 *  - `DrizzleRepository` (Neon PostgreSQL, production)
 *  - `FileRepository`    (local JSON, used when DATABASE_URL is absent)
 */
export interface XPassRepository {
  readonly mode: 'neon' | 'file' | 'memory';

  // --- identity -----------------------------------------------------------
  findUserByEmail(email: string): Promise<User | null>;
  getUser(id: string): Promise<User | null>;
  /**
   * Creates the account, or returns `null` if that email already has one.
   *
   * Null rather than a thrown error because "this email is taken" is an
   * ordinary outcome of the sign-up form, not a fault. The check is part of
   * the write rather than a read before it, so two simultaneous sign-ups
   * cannot both decide the address is free.
   */
  createUser(input: { email: string; displayName: string }): Promise<User | null>;
  updateDisplayName(userId: string, displayName: string): Promise<User | null>;
  /** The stored password, or `null` for an account that has never set one. */
  getCredential(userId: string): Promise<UserCredential | null>;
  /** Sets or replaces the password. `updatedAt` comes from the caller's clock. */
  setPasswordHash(userId: string, passwordHash: string, updatedAt: string): Promise<void>;

  // --- onboarding ---------------------------------------------------------
  savePreSurvey(userId: string, answers: Record<string, unknown>): Promise<PreSurvey>;
  getPreSurvey(userId: string): Promise<PreSurvey | null>;
  /**
   * The pre-2+1 free pick of up to three departments. Kept for the records it
   * wrote; the app now confirms a plan with `confirmDepartmentPlan` instead.
   */
  saveDepartmentSelection(
    userId: string,
    departmentSlugs: string[],
  ): Promise<DepartmentSelection>;
  getDepartmentSelection(userId: string): Promise<DepartmentSelection | null>;
  /**
   * Saves a confirmed 2+1 plan — only if the student has not confirmed one
   * already, checked in the same write. Null when one was already confirmed.
   */
  confirmDepartmentPlan(
    userId: string,
    plan: ConfirmDepartmentPlanInput,
  ): Promise<DepartmentSelection | null>;

  // --- post-survey ----------------------------------------------------------
  getCareerPostSurvey(userId: string): Promise<CareerPostSurvey | null>;
  /**
   * Saves a draft. Null — and nothing written — when the survey was already
   * submitted, checked in the same write.
   */
  saveCareerPostSurveyDraft(userId: string, input: CareerPostSurveyInput): Promise<CareerPostSurvey | null>;
  /**
   * Submits, once. Null when it was already submitted (a second or a
   * concurrent submission), checked in the same write.
   */
  submitCareerPostSurvey(userId: string, input: CareerPostSurveyInput): Promise<CareerPostSurvey | null>;

  // --- sessions -----------------------------------------------------------
  createSession(input: CreateSessionInput): Promise<ProjectSession>;
  getSession(sessionId: string): Promise<ProjectSession | null>;
  listSessionsForUser(userId: string): Promise<ProjectSession[]>;
  findActiveSession(
    userId: string,
    departmentSlug: string,
  ): Promise<ProjectSession | null>;
  updateSession(
    sessionId: string,
    patch: Partial<Pick<ProjectSession, 'status' | 'currentStepKey' | 'completedAt'>> & {
      status?: SessionStatus;
    },
  ): Promise<ProjectSession>;

  // --- step progress ------------------------------------------------------
  listStepProgress(sessionId: string): Promise<StepProgress[]>;
  upsertStepProgress(
    sessionId: string,
    stepKey: string,
    patch: { status?: StepStatus; startedAt?: string | null; completedAt?: string | null },
  ): Promise<StepProgress>;

  // --- answers ------------------------------------------------------------
  listAnswers(sessionId: string): Promise<TaskAnswer[]>;
  getAnswer(sessionId: string, taskKey: string): Promise<TaskAnswer | null>;
  /** Appends a revision row whenever the stored value actually changes. */
  saveAnswer(input: SaveAnswerInput): Promise<TaskAnswer>;
  listRevisions(sessionId: string, taskKey?: string): Promise<TaskAnswerRevision[]>;

  // --- submissions --------------------------------------------------------
  createSubmission(input: {
    sessionId: string;
    taskKey: string;
    title: string;
    snapshot: Record<string, unknown>;
  }): Promise<Submission>;
  listSubmissions(sessionId: string): Promise<Submission[]>;

  // --- AI conversations ---------------------------------------------------
  getOrCreateConversation(input: {
    sessionId: string;
    personaKey: string;
    stepKey: string;
  }): Promise<AiConversation>;
  getConversation(conversationId: string): Promise<AiConversation | null>;
  listConversations(sessionId: string): Promise<AiConversation[]>;
  updateConversation(
    conversationId: string,
    patch: Partial<Pick<AiConversation, 'status' | 'revealedFactIds' | 'endedAt'>> & {
      state?: Record<string, unknown>;
    },
  ): Promise<AiConversation>;
  appendMessage(input: {
    conversationId: string;
    role: AiMessage['role'];
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<AiMessage>;
  listMessages(conversationId: string): Promise<AiMessage[]>;

  // --- behavior events ----------------------------------------------------
  recordEvent(input: RecordEventInput): Promise<BehaviorEvent>;
  listEvents(filter: EventFilter): Promise<BehaviorEvent[]>;
}
