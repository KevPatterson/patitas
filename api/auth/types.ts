export type SessionPayload = {
  userId: number;
  email: string;
};

export type GoogleProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
