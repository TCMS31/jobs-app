export interface UserRegistration {
  name: string;
  email: string;
  password: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

/** What a successful login returns. Never contains the password or its hash. */
export interface AuthSession {
  authtoken: string;
  userId: string;
  name: string;
}
