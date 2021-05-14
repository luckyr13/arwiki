import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription, of } from 'rxjs';
import { ArwikiSettingsContract } from '../../core/arwiki-contracts/arwiki-settings';
import { ArwikiCategoriesContract } from '../../core/arwiki-contracts/arwiki-categories';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getVerification } from "arverify";
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { UserSettingsService } from '../../core/user-settings.service';

@Component({
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit {
  arwikiQuery!: ArwikiQuery;
  pagesSubscription: Subscription = Subscription.EMPTY;
  loadingPages: boolean = false;
  category: string = '';
  pages: any[] = [];
  routeLang: string = '';
  pagesData: any = {};
  baseURL: string = this._arweave.baseURL;
  arverifyProcessedAddressesMap: any = {};
  defaultTheme: string = '';

  constructor(
  	private _arweave: ArweaveService,
  	private _settingsContract: ArwikiSettingsContract,
    private _categoriesContract: ArwikiCategoriesContract,
  	private _snackBar: MatSnackBar,
  	private _route: ActivatedRoute,
    private _location: Location,
    private _userSettings: UserSettingsService
 	) { }

  async ngOnInit() {
    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
  	this.category = this._route.snapshot.paramMap.get('category')!;
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;

    this.getDefaultTheme();

    this._route.paramMap.subscribe(async params => {
      this.routeLang = params.get('lang')!;
      this.category = params.get('category')!;
      await this._loadContent();
    });
    
    

  }

  private async _loadContent() {
    this.loadingPages = true;
    let networkInfo;
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(error, 'error');
      return;
    }

    this.pagesSubscription = this.getPagesByCategory(
      this.category,
      this.routeLang,
      maxHeight
    ).subscribe({
      next: async (pages) => {
        const finalRes: ArwikiPage[] = [];
        for (let p of pages) {
          const title = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
          const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
          const category = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
          const img = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img');
          const lang = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang');
          const owner = p.node.owner.address;
          const id = p.node.id;
          
          finalRes.push({
            title: title,
            slug: slug,
            category: category,
            img: img,
            owner: owner,
            id: id,
            language: lang
          });
          
        }

        this.pages = finalRes;
        this.pagesData = {};
        this.loadingPages = false;

        for (let p of this.pages) {
          this.pagesData[p.id] = await this._arweave.arweave.transactions.getData(
            p.id, 
            {decode: true, string: true}
          );  
        }

        // Verify addresses 
        // Validate owner address with ArVerify
        this.arverifyProcessedAddressesMap = {};
        for (let p of pages) {
          // Avoid duplicates
          if (
            Object.prototype.hasOwnProperty.call(
              this.arverifyProcessedAddressesMap, 
              p.owner
            )
          ) {
            continue;
          }
          const arverifyQuery = await this.getArverifyVerification(p.owner);
          this.arverifyProcessedAddressesMap[p.owner] = arverifyQuery;
        }
        
      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingPages = false;
      }
    });
  }

  slugToLabel(_s: string) {
  	return _s.replace(/_/gi, " ");
  }


  /*
  *	Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 8000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }


  ngOnDestroy() {
  	if (this.pagesSubscription) {
  		this.pagesSubscription.unsubscribe();
  	}

  }


  async getArverifyVerification(_address: string) {
    const verification = await getVerification(_address);

    return ({
      verified: verification.verified,
      icon: verification.icon,
      percentage: verification.percentage
    });
  }

  sanitizeMarkdown(_s: string) {
    _s = _s.replace(/[#*=\[\]]/gi, '')
    let res: string = `${_s.substring(0, 250)} ...`;
    return res;
  }

  
  sanitizeImg(_img: string) {
    let res: string = _img.indexOf('http') >= 0 ?
      _img :
      _img ? `${this.baseURL}${_img}` : '';
    return res;
  }


  goBack() {
    this._location.back();
  }

  /*
  * @dev
  */
  getPagesByCategory(
    _category: string,
    _langCode: string,
    _maxHeight: number,
    _limit: number = 100
  ) {
    let settingsCS: any = {};
    const verifiedPagesDict: Record<string, boolean> = {};
    return this._settingsContract.getState()
      .pipe(
        switchMap((settingsContractState) => {
          settingsCS = settingsContractState;
          return this._categoriesContract.getState();
        }),
        switchMap((categoriesContractState) => {
          // Validate category 
          if (!(_category in categoriesContractState)) {
            throw new Error('Invalid category!');
          }
          
          return this.arwikiQuery.getVerifiedPagesByCategories(
            Object.keys(settingsCS.admin_list),
            [_category],
            _langCode,
            _limit,
            _maxHeight
          );
        }),
        switchMap((verifiedPages) => {
          for (let p of verifiedPages) {
            const vrfdPageId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
            verifiedPagesDict[vrfdPageId] = true;
          }

          return this.arwikiQuery.getDeletedPagesTX(
            Object.keys(settingsCS.admin_list),
            Object.keys(verifiedPagesDict),
            _langCode,
            _limit,
            _maxHeight
          );
        }),
        switchMap((deletedPagesTX) => {
          const deletedPagesDict: Record<string,boolean> = {};
          for (const p of deletedPagesTX) {
            const arwikiId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
            deletedPagesDict[arwikiId] = true;
          }

          let finalList = Object.keys(verifiedPagesDict).filter((vpId) => {
            return !deletedPagesDict[vpId];
          });
          
          return this.arwikiQuery.getTXsData(finalList);
        })
      );
  }


  getDefaultTheme() {
    this.defaultTheme = this._userSettings.getDefaultTheme();
    this._userSettings.defaultThemeStream.subscribe(
      (theme) => {
        this.defaultTheme = theme;
      }
    );
  }

}
