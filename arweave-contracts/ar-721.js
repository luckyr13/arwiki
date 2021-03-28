/*
 * AR-721 token contract
 * @dev Implementation of https://eips.ethereum.org/EIPS/eip-721[ERC721] Non-Fungible Token Standard, 
 * including the Metadata extension, but not including the Enumerable extension, 
 * which is available separately as {ERC721Enumerable} as a smartweave contract.
 * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol
 *
 * The EIP consists of three interfaces {IERC721}, {IERC721Metadata}, and {IERC721Enumerable}.
 * Only the first one is required in a contract to be ERC721 compliant. 
 * {IERC721Receiver} can be used to prevent tokens from becoming forever locked in contracts. 
 * destruction of own tokens ({ERC721Burnable}).
 * Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token/ERC721
 */


/*
 * @dev Main function
 */
export async function handle(state, action)
{
	// Transaction info
	const _msgSender = SmartWeave.transaction.owner;
	const _to = SmartWeave.transaction.target;
	const _tags = SmartWeave.transaction.tags;

	// Token name
  const _name = state.name;

  // Token symbol
  const _symbol = state.symbol;

  // Mapping from token ID to owner address
  const _owners = state.owners;

  // Mapping owner address to token count
  const _balances = state.balances;

  // Mapping from token ID to approved address
  const _tokenApprovals = state.tokenApprovals;

  // Mapping from owner to operator approvals
  const _operatorApprovals = state.operatorApprovals;

  /*
	 *	@dev See {IERC165-supportsInterface}.
	 * Not implemented
	 */
	// if (action.input.function === "supportsInterface") {
	// 	 throw new ContractError('Error');
	// }

	/*
	 *	@dev See {IERC721-balanceOf}.
	 */
	const balanceOf = (owner) => {
		_modifier_validateAddress(owner);
    return _balances[owner];
  }
	if (action.input.function === "balanceOf") {
		return {
			result: balanceOf(input.owner)
		};
	}


	/**
	 * @dev See {IERC721-ownerOf}.
	 */
  const ownerOf = (tokenId) => {
		_modifier_validateInputNumber(input.tokenId);
    const owner = _owners[tokenId];
    if (!owner) {
    	throw new ContractError('AR721: owner query for nonexistent token');
    }
    return owner;
  }
	if (action.input.function === "ownerOf") {
		const owner = ownerOf(input.tokenId);
    return {
    	result: owner
    };
  }

  /**
   * @dev See {IERC721Metadata-name}.
   */
  if (action.input.function === "name") {
    return {
    	result: _name
    };
  }

  /**
   * @dev See {IERC721Metadata-symbol}.
   */
  if (action.input.function === "symbol") {
    return {
    	result: _symbol
    };
  }
	
	/**
	 * @dev Base URI for computing {tokenURI}. Empty by default, can be overriden
	 * in child contracts.
	 */
  if (action.input.function === "tokenURI") {
		if(!_exists(input.tokenId)) {
    	throw new ContractError('AR721Metadata: URI query for nonexistent token')
    }
    const baseURI = _baseURI();
    const res = (
    	baseURI.length > 0 ?
    	`${baseURI}${action.input.tokenId}` :
    	''
    );
    return {
    	result: res
    };
  }

  /**
  * @dev See {IERC721Metadata-tokenURI}.
  */
	const _baseURI = () => {
    return "";
	};

	/**
	 * @dev Returns whether `tokenId` exists.
	 *
	 * Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.
	 *
	 * Tokens start existing when they are minted (`_mint`),
	 * and stop existing when they are burned (`_burn`).
	 */
	const _exists = (tokenId) => {
		_modifier_validateInputNumber(tokenId);
    return (
    	Object.prototype.hasOwnProperty(_owners, tokenId) && 
    	_owners[tokenId]
    );
	};

  /**
   * @dev See {IERC721-approve}.
   */
  if (action.input.function === "approve") {
  	_modifier_validateInputNumber(action.input.tokenId);
  	const owner = ownerOf(action.input.tokenId);
  	if (_to == owner) {
  		throw new ContractError('AR721: approval to current owner');
  	}

  	if (_msgSender != owner ||
  		isApprovedForAll(owner, _msgSender)) {
  		throw new ContractError(' approve caller is not owner nor approved for all');
  	}

  	_approve(_to, action.input.tokenId);
  	return { state };
  }

 /**
   * @dev Approve `to` to operate on `tokenId`
   *
   * Emits a {Approval} event.
   */
  const _approve = (to, tokenId) => {
  	_tokenApprovals[tokenId] = to;
  }


  /**
   * @dev See {IERC721-approve}.
   */
  if (action.input.function === "getApproved") {
  	if (!_exists(action.input.tokenId)) {
  		throw new ContractError('AR721: approved query for nonexistent token');
  	}
  	return _tokenApprovals[action.input.tokenId];
  }


  /**
   * @dev See {IERC721-setApprovalForAll}.
   */
  if (action.input.function === "setApprovalForAll") {
  	_modifier_validateAddress(action.input.operator);
  	if (action.input.operator == _msgSender) {
  		throw new ContractError('AR721: approve to caller');
  	}

		_operatorApprovals[_msgSender][action.input.operator] = action.input.approved;
  	return {state};
  }

  /**
   * @dev See {IERC721-isApprovedForAll}.
   */
  if (action.input.function === "isApprovedForAll") {
  	return {
  		result: isApprovedForAll(action.input.owner, action.input.operator)
  	}
  }
  const isApprovedForAll = (owner, operator) => {
      return _operatorApprovals[owner][operator];
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
			`AR721: ${_strName} must be a string less or equal than ${_maxStrLen} characters`
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
			`AR721: ${_nName} must be a number less than ${ Number.MAX_SAFE_INTEGER }`
		);
	}
}

/*
*	@dev Validate if _address is a valid arweave address
*/
function _modifier_validateAddress(_address, _addressName)
{
	// ERC721: balance query for the zero address
	if (typeof _s !== "string" || _s.length > _maxStrLen) {
		throw new ContractError(
			`AR721: ${_strName} must be a string less equal to ${_maxStrLen} characters`
		);
	}
}
