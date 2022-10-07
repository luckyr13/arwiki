import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Observable, Subscription, EMPTY, of } from 'rxjs';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { ArwikiQuery } from '../../core/arwiki-query';
import {MatSnackBar} from '@angular/material/snack-bar';
import { ArweaveService } from '../../core/arweave.service';
import { switchMap } from 'rxjs/operators';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';

@Component({
  selector: 'app-dialog-search-page-update',
  templateUrl: './dialog-search-page-update.component.html',
  styleUrls: ['./dialog-search-page-update.component.scss']
})
export class DialogSearchPageUpdateComponent implements OnInit, OnDestroy {
	loadingPendingPages: boolean = false;
  pages: ArwikiPage[] = [];
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  arwikiQuery!: ArwikiQuery;
  langCode: string = '';


  constructor(
  	@Inject(MAT_DIALOG_DATA) public data: any,
  	private _arweave: ArweaveService,
    private _snackBar: MatSnackBar,
    private _arwikiTokenContract: ArwikiTokenContract,
    private _router: Router,
    public _dialogRef: MatDialogRef<DialogSearchPageUpdateComponent>
  ) { }

  async ngOnInit() {
  	this.langCode = this.data.langCode;
  	// Init ardb instance
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    await this.getUpdates();
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
  	if (this.pendingPagesSubscription) {
      this.pendingPagesSubscription.unsubscribe();
    }
  }

  async getUpdates() {

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
      .getPendingPagesUpdatesByLang(
        this.langCode,
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
            this._arwikiTokenContract.getApprovedPages(this.langCode, -1, true)
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
          this.pages = Object.values(pages);
          this.loadingPendingPages = false;
          

        },
        error: (error) => {
          this.message(error, 'error');
          this.loadingPendingPages = false;
        }
      });
  }

  getKeys(d: any) {
    return Object.keys(d);
  }

  viewUpdates(slug: string) {
  	this.close();
  	this._router.navigate([
  		this.langCode, 'moderators', 'page-updates', slug
  	]);
  }

  close() {
  	this._dialogRef.close();
  }


}
