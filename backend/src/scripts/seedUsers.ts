import bcrypt from "bcryptjs";
import sql from "mssql/msnodesqlv8";
import dotenv from "dotenv";
import { connectSQLServer, getSQLPool } from "../config/database";

dotenv.config();

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "AGENT";
}

const users: SeedUser[] = [
  {
    name: "System Admin",
    email: "admin@incident.local",
    password: "Admin@123",
    role: "ADMIN",
  },
  {
    name: "Incident Agent",
    email: "agent@incident.local",
    password: "Agent@123",
    role: "AGENT",
  },
];

async function seedUsers() {
  try {
    await connectSQLServer();

    const pool = getSQLPool();

    for (const user of users) {
      const existingUser = await pool
        .request()
        .input("email", sql.NVarChar(255), user.email)
        .query(`
          SELECT Id
          FROM dbo.Users
          WHERE Email = @email
        `);

      if (existingUser.recordset.length > 0) {
        console.log(`User already exists: ${user.email}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(user.password, 12);

      await pool
        .request()
        .input("name", sql.NVarChar(100), user.name)
        .input("email", sql.NVarChar(255), user.email)
        .input("passwordHash", sql.NVarChar(255), passwordHash)
        .input("role", sql.NVarChar(20), user.role)
        .query(`
          INSERT INTO dbo.Users
          (
            Name,
            Email,
            PasswordHash,
            Role
          )
          VALUES
          (
            @name,
            @email,
            @passwordHash,
            @role
          )
        `);

      console.log(`Seeded user: ${user.email} (${user.role})`);
    }
  } catch (error) {
    console.error("User seeding failed:", error);
    process.exitCode = 1;
  }
}

seedUsers();