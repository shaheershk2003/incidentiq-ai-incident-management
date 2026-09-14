import sql from "mssql/msnodesqlv8";
import { getSQLPool } from "../config/database";

export interface Comment {
  id: number;
  incidentId: number;
  userId: number;
  commentText: string;
  createdAt: Date;
}

export async function createComment(
  incidentId: number,
  userId: number,
  commentText: string
): Promise<Comment> {
  const pool = getSQLPool();

  const result = await pool
    .request()
    .input("incidentId", sql.Int, incidentId)
    .input("userId", sql.Int, userId)
    .input("commentText", sql.NVarChar(sql.MAX), commentText)
    .query<Comment>(`
      INSERT INTO dbo.Comments
      (
        IncidentId,
        UserId,
        CommentText
      )
      OUTPUT
        INSERTED.Id AS id,
        INSERTED.IncidentId AS incidentId,
        INSERTED.UserId AS userId,
        INSERTED.CommentText AS commentText,
        INSERTED.CreatedAt AS createdAt
      VALUES
      (
        @incidentId,
        @userId,
        @commentText
      );
    `);

  return result.recordset[0];
}

export async function getCommentsByIncident(
  incidentId: number
): Promise<Comment[]> {
  const pool = getSQLPool();

  const result = await pool
    .request()
    .input("incidentId", sql.Int, incidentId)
    .query<Comment>(`
      SELECT
        Id AS id,
        IncidentId AS incidentId,
        UserId AS userId,
        CommentText AS commentText,
        CreatedAt AS createdAt
      FROM dbo.Comments
      WHERE IncidentId = @incidentId
      ORDER BY CreatedAt ASC;
    `);

  return result.recordset;
}