const LOCAL_PREFIX = "local-";

export function generateLocalAssessmentId(): string {
  return `${LOCAL_PREFIX}${crypto.randomUUID()}`;
}

export function isLocalAssessmentId(id: string): boolean {
  return id.startsWith(LOCAL_PREFIX);
}
