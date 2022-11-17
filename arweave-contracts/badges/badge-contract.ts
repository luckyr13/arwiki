import { BadgeState } from './badge-state';
import { AtomicBadge } from './atomic-badge';
import {
  AddPair,
  CancelOrder,
  CreateOrder,
  Halt,
  ReadOutbox
} from "@verto/flex";

export async function handle(state: BadgeState, action: ActionInterface) {
	const { input, caller } = action;
  const option = input.function;
  const badge = new AtomicBadge();
  
  if (option === "balance") {
    const target = input.target || caller;
    return badge.balance(target, state);
  }
  else if (option === 'transfer') {
    const { qty, target } = input;
    return badge.transfer(target, qty, caller, state);
  }
	else if (input.function === "addPair") {
		const { newState, result } = await AddPair(state, action)
		return { state: newState };
	}
	else if (input.function === "cancelOrder") {
		const { newState, result } = await CancelOrder(state, action)
		return { state: newState };
	}

	else if (input.function === "createOrder") {
		const { newState, result } = await CreateOrder(state, action);
		return { state: newState };
	}

	else if (input.function === "halt") {
		const { newState, result } = await Halt(state, action);
		return { state: newState };
	}

  throw new ContractError('Invalid option.');
}