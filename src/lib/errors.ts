export class DomainError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "DomainError";
    this.status = status;
  }
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}
