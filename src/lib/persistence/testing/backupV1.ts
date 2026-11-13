/**
 * A version 1 backup file, hand-written with made-up values. It is the test
 * fixture for the released format: a later format version adds its own fixture
 * and keeps this one, and it must keep importing.
 *
 * Imports as 4 tools (mortgage, CPF SA, HYSA, dividend). "unknown:example" is
 * reported as skipped. The newest save in it is 2026-11-08T04:00:00Z.
 */
export const BACKUP_V1_TEXT = `{
  "app": "debtoralive",
  "version": 1,
  "exportedAt": "2026-11-08T04:00:00.000Z",
  "data": {
    "tool:mortgage-calculator": {
      "propertyPrice": 700000,
      "downPaymentPct": 20,
      "annualRate": 3,
      "tenureYears": 25,
      "savedAt": "2026-11-08T04:00:00Z"
    },
    "mortgage:partial-repayments": [
      { "id": "p", "year": 2, "amount": 10000 }
    ],
    "cpf-sa:profiles": [
      {
        "id": "p_1",
        "name": "Mine",
        "currentBalance": 1,
        "monthlyContrib": 2,
        "startYear": 2024,
        "startMonth": 1,
        "endContribYear": 2030,
        "birthYear": 1990,
        "savedAt": "2026-11-08T04:00:00Z"
      }
    ],
    "hysa-tracker:scenarios": [
      { "id": "h1", "name": "Bank", "entries": [], "savedAt": "2026-11-08T04:00:00Z" }
    ],
    "dividend:projection-years": { "years": 12, "savedAt": "2026-11-08T04:00:00Z" },
    "unknown:example": 1
  }
}`;
