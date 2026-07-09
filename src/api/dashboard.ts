import client from "./client";

export interface Headcount {
  total: number;
  admin: number;
  hr: number;
  employee: number;
}

export interface DesignationCount {
  designation: string;
  count: number;
}

export interface SkillsetCount {
  skillset: string;
  count: number;
}

export interface JoiningTrendItem {
  month: string;
  count: number;
}

export interface CycleSummary {
  total: number;
  draft: number;
  active: number;
  completed: number;
}

export interface RecentHire {
  full_name: string;
  designation: string;
  employee_id: string;
  date_of_joining: string | null;
}

export interface AdminStats {
  headcount: Headcount;
  designation_distribution: DesignationCount[];
  joining_trend: JoiningTrendItem[];
  cycle_summary: CycleSummary;
  recent_hires: RecentHire[];
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface CycleProgress {
  cycle_name: string;
  total_participants: number;
  status_breakdown: StatusBreakdown[];
}

export interface CompletionRate {
  cycle_name: string;
  completed_count: number;
  total_count: number;
  percentage: number;
}

export interface CategoryRating {
  category: string;
  avg_rating: number;
}

export interface TopPerformer {
  employee_name: string;
  designation: string;
  employee_id: string;
  avg_rating: number;
}

export interface UpcomingMeeting {
  participant_id: string;
  cycle_name: string;
  employee_name: string;
  lead_name: string | null;
  hr_name: string | null;
  meeting_time: string;
}

export interface HRHeadcount {
  total_employees: number;
  active_cycles: number;
}

export interface HRStats {
  headcount: HRHeadcount;
  active_cycle_progress: CycleProgress[];
  completion_rate: CompletionRate[];
  avg_ratings_by_category: CategoryRating[];
  top_performers: TopPerformer[];
  upcoming_meetings: UpcomingMeeting[];
  designation_distribution: DesignationCount[];
  skillset_distribution: SkillsetCount[];
}

export interface EmployeeSummary {
  total_appraisals: number;
  completed: number;
  in_progress: number;
}

export interface CycleHistoryItem {
  cycle_name: string;
  period_from: string;
  period_to: string;
  status: string;
  overall_avg_rating: number | null;
}

export interface EmployeeStats {
  my_summary: EmployeeSummary;
  my_ratings: CategoryRating[];
  my_cycle_history: CycleHistoryItem[];
  upcoming_meetings: UpcomingMeeting[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await client.get<AdminStats>("/api/dashboard/admin/stats");
  return res.data;
}

export async function getHRStats(): Promise<HRStats> {
  const res = await client.get<HRStats>("/api/dashboard/hr/stats");
  return res.data;
}

export async function getEmployeeStats(): Promise<EmployeeStats> {
  const res = await client.get<EmployeeStats>("/api/dashboard/employee/stats");
  return res.data;
}
