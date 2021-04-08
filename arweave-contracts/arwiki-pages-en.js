/*
*	Pages structure (English language)
* v2
*/
export async function handle(state, action)
{	
	const _msgSender = SmartWeave.transaction.owner;
	const _to = SmartWeave.transaction.target;
	const _tags = SmartWeave.transaction.tags;
	const SETTINGS_CONTRACT = 'sGOPfJMI_TyQ632y1T0DwWNf6IPKRU9-tguBx0h8g9Q';
	const CATEGORIES_CONTRACT = 'v-G-YU3rlqgPnSHGSoNXrAWCF1_Cvh4v6SUKfkgaxtE';

	/*
	*	@dev Create a new page
	*/
	if (action.input.function === "addPage") {
		// Only admin can update the state
		// Get the list of admins from Settings contract
		const settingsContractState = await SmartWeave.contracts.readContractState(
			SETTINGS_CONTRACT
		);
    const adminList = settingsContractState.admin_list;
    // Validate _msgSender in admins list
    _modifier_validateAdmin(_msgSender, adminList);
    
		_modifier_validateInputString(
			action.input.slug, 'slug', 150
		);
		_modifier_validateInputString(
			action.input.content_id, 'content_id', 43
		);
		_modifier_validateInputString(
			action.input.category_slug, 'category_slug', 120
		);

		const slug = action.input.slug.trim();
		const content_id = action.input.content_id.trim();
		const category_slug = action.input.category_slug.trim();

		// Validate category
		const categoryContractState = await SmartWeave.contracts.readContractState(
			CATEGORIES_CONTRACT
		);
		
		// Validate category slug 
    if (
    	!Object.prototype.hasOwnProperty.call(
    		categoryContractState, category_slug
    	)
    ) {
    	throw new ContractError('Category slug does not exists!');
    }

    // Validate in all categories if page slug already exists
    const currentCategories = Object.keys(state);
    for (let c1 of currentCategories) {
    	if (
	    	Object.prototype.hasOwnProperty.call(
	    		state, c1
	    	) &&
	    	Object.prototype.hasOwnProperty.call(
	    		state[c1], slug
	    	)
	    ) {
	    	throw new ContractError('Slug already taken, please choose another one!');
	    }
    }

    // IF is the first page in the category
    if (
    	!Object.prototype.hasOwnProperty.call(
    		state, category_slug
    	)
    ) {
    	state[category_slug] = {};
    }

    // Update state
		state[category_slug][slug] = content_id;

    return { state };
  }

  /*
	*	@dev Transfer the page property to a new owner
	*/
	if (action.input.function === "transfer") {
		throw new ContractError('Not implemented!');
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


/*
*	@dev Validate if _categoryCode exists
*/
function _modifier_validateCategory(_categoryCode, _baseCategories)
{
	if (!Object.prototype.hasOwnProperty.call(_baseCategories, _categoryCode)) {
		throw new ContractError(
			`${_categoryCode} is not a valid category!`
		);
	}
}