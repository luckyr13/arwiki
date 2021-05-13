import Arweave from 'arweave';

/*
* Arwiki versions supported by the system
* arwikiVersion[0] the first position must contain the latest supported version
*/
export const arwikiVersion = ['0.2'];

/*
*	@dev Main class
*/
export class Arwiki {
	private _arweave: Arweave;

	constructor(
    _arweave: Arweave
  ) {
		this._arweave = _arweave;
	}

  /*
  * @dev All pages needs to be validated first 
  * to be listed on the Arwiki. Validations are special TXs
  * with custom tags (Arwiki-Type: Validation)
  */
  async createValidationTXForArwikiPage(
    _pageId: string,
    _slug: string,
    _category: string,
    _langCode: string,
    _privateKey: any
  ) {
    const jwk = _privateKey;
    const data = { pageId: _pageId, slug: _slug, category: _category };
    const tx = await this._arweave.createTransaction({
      data: JSON.stringify(data)
    }, jwk);
    tx.addTag('Content-Type', 'text/json');
    tx.addTag('Service', 'ArWiki');
    tx.addTag('Arwiki-Type', 'Validation');
    tx.addTag('Arwiki-Page-Id', _pageId);
    tx.addTag('Arwiki-Page-Slug', _slug);
    tx.addTag('Arwiki-Page-Category', _category);
    tx.addTag('Arwiki-Page-Lang', _langCode);
    tx.addTag('Arwiki-Version', arwikiVersion[0]);
    await this._arweave.transactions.sign(tx, jwk)
    await this._arweave.transactions.post(tx)
    return tx.id;
  }
  
  /*
  *  @dev Create an Arwiki Tag
  * A tag in the arwiki context is a TX with custom "tags"
  * that helps to the search engine to locate pages
  * (Arwiki-Type: Tag)
  */
  async createTagTXForArwikiPage(
    _pageId: string,
    _tag: string,
    _category_slug: string,
    _langCode: string,
    _privateKey: any
  ) {
    _tag = _tag.toLowerCase().trim();
    const jwk = _privateKey;
    const data = { pageId: _pageId, tag: _tag };
    const tx = await this._arweave.createTransaction({
      data: JSON.stringify(data)
    }, jwk);
    tx.addTag('Content-Type', 'text/json');
    tx.addTag('Service', 'ArWiki');
    tx.addTag('Arwiki-Type', 'Tag');
    tx.addTag('Arwiki-Page-Id', _pageId);
    tx.addTag('Arwiki-Page-Tag', _tag);
    tx.addTag('Arwiki-Page-Category', _category_slug);
    tx.addTag('Arwiki-Page-Lang', _langCode);
    tx.addTag('Arwiki-Version', arwikiVersion[0]);
    await this._arweave.transactions.sign(tx, jwk)
    await this._arweave.transactions.post(tx)
    return tx.id;
  }

  /*
  * @dev Pages can be removed
  * if an admin creates a Delete TX (Arwiki-Type: DeletePage)
  */
  async createDeleteTXForArwikiPage(
    _pageId: string,
    _slug: string,
    _category: string,
    _langCode: string,
    _privateKey: any
  ) {
    const jwk = _privateKey;
    const data = { pageId: _pageId, slug: _slug, category: _category };
    const tx = await this._arweave.createTransaction({
      data: JSON.stringify(data)
    }, jwk);
    tx.addTag('Content-Type', 'text/json');
    tx.addTag('Service', 'ArWiki');
    tx.addTag('Arwiki-Type', 'DeletePage');
    tx.addTag('Arwiki-Page-Id', _pageId);
    tx.addTag('Arwiki-Page-Slug', _slug);
    tx.addTag('Arwiki-Page-Category', _category);
    tx.addTag('Arwiki-Page-Lang', _langCode);
    tx.addTag('Arwiki-Version', arwikiVersion[0]);
    await this._arweave.transactions.sign(tx, jwk)
    await this._arweave.transactions.post(tx)
    return tx.id;
  }

  /*
  * @dev A page can be set as the Main Page
  * if an admin creates a MainPage TX (Arwiki-Type: MainPage)
  * Note: The latest MainPage TX would be the considered as the main page
  */
  async createMainPageTXForArwikiPage(
    _pageId: string,
    _slug: string,
    _category: string,
    _langCode: string,
    _privateKey: any
  ) {
    const jwk = _privateKey;
    const data = { pageId: _pageId, slug: _slug, category: _category };
    const tx = await this._arweave.createTransaction({
      data: JSON.stringify(data)
    }, jwk);
    tx.addTag('Content-Type', 'text/json');
    tx.addTag('Service', 'ArWiki');
    tx.addTag('Arwiki-Type', 'MainPage');
    tx.addTag('Arwiki-Page-Id', _pageId);
    tx.addTag('Arwiki-Page-Slug', _slug);
    tx.addTag('Arwiki-Page-Category', _category);
    tx.addTag('Arwiki-Page-Lang', _langCode);
    tx.addTag('Arwiki-Version', arwikiVersion[0]);
    await this._arweave.transactions.sign(tx, jwk)
    await this._arweave.transactions.post(tx)
    return tx.id;
  }


}

