/*
*	Pages for the English language
*/
export async function handle(state, action)
{	
	const _msgSender = SmartWeave.transaction.owner;
	const _to = SmartWeave.transaction.target;
	const _tags = SmartWeave.transaction.tags;
	const SETTINGS_CONTRACT = 'O3dek5yOpnxdbyKSBQT-io7a_CzXim6jBZkyk8_KCSQ';
	const CATEGORIES_CONTRACT = 'xPjZZ-02SLU2iubGCuyuD9cC_XwqkzA499cnX31eWwM';

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
    // Validate inputs
		_modifier_validateInputString(
			action.input.title, 'title', 120
		);
		_modifier_validateInputString(
			action.input.slug, 'slug', 100
		);
		_modifier_validateInputString(
			action.input.summary, 'summary', 240
		);
		_modifier_validateInputString(
			action.input.htmlContentId, 'htmlContentId', 43
		);
		_modifier_validateInputString(
			action.input.externalLink, 'externalLink', 240
		);
		// Validate categories list
		if (!Array.isArray(action.input.categories)) {
			throw new ContractError('Categories is not an array');
		}
		// Validate categories
		// Get the list of categories from Categories contract
		const categoriesContractState = await SmartWeave.contracts.readContractState(
			CATEGORIES_CONTRACT
		);
    const categoriesList = categoriesContractState.categories;
    for (let cat of Object.keys(action.input.categories)) {
			_modifier_validateCategory(
				cat, categoriesList
			);
    }
    // Validate slug 
    if (
    	Object.prototype.hasOwnProperty.call(
    		state.slug_table, action.input.slug
    	)
    ) {
    	throw new ContractError('slug already exists, please choose another one!');
    }

		const newPage = {
			"id": state.pages.length,
			"title": action.input.title.trim(),
			"slug": action.input.slug.trim(),
			"summary": action.input.summary.trim(),
			"html_content_id": action.input.htmlContentId.trim(),
			"categories": action.input.categories,
			"external_link": action.input.externalLink.trim(),
			"rating": 0
		};

		state.pages.push(newPage);

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