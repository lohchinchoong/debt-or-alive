import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmLeave, getUnsaved, setUnsaved } from "@/lib/unsavedStore";

afterEach(() => {
  setUnsaved("a", null);
  setUnsaved("b", null);
  vi.unstubAllGlobals();
});

describe("unsavedStore", () => {
  it("registers and clears an owner", () => {
    setUnsaved("a", "FIRE Calculator");
    expect(getUnsaved()).toBe("FIRE Calculator");
    setUnsaved("a", null);
    expect(getUnsaved()).toBeNull();
  });

  it("returns the first dirty tool in insertion order", () => {
    setUnsaved("a", "First");
    setUnsaved("b", "Second");
    expect(getUnsaved()).toBe("First");
  });

  it("allows leaving without asking when nothing is dirty", () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    expect(confirmLeave()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("asks when dirty and returns the user's answer", () => {
    setUnsaved("a", "Mortgage Calculator");
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);

    expect(confirmLeave()).toBe(false);
    expect(confirm).toHaveBeenCalledWith("You have unsaved changes to Mortgage Calculator. Leave anyway?");

    confirm.mockReturnValue(true);
    expect(confirmLeave()).toBe(true);
  });
});
