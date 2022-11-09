import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription, of } from 'rxjs';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { UserSettingsService } from '../../core/user-settings.service';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';

@Component({
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, OnDestroy {
  arwikiQuery!: ArwikiQuery;
  pagesSubscription: Subscription = Subscription.EMPTY;
  loadingPages: boolean = false;
  query: string = '';
  pages: any[] = [];
  routeLang: string = '';
  pagesData: any = {};
  baseURL: string = this._arweave.baseURL;
  defaultTheme = '';
  frmSearch: UntypedFormGroup = new UntypedFormGroup({
    'searchQry': new UntypedFormControl('', [Validators.required])
  });

  get searchQry() {
    return this.frmSearch.get('searchQry');
  }

  set setSearchQry(qry: string) {
    this.frmSearch.get('searchQry')!.setValue(qry);
  }

  constructor(
    private _arweave: ArweaveService,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _snackBar: MatSnackBar,
    private _route: ActivatedRoute,
    private _userSettings: UserSettingsService,
    private _router: Router,
    private _location: Location
   ) { }

  async ngOnInit() {
    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    this._route.paramMap.subscribe(async params => {
      this.query = params.get('query')!;
      this.routeLang = params.get('lang')!;
      this.setSearchQry = this.query;

      await this.searchNow();
    });

    this.getDefaultTheme();
    
  }

  async searchNow() {
    this.loadingPages = true;
    this.pages = [];

    let networkInfo;
    let maxHeight = 0;
    const maxPages = 100;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(`${error}`, 'error');
      return;
    }

    this.pagesSubscription = this.searchInApprovedTags(
      [this.query],
      this.routeLang,
      maxHeight,
      maxPages
    ).subscribe({
      next: async (pages: any) => {
        this.pages = pages;
        this.pagesData = {};
        this.loadingPages = false;

        for (let p of pages) {
          this.pagesData[p.id] = await this._arweave.arweave.transactions.getData(
            p.id, 
            {decode: true, string: true}
          );  
        }

        
      },
      error: (error: string) => {
        this.message(error, 'error');
        this.loadingPages = false;
      }
    });
  }


  slugToLabel(_s: string) {
    return _s.replace(/_/gi, " ");
  }


  /*
  *  Custom snackbar message
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


  /*
  * @dev
  */
  searchInApprovedTags(
    _queries: string[],
    _langCode: string,
    _maxHeight: number,
    _limit: number = 100
  ) {
    const qry = _queries.map(e => e.toLowerCase().trim());
    let adminList: string[] = [];
    let verifiedPages: any = {};
    return this._arwikiTokenContract.getAdminList()
      .pipe(
        switchMap((_adminList: string[]) => {
          adminList = _adminList;
          return this._arwikiTokenContract.getApprovedPages(_langCode);
        }),
        switchMap((_verifiedPages: any) => {
          verifiedPages = _verifiedPages;
          return this.arwikiQuery.getVerifiedTagsFromQueries(
            adminList,
            qry,
            _langCode,
            _limit,
            _maxHeight
          );
        }),
        switchMap((_verifiedTags: ArdbTransaction[]|ArdbBlock[]) => {
          const verifiedPagesList: string[] = [];
          const verifiedSlugs = Object.keys(verifiedPages);
          for (let p of _verifiedTags) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const vrfdSlug = this.arwikiQuery.searchKeyNameInTags(
              pTX.tags, 'Arwiki-Page-Slug'
            );

            if (verifiedSlugs.indexOf(vrfdSlug) < 0) {
              continue;
            }
            if (verifiedPagesList.indexOf(verifiedPages[vrfdSlug].id) >= 0) {
              continue;
            }
            let id = verifiedPages[vrfdSlug].content;
            if (verifiedPages[vrfdSlug].updates.length) {
              id = verifiedPages[vrfdSlug].updates[verifiedPages[vrfdSlug].updates.length - 1].tx;
            }
            verifiedPagesList.push(id);
          }
          return this.arwikiQuery.getTXsData(verifiedPagesList);
        }),
        switchMap((txs: ArdbTransaction[]|ArdbBlock[]) => {
          const finalRes: any = [];
          for (let p of txs) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
            const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
            const category = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
            const img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
            const owner = pTX.owner.address;
            const id = pTX.id;
            
            finalRes.push({
              title: title,
              slug: slug,
              category: category,
              img: img,
              owner: owner,
              id: id
            });
            
          }
          return of(finalRes);
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

  onSearch() {
    const qry = this.searchQry!.value;
    if (!qry) {
      return;
    }
    this._router.navigate([`${this.routeLang}/search/${qry}`]);
  }

  goBack() {
    this._location.back();
  }


}
