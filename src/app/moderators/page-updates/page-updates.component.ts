import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { switchMap } from 'rxjs/operators';
import { getVerification } from "arverify";
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmAmountComponent } from '../../shared/dialog-confirm-amount/dialog-confirm-amount.component';
import { DialogCompareComponent } from '../../shared/dialog-compare/dialog-compare.component';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ActivatedRoute } from '@angular/router';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { arwikiVersion } from '../../core/arwiki';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';

@Component({
  selector: 'app-page-updates',
  templateUrl: './page-updates.component.html',
  styleUrls: ['./page-updates.component.scss']
})
export class PageUpdatesComponent implements OnInit , OnDestroy {
	loadingPendingPages: boolean = false;
  pages: ArwikiPageIndex = {};
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  arverifyProcessedAddressesMap: any = {};
  loadingInsertPageIntoIndex: boolean = false;
  insertPageTxMessage: string = '';
  insertPageTxErrorMessage: string = '';
  arwikiQuery!: ArwikiQuery;
  routeLang: string = '';
  baseURL = this._arweave.baseURL;
  pageSlug: string = '';

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _snackBar: MatSnackBar,
    public _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _userSettings: UserSettingsService,
    private _arwikiTokenContract: ArwikiTokenContract
  ) { }

  async ngOnInit() {
    const adminList: any[] = this._auth.getAdminList();
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;
    this.pageSlug = this._route.snapshot.paramMap.get('slug')!;

    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);

    // Get pages
    this.loadingPendingPages = true;
    const numPages = 100;
    let networkInfo;
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height;
    } catch (error) {
      this.message(`${error}`, 'error');
      return;
    }

    this.pendingPagesSubscription = this.arwikiQuery
      .getPendingPagesUpdates(
        this.routeLang,
        this.pageSlug,
        numPages,
        maxHeight
      )
      .pipe(
        switchMap((pendingPages: ArdbTransaction[]|ArdbBlock[]) => {
          let tmp_res: ArwikiPageIndex = {};
          for (let p of pendingPages) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            tmp_res[pTX.id] = {
              id: pTX.id,
              title: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title'),
              slug: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug'),
              category: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category'),
              language: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Lang'),
              img: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img'),
              owner: pTX.owner.address,
              block: pTX.block,
              value: this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Value'),
              
            };
          }
          return of(tmp_res);
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          return (
            this._arwikiTokenContract.getApprovedPages(this.routeLang, -1, true)
              .pipe(
                switchMap((_approvedPages: ArwikiPageIndex) => {
                  let tmp_res: ArwikiPageIndex = {};
                  let verifiedUpdates: string[] = [];
                  for (const approvedSlug of Object.keys(_approvedPages)) {
                    const updates = _approvedPages[approvedSlug].updates!.map((c: any) => {
                      return c.tx;
                    });
                    verifiedUpdates = verifiedUpdates.concat(updates);
                  }

                  // Check pending updates against verified updates
                  for (let pId in pendingPages) {
                    if (!(verifiedUpdates.indexOf(pId) >= 0)) {
                      tmp_res[pId] = pendingPages[pId];
                    }
                  }
                  return of(tmp_res);
                })
              )
          );
        })
      ).subscribe({
        next: async (pages: ArwikiPageIndex) => {
          this.pages = pages;
          this.loadingPendingPages = false;
          // Validate owner address with ArVerify
          this.arverifyProcessedAddressesMap = {};
          for (let pId of Object.keys(pages)) {
            // Avoid duplicates
            if (
              Object.prototype.hasOwnProperty.call(
                this.arverifyProcessedAddressesMap, 
                pages[pId].owner
              )
            ) {
              continue;
            }
            const arverifyQuery = await this.getArverifyVerification(pages[pId].owner);
            this.arverifyProcessedAddressesMap[pages[pId].owner] = arverifyQuery;
          }

        },
        error: (error) => {
          this.message(error, 'error');
          this.loadingPendingPages = false;
        }
      });

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

  /*
  *	@dev Destroy subscriptions
  */
  ngOnDestroy() {
    if (this.pendingPagesSubscription) {
      this.pendingPagesSubscription.unsubscribe();
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

  underscoreToSpace(_s: string) {
    return _s.replace(/[_]/gi, ' ');
  }

  
  confirmValidateArWikiPage(
    _slug: string,
    _pageId: string,
    _category_slug: string,
    _pageValue: number,
    _author: string
  ) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogConfirmAmountComponent, {
      data: {
        title: 'Are you sure?',
        content: `You are about to approve a new arwiki page update. Do you want to proceed?`,
        second_content: 'Please define the page update value in $WIKI tokens:',
        pageValue: _pageValue
      },
      direction: direction
    });

    dialogRef.afterClosed().pipe(
      switchMap((_newPageValue: number) => {
        const newPageValue = +_newPageValue;
        if (Number.isInteger(newPageValue) && newPageValue > 0) {
          this.loadingInsertPageIntoIndex = true;
          return this._arwikiTokenContract.approvePageUpdate(
            _pageId,
            _author,
            _slug,
            _category_slug,
            this.routeLang,
            newPageValue,
            this._auth.getPrivateKey(),
            arwikiVersion[0],
          );
        } else if (newPageValue === 0) {
          throw Error('Stake must be greater than 0 $WIKI tokens');
        }
        
        return of(null);
      })
    ).subscribe({
      next: (tx) => {
        if (tx) {
          this.insertPageTxMessage = `${tx}`;
          this.message('Success!', 'success');
        }
      },
      error: (error) => {
        this.insertPageTxErrorMessage = `${error}`;
        this.message(`${error}`, 'error');
      }
    });
  }

  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }

  getKeys(d: any) {
    return Object.keys(d);
  }

  compare(newPage: string, slug: string) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogCompareComponent, {
      data: {
        newPage,
        slug,
        lang: this.routeLang
      },
      direction: direction
    });

    dialogRef.afterClosed().subscribe({
      next: () => {
        
      },
      error: (error) => {
        this.message(`${error}`, 'error');
      }
    });
  }

}
