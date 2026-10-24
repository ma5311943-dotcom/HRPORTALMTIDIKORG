import type { Candidate } from "@/types";

export type StoredCandidate = Candidate & { passwordHash?: string };

export function publicCandidate(candidate: StoredCandidate): Candidate {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = candidate;
  return rest;
}
