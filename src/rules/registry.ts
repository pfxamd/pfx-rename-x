import type { RenameRule, RuleHandler, RuleType } from "../types.js";

export class PfxRuleRegistry {
  readonly #handlers = new Map<RuleType, RuleHandler>();

  register<TConfig>(handler: RuleHandler<TConfig>): this {
    if (this.#handlers.has(handler.type)) {
      throw new Error(`Rule handler already registered: ${handler.type}`);
    }
    this.#handlers.set(handler.type, handler as RuleHandler);
    return this;
  }

  get(rule: RenameRule): RuleHandler | undefined {
    const handler = this.#handlers.get(rule.type);
    if (!handler || handler.version !== rule.version) return undefined;
    return handler;
  }

  clone(): PfxRuleRegistry {
    const next = new PfxRuleRegistry();
    for (const handler of this.#handlers.values()) next.register(handler);
    return next;
  }
}
