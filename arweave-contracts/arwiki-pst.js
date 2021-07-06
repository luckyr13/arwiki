export function handle(state, action) {
  const settings = new Map(state.settings);
  const balances = state.balances;
  const vault = state.vault;
  const votes = state.votes;
  const input = action.input;
  const caller = action.caller;
  const stakes = state.stakes;
  const pages = state.pages;
  const frozenAdmins = state.frozenAdmins;
  if (input.function === "transfer") {
    const target = input.target;
    const qty = input.qty;
    if (!Number.isInteger(qty)) {
      throw new ContractError('Invalid value for "qty". Must be an integer.');
    }
    if (!target) {
      throw new ContractError("No target specified.");
    }
    if (qty <= 0 || caller === target) {
      throw new ContractError("Invalid token transfer.");
    }
    if (!(caller in balances)) {
      throw new ContractError("Caller doesn't own any DAO balance.");
    }
    if (balances[caller] < qty) {
      throw new ContractError(`Caller balance not high enough to send ${qty} token(s)!`);
    }
    balances[caller] -= qty;
    if (target in balances) {
      balances[target] += qty;
    } else {
      balances[target] = qty;
    }
    return {state};
  }
  if (input.function === "balance") {
    const target = input.target || caller;
    if (typeof target !== "string") {
      throw new ContractError("Must specificy target to get balance for.");
    }
    let balance = 0;
    if (target in balances) {
      balance = balances[target];
    }
    if (target in vault && vault[target].length) {
      try {
        balance += vault[target].map((a) => a.balance).reduce((a, b) => a + b, 0);
      } catch (e) {
      }
    }
    const stakingDict = stakes[target] ? stakes[target] : {};
    for (const vPage of Object.keys(stakingDict)) {
      balance += stakes[target][vPage];
    }
    return {result: {target, balance}};
  }
  if (input.function === "unlockedBalance") {
    const target = input.target || caller;
    if (typeof target !== "string") {
      throw new ContractError("Must specificy target to get balance for.");
    }
    if (!(target in balances)) {
      throw new ContractError("Cannnot get balance, target does not exist.");
    }
    let balance = balances[target];
    return {result: {target, balance}};
  }
  if (input.function === "lock") {
    const qty = input.qty;
    const lockLength = input.lockLength;
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new ContractError("Quantity must be a positive integer.");
    }
    if (!Number.isInteger(lockLength) || lockLength < settings.get("lockMinLength") || lockLength > settings.get("lockMaxLength")) {
      throw new ContractError(`lockLength is out of range. lockLength must be between ${settings.get("lockMinLength")} - ${settings.get("lockMaxLength")}.`);
    }
    const balance = balances[caller];
    if (isNaN(balance) || balance < qty) {
      throw new ContractError("Not enough balance.");
    }
    balances[caller] -= qty;
    const start = +SmartWeave.block.height;
    const end = start + lockLength;
    if (caller in vault) {
      vault[caller].push({
        balance: qty,
        end,
        start
      });
    } else {
      vault[caller] = [{
        balance: qty,
        end,
        start
      }];
    }
    return {state};
  }
  if (input.function === "increaseVault") {
    const lockLength = input.lockLength;
    const id = input.id;
    if (!Number.isInteger(lockLength) || lockLength < settings.get("lockMinLength") || lockLength > settings.get("lockMaxLength")) {
      throw new ContractError(`lockLength is out of range. lockLength must be between ${settings.get("lockMinLength")} - ${settings.get("lockMaxLength")}.`);
    }
    if (caller in vault) {
      if (!vault[caller][id]) {
        throw new ContractError("Invalid vault ID.");
      }
    } else {
      throw new ContractError("Caller does not have a vault.");
    }
    if (+SmartWeave.block.height >= vault[caller][id].end) {
      throw new ContractError("This vault has ended.");
    }
    vault[caller][id].end = +SmartWeave.block.height + lockLength;
    return {state};
  }
  if (input.function === "unlock") {
    if (caller in vault && vault[caller].length) {
      let i = vault[caller].length;
      while (i--) {
        const locked = vault[caller][i];
        if (+SmartWeave.block.height >= locked.end) {
          if (caller in balances && typeof balances[caller] === "number") {
            balances[caller] += locked.balance;
          } else {
            balances[caller] = locked.balance;
          }
          vault[caller].splice(i, 1);
        }
      }
    }
    return {state};
  }
  if (input.function === "vaultBalance") {
    const target = input.target || caller;
    let balance = 0;
    if (target in vault) {
      const blockHeight = +SmartWeave.block.height;
      const filtered = vault[target].filter((a) => blockHeight < a.end);
      for (let i = 0, j = filtered.length; i < j; i++) {
        balance += filtered[i].balance;
      }
    }
    return {result: {target, balance}};
  }
  if (input.function === "propose") {
    const voteType = input.type;
    const note = input.note;
    if (typeof note !== "string") {
      throw new ContractError("Note format not recognized.");
    }
    if (!(caller in vault)) {
      throw new ContractError("Caller needs to have locked balances.");
    }
    const hasBalance = vault[caller] && !!vault[caller].filter((a) => a.balance > 0).length;
    if (!hasBalance) {
      throw new ContractError("Caller doesn't have any locked balance.");
    }
    let totalWeight = 0;
    const vaultValues = Object.values(vault);
    for (let i = 0, j = vaultValues.length; i < j; i++) {
      const locked = vaultValues[i];
      for (let j2 = 0, k = locked.length; j2 < k; j2++) {
        totalWeight += locked[j2].balance * (locked[j2].end - locked[j2].start);
      }
    }
    let vote = {
      status: "active",
      type: voteType,
      note,
      yays: 0,
      nays: 0,
      voted: [],
      start: +SmartWeave.block.height,
      totalWeight
    };
    if (voteType === "mint" || voteType === "mintLocked") {
      const recipient = input.recipient;
      const qty = +input.qty;
      if (!recipient) {
        throw new ContractError("No recipient specified");
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new ContractError('Invalid value for "qty". Must be a positive integer.');
      }
      let totalSupply = _calculate_total_supply(vault, balances, stakes);
      if (totalSupply + qty > Number.MAX_SAFE_INTEGER) {
        throw new ContractError("Quantity too large.");
      }
      let lockLength = {};
      if (input.lockLength) {
        if (!Number.isInteger(input.lockLength) || input.lockLength < settings.get("lockMinLength") || input.lockLength > settings.get("lockMaxLength")) {
          throw new ContractError(`lockLength is out of range. lockLength must be between ${settings.get("lockMinLength")} - ${settings.get("lockMaxLength")}.`);
        }
        lockLength = {lockLength: input.lockLength};
      }
      Object.assign(vote, {
        recipient,
        qty
      }, lockLength);
      votes.push(vote);
    } else if (voteType === "burnVault") {
      const target = input.target;
      if (!target || typeof target !== "string") {
        throw new ContractError("Target is required.");
      }
      Object.assign(vote, {
        target
      });
      votes.push(vote);
    } else if (voteType === "set") {
      if (typeof input.key !== "string") {
        throw new ContractError("Data type of key not supported.");
      }
      if (input.key === "quorum" || input.key === "support" || input.key === "lockMinLength" || input.key === "lockMaxLength") {
        input.value = +input.value;
      }
      if (input.key === "quorum") {
        if (isNaN(input.value) || input.value < 0.01 || input.value > 0.99) {
          throw new ContractError("Quorum must be between 0.01 and 0.99.");
        }
      } else if (input.key === "support") {
        if (isNaN(input.value) || input.value < 0.01 || input.value > 0.99) {
          throw new ContractError("Support must be between 0.01 and 0.99.");
        }
      } else if (input.key === "lockMinLength") {
        if (!Number.isInteger(input.value) || input.value < 1 || input.value >= settings.get("lockMaxLength")) {
          throw new ContractError("lockMinLength cannot be less than 1 and cannot be equal or greater than lockMaxLength.");
        }
      } else if (input.key === "lockMaxLength") {
        if (!Number.isInteger(input.value) || input.value <= settings.get("lockMinLength")) {
          throw new ContractError("lockMaxLength cannot be less than or equal to lockMinLength.");
        }
      }
      if (input.key === "role") {
        const recipient = input.recipient;
        if (!recipient) {
          throw new ContractError("No recipient specified");
        }
        Object.assign(vote, {
          key: input.key,
          value: input.value,
          recipient
        });
      } else {
        Object.assign(vote, {
          key: input.key,
          value: input.value
        });
      }
      votes.push(vote);
    } else if (voteType === "indicative") {
      votes.push(vote);
    } else {
      throw new ContractError("Invalid vote type.");
    }
    return {state};
  }
  if (input.function === "vote") {
    const id = input.id;
    const cast = input.cast;
    if (!Number.isInteger(id)) {
      throw new ContractError('Invalid value for "id". Must be an integer.');
    }
    const vote = votes[id];
    let voterBalance = 0;
    if (caller in vault) {
      for (let i = 0, j = vault[caller].length; i < j; i++) {
        const locked = vault[caller][i];
        if (locked.start < vote.start && locked.end >= vote.start) {
          voterBalance += locked.balance * (locked.end - locked.start);
        }
      }
    }
    if (voterBalance <= 0) {
      throw new ContractError("Caller does not have locked balances for this vote.");
    }
    if (vote.voted.includes(caller)) {
      throw new ContractError("Caller has already voted.");
    }
    if (+SmartWeave.block.height >= vote.start + settings.get("voteLength")) {
      throw new ContractError("Vote has already concluded.");
    }
    if (cast === "yay") {
      vote.yays += voterBalance;
    } else if (cast === "nay") {
      vote.nays += voterBalance;
    } else {
      throw new ContractError("Vote cast type unrecognised.");
    }
    vote.voted.push(caller);
    return {state};
  }
  if (input.function === "finalize") {
    const id = input.id;
    const vote = votes[id];
    const qty = vote.qty;
    if (!vote) {
      throw new ContractError("This vote doesn't exists.");
    }
    if (+SmartWeave.block.height < vote.start + settings.get("voteLength")) {
      throw new ContractError("Vote has not yet concluded.");
    }
    if (vote.status !== "active") {
      throw new ContractError("Vote is not active.");
    }
    if (vote.totalWeight * settings.get("quorum") > vote.yays + vote.nays) {
      vote.status = "quorumFailed";
      return {state};
    }
    if (vote.yays !== 0 && (vote.nays === 0 || vote.yays / vote.nays > settings.get("support"))) {
      vote.status = "passed";
      if (vote.type === "mint" || vote.type === "mintLocked") {
        let totalSupply = _calculate_total_supply(vault, balances, stakes);
        if (totalSupply + qty > Number.MAX_SAFE_INTEGER) {
          throw new ContractError("Quantity too large.");
        }
      }
      if (vote.type === "mint") {
        if (vote.recipient in balances) {
          balances[vote.recipient] += qty;
        } else {
          balances[vote.recipient] = qty;
        }
      } else if (vote.type === "mintLocked") {
        const start = +SmartWeave.block.height;
        const end = start + vote.lockLength;
        const locked = {
          balance: qty,
          start,
          end
        };
        if (vote.recipient in vault) {
          vault[vote.recipient].push(locked);
        } else {
          vault[vote.recipient] = [locked];
        }
      } else if (vote.type === "burnVault") {
        if (vote.target in vault) {
          delete vault[vote.target];
        } else {
          vote.status = "failed";
        }
      } else if (vote.type === "set") {
        if (vote.key === "role") {
          state.roles[vote.recipient] = vote.value;
        } else {
          settings.set(vote.key, vote.value);
          state.settings = Array.from(settings);
        }
      }
    } else {
      vote.status = "failed";
    }
    return {state};
  }
  if (input.function === "role") {
    const target = input.target || caller;
    const role = target in state.roles ? state.roles[target] : "";
    if (!role.trim().length) {
      throw new Error("Target doesn't have a role specified.");
    }
    return {result: {target, role}};
  }
  if (input.function === "approvePage") {
    const author = input.author;
    const pageTX = input.pageTX;
    const value = +input.pageValue;
    const lang = input.langCode;
    const slug = input.slug;
    const category = input.category;
    const role = caller in state.roles ? state.roles[caller] : "";
    const start = +SmartWeave.block.height;
    const pageApprovalLength = +settings.get("pageApprovalLength");
    const maxPagesPerLang = +settings.get("maxPagesPerLang");
    const end = start + (pageApprovalLength);
    const balance = balances[caller];
    let totalSupply = _calculate_total_supply(vault, balances, stakes);
    if (!Number.isInteger(value) || value <= 0) {
      throw new ContractError('"pageValue" must be a positive integer.');
    }
    if (role.trim().toUpperCase() !== "MODERATOR") {
      throw new ContractError("Caller must be an admin");
    }
    if (_is_admin_frozen(caller, frozenAdmins, start)) {
      throw new ContractError("Error: Caller admin is frozen");
    }
    if (typeof author !== 'string' || !author.trim().length) {
      throw new ContractError("Author address must be specified");
    }
    if (typeof lang !== 'string' || !lang.trim().length) {
      throw new ContractError("LangCode must be specified");
    }
    if (typeof slug !== 'string' || !slug.trim().length) {
      throw new ContractError("Slug must be specified");
    }
    if (typeof category !== 'string' || !category.trim().length) {
      throw new ContractError("Category must be specified");
    }
    if (typeof pageTX !== 'string' || !pageTX.trim().length) {
      throw new ContractError("PageTX must be specified");
    }
    if (!Object.prototype.hasOwnProperty.call(state.pages, lang)) {
      throw new ContractError("Invalid LangCode"); 
    }
    if (Object.prototype.hasOwnProperty.call(state.pages[lang], slug)) {
      throw new ContractError("Slug already taken!"); 
    }
    if (Object.prototype.hasOwnProperty.call(stakes, caller) &&
        stakes[caller][pageTX]) {
      throw new ContractError("User is already staking on this page");
    }
    if (isNaN(balance) || balance < value) {
      throw new ContractError("Not enough balance.");
    }
    if (totalSupply + value > Number.MAX_SAFE_INTEGER) {
      throw new ContractError("'value' too large.");
    }
    balances[caller] -= value;
    if (!Object.prototype.hasOwnProperty.call(stakes, caller)) {
      stakes[caller] = {};
    }
    stakes[caller][pageTX] = value;
    pages[lang][slug] = {
      author,
      content: pageTX,
      sponsor: caller,
      value,
      start,
      pageRewardAt: end,
      paidAt: '',
      category: category,
      updates: [],
      active: true
    };
    return { state };
  }
  if (input.function === "unlockPageReward") {
    const author = input.target || caller;
    const currentHeight = +SmartWeave.block.height;
    const lang = input.langCode;
    const slug = input.slug;
    if (typeof lang !== 'string' || !lang.trim().length) {
      throw new ContractError("LangCode must be specified");
    }
    if (typeof slug !== 'string' || !slug.trim().length) {
      throw new ContractError("Slug must be specified");
    }
    if (!Object.prototype.hasOwnProperty.call(pages, lang)) {
      throw new ContractError("Invalid LangCode"); 
    }
    if (!Object.prototype.hasOwnProperty.call(pages[lang], slug)) {
      throw new ContractError("Invalid slug!"); 
    }
    if (pages[lang][slug] && pages[lang][slug].author === author &&
        currentHeight >= pages[lang][slug].pageRewardAt &&
        !pages[lang][slug].paidAt) {
      balances[author] += pages[lang][slug].value;
      pages[lang][slug].paidAt = currentHeight;
    }
    return {state};
  }
  if (input.function === "updatePageSponsor") {
    const value = +input.pageValue;
    const role = caller in state.roles ? state.roles[caller] : "";
    const balance = +balances[caller];
    const currentHeight = +SmartWeave.block.height;
    let totalSupply = _calculate_total_supply(vault, balances, stakes);
    const lang = input.langCode;
    const slug = input.slug;
    if (typeof lang !== 'string' || !lang.trim().length) {
      throw new ContractError("LangCode must be specified");
    }
    if (typeof slug !== 'string' || !slug.trim().length) {
      throw new ContractError("Slug must be specified");
    }
    if (!Object.prototype.hasOwnProperty.call(pages, lang)) {
      throw new ContractError("Invalid LangCode"); 
    }
    if (!Object.prototype.hasOwnProperty.call(pages[lang], slug)) {
      throw new ContractError("Invalid slug!"); 
    }
    if (!Number.isInteger(value) || value <= 0) {
      throw new ContractError('"pageValue" must be a positive integer.');
    }
    if (role.trim().toUpperCase() !== "MODERATOR") {
      throw new ContractError("Caller must be an admin");
    }
    if (_is_admin_frozen(caller, frozenAdmins, currentHeight)) {
      throw new ContractError("Error: Caller admin is frozen");
    }
    if (isNaN(balance) || balance < value) {
      throw new ContractError("Not enough balance.");
    }
    if (totalSupply + value > Number.MAX_SAFE_INTEGER) {
      throw new ContractError("'value' too large.");
    }
    const pageTX = pages[lang][slug].content;
    if (Object.prototype.hasOwnProperty.call(stakes, caller) &&
        stakes[caller][pageTX]) {
      throw new ContractError("User is already staking for this page");
    }

    const previousSponsor = pages[lang][slug].sponsor;
    const previousValue = pages[lang][slug].value;
    if (value <= previousValue) {
      throw new ContractError("New page value must be greater than the previous one.");
    }
    balances[caller] -= value;
    if (previousSponsor && Object.prototype.hasOwnProperty.call(balances, previousSponsor) &&
      stakes[previousSponsor]) {
      balances[previousSponsor] += previousValue;
      delete stakes[previousSponsor][pageTX];
    }

    if (!Object.prototype.hasOwnProperty.call(stakes, caller)) {
      stakes[caller] = {};
    }
    stakes[caller][pageTX] = value;
    pages[lang][slug].sponsor = caller;
    pages[lang][slug].value = value;
    pages[lang][slug].active = true;

    return { state };
  }
  if (input.function === "stopPageSponsorshipAndDeactivatePage") {
    const role = caller in state.roles ? state.roles[caller] : "";
    const currentHeight = +SmartWeave.block.height;
    const lang = input.langCode;
    const slug = input.slug;
    if (typeof lang !== 'string' || !lang.trim().length) {
      throw new ContractError("LangCode must be specified");
    }
    if (typeof slug !== 'string' || !slug.trim().length) {
      throw new ContractError("Slug must be specified");
    }
    if (!Object.prototype.hasOwnProperty.call(pages, lang)) {
      throw new ContractError("Invalid LangCode"); 
    }
    if (!Object.prototype.hasOwnProperty.call(pages[lang], slug)) {
      throw new ContractError("Invalid slug!"); 
    }
    if (role.trim().toUpperCase() !== "MODERATOR") {
      throw new ContractError("Caller must be an admin");
    }
    const pageTX = pages[lang][slug].content;
    if (!Object.prototype.hasOwnProperty.call(stakes, caller) ||
        !stakes[caller][pageTX]) {
      throw new ContractError("User is not staking for this page");
    }
    if (pages[lang][slug].sponsor !== caller) {
      throw new ContractError("User is not the sponsor");
    }

    const currentSponsor = pages[lang][slug].sponsor;
    const currentValue = pages[lang][slug].value;

    balances[currentSponsor] += currentValue;
    delete stakes[currentSponsor][pageTX];

    pages[lang][slug].sponsor = '';
    pages[lang][slug].value = 0;
    pages[lang][slug].active = false;
    // :)
    if (pages[lang][slug].paidAt && pages[lang][slug].author === caller) {
      balances[currentSponsor] -= currentValue;
    }
    
    return { state };
  }
  if (input.function === "balanceDetail") {
    const target = input.target || caller;
    if (typeof target !== "string") {
      throw new ContractError("Must specificy target to get balance for.");
    }
    let unlockedBalance = 0;
    let vaultBalance = 0;
    let stakingBalance = 0;
    if (target in balances) {
      unlockedBalance = balances[target];
    }
    if (target in vault && vault[target].length) {
      try {
        vaultBalance += vault[target].map((a) => a.balance).reduce((a, b) => a + b, 0);
      } catch (e) {
      }
    }
    const stakingDict = stakes[target] ? stakes[target] : {};
    for (const vPage of Object.keys(stakingDict)) {
      stakingBalance += stakes[target][vPage];
    }
    return {result: {target, unlockedBalance, vaultBalance, stakingBalance}};
  }
  if (input.function === "addPageUpdate") {
    const role = caller in state.roles ? state.roles[caller] : "";
    const balance = +balances[caller];
    const currentHeight = +SmartWeave.block.height;
    const lang = input.langCode;
    const slug = input.slug;
    const updateTX = input.updateTX;
    if (typeof lang !== 'string' || !lang.trim().length) {
      throw new ContractError("LangCode must be specified");
    }
    if (typeof slug !== 'string' || !slug.trim().length) {
      throw new ContractError("Slug must be specified");
    }
    if (typeof updateTX !== 'string' || !updateTX.trim().length) {
      throw new ContractError("UpdateTX must be specified");
    }
    if (!Object.prototype.hasOwnProperty.call(pages, lang)) {
      throw new ContractError("Invalid LangCode"); 
    }
    if (!Object.prototype.hasOwnProperty.call(pages[lang], slug)) {
      throw new ContractError("Invalid slug!"); 
    }
    if (role.trim().toUpperCase() !== "MODERATOR") {
      throw new ContractError("Caller must be an admin");
    }
    if (_is_admin_frozen(caller, frozenAdmins, currentHeight)) {
      throw new ContractError("Error: Caller admin is frozen");
    }
    if (!pages[lang][slug].active) {
      throw new ContractError("Page is inactive");
    }
    pages[lang][slug].updates.push({
      tx: updateTX, approvedBy: caller, at: currentHeight
    });
    return { state };
  }
  if (input.function === "activateDeactivatePage") {
    const role = caller in state.roles ? state.roles[caller] : "";
    const currentHeight = +SmartWeave.block.height;
    const lang = input.langCode;
    const slug = input.slug;
    const newStatus = !!input.active;
    if (typeof lang !== 'string' || !lang.trim().length) {
      throw new ContractError("LangCode must be specified");
    }
    if (typeof slug !== 'string' || !slug.trim().length) {
      throw new ContractError("Slug must be specified");
    }
    if (!Object.prototype.hasOwnProperty.call(pages, lang)) {
      throw new ContractError("Invalid LangCode"); 
    }
    if (!Object.prototype.hasOwnProperty.call(pages[lang], slug)) {
      throw new ContractError("Invalid slug!"); 
    }
    if (role.trim().toUpperCase() !== "MODERATOR") {
      throw new ContractError("Caller must be an admin");
    }
    if (_is_admin_frozen(caller, frozenAdmins, currentHeight)) {
      throw new ContractError("Error: Caller admin is frozen");
    }
    const pageTX = pages[lang][slug].content;
    if (!Object.prototype.hasOwnProperty.call(stakes, caller) ||
        !stakes[caller][pageTX]) {
      throw new ContractError("User is not staking for this page");
    }
    if (pages[lang][slug].sponsor !== caller) {
      throw new ContractError("User is not the sponsor");
    }

    pages[lang][slug].active = newStatus;
    
    return { state };
  }
  if (input.function === "freezeAdmin") {
    const role = caller in state.roles ? state.roles[caller] : "";
    const currentHeight = +SmartWeave.block.height;
    const adminToBeFrozen = input.target;
    const frozenLength = +settings.get("frozenLength");
    const roleT = adminToBeFrozen in state.roles ? state.roles[adminToBeFrozen] : "";
    if (role.trim().toUpperCase() !== "MODERATOR") {
      throw new ContractError("Caller must be an admin");
    }
    if (roleT.trim().toUpperCase() !== "MODERATOR") {
      throw new ContractError("Target must be an admin");
    }
    if (_is_admin_frozen(adminToBeFrozen, frozenAdmins, currentHeight)) {
      throw new ContractError("Target admin is already frozen :)");
    }
    if (_is_admin_frozen(caller, frozenAdmins, currentHeight)) {
      throw new ContractError("Can't freeze admin. Caller is frozen!");
    }
    for (const fa in frozenAdmins) {
      if (frozenAdmins[fa].frozenBy === caller &&
          currentHeight < frozenAdmins[fa].frozenUntil) {
        throw new ContractError("You already freezed an admin! Please wait until unfrozen to frost another one.");
      }
    }

    frozenAdmins[adminToBeFrozen] = {
      frozenAt: currentHeight,
      frozenUntil: currentHeight + frozenLength,
      frozenBy: caller
    };

    return { state };
  }
  throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
}

function _calculate_total_supply(vault, balances, stakes) {
  const vaultValues2 = Object.values(vault);
  let totalSupply = 0;
  for (let i = 0, j = vaultValues2.length; i < j; i++) {
    const locked = vaultValues2[i];
    for (let j2 = 0, k = locked.length; j2 < k; j2++) {
      totalSupply += locked[j2].balance;
    }
  }
  const balancesValues = Object.values(balances);
  for (let i = 0, j = balancesValues.length; i < j; i++) {
    totalSupply += balancesValues[i];
  }
  const stakersList = Object.keys(stakes);
  for (const staker of stakersList) {
    const pagesStakedByUser = Object.keys(stakes[staker]);
    for (const pageIdByUs of pagesStakedByUser) {
      totalSupply += stakes[staker][pageIdByUs];
    }
  }
  return totalSupply;
}

function _is_admin_frozen(admin, frozenAdmins, currentHeight) {
  if (frozenAdmins && Object.keys(frozenAdmins).length > 0 &&
      frozenAdmins[admin] && 
      currentHeight < frozenAdmins[admin].frozenUntil) {
    return true;
  }
  return false;
}