import client from "./client";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  username: string;
  company_name: string;
}

export interface AddHRResponse {
  id: string;
  username: string;
  generated_password: string;
  message: string;
}

export interface HRItem {
  id: string;
  username: string;
  created_at: string;
}

export interface HRListResponse {
  hr_list: HRItem[];
}

export async function register(
  companyName: string,
  username: string,
  password: string
): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>("/api/auth/register", {
    company_name: companyName,
    username,
    password,
  });
  return res.data;
}

export async function login(
  companyName: string,
  username: string,
  password: string
): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>("/api/auth/login", {
    company_name: companyName,
    username,
    password,
  });
  return res.data;
}

export async function addHR(username: string): Promise<AddHRResponse> {
  const res = await client.post<AddHRResponse>("/api/admin/add-hr", {
    username,
  });
  return res.data;
}

export async function listHRs(): Promise<HRListResponse> {
  const res = await client.get<HRListResponse>("/api/admin/hrs");
  return res.data;
}

export async function removeHR(hrId: string): Promise<void> {
  await client.delete(`/api/admin/hrs/${hrId}`);
}
