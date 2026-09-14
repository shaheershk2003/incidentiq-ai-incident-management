import {
  createComment,
  getCommentsByIncident,
} from "../repositories/commentRepository";
import { logActivity } from "./activityService";

export async function addComment(
  incidentId: number,
  userId: number,
  commentText: string
) {
  const comment = await createComment(
    incidentId,
    userId,
    commentText
  );

  await logActivity(
    incidentId,
    "COMMENT_ADDED",
    userId,
    {
      commentId: comment.id,
    }
  );

  return comment;
}

export async function listComments(incidentId: number) {
  return getCommentsByIncident(incidentId);
}