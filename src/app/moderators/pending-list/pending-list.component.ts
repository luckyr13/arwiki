import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { switchMap } from 'rxjs/operators';
import { getVerification } from "arverify";
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmComponent } from '../../shared/dialog-confirm/dialog-confirm.component';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ActivatedRoute } from '@angular/router';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { Arwiki, arwikiVersion } from '../../core/arwiki';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { 
  ArwikiCategoriesContract 
} from '../../core/arwiki-contracts/arwiki-categories';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token';

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
  arwikiQuery!: ArwikiQuery;
  routeLang: string = '';
  private _arwiki!: Arwiki;

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _snackBar: MatSnackBar,
    public _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _userSettings: UserSettingsService,
    private _categoriesContract: ArwikiCategoriesContract,
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
      this.message(error, 'error');
      return;
    }

    this.pendingPagesSubscription = this._categoriesContract
      .getState()
      .pipe(
        switchMap((categories: ArwikiCategoryIndex) => {
          return this.arwikiQuery.getPendingPages(
            this.routeLang,
            Object.keys(categories),
            numPages,
            maxHeight
          );
        }),
        switchMap((pendingPages) => {
          let pages = pendingPages;
          let tmp_res: ArwikiPageIndex = {};

          for (let p of pages) {
            tmp_res[p.node.id] = {
              id: p.node.id,
              title: this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title'),
              slug: this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug'),
              category: this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category'),
              language: this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang'),
              owner: p.node.owner.address,
              block: p.node.block,
              value: this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Value'),
              
            };
          }
          return of(tmp_res);
        }),
        switchMap((pendingPages: ArwikiPageIndex) => {
          return (
            this.arwikiQuery.verifyPages(adminList, Object.keys(pendingPages))
              .pipe(
                switchMap((data) => {
                  let tmp_res: ArwikiPageIndex = {};
                  const verifiedPages = data;
                  const verifiedPagesDict: Record<string, boolean> = {};
                  for (let p of verifiedPages) {
                    const vrfdPageId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
                    verifiedPagesDict[vrfdPageId] = true;
                  }
                  // Check pending pages against verified pages
                  for (let pId of Object.keys(pendingPages)) {
                    if (!verifiedPagesDict[pId]) {
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

    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Are you sure?',
        content: 'You are about to approve a new arwiki page. Do you want to proceed?'
      },
      direction: direction
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        // Create arwiki page
        this.loadingInsertPageIntoIndex = true;
        try {
          const tx = await this._arwikiTokenContract.approvePage(
            _pageId,
            _author,
            _slug,
            _category_slug,
            this.routeLang,
            _pageValue,
            this._auth.getPrivateKey(),
            arwikiVersion[0],
          ); 

          this.insertPageTxMessage = tx;
          this.message('Success!', 'success');
        } catch (error) {
          this.message(error, 'error');
        }

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
 

}
