/*
*	Language list based on ISO 639-1 Code
*/
export async function handle(state, action)
{	
	const _msgSender = SmartWeave.transaction.owner;
	const _to = SmartWeave.transaction.target;
	const _tags = SmartWeave.transaction.tags;
	const SETTINGS_CONTRACT = 'O3dek5yOpnxdbyKSBQT-io7a_CzXim6jBZkyk8_KCSQ';

	/*
	*	@dev Anyone can update the number of pages for a language
	*/
	if (action.input.function === "updateLangNumPages") {
		// Validate inputs
		_modifier_validateInputString(
			action.input.langCode, 'langCode', 2
		);
		// Validate if language exists in state
		_modifier_validateIfLanguageExists(
			action.input.langCode,
			state.langs
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
	/*
	*	@dev Update the contract address for a language
	*/
	if (action.input.function === "updateLangContract") {
		// Only admin can update the state
		// Get the list of admins from Settings contract
		const settingsContractState = await SmartWeave.contracts.readContractState(
			SETTINGS_CONTRACT
		);
    const adminList = settingsContractState.admin_list;
    // Validate _msgSender in admins list
    _modifier_validateAdmin(_msgSender, adminList);
    // Validate inputs
		_modifier_validateInputString(
			action.input.contract, 'contract', 43
		);
		_modifier_validateInputString(
			action.input.langCode, 'langCode', 2
		);
		// Validate if language exists in state
		_modifier_validateIfLanguageExists(
			action.input.langCode,
			state.langs
		);
    
    state.langs[action.input.langCode].contract = action.input.contract.trim();
    return { state };
  }
  /*
	*	@dev Add language
	*/
	if (action.input.function === "addLanguage") {
		// Only admin can update the state
		// Get the list of admins from Settings contract
		const settingsContractState = await SmartWeave.contracts.readContractState(
			SETTINGS_CONTRACT
		);
    const adminList = settingsContractState.admin_list;
    // Validate _msgSender in admins list
    _modifier_validateAdmin(_msgSender, adminList);
    // Validate inputs
    _modifier_validateInputString(
			action.input.langCode, 'langCode', 2
		);
		_modifier_validateInputString(
			action.input.langCode, 'langCode', 2
		);
		_modifier_validateInputString(
			action.input.langCode, 'langCode', 2
		);
		_modifier_validateInputString(
			action.input.writingSystem, 'isoName', 3
		);
		_modifier_validateInputString(
			action.input.writingSystem, 'nativeName', 100
		);
		_modifier_validateInputString(
			action.input.writingSystem, 'writingSystem', 3
		);
		_modifier_validateInputString(
			action.input.contract, 'contract', 43
		);
		
		// Validate if language is not already created
		_modifier_validateIfLanguageIsAvailable(
			action.input.langCode,
			Object.keys(state.langs)
		);

		const newLang = {
			"code": action.input.langCode.trim(),
			"iso_name": action.input.isoName.trim(),
			"native_name": action.input.nativeName.trim(),
			"numPages": 0,
			"writing_system": action.input.writingSystem.trim(),
			"contract": action.input.contract.trim()
		};

    state.langs[action.input.langCode.trim()] = newLang;
    return { state };
  }
	

	throw new ContractError('Invalid option!');
}

/*
*	@dev Validate if _s is a valid string
*/
function _modifier_validateInputString(_s, _strName, _maxStrLen)
{
	if (typeof _s !== "string" || _s.length > _maxStrLen) {
		throw new ContractError(
			`${_strName} must be a string less or equal than ${_maxStrLen} characters`
		);
	}
}

/*
*	@dev Validate if _n is a valid number
*/
function _modifier_validateInputNumber(_n, _nName)
{
	if (isNaN(_n) || !Number.isSafeInteger(_n)) {
		throw new ContractError(
			`${_nName} must be a number less than ${ Number.MAX_SAFE_INTEGER }`
		);
	}
}

/*
*	@dev Validate if msg.sender is in the admins list
*/
function _modifier_validateAdmin(_owner, adminList)
{
	const isAdmin = (_owner in adminList);

	if (isAdmin) {
		return true;
	}

	throw new ContractError(`${_owner} is not an admin!`);
}


/*
*	@dev Validate if _lang exists
*/
function _modifier_validateIfLanguageExists(_langCode, _langs)
{
	if (!Object.prototype.hasOwnProperty.call(_langs, _langCode)) {
		throw new ContractError(
			`${_langCode} not found!`
		);
	}
}

/*
*	@dev Validate if _lang exists
*/
function _modifier_validateIfLanguageIsAvailable(_langCode, _langs)
{
	if (Object.prototype.hasOwnProperty.call(_langs, _langCode)) {
		throw new ContractError(
			`${_langCode} already exists!`
		);
	}
}