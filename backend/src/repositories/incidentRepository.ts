import sql from "mssql/msnodesqlv8";
import { getSQLPool } from "../config/database";

export interface Incident {
  id: number;
  incidentNumber: string;
  title: string;
  description: string;
  priority: "P1" | "P2" | "P3" | "P4";
  category:
    | "APPLICATION"
    | "DATABASE"
    | "NETWORK"
    | "SECURITY"
    | "INFRASTRUCTURE"
    | "AUTHENTICATION"
    | "OTHER";
  status:
    | "OPEN"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "CLOSED"
    | "REOPENED";
  createdBy: number;
  assignedTo: number | null;
  snapshotData: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

export interface CreateIncidentInput {
  title: string;
  description: string;
  priority: Incident["priority"];
  category: Incident["category"];
  createdBy: number;
  snapshotData?: string | null;
}

export async function createIncident(
  input: CreateIncidentInput
): Promise<Incident> {
  const pool = getSQLPool();

  const result = await pool
    .request()
    .input("title", sql.NVarChar(200), input.title)
    .input("description", sql.NVarChar(sql.MAX), input.description)
    .input("priority", sql.NVarChar(10), input.priority)
    .input("category", sql.NVarChar(50), input.category)
    .input("createdBy", sql.Int, input.createdBy)
    .input(
      "snapshotData",
      sql.NVarChar(sql.MAX),
      input.snapshotData ?? null
    )
    .query<Incident>(`
      INSERT INTO dbo.Incidents
      (
        IncidentNumber,
        Title,
        Description,
        Priority,
        Category,
        Status,
        CreatedBy,
        SnapshotData
      )
      OUTPUT
        INSERTED.Id AS id,
        INSERTED.IncidentNumber AS incidentNumber,
        INSERTED.Title AS title,
        INSERTED.Description AS description,
        INSERTED.Priority AS priority,
        INSERTED.Category AS category,
        INSERTED.Status AS status,
        INSERTED.CreatedBy AS createdBy,
        INSERTED.AssignedTo AS assignedTo,
        INSERTED.SnapshotData AS snapshotData,
        INSERTED.CreatedAt AS createdAt,
        INSERTED.UpdatedAt AS updatedAt,
        INSERTED.ResolvedAt AS resolvedAt
      VALUES
      (
        CONCAT(
          'INC-',
          NEXT VALUE FOR dbo.IncidentNumberSequence
        ),
        @title,
        @description,
        @priority,
        @category,
        'OPEN',
        @createdBy,
        @snapshotData
      );
    `);

  return result.recordset[0];
}

export async function getAllIncidents(): Promise<Incident[]> {
  const pool = getSQLPool();

  const result = await pool
    .request()
    .query<Incident>(`
      SELECT
        Id AS id,
        IncidentNumber AS incidentNumber,
        Title AS title,
        Description AS description,
        Priority AS priority,
        Category AS category,
        Status AS status,
        CreatedBy AS createdBy,
        AssignedTo AS assignedTo,
        SnapshotData AS snapshotData,
        CreatedAt AS createdAt,
        UpdatedAt AS updatedAt,
        ResolvedAt AS resolvedAt
      FROM dbo.Incidents
      ORDER BY CreatedAt DESC
    `);

  return result.recordset;
}

export async function getIncidentById(
  id: number
): Promise<Incident | null> {
  const pool = getSQLPool();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query<Incident>(`
      SELECT
        Id AS id,
        IncidentNumber AS incidentNumber,
        Title AS title,
        Description AS description,
        Priority AS priority,
        Category AS category,
        Status AS status,
        CreatedBy AS createdBy,
        AssignedTo AS assignedTo,
        SnapshotData AS snapshotData,
        CreatedAt AS createdAt,
        UpdatedAt AS updatedAt,
        ResolvedAt AS resolvedAt
      FROM dbo.Incidents
      WHERE Id = @id
    `);

  return result.recordset[0] ?? null;
}

export async function updateIncidentStatus(
  id: number,
  status: Incident["status"]
): Promise<Incident | null> {
  const pool = getSQLPool();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input("status", sql.NVarChar(30), status)
    .query<Incident>(`
      UPDATE dbo.Incidents
      SET
        Status = @status,
        UpdatedAt = SYSUTCDATETIME(),
        ResolvedAt =
          CASE
            WHEN @status = 'RESOLVED'
              THEN SYSUTCDATETIME()
            WHEN @status IN ('OPEN', 'IN_PROGRESS', 'REOPENED')
              THEN NULL
            ELSE ResolvedAt
          END
      OUTPUT
        INSERTED.Id AS id,
        INSERTED.IncidentNumber AS incidentNumber,
        INSERTED.Title AS title,
        INSERTED.Description AS description,
        INSERTED.Priority AS priority,
        INSERTED.Category AS category,
        INSERTED.Status AS status,
        INSERTED.CreatedBy AS createdBy,
        INSERTED.AssignedTo AS assignedTo,
        INSERTED.SnapshotData AS snapshotData,
        INSERTED.CreatedAt AS createdAt,
        INSERTED.UpdatedAt AS updatedAt,
        INSERTED.ResolvedAt AS resolvedAt
      WHERE Id = @id;
    `);

  return result.recordset[0] ?? null;
}

export async function assignIncident(
  incidentId: number,
  assignedTo: number
): Promise<Incident | null> {
  const pool = getSQLPool();

  const result = await pool
    .request()
    .input("incidentId", sql.Int, incidentId)
    .input("assignedTo", sql.Int, assignedTo)
    .query<Incident>(`
      UPDATE dbo.Incidents
      SET
        AssignedTo = @assignedTo,
        UpdatedAt = SYSUTCDATETIME()
      OUTPUT
        INSERTED.Id AS id,
        INSERTED.IncidentNumber AS incidentNumber,
        INSERTED.Title AS title,
        INSERTED.Description AS description,
        INSERTED.Priority AS priority,
        INSERTED.Category AS category,
        INSERTED.Status AS status,
        INSERTED.CreatedBy AS createdBy,
        INSERTED.AssignedTo AS assignedTo,
        INSERTED.SnapshotData AS snapshotData,
        INSERTED.CreatedAt AS createdAt,
        INSERTED.UpdatedAt AS updatedAt,
        INSERTED.ResolvedAt AS resolvedAt
      WHERE Id = @incidentId;
    `);

  return result.recordset[0] ?? null;
}