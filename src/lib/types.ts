export interface AppUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string | null;
    avatar_url: string | null;
  };
}
