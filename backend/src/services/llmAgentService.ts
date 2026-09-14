import { openai } from "../config/openai";
import { Incident } from "../repositories/incidentRepository";

export type AgentAction =
  | "START_INVESTIGATION"
  | "REVIEW_ONLY";

export interface AgentDecision {
  action: AgentAction;
  reason: string;
  confidence: number;
  source: "LLM" | "FALLBACK";
}

function generateFallbackDecision(
  incident: Incident
): AgentDecision {
  const description = incident.description.toLowerCase();

  const shouldInvestigate =
    incident.priority === "P1" ||
    description.includes("production") ||
    description.includes("unavailable") ||
    description.includes("outage") ||
    description.includes("data loss");

  if (shouldInvestigate) {
    return {
      action: "START_INVESTIGATION",
      reason:
        "Deterministic fallback selected investigation because the incident has high production impact.",
      confidence: 0.85,
      source: "FALLBACK",
    };
  }

  return {
    action: "REVIEW_ONLY",
    reason:
      "Deterministic fallback determined that automatic investigation is not justified.",
    confidence: 0.75,
    source: "FALLBACK",
  };
}

export async function generateAgentDecision(
  incident: Incident
): Promise<AgentDecision> {
  const prompt = `
You are an incident-management assistant.

Analyze this incident and decide whether the system should:
- START_INVESTIGATION: only when the incident is clearly high-impact or production-critical.
- REVIEW_ONLY: when automatic action is not justified.

Incident:
Incident Number: ${incident.incidentNumber}
Title: ${incident.title}
Description: ${incident.description}
Priority: ${incident.priority}
Category: ${incident.category}
Status: ${incident.status}

Return ONLY valid JSON with exactly:
{
  "action": "START_INVESTIGATION" | "REVIEW_ONLY",
  "reason": "brief explanation",
  "confidence": number between 0 and 1
}
`;

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      input: prompt,
    });

    const text = response.output_text.trim();

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("action" in parsed) ||
      !("reason" in parsed) ||
      !("confidence" in parsed)
    ) {
      throw new Error("AI returned an invalid decision structure");
    }

    const decision = parsed as {
      action: unknown;
      reason: unknown;
      confidence: unknown;
    };

    if (
      decision.action !== "START_INVESTIGATION" &&
      decision.action !== "REVIEW_ONLY"
    ) {
      throw new Error("AI returned an unsupported action");
    }

    if (
      typeof decision.reason !== "string" ||
      typeof decision.confidence !== "number" ||
      decision.confidence < 0 ||
      decision.confidence > 1
    ) {
      throw new Error("AI returned invalid decision values");
    }

    return {
      action: decision.action,
      reason: decision.reason,
      confidence: decision.confidence,
      source: "LLM",
    };
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error
        ? Number((error as { status: unknown }).status)
        : undefined;

    if (status === 429) {
      console.warn(
        "OpenAI unavailable/quota exhausted. Using deterministic fallback."
      );

      return generateFallbackDecision(incident);
    }

    throw error;
  }
}