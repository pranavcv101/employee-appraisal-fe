import client from "./client";

export interface MyAppraisal {
  id: string;
  cycle_name: string;
  period_from: string;
  period_to: string;
  status: string;
  has_self_appraisal: boolean;
}

export interface MyAppraisalListResponse {
  appraisals: MyAppraisal[];
}

export interface AppraisalDetails {
  id: string;
  status: string;
  cycle_name: string;
  employee_name: string;
  employee_code: string;
  self_appraisal?: {
    team_worked_in: string;
    contributions: string;
    challenges: string;
    skills_improved: string;
    feedback_acted_on: string;
    additional_responsibilities: string;
    future_goals: string;
    submitted_at: string;
  };
  performance_ratings?: {
    category: string;
    item: string;
    rating: number;
    strengths?: string;
    improvement_needs?: string;
    reason_for_high_rating?: string;
  }[];
  development_plans?: {
    category: string;
    individual_objectives: string;
    development_plan: string;
  }[];
  additional_remarks?: {
    appraisee_remarks?: string;
    appraiser_remarks?: string;
    special_mentions?: string;
  };
}

export interface ReviewItem {
  id: string;
  cycle_name: string;
  employee_name: string;
  employee_code: string;
  status: string;
}

export interface ReviewListResponse {
  reviews: ReviewItem[];
}

export interface MeetingItem {
  id: string;
  cycle_name: string;
  employee_name: string;
  employee_code: string;
  lead_name: string | null;
  meeting_time: string;
  status: string;
}

export interface MeetingListResponse {
  meetings: MeetingItem[];
}

export interface SelfAppraisalPayload {
  lead_employee_id: string;
  team_worked_in: string;
  contributions: string;
  challenges: string;
  skills_improved: string;
  feedback_acted_on: string;
  additional_responsibilities: string;
  future_goals: string;
}

export interface RatingItemPayload {
  category: string;
  item: string;
  rating: number;
  strengths?: string;
  improvement_needs?: string;
  reason_for_high_rating?: string;
}

export interface MeetingCompletePayload {
  development_plans: {
    category: string;
    individual_objectives: string;
    development_plan: string;
  }[];
  additional_remarks: {
    appraisee_remarks?: string;
    appraiser_remarks?: string;
    special_mentions?: string;
  };
}

export async function getMyAppraisals(): Promise<MyAppraisalListResponse> {
  const res = await client.get<MyAppraisalListResponse>("/api/employee/my-appraisals");
  return res.data;
}

export async function getAppraisalDetails(participantId: string): Promise<AppraisalDetails> {
  const res = await client.get<AppraisalDetails>(`/api/employee/my-appraisals/${participantId}`);
  return res.data;
}

export async function submitSelfAppraisal(
  participantId: string,
  data: SelfAppraisalPayload
): Promise<{ message: string; status: string }> {
  const res = await client.post(`/api/employee/my-appraisals/${participantId}/self-appraisal`, data);
  return res.data;
}

export async function getReviews(): Promise<ReviewListResponse> {
  const res = await client.get<ReviewListResponse>("/api/employee/reviews");
  return res.data;
}

export async function submitPerformanceRating(
  participantId: string,
  ratings: RatingItemPayload[]
): Promise<{ message: string; status: string }> {
  const res = await client.post(`/api/employee/reviews/${participantId}/performance-rating`, { ratings });
  return res.data;
}

export async function getMeetings(): Promise<MeetingListResponse> {
  const res = await client.get<MeetingListResponse>("/api/employee/meetings");
  return res.data;
}

export async function completeMeeting(
  participantId: string,
  data: MeetingCompletePayload
): Promise<{ message: string; status: string }> {
  const res = await client.post(`/api/employee/meetings/${participantId}/complete`, data);
  return res.data;
}
