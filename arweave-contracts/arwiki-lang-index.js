/*
*	Language list based on ISO 639-1 Code
*/
export async function handle(state, action)
{	
	const _msgSender = SmartWeave.transaction.owner;
	const _to = SmartWeave.transaction.target;
	const _tags = SmartWeave.transaction.tags;
	const SETTINGS_CONTRACT = 'yA5zTz3w3Oya1Mg-VH3F-KWTQh6vzeahoCEude9qmn8';

  /*
	*	@dev Add language
	*/
	if (action.input.function === "addLanguage") {
		// Only admin can update the state
		// Get the list of admins from Settings contract
		const settingsContractState = await SmartWeave.contracts.readContractState(
			SETTINGS_CONTRACT
		);
    const adminList = Object.keys(settingsContractState.roles).filter((address) => {
			return settingsContractState.roles[address].toUpperCase() === 'MODERATOR';
		});
    // Validate _msgSender in admins list
    _modifier_validateAdmin(_msgSender, adminList);
    // Validate inputs
    _modifier_validateInputString(
			action.input.langCode, 'langCode', 2
		);
		_modifier_validateInputString(
			action.input.isoName, 'isoName', 100
		);
		_modifier_validateInputString(
			action.input.nativeName, 'nativeName', 100
		);
		_modifier_validateInputString(
			action.input.writingSystem, 'writingSystem', 3
		);
		
		const langCode = action.input.langCode.trim();
		// Validate if language is not already created
		_modifier_validateIfLanguageIsAvailable(
			langCode,
			Object.keys(state)
		);

		const newLang = {
			"code": langCode,
			"iso_name": action.input.isoName.trim(),
			"native_name": action.input.nativeName.trim(),
			"writing_system": action.input.writingSystem.trim(),
			"active": true
		};

    state.langs[langCode] = newLang;
    return { state };
  }
	

	throw new ContractError('Invalid option!');
}

/*
*	@dev Validate if _s is a valid string
*/
function _modifier_validateInputString(_s, _strName, _maxStrLen)
{
	if (!_s || typeof _s !== "string" || 
			(typeof _s === "string" && _s.trim().length > _maxStrLen)) {
		throw new ContractError(
			`${_strName} must be a non-empty string less or equal than ${_maxStrLen} characters`
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