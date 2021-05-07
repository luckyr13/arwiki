/*
*	ArWiki categories
*/
export async function handle(state, action)
{	
	const _msgSender = SmartWeave.transaction.owner;
	const _to = SmartWeave.transaction.target;
	const _tags = SmartWeave.transaction.tags;
	const SETTINGS_CONTRACT = 'sGOPfJMI_TyQ632y1T0DwWNf6IPKRU9-tguBx0h8g9Q';

	/*
	*	@dev Add category
	*/
	if (action.input.function === "addCategory") {
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
			action.input.slug, 'slug', 120
		);
		_modifier_validateInputString(
			action.input.label, 'label', 120
		);
		_modifier_validateInputNumber(
			action.input.order, 'order'
		);
		const slug = action.input.slug.trim();
		const label = action.input.label.trim();
		const order = parseInt(action.input.order);

		// Validate that category doesn't exists
		if (Object.prototype.hasOwnProperty.call(state, slug)) {
			throw new ContractError('Category already exists!');
		}

    state[slug] = {
    	slug: slug,
    	label: label,
    	order: order,
    	active: true
    };
    return { state };
  }
	/*
	*	@dev Update category
	*/
	if (action.input.function === "updateCategory") {
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
			action.input.slug, 'slug', 120
		);
		_modifier_validateInputString(
			action.input.label, 'label', 120
		);
		_modifier_validateInputNumber(
			action.input.order, 'order'
		);
		_modifier_validateInputBoolean(
			action.input.active, 'active'
		);
		const slug = action.input.slug.trim();
		const label = action.input.label.trim();
		const order = parseInt(action.input.order);
		const active = !!action.input.active;

		// Validate that category exists
		if (!Object.prototype.hasOwnProperty.call(state, slug)) {
			throw new ContractError('Category doesn\'t exist');
		}

    state[slug] = {
    	slug: slug,
    	label: label,
    	order: order,
    	active: active
    };
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

function _modifier_validateInputNumber(_n, _nName)
{
	if (isNaN(_n) || !Number.isSafeInteger(_n)) {
		throw new ContractError(
			`${_nName} must be a number less than ${ Number.MAX_SAFE_INTEGER }`
		);
	}
}

function _modifier_validateInputBoolean(_n, _nName)
{
	if (typeof _n === "boolean") {
		throw new ContractError(
			`${_nName} must be a boolean value`
		);
	}
}