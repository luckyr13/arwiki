import { Component, OnInit } from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { Observable, Subscription, EMPTY, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { switchMap } from 'rxjs/operators';
import { getVerification } from "arverify";
import {MatDialog} from '@angular/material/dialog';
import { DialogConfirmComponent } from '../../shared/dialog-confirm/dialog-confirm.component';
import { ArwikiPagesContract } from '../../arwiki-contracts/arwiki-pages';
import ArDB from 'ardb';

@Component({
  templateUrl: './pending-list.component.html',
  styleUrls: ['./pending-list.component.scss']
})
export class PendingListComponent implements OnInit {
	loadingPendingPages: boolean = false;
  pages: any[] = [];
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  arverifyProcessedAddressesMap: any = {};
  loadingInsertPageIntoIndex: boolean = false;
  insertPageTxMessage: string = '';
  arwikiPageIndexSubscription: Subscription = Subscription.EMPTY;
  ardb: ArDB|null = null;

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _snackBar: MatSnackBar,
    public _dialog: MatDialog,
    public _pagesContract: ArwikiPagesContract
  ) { }

  ngOnInit() {
    // Init ardb instance
    this.ardb = new ArDB(this._arweave.arweave);
    // Get pages
    this.loadingPendingPages = true;
    this.pendingPagesSubscription = this.getPendingPages().pipe(
      switchMap((res) => {
        let pages = res;
        let tmp_res = [];
        for (let p of pages) {
          tmp_res.push({
            id: p.node.id,
            title: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title'),
            slug: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug'),
            category: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category'),
            language: this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Lang'),
            owner: p.node.owner.address,
          });
        }
        return of(tmp_res);
      }),
      switchMap((pages) => {
        return of(pages);
      })
    )
    .subscribe({
      next: async (pages) => {
        this.pages = pages;
        this.loadingPendingPages = false;
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
    if (this.arwikiPageIndexSubscription) {
      this.arwikiPageIndexSubscription.unsubscribe();
    }
  }

   /*
  * @dev
  */
  getPendingPages(): Observable<any> {
    const owners: any = [];
    const tags = [
      {
        name: 'Service',
        values: ['ArWiki'],
      },
      {
        name: 'Arwiki-Type',
        values: ['page'],
      },
    ];

    const obs = new Observable((subscriber) => {
      this.ardb!.search('transactions')
        .tags(tags).find().then((res) => {
          subscriber.next(res);
          subscriber.complete();
        }).catch((error) => {
          subscriber.error(error);
        });

    });
    return obs;
  }


  async getArverifyVerification(_address: string) {
    const verification = await getVerification(_address);

    return ({
      verified: verification.verified,
      icon: verification.icon,
      percentage: verification.percentage
    });
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

  
  confirmInsertPageToArWikiIndex(
    _slug: string,
    _content_id: string,
    _category_slug: string
  ) {
    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Are you sure?',
        content: 'You are about to insert a new arwiki page in the index. Do you want to proceed?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Create arwiki page
        this.loadingInsertPageIntoIndex = true;
        this._pagesContract.addArWikiPageIntoIndex(this._arweave.arweave,
          this._auth.getPrivateKey(),
          _slug, _content_id, _category_slug
        ).subscribe({
          next: (res) => {
            this.insertPageTxMessage = res;
            console.log('res', res);
            this.message('Success!', 'success');
          },
          error: (error) => {
            this.message(error, 'error');
          }
        });
      }
    });
  }



 


}
