import Arweave from 'arweave';
import Transaction from 'arweave/node/lib/transaction';
import { JWKInterface } from 'arweave/node/lib/wallet';

/*
 * Based on Verto-Compatible NFT Specification: 
 * https://www.notion.so/Verto-Compatible-NFT-Specification-fd1e85adbe5a4f7598f89c1e7eccd0d6
*/
export class ArweaveContractCreateNFT {
 	constructor() {
 	}

 	stateToString(_state: INFTStateTemplate) {
 		return JSON.stringify(_state);
 	}

 	/**
	 * Create a new contract from a contract source file and an initial state.
	 * Returns the contract id.
	 *
	 * @param arweave       an Arweave client instance
	 * @param wallet        a wallet private or public key
	 * @param contractSrc   the contract source as string.
	 * @param initState     the contract initial state, as a JSON string.
	 * @param dataPayload   the binary data for the NFT.
	 * @param contentType   the content type for the data.
	 * @param target        if needed to send AR to an address, this is the target.
	 * @param winstonQty    amount of winston to send to the target, if needed.
	 */
	async createNFTContract(
	  arweave: Arweave,
	  wallet: JWKInterface | 'use_wallet',
	  contractSrc: string,
	  initState: string,
	  dataPayload: string,
	  contentType: string,
	  target: string = '',
	  winstonQty: string = '',
	  langCode: string = '',
	  categorySlug: string = '',
	  slug: string = '',
	  img: string = '',
	  title: string = ''
	): Promise<string> {
	  const srcTx = await arweave.createTransaction({ data: contractSrc }, wallet);

	  srcTx.addTag('App-Name', 'SmartWeaveContractSource');
	  srcTx.addTag('App-Version', '0.3.0');
	  srcTx.addTag('Content-Type', 'application/javascript');

	  await arweave.transactions.sign(srcTx, wallet);

	  const response = await arweave.transactions.post(srcTx);

	  if (response.status === 200 || response.status === 208) {
		  const extraTags = [
				{name:'Exchange', value: 'Verto'},
				{name: 'Action', value: 'marketplace/create'}
			];
	    return await this.createNFTContractFromTx(
	    	arweave, wallet, srcTx.id, initState,
	    	extraTags, dataPayload, contentType,
	    	target, winstonQty,
			  langCode,
			  categorySlug,
			  slug,
			  img,
			  title
			);
	  } else {
	    throw new Error('Unable to write Contract Source.');
	  }
	}

	/**
	 * Create a new contract from an existing contract source tx, with an initial state.
	 * Returns the contract id.
	 *
	 * @param arweave   an Arweave client instance
	 * @param wallet    a wallet private or public key
	 * @param srcTxId   the contract source Tx id.
	 * @param state     the initial state, as a JSON string.
	 * @param tags          an array of tags with name/value as objects.
	 * @param dataPayload   the binary data for the NFT.
	 * @param contentType   the content type for the data.
	 * @param target        if needed to send AR to an address, this is the target.
	 * @param winstonQty    amount of winston to send to the target, if needed.
	 */
	async createNFTContractFromTx(
	  arweave: Arweave,
	  wallet: JWKInterface | 'use_wallet',
	  srcTxId: string,
	  state: string,
	  tags: { name: string; value: string }[] = [],
	  dataPayload: string = '',
	  contentType: string = '',
	  target: string = '',
	  winstonQty: string = '',
	  langCode: string = '',
	  categorySlug: string = '',
	  slug: string = '',
	  img: string = '',
	  title: string = '',
	) {
	  let contractTX = await arweave.createTransaction({ data: dataPayload }, wallet);

	  if (target && winstonQty && target.length && +winstonQty > 0) {
	    contractTX = await arweave.createTransaction(
	      {
	        data: dataPayload,
	        target: target.toString(),
	        quantity: winstonQty.toString(),
	      },
	      wallet,
	    );
	  }

	  if (tags && tags.length) {
	    for (const tag of tags) {
	      contractTX.addTag(tag.name.toString(), tag.value.toString());
	    }
	  }

	  contractTX.addTag('App-Name', 'SmartWeaveContract');
	  contractTX.addTag('App-Version', '0.3.0');
	  contractTX.addTag('Contract-Src', srcTxId);
	  contractTX.addTag('Content-Type', contentType);
	  contractTX.addTag('Init-State', state);
	  // Custom ArWiki tags
	  contractTX.addTag('Service', 'ArWiki');
    contractTX.addTag('Arwiki-Version', '0.1');
    contractTX.addTag('Arwiki-Type', 'page');
    contractTX.addTag('Arwiki-Page-Lang', langCode);
    contractTX.addTag('Arwiki-Page-Category', categorySlug);
    contractTX.addTag('Arwiki-Page-Slug', slug);
    contractTX.addTag('Arwiki-Page-Title', title);
    contractTX.addTag('Arwiki-Page-Img', img);

	  await arweave.transactions.sign(contractTX, wallet);

	  const response = await arweave.transactions.post(contractTX);
	  if (response.status === 200 || response.status === 208) {
	    return contractTX.id;
	  } else {
	    throw new Error('Unable to write Contract Initial State');
	  }
	}

}

export interface INFTStateTemplate {
	name: string,
	description: string,
  ticker: string,
  owner: string,
  balance: any,
  category?: any,
  updates?: any[],
  img?: string
};

export const contractTemplateNFT: string = `export function handle(state, action) {
  const input = action.input;
  const caller = action.caller;
  if (input.function === "transfer") {
    const target = input.target;
    ContractAssert(target, 'No target specified.');
    ContractAssert(caller !== target, 'Invalid token transfer.');
    ContractAssert(caller === state.owner, 'Caller does not own the token.');
    state.balance[state.owner] = 0;
    state.owner = target;
    state.balance[target] = 1;
    return {state};
  }
  if (input.function === "balance") {
    let target;
    if (input.target) {
      target = input.target;
    } else {
      target = caller;
    }
    const ticker = state.ticker;
    ContractAssert(
      typeof target === "string", 
      'Must specify target to retrieve balance for.'
    );
    return {
      result: {
        target,
        ticker,
        balance: target === state.owner ? 1 : 0
      }
    };
  }
  if (input.function === "addUpdate") {
    const updateId = state.input.updateId.trim();
    ContractAssert(caller === state.owner, 'Caller does not own the token.');
    ContractAssert(updateId.length === 43, 'UpdateId must be a valid arweave id');
    state.updates.push(updateId);
    return {state};
  }
  throw new ContractError("No function supplied or function not recognised: " + input.function);
}`;

export const contractNFTBaseTxId = '3Mftf_qsV2pJdfpqpVvtbHXk_EQIX80r72xIAPyRCeQ';