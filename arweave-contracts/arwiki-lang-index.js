/*
*	Language list based on ISO 639-1 Code
*/
export function handle(state, action)
{	
	const _msgSender = SmartWeave.transaction.owner;
	const _to = SmartWeave.transaction.target;
	const _tags = SmartWeave.transaction.tags;

	/*
	*	@dev Anyone can update the number of pages for a language
	*/
	if (action.input.function === "updateLangNumPages") {
		_modifier_validateInputString(
			action.input.langCode, 'langCode', 2
		);

		// Get the number of pages from external contract
		const pageContract = state.langs[action.input.langCode];
		if (!pageContract) {
			throw new ContractError(`Contract undefined for ${action.input.langCode}`);
		}
		const pageContractState = await SmartWeave.contracts.readContractState(
			pageContract
		);
    const numPages = pageContractState.pages.length;

    if (numPages > state.langs[action.input.langCode].numPages) {
      state.langs[action.input.langCode].numPages = numPages;
      return { state };
    }

    throw new ContractError(`Error updating language ${action.input.langCode}`);
	}
	

	throw new ContractError('Invalid option!');
}


function _modifier_validateInputString(_s, _strName, _maxStrLen)
{
	if (typeof _s !== "string" || _s.length > _maxStrLen) {
		throw new ContractError(
			`${_strName} must be a string less or equal than ${_maxStrLen} characters`
		);
	}
}

function _modifier_validateInputNumber(_n, _nName)
{
	if (isNaN(_n) || !Number.isSafeInteger(_n)) {
		throw new ContractError(
			`${_nName} must be a number less than ${ Number.MAX_SAFE_INTEGER }`
		);
	}
}
