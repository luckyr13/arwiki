/*
*	dApp configuration options
*/
export async function handle(state, action)
{	
	const _msgSender = SmartWeave.transaction.owner;
	const _to = SmartWeave.transaction.target;
	const _tags = SmartWeave.transaction.tags;

	/*
	*	@dev Update app name
	*/
	if (action.input.function === "updateAppName") {
		// Only admin can update the state
		_modifier_validateAdmin(_msgSender, state.admin_list);
		// Validate inputs
		_modifier_validateInputString(
			action.input.app_name, 'app_name', 100
		);

		state.app_name = action.input.app_name.trim();
		return {state};
	}

	/*
	*	@dev Update logos
	*/
	if (action.input.function === "updateLogos") {
		// Only admin can update the state
		_modifier_validateAdmin(_msgSender, state.admin_list);

		_modifier_validateInputString(
			action.input.main_menu_logo_light, 'main_menu_logo_light', 43
		);
		_modifier_validateInputString(
			action.input.main_menu_logo_dark, 'main_menu_logo_dark', 43
		);
		_modifier_validateInputString(
			action.input.main_page_logo_light, 'main_page_logo_light', 43
		);
		_modifier_validateInputString(
			action.input.main_page_logo_dark, 'main_page_logo_dark', 43
		);

		state.main_menu_logo_light = action.input.main_menu_logo_light.trim();
		state.main_menu_logo_dark = action.input.main_menu_logo_dark.trim();
		state.main_page_logo_light = action.input.main_page_logo_light.trim();
		state.main_page_logo_dark = action.input.main_page_logo_dark.trim();
		
		return {state};
	}

	/*
	*	@dev Add admin
	*/
	if (action.input.function === "addAdmin") {
		// Only admin can update the state
		_modifier_validateAdmin(_msgSender, state.admin_list);
		// Validate inputs
		_modifier_validateInputString(
			action.input.new_admin, 'new_admin', 43
		);
		// Validate if new admin is not already in the list
		if (action.input.new_admin in state.admin_list) {
			throw new ContractError('Admin already exists!');
		}
		state.admin_list.push(action.input.new_admin);
		return {state};
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
