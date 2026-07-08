import client from "./client";

export interface Cycle {
  id: string;
  name: string;
  period_from: string;
  period_to: string;
  status: string;
  created_at: string;
}

export interface CycleListResponse {
  cycles: Cycle[];
}

export interface Participant {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  designation: string;
  lead_id: string | null;
  lead_name: string | null;
  assigned_hr_id: string | null;
  status: string;
  meeting_time: string | null;
}

export interface ParticipantListResponse {
  participants: Participant[];
}

export interface EmployeeItem {
  id: string;
  username: string;
  employee_id: string;
  full_name: string;
  designation: string;
  role: string;
  created_at: string;
}

export interface EmployeeListResponse {
  employees: EmployeeItem[];
}

export interface AddEmployeeResponse {
  id: string;
  username: string;
  employee_id: string;
  generated_password: string;
  message: string;
}

export async function createCycle(data: {
  name: string;
  period_from: string;
  period_to: string;
}): Promise<Cycle> {
  const res = await client.post<Cycle>("/api/hr/cycles", data);
  return res.data;
}

export async function listCycles(): Promise<CycleListResponse> {
  const res = await client.get<CycleListResponse>("/api/hr/cycles");
  return res.data;
}

export async function addParticipants(
  cycleId: string,
  employeeIds: string[]
): Promise<ParticipantListResponse> {
  const res = await client.post<ParticipantListResponse>(
    `/api/hr/cycles/${cycleId}/participants`,
    { employee_ids: employeeIds }
  );
  return res.data;
}

export async function startCycle(cycleId: string): Promise<{ message: string; status: string }> {
  const res = await client.post(`/api/hr/cycles/${cycleId}/start`);
  return res.data;
}

export async function listParticipants(cycleId: string): Promise<ParticipantListResponse> {
  const res = await client.get<ParticipantListResponse>(`/api/hr/cycles/${cycleId}/participants`);
  return res.data;
}

export async function proceedParticipant(
  participantId: string
): Promise<{ message: string; status: string }> {
  const res = await client.post(`/api/hr/participants/${participantId}/proceed`);
  return res.data;
}

export async function scheduleMeeting(
  participantId: string,
  hrId: string,
  meetingTime: string
): Promise<{ message: string; status: string }> {
  const res = await client.post(`/api/hr/participants/${participantId}/schedule-meeting`, {
    hr_id: hrId,
    meeting_time: meetingTime,
  });
  return res.data;
}

export async function listEmployees(): Promise<EmployeeListResponse> {
  const res = await client.get<EmployeeListResponse>("/api/hr/employees");
  return res.data;
}

export async function addEmployee(data: {
  username: string;
  full_name: string;
  designation: string;
  date_of_joining?: string;
  skillset?: string;
}): Promise<AddEmployeeResponse> {
  const res = await client.post<AddEmployeeResponse>("/api/hr/employees", data);
  return res.data;
}
