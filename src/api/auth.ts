import client from "./client";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  username: string;
  company_name: string;
}

export interface AddHRResponse {
  username: string;
  generated_password: string;
  message: string;
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
