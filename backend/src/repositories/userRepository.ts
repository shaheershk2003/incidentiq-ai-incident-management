import sql from "mssql/msnodesqlv8";
import { getSQLPool } from "../config/database";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "AGENT";
  isActive: boolean;
  createdAt: Date;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
}

export async function findUserByEmail(
  email: string
): Promise<User | null> {
  const pool = getSQLPool();

  const result = await pool
    .request()
    .input(
      "email",
      sql.NVarChar(255),
      email
    )
    .query<User>(`
      SELECT
        Id AS id,
        Name AS name,
        Email AS email,
        PasswordHash AS passwordHash,
        Role AS role,
        IsActive AS isActive,
        CreatedAt AS createdAt
      FROM dbo.Users
      WHERE Email = @email
    `);

  return result.recordset[0] ?? null;
}

export async function getActiveUsers(): Promise<UserSummary[]> {
  const pool = getSQLPool();

  const result = await pool
    .request()
    .query<UserSummary>(`
      SELECT
        Id AS id,
        Name AS name,
        Email AS email,
        Role AS role
      FROM dbo.Users
      WHERE IsActive = 1
      ORDER BY Name ASC
    `);

  return result.recordset;
}