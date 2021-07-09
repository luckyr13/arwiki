import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of, from } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { switchMap } from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmComponent } from '../../shared/dialog-confirm/dialog-confirm.component';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ActivatedRoute } from '@angular/router';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { 
  ArwikiCategoriesContract 
} from '../../core/arwiki-contracts/arwiki-categories';
import { ArwikiCategoryIndex } from '../../core/interfaces/arwiki-category-index';
import { Direction } from '@angular/cdk/bidi';
import { UserSettingsService } from '../../core/user-settings.service';
import { Arwiki } from '../../core/arwiki';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token';

@Component({
  selector: 'app-deleted-list',
  templateUrl: './deleted-list.component.html',
  styleUrls: ['./deleted-list.component.scss']
})
export class DeletedListComponent implements OnInit, OnDestroy {
  loadingPages: boolean = false;
  pages: ArwikiPage[] = [];
  pagesSubscription: Subscription = Subscription.EMPTY;
  arwikiQuery!: ArwikiQuery;
  routeLang: string = '';
  loadingDeletePage: boolean = false;
  deleteTxMessage: string = '';
  loadingSetMainPage: boolean = false;
  setMainTxMessage: string = '';
  private _arwiki!: Arwiki;
  myAddress: string = '';
  currentBlockHeight: number = 0;
  heightSubscription: Subscription = Subscription.EMPTY;

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _snackBar: MatSnackBar,
    public _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _categoriesContract: ArwikiCategoriesContract,
    private _userSettings: UserSettingsService,
    private _arwikiToken: ArwikiTokenContract
  ) { }

  async ngOnInit() {
    this.myAddress = this._auth.getMainAddressSnapshot();
    const adminList: any[] = this._auth.getAdminList();
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;

    // Init arwiki 
    this._arwiki = new Arwiki(this._arweave.arweave);

    // Init ardb
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    // Get pages
    this.loadingPages = true;
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

    
    this.pagesSubscription = this.getDeletedPages(numPages, maxHeight).subscribe({
      next: async (pages: ArwikiPage[]) => {
        this.pages = pages;
        this.loadingPages = false;
        
      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingPages = false;
      }
    });


    this.heightSubscription = from(this.getCurrentHeight()).subscribe({
      next: (height)  => {
        this.currentBlockHeight = height;
      },
      error: (error) => {
        this.message(error, 'error');
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
    if (this.pagesSubscription) {
      this.pagesSubscription.unsubscribe();
    }
  }

  underscoreToSpace(_s: string) {
    return _s.replace(/[_]/gi, ' ');
  }


  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }


  async getCurrentHeight(): Promise<number> {
    let networkInfo: any = {};
    let maxHeight = 0;
    try {
      networkInfo = await this._arweave.arweave.network.getInfo();
      maxHeight = networkInfo.height ? networkInfo.height : 0;
    } catch (error) {
      throw Error(error);
    }
    return maxHeight;
  }

  getDeletedPages(numPages: number, maxHeight: number) {
    const owners = this._auth.getAdminList();
    let allVerifiedPages: string[] = [];
    let allPages: any = {};
    let allInactivePages: string[] = [];
    return this._categoriesContract
      .getState()
      .pipe(
        switchMap((categories: ArwikiCategoryIndex) => {
          return this._arwikiToken.getAllPages(
            this.routeLang,
            -1
          );
        }),
        switchMap((_allPages) => {
          allPages = _allPages;
          allVerifiedPages = Object.keys(allPages)
            .map((slug) => {
              return allPages[slug].content;
            });
          allInactivePages = Object.keys(allPages)
            .filter((slug) => {
              return !allPages[slug].active;
            })
            .map((slug) => {
              return allPages[slug].content;
            });

          return this.arwikiQuery.getAllDeletedPages(
            owners,
            this.routeLang,
            numPages,
            maxHeight
          );
        }),
        switchMap((deletedPagesTX) => {
          const deletedPagesDict: Record<string,boolean> = {};
          for (const p of deletedPagesTX) {
            const arwikiId = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
            deletedPagesDict[arwikiId] = true;
          }

          let finalList = allVerifiedPages.filter((vpId) => {
            return deletedPagesDict[vpId];
          });
          finalList = finalList.concat(allInactivePages);

          
          return this.arwikiQuery.getTXsData(finalList);
        }),
        switchMap((pages) => {
          let tmp_res: ArwikiPage[] = [];
          for (let p of pages) {
            const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
            tmp_res.push({
              id: p.node.id,
              title: this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title'),
              slug: slug,
              category: this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category'),
              language: this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang'),
              value: this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Value'),
              owner: p.node.owner.address,
              block: p.node.block,
              start: allPages[slug].start,
              sponsor: allPages[slug].sponsor,
              pageRewardAt: allPages[slug].pageRewardAt              
            });
          }
          return of(tmp_res);
        })
      

      );
  }

}
