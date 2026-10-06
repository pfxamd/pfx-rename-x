import { beforeEach, describe, expect, it } from "vitest";
import { prefix, suffix } from "@pfxamd/rename-x";
import { useRenameStore } from "./renameStore.js";

describe("rename store", () => {
  beforeEach(() => {
    useRenameStore.setState({ files: [], rules: [], options: {} });
  });

  it("keeps rule order explicit and movable", () => {
    const first = prefix("a-");
    const second = suffix("-b");

    useRenameStore.getState().addRule(first);
    useRenameStore.getState().addRule(second);
    useRenameStore.getState().moveRule(second.id, "up");

    expect(useRenameStore.getState().rules.map((rule) => rule.id)).toEqual([
      second.id,
      first.id,
    ]);
  });

  it("toggles rules without replacing their configuration", () => {
    const rule = prefix("x-");

    useRenameStore.getState().addRule(rule);
    useRenameStore.getState().toggleRule(rule.id);

    expect(useRenameStore.getState().rules[0]).toEqual({
      ...rule,
      enabled: false,
    });
  });
});
