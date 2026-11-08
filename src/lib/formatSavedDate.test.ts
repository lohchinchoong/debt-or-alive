import { describe, expect, it } from "vitest";
import { formatSavedDate } from "@/lib/formatSavedDate";

describe("formatSavedDate", () => {
  it("formats a date as D Mon YYYY", () => {
    expect(formatSavedDate("2026-11-08T04:00:00Z")).toBe("8 Nov 2026");
  });

  it("uses the local time zone (Asia/Singapore, UTC+8)", () => {
    expect(formatSavedDate("2026-09-30T16:30:00Z")).toBe("1 Oct 2026");
  });

  it("uses fixed three-letter month names, including Sep", () => {
    const expected = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    expected.forEach((name, i) => {
      const month = String(i + 1).padStart(2, "0");
      expect(formatSavedDate(`2026-${month}-15T04:00:00Z`)).toBe(`15 ${name} 2026`);
    });
  });

  it("returns null for an invalid string", () => {
    expect(formatSavedDate("not a date")).toBeNull();
  });
});
