import { afterEach, describe, expect, it, vi } from "vitest";
import { canShareBackupFile, shareBackupFile } from "@/lib/shareBackup";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("canShareBackupFile", () => {
  it("is false when there is no navigator", () => {
    vi.stubGlobal("navigator", undefined);

    expect(canShareBackupFile()).toBe(false);
  });

  it("is false when navigator has no canShare", () => {
    vi.stubGlobal("navigator", {});

    expect(canShareBackupFile()).toBe(false);
  });

  it("is false when canShare says no, or returns something that is not true", () => {
    vi.stubGlobal("navigator", { canShare: () => false });
    expect(canShareBackupFile()).toBe(false);

    vi.stubGlobal("navigator", { canShare: () => undefined });
    expect(canShareBackupFile()).toBe(false);
  });

  it("is false when canShare throws", () => {
    vi.stubGlobal("navigator", {
      canShare: () => {
        throw new TypeError("nope");
      },
    });

    expect(canShareBackupFile()).toBe(false);
  });

  it("is true when canShare says yes, and probes with an empty JSON file named probe.json", () => {
    const canShare = vi.fn(() => true);
    vi.stubGlobal("navigator", { canShare });

    expect(canShareBackupFile()).toBe(true);

    const [{ files }] = canShare.mock.calls[0] as unknown as [{ files: File[] }];
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe("probe.json");
    expect(files[0].type).toBe("application/json");
    expect(files[0].size).toBe(0);
  });
});

describe("shareBackupFile", () => {
  const file = new File(["{}"], "debtoralive-backup-2026-11-08.json", { type: "application/json" });

  it("returns shared when the share resolves, and passes one file, a fixed title and no text", async () => {
    const share = vi.fn(async () => {});
    vi.stubGlobal("navigator", { share });

    await expect(shareBackupFile(file)).resolves.toBe("shared");

    expect(share).toHaveBeenCalledTimes(1);
    const [data] = share.mock.calls[0] as unknown as [ShareData];
    expect(data.files).toEqual([file]);
    expect(data.title).toBe("Debt or Alive backup");
    expect(data).not.toHaveProperty("text");
  });

  it("returns cancelled when the user closes the share sheet (an AbortError)", async () => {
    vi.stubGlobal("navigator", { share: async () => Promise.reject(new DOMException("closed", "AbortError")) });

    await expect(shareBackupFile(file)).resolves.toBe("cancelled");
  });

  it("returns failed for any other error", async () => {
    vi.stubGlobal("navigator", { share: async () => Promise.reject(new Error("x")) });

    await expect(shareBackupFile(file)).resolves.toBe("failed");
  });

  it("returns failed when navigator has no share", async () => {
    vi.stubGlobal("navigator", {});

    await expect(shareBackupFile(file)).resolves.toBe("failed");
  });
});
