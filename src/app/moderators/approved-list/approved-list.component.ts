import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of } from 'rxjs';
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

@Component({
  templateUrl: './approved-list.component.html',
  styleUrls: ['./approved-list.component.scss']
})
export class ApprovedListComponent implements OnInit, OnDestroy {
  loadingApprovedPages: boolean = false;
  pages: ArwikiPage[] = [];
  approvedPagesSubscription: Subscription = Subscription.EMPTY;
  arwikiQuery!: ArwikiQuery;
  routeLang: string = '';

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _snackBar: MatSnackBar,
    public _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _categoriesContract: ArwikiCategoriesContract
  ) { }

  async ngOnInit() {
    const adminList: any[] = this._auth.getAdminList();
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;

    // Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    // Get pages
    this.loadingApprovedPages = true;
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

    const owners = [this._auth.getMainAddressSnapshot()];
    this.approvedPagesSubscription = this._categoriesContract
      .getState()
      .pipe(
        switchMap((categories: ArwikiCategoryIndex) => {
          return this.arwikiQuery.getVerifiedPagesByCategories(
            owners,
            Object.keys(categories),
            this.routeLang,
            numPages,
            maxHeight
          );
        }),
        switchMap((verifiedPages) => {
          let pages = verifiedPages;
          let tmp_res = [];
          for (let p of pages) {
            tmp_res.push(this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id'));
          }
          return this.arwikiQuery.getTXsData(tmp_res);
        }),
        switchMap((pages) => {
          let tmp_res = [];
          for (let p of pages) {
            tmp_res.push({
              id: p.node.id,
              title: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title'),
              slug: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug'),
              category: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category'),
              language: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang'),
              owner: p.node.owner.address,
              block: p.node.block
            });
          }
          return of(tmp_res);
        })
      

      ).subscribe({
      next: async (pages: ArwikiPage[]) => {
        this.pages = pages;
        this.loadingApprovedPages = false;
        
      },
      error: (error) => {
        this.message(error, 'error');
        this.loadingApprovedPages = false;
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
    if (this.approvedPagesSubscription) {
      this.approvedPagesSubscription.unsubscribe();
    }
  }

  searchKeyNameInTags(_arr: any[], _key: string) {
    let res = '';
    for (const a of _arr) {
      if (a.name.toUpperCase() === _key.toUpperCase()) {
        return a.value;
      }
    }
    return res;
  }

  underscoreToSpace(_s: string) {
    return _s.replace(/[_]/gi, ' ');
  }


  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }

}
