export interface UserRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  password: string;
  phone: string | null;
  profile_image: string | null;
  role: 'USER' | 'ADMIN';
  email_verified: boolean;
  status: boolean;
  created_at: Date;
  updated_at: Date;
}

/** User shape safe to return to clients (no password hash). */
export type SafeUser = Omit<UserRow, 'password'>;

export function toSafeUser(user: UserRow): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest;
}
