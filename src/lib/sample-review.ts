type SampleSettings = {
  replicas: number;
  readinessProbe: boolean;
  memoryLimitMi: number | null;
};

export type SampleFinding = {
  field: keyof SampleSettings;
  configured: boolean;
  title: string;
  detail: string;
};

type SampleReview = { error: string; findings: null } | { error: null; findings: SampleFinding[] };

export const ORIGINAL_SAMPLE = JSON.stringify({ replicas: 1, readinessProbe: false, memoryLimitMi: null }, null, 2);
export const IMPROVED_SAMPLE = JSON.stringify({ replicas: 2, readinessProbe: true, memoryLimitMi: 512 }, null, 2);

export function reviewSample(source: string): SampleReview {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    return { error: "Enter valid JSON. Use double quotes around field names and commas between settings.", findings: null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Use a JSON object with replicas, readinessProbe, and memoryLimitMi.", findings: null };
  }
  const settings = value as Record<string, unknown>;
  if (Object.keys(settings).some((key) => !["replicas", "readinessProbe", "memoryLimitMi"].includes(key))) {
    return { error: "This demo only checks replicas, readinessProbe, and memoryLimitMi. Remove other fields to try the sample checks.", findings: null };
  }
  if (typeof settings.replicas !== "number" || !Number.isSafeInteger(settings.replicas) || settings.replicas < 0) {
    return { error: "Set replicas to a whole number of zero or more.", findings: null };
  }
  if (typeof settings.readinessProbe !== "boolean") {
    return { error: "Set readinessProbe to true or false, without quotation marks.", findings: null };
  }
  if (settings.memoryLimitMi !== null && (typeof settings.memoryLimitMi !== "number" || !Number.isFinite(settings.memoryLimitMi) || settings.memoryLimitMi <= 0)) {
    return { error: "Set memoryLimitMi to a positive number, or null for no limit.", findings: null };
  }

  return {
    error: null,
    findings: [
      {
        field: "replicas",
        configured: settings.replicas >= 2,
        title: settings.replicas === 0 ? "No running replicas" : settings.replicas === 1 ? "A single replica" : `${settings.replicas} replicas configured`,
        detail: settings.replicas === 0 ? "This sample would not serve traffic. Zero replicas can be intentional when a deployment is paused." : settings.replicas === 1 ? "If that instance stops, there is no second replica to serve requests. Consider additional replicas for availability." : "There is more than one replica. Placement and downstream dependencies still affect availability.",
      },
      {
        field: "readinessProbe",
        configured: settings.readinessProbe,
        title: settings.readinessProbe ? "Readiness checks enabled" : "Readiness checks are off",
        detail: settings.readinessProbe ? "A real deployment still needs a working probe endpoint and suitable timing." : "Enable a readiness probe so traffic waits until the application is ready to accept it.",
      },
      {
        field: "memoryLimitMi",
        configured: settings.memoryLimitMi !== null,
        title: settings.memoryLimitMi === null ? "No memory limit set" : `Memory limit: ${settings.memoryLimitMi} Mi`,
        detail: settings.memoryLimitMi === null ? "Choose a memory limit using workload measurements so one container cannot consume memory without a configured bound." : "A bound is configured. Compare it with measured usage to check that it fits the workload.",
      },
    ],
  };
}
