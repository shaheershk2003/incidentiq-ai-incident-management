import sql from "mssql/msnodesqlv8";
import dotenv from "dotenv";

dotenv.config();

const sqlConfig: sql.config = {
  server: process.env.SQL_SERVER || "localhost",
  database: process.env.SQL_DATABASE || "IncidentManagementDB",
  driver: "ODBC Driver 18 for SQL Server",
  options: {
    trustedConnection: true,
    trustServerCertificate:
      process.env.SQL_TRUST_SERVER_CERTIFICATE === "true",
  },
};
let pool: sql.ConnectionPool | null = null;

export async function connectSQLServer(): Promise<sql.ConnectionPool> {
  if (pool?.connected) {
    return pool;
  }

  try {
    pool = await sql.connect(sqlConfig);
    console.log("SQL Server connected successfully");
    return pool;
  } catch (error) {
    console.error("SQL Server connection failed:", error);
    throw error;
  }
}

export function getSQLPool(): sql.ConnectionPool {
  if (!pool?.connected) {
    throw new Error("SQL Server is not connected");
  }

  return pool;
}