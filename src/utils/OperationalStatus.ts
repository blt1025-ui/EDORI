export interface OperationalStatus {
  title: string;
  color: string;
  icon: string;
  recommendation: string;
}

export function getOperationalStatus(score: number): OperationalStatus {
  if (score <= 20) {
    return {
      title: "Normal Operations",
      color: "#2E7D32",
      icon: "🟢",
      recommendation:
        "Emergency Department operations are stable. Continue routine monitoring.",
    };
  }

  if (score <= 40) {
    return {
      title: "Elevated Activity",
      color: "#1565C0",
      icon: "🔵",
      recommendation:
        "Patient demand is increasing. Monitor patient flow and staffing closely.",
    };
  }

  if (score <= 60) {
    return {
      title: "Busy",
      color: "#F9A825",
      icon: "🟡",
      recommendation:
        "Operational strain is developing. Evaluate throughput barriers and anticipate additional resource needs.",
    };
  }

  if (score <= 80) {
    return {
      title: "Surge",
      color: "#EF6C00",
      icon: "🟠",
      recommendation:
        "Hospital surge interventions should be considered. Increase executive awareness and monitor frequently.",
    };
  }

  return {
    title: "Severe Surge",
    color: "#C62828",
    icon: "🔴",
    recommendation:
      "Immediate hospital-wide intervention is recommended. Activate executive surge response and reassess frequently.",
  };
}