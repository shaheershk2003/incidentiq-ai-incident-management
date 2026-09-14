import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByEmail, User } from "../repositories/userRepository";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-later";

export interface LoginResult {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: User["role"];
  };
}

export async function login(
  email: string,
  password: string
): Promise<LoginResult | null> {
  const user = await findUserByEmail(email);

  if (!user || !user.isActive) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    return null;
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}