import { Incident } from "../repositories/incidentRepository";

export interface AIAnalysisResult {
  suggestedCategory: Incident["category"];
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  summary: string;
  probableCause: string;
  recommendedActions: string[];
  possibleResolution: string;
}

export async function analyzeIncident(
  incident: Incident
): Promise<AIAnalysisResult> {
  const description =
    incident.description.toLowerCase();

  const title =
    incident.title.toLowerCase();

  const text =
    `${title} ${description}`;

  let severity:
    AIAnalysisResult["severity"] =
    "MEDIUM";

  if (
    incident.priority === "P1" ||
    text.includes("production") ||
    text.includes("outage") ||
    text.includes("unavailable") ||
    text.includes("data loss") ||
    text.includes("critical")
  ) {
    severity = "CRITICAL";
  } else if (
    incident.priority === "P2" ||
    text.includes("degraded") ||
    text.includes("high impact")
  ) {
    severity = "HIGH";
  } else if (
    incident.priority === "P4"
  ) {
    severity = "LOW";
  }

  let suggestedCategory:
    Incident["category"] =
    incident.category;

  let probableCause =
    "Insufficient information to determine the root cause.";

  let possibleResolution =
    "Review application and infrastructure logs, identify the failing component, validate the root cause, and apply the appropriate corrective change.";

  /*
   * Category detection is intentionally ordered by specificity.
   *
   * Deployment/API incidents are checked before generic
   * infrastructure keywords such as "server", because a
   * production API failure after a deployment is primarily
   * an APPLICATION incident.
   */

  if (
    text.includes("database") ||
    text.includes("sql") ||
    text.includes("connection pool") ||
    text.includes("query")
  ) {
    suggestedCategory = "DATABASE";

    probableCause =
      "Possible database connectivity, capacity, query performance, or connection-pool issue.";

    possibleResolution =
      "Validate database availability and connection-pool health, review database and application logs, identify slow or failed queries, and restore the affected database dependency.";
  } else if (
    text.includes("authentication") ||
    text.includes("login") ||
    text.includes("credential") ||
    text.includes("identity") ||
    text.includes("token")
  ) {
    suggestedCategory =
      "AUTHENTICATION";

    probableCause =
      "Possible authentication service, credential, token, or identity-provider issue.";

    possibleResolution =
      "Validate the authentication service and identity-provider configuration, inspect authentication logs, verify credentials and token configuration, and restore the failing authentication dependency.";
  } else if (
    text.includes("network") ||
    text.includes("gateway") ||
    text.includes("dns") ||
    text.includes("connectivity") ||
    text.includes("routing")
  ) {
    suggestedCategory = "NETWORK";

    probableCause =
      "Possible network connectivity, routing, DNS, or gateway failure.";

    possibleResolution =
      "Validate network connectivity, DNS, routing and gateway health, identify the affected dependency, and restore the failing network component or configuration.";
  } else if (
    text.includes("security") ||
    text.includes("attack") ||
    text.includes("unauthorized") ||
    text.includes("vulnerability") ||
    text.includes("breach")
  ) {
    suggestedCategory = "SECURITY";

    probableCause =
      "Possible security control, authorization, vulnerability, or suspicious-access issue.";

    possibleResolution =
      "Review security logs and access patterns, contain suspicious activity where required, validate affected systems, and apply the appropriate security remediation.";
  } else if (
    text.includes("deployment") ||
    text.includes("deployed") ||
    text.includes("deploy") ||
    text.includes("release")
  ) {
    suggestedCategory =
      "APPLICATION";

    probableCause =
      "Possible application regression or configuration issue introduced during the latest deployment.";

    possibleResolution =
      "Compare the current release with the last known-good version, review deployment logs and configuration changes, identify the failing API component, and roll back or correct the problematic release after validation.";
  } else if (
    text.includes("api") ||
    text.includes("application") ||
    text.includes("runtime") ||
    text.includes("http 500") ||
    text.includes("http 4") ||
    text.includes("http 5") ||
    text.includes("error")
  ) {
    suggestedCategory =
      "APPLICATION";

    probableCause =
      "Possible application service failure, runtime error, dependency failure, or configuration issue.";

    possibleResolution =
      "Review application and API logs, identify the failing component and dependency, reproduce the failure where possible, and deploy the validated corrective application or configuration change.";
  } else if (
    text.includes("server") ||
    text.includes("cpu") ||
    text.includes("memory") ||
    text.includes("disk") ||
    text.includes("infrastructure") ||
    text.includes("host")
  ) {
    suggestedCategory =
      "INFRASTRUCTURE";

    probableCause =
      "Possible infrastructure resource, host, capacity, or service-health issue.";

    possibleResolution =
      "Check host and infrastructure health, resource utilization and service status, identify the constrained resource, and restore the required capacity or service.";
  }

  const recommendedActions: string[] = [
    "Review recent application and infrastructure logs.",
    "Check whether the issue affects all users or only a subset.",
    "Review recent deployments and configuration changes.",
  ];

  if (severity === "CRITICAL") {
    recommendedActions.unshift(
      "Escalate immediately and assess production impact."
    );
  }

  if (
    suggestedCategory === "DATABASE"
  ) {
    recommendedActions.push(
      "Check database connectivity, connection-pool usage and query performance."
    );
  }

  if (
    suggestedCategory === "NETWORK"
  ) {
    recommendedActions.push(
      "Validate gateway, DNS, routing and network connectivity."
    );
  }

  if (
    suggestedCategory === "AUTHENTICATION"
  ) {
    recommendedActions.push(
      "Review authentication and identity-provider logs."
    );
  }

  if (
    suggestedCategory === "SECURITY"
  ) {
    recommendedActions.push(
      "Review security events, access patterns and affected accounts or services."
    );
  }

  if (
    suggestedCategory === "INFRASTRUCTURE"
  ) {
    recommendedActions.push(
      "Check CPU, memory, disk and service-health metrics for affected infrastructure."
    );
  }

  if (
    suggestedCategory === "APPLICATION"
  ) {
    recommendedActions.push(
      "Review application errors, API health and dependent services."
    );

    if (
      text.includes("deployment") ||
      text.includes("deployed") ||
      text.includes("deploy") ||
      text.includes("release")
    ) {
      recommendedActions.push(
        "Compare the latest deployment with the previous known-good release and validate rollback options."
      );
    }
  }

  /*
   * Deterministic confidence represents how strongly the
   * available incident evidence supports the generated result.
   *
   * This is not an LLM probability. It is a rule-based
   * confidence score and is labeled as such in the UI.
   */

  let confidence = 0.78;

  if (
    incident.priority === "P1" ||
    (
      text.includes("production") &&
      (
        text.includes("api") ||
        text.includes("deployment") ||
        text.includes("500")
      )
    )
  ) {
    confidence = 0.92;
  } else if (
    suggestedCategory !== "OTHER" &&
    severity === "CRITICAL"
  ) {
    confidence = 0.88;
  } else if (
    suggestedCategory !== "OTHER"
  ) {
    confidence = 0.82;
  }

  return {
    suggestedCategory,
    severity,
    confidence,

    summary:
      `Incident ${incident.incidentNumber} appears to be a ` +
      `${severity.toLowerCase()} severity issue requiring investigation.`,

    probableCause,

    recommendedActions,

    possibleResolution,
  };
}