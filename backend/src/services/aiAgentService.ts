import { getSingleIncident } from "./incidentService";
import { getAllIncidents } from "../repositories/incidentRepository";
import { generateAgentDecision } from "./llmAgentService";
import {
  updateIncidentStatusTool,
  addCommentTool,
  logAgentActivityTool,
} from "./aiAgentTools";

export interface SimilarIncident {
  incidentNumber: string;
  title: string;
  similarity: number;
}

export interface AgentResult {
  action: string;
  result: string;
  reason: string;
  confidence: number;
  source: "LLM" | "FALLBACK";
  similarIncidents: SimilarIncident[];
  recommendedResolution: string;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWords(value: string): Set<string> {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "is",
    "are",
    "was",
    "were",
    "this",
    "that",
    "from",
    "has",
    "have",
    "be",
    "been",
    "it",
    "as",
    "at",
    "by",
    "after",
    "during",
    "into",
    "unable",
    "issue",
    "problem",
    "service",
    "production",
  ]);

  return new Set(
    normalizeText(value)
      .split(" ")
      .filter(
        word =>
          word.length >= 3 &&
          !stopWords.has(word)
      )
  );
}

function calculateSimilarity(
  currentIncident: {
    title: string;
    description: string;
    category: string;
    priority: string;
  },
  candidate: {
    title: string;
    description: string;
    category: string;
    priority: string;
  }
): number {
  const currentWords = getWords(
    `${currentIncident.title} ${currentIncident.description}`
  );

  const candidateWords = getWords(
    `${candidate.title} ${candidate.description}`
  );

  if (
    currentWords.size === 0 ||
    candidateWords.size === 0
  ) {
    return 0;
  }

  let commonWords = 0;

  currentWords.forEach(word => {
    if (candidateWords.has(word)) {
      commonWords++;
    }
  });

  const unionSize =
    new Set([
      ...currentWords,
      ...candidateWords,
    ]).size;

  let score =
    unionSize > 0
      ? commonWords / unionSize
      : 0;

  if (
    currentIncident.category === candidate.category
  ) {
    score += 0.25;
  }

  if (
    currentIncident.priority === candidate.priority
  ) {
    score += 0.10;
  }

  return Math.min(score, 1);
}

async function findSimilarIncidents(
  incidentId: number,
  incident: Awaited<
    ReturnType<typeof getSingleIncident>
  >
): Promise<SimilarIncident[]> {
  if (!incident) {
    return [];
  }

  const incidents = await getAllIncidents();

  return incidents
    // Never include the current incident itself.
    .filter(
      candidate =>
        Number(candidate.id) !== Number(incidentId)
    )
    .map(candidate => {
      const similarity = calculateSimilarity(
        incident,
        candidate
      );

      return {
        incidentNumber:
          candidate.incidentNumber,
        title: candidate.title,
        similarity:
          Number.isFinite(similarity)
            ? Math.round(similarity * 100) / 100
            : 0,
      };
    })
    .filter(
      item =>
        Number.isFinite(item.similarity) &&
        item.similarity >= 0.15
    )
    .sort(
      (a, b) =>
        b.similarity - a.similarity
    )
    .slice(0, 3);
}

function generateRecommendedResolution(
  incident: Awaited<
    ReturnType<typeof getSingleIncident>
  >
): string {
  if (!incident) {
    return "Insufficient incident information to recommend a resolution.";
  }

  const text = normalizeText(
    `${incident.title} ${incident.description}`
  );

  if (
    text.includes("database") ||
    text.includes("sql") ||
    text.includes("connection") ||
    text.includes("query") ||
    text.includes("timeout")
  ) {
    return (
      "Validate database availability and connection-pool health, " +
      "review database and application logs, identify slow or failed " +
      "queries, and restore the affected database dependency."
    );
  }

  if (
    text.includes("authentication") ||
    text.includes("login") ||
    text.includes("credential") ||
    text.includes("identity") ||
    text.includes("token")
  ) {
    return (
      "Review authentication-service and identity-provider logs, " +
      "validate credentials and token configuration, and restore " +
      "the failing authentication dependency."
    );
  }

  if (
    text.includes("network") ||
    text.includes("gateway") ||
    text.includes("dns") ||
    text.includes("connectivity")
  ) {
    return (
      "Validate DNS, gateway, routing and network connectivity, " +
      "identify the affected dependency, and restore the failing " +
      "network component or configuration."
    );
  }

  if (
    text.includes("security") ||
    text.includes("attack") ||
    text.includes("unauthorized") ||
    text.includes("vulnerability")
  ) {
    return (
      "Review security logs and access patterns, contain suspicious " +
      "activity if required, validate affected systems, and apply " +
      "the appropriate security remediation."
    );
  }

  if (
    text.includes("cpu") ||
    text.includes("memory") ||
    text.includes("disk") ||
    text.includes("server") ||
    text.includes("infrastructure")
  ) {
    return (
      "Check infrastructure health and resource utilization, " +
      "identify the constrained host or service, restore required " +
      "capacity, and restart the affected service if necessary."
    );
  }

  if (
    text.includes("deployment") ||
    text.includes("release")
  ) {
    return (
      "Compare the current release with the last known-good version, " +
      "review deployment logs and configuration changes, and roll back " +
      "or correct the problematic release after validation."
    );
  }

  if (
    text.includes("api") ||
    text.includes("application") ||
    text.includes("service") ||
    text.includes("error")
  ) {
    return (
      "Review application and API logs, identify the failing component " +
      "and dependency, reproduce the issue where possible, and deploy " +
      "the validated corrective application or configuration change."
    );
  }

  return (
    "Review application and infrastructure logs, identify the failing " +
    "component and recent changes, validate the root cause, and apply " +
    "the appropriate corrective change."
  );
}

export async function runIncidentAgent(
  incidentId: number,
  actorId: number
): Promise<AgentResult> {
  const incident =
    await getSingleIncident(incidentId);

  if (!incident) {
    throw new Error("Incident not found");
  }

  const similarIncidents =
    await findSimilarIncidents(
      incidentId,
      incident
    );

  const recommendedResolution =
    generateRecommendedResolution(
      incident
    );

  const decision =
    await generateAgentDecision(incident);

  let result: string;

  if (
    decision.action ===
    "START_INVESTIGATION"
  ) {
    if (incident.status === "OPEN") {
      await updateIncidentStatusTool(
        incidentId,
        "IN_PROGRESS"
      );

      await addCommentTool(
        incidentId,
        actorId,
        `AI Agent started investigation. Reason: ${decision.reason}`
      );

      result =
        "Incident moved to IN_PROGRESS and an investigation comment was added.";
    } else {
      result =
        `Incident is already ${incident.status}. ` +
        "No duplicate status change or investigation comment was created.";
    }
  } else {
    result =
      "Incident was reviewed; no automatic remediation action was taken.";
  }

  await logAgentActivityTool(
    incidentId,
    actorId,
    decision.action,
    {
      reason: decision.reason,
      confidence: decision.confidence,
      source: decision.source,
      similarIncidents,
      recommendedResolution,
    }
  );

  return {
    action: decision.action,
    result,
    reason: decision.reason,
    confidence: decision.confidence,
    source: decision.source,
    similarIncidents,
    recommendedResolution,
  };
}