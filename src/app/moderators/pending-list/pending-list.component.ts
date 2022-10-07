import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { switchMap } from 'rxjs/operators';
import { getVerification } from "arverify";
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmAmountComponent } from '../../shared/dialog-confirm-amount/dialog-confirm-amount.component';
import { DialogRejectReasonComponent } from '../../shared/dialog-reject-reason/dialog-reject-reason.component';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ActivatedRoute } from '@angular/router';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { Arwiki, arwikiVersion } from '../../core/arwiki';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';

@Component({
  templateUrl: './pending-list.component.html',
  styleUrls: ['./pending-list.component.scss']
})
export class PendingListComponent implements OnInit, OnDestroy {
	loadingPendingPages: boolean = false;
  pages: ArwikiPageIndex = {};
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  arverifyProcessedAddressesMap: any = {};
  loadingInsertPageIntoIndex: boolean = false;
  insertPageTxMessage: string = '';
  insertPageTxErrorMessage: string = '';
  arwikiQuery!: ArwikiQuery;
  routeLang: string = '';
  private _arwiki!: Arwiki;
  baseURL = this._arweave.baseURL;
  loadingRejectPage: boolean = false;
  rejectPageTxMessage: string = '';
  rejectPageTxErrorMessage: string = '';

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

    // Init arwiki 
    this._arwiki = new Arwiki(this._arweave.arweave);

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
    let allPendingPages: ArwikiPageIndex = {};

    this.pendingPagesSubscription = this._arwikiTokenContract
      .getCategories()
      .pipe(
        switchMap((categories: ArwikiCategoryIndex) => {
          return this.arwikiQuery.getPendingPages(
            this.routeLang,
            Object.keys(categories),
            numPages,
            maxHeight
          );
        }),
        switchMap((pendingPages: ArdbTransaction[]|ArdbBlock[]) => {
          for (let p of pendingPages) {
            const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
            allPendingPages[pTX.id] = {
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
          return of(allPendingPages);
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          return (
            this._arwikiTokenContract.getAllPages(this.routeLang, -1)
              .pipe(
                switchMap((_approvedPages) => {
                  let tmp_res: ArwikiPageIndex = {};
                  const verifiedPages: string[] = Object.keys(_approvedPages).map((slug) => {
                    return _approvedPages[slug].content;
                  });
                  // Check pending pages against verified pages
                  for (let pId in pendingPages) {
                    if (!(verifiedPages.indexOf(pId) >= 0)) {
                      tmp_res[pId] = pendingPages[pId];
                    }
                  }

                  return of(tmp_res);
                })
              )
          );
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          return (
            this.arwikiQuery.getRejectedPagesByIds(
                adminList, Object.keys(pendingPages), numPages, maxHeight
              )
              .pipe(
                switchMap((_rejectedIntersection: ArdbTransaction[]|ArdbBlock[]) => {
                  let rejected: string[] = [];
                  let finalIndex: ArwikiPageIndex = {};

                  for (let p of _rejectedIntersection) {
                    const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
                    const rejectedId = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Id');
                    rejected.push(rejectedId);
                  }

                  for (let pId in pendingPages) {
                    if (rejected.indexOf(pId) < 0) {
                      finalIndex[pId] = pendingPages[pId];
                    }
                  }

                  return of(finalIndex);
                })
              )
          );
        }),

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
        content: `You are about to approve a new arwiki page. Remember to have enough balance to stake and some other in your vault! Do you want to proceed?`,
        pageValue: _pageValue,
        second_content: 'Please define the final page value:'
      },
      direction: direction
    });


    dialogRef.afterClosed().pipe(
      switchMap((_newPageValue: number) => {
        const newPageValue = +_newPageValue;
        if (Number.isInteger(newPageValue) && newPageValue > 0) {
          this.loadingInsertPageIntoIndex = true;
          return this._arwikiTokenContract.approvePage(
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

  confirmRejectArWikiPage(
    _slug: string,
    _pageId: string
  ) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogRejectReasonComponent, {
      data: {
        id: _pageId
      },
      direction: direction
    });


    dialogRef.afterClosed().pipe(
      switchMap((_reason: string) => {
        if (_reason) {
          this.loadingRejectPage = true;
          const jwk = this._auth.getPrivateKey();
          return this._arwiki.createRejectTXForArwikiPage(_pageId, _slug, this.routeLang, _reason, jwk);
        }
        
        return of(null);
      })
    ).subscribe({
      next: (tx) => {
        if (tx) {
          this.rejectPageTxMessage = `${tx}`;
          this.message('Page rejected!', 'success');
        }
      },
      error: (error) => {
        this.rejectPageTxErrorMessage = `${error}`;
        this.message(`${error}`, 'error');
      }
    });
  }
 

}
