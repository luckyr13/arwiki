/*
*	dApp configuration options
*/
export function handle(state, action)
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
			action.input.main_logo_light, 'main_logo_light', 43
		);
		_modifier_validateInputString(
			action.input.main_logo_dark, 'main_menu_logo_dark', 43
		);

		state.main_logo_light = action.input.main_logo_light.trim();
		state.main_logo_dark = action.input.main_logo_dark.trim();
		
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
		if (state.admin_list.indexOf(action.input.new_admin) >= 0) {
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
	const isAdmin = (adminList.indexOf(_owner) >= 0);

	if (isAdmin) {
		return true;
	}

	throw new ContractError(`${_owner} is not an admin!`);
}
