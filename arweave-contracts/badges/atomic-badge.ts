import { BadgeState } from './badge-state';

export class AtomicBadge {
  balance(target: string, state: BadgeState) {
    const balances = state.balances;
    const ticker = state.ticker;
    ContractAssert(typeof target === "string", "Must specify target to get balance for.");
    const balance: number = balances[target] && typeof balances[target] === "number" ? balances[target] : 0;
    return {
      result: {
        target,
        ticker,
        balance: balances[target]
      },
    };
  }

  transfer(target: string, qty: number, caller: string, state: BadgeState) {
    const balances = state.balances;
    ContractAssert(!!target, 'target MUST be defined');
    ContractAssert(target !== caller, 'target can not be caller');
    ContractAssert(Number.isInteger(qty), 'qty MUST be an integer');
    ContractAssert(qty > 0, 'qty MUST be greater than zero');
    ContractAssert(balances[caller] >= qty, 'caller does not have enough qty');
    ContractAssert(!balances[target] || Number.isSafeInteger(balances[target] + qty),
      'target balance must be a safe integer');
    state.balances[caller] -= qty;
    if (target in balances) {
      state.balances[target] += qty;
    } else {
      state.balances[target] = qty;
    }

    return { state };
  }


}