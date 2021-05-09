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

@Component({
  templateUrl: './pending-list.component.html',
  styleUrls: ['./pending-list.component.scss']
})
export class PendingListComponent implements OnInit, OnDestroy {
	loadingPendingPages: boolean = false;
  pages: any[] = [];
  pendingPagesSubscription: Subscription = Subscription.EMPTY;
  arverifyProcessedAddressesMap: any = {};
  loadingInsertPageIntoIndex: boolean = false;
  insertPageTxMessage: string = '';
  arwikiQuery: ArwikiQuery|null = null;
  routeLang: string = '';

  constructor(
  	private _arweave: ArweaveService,
    private _auth: AuthService,
    private _snackBar: MatSnackBar,
    public _dialog: MatDialog,
    private _route: ActivatedRoute,
    private _userSettings: UserSettingsService,
  ) { }

  async ngOnInit() {
    const adminList: any[] = this._auth.getAdminList();
    this.routeLang = this._route.snapshot.paramMap.get('lang')!;

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

    this.pendingPagesSubscription = this.arwikiQuery.getPendingPages(
        this.routeLang, numPages, maxHeight
      ).pipe(
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
            block: p.node.block
          });
        }
        return of(tmp_res);
      }),
      switchMap((pages) => {
        return (
          this.arwikiQuery!.verifyPages(adminList, pages.map((p) => p.id))
          .pipe(
            switchMap((data) => {
              let tmp_res = [];
              const verifiedPages = data;
              const verifiedPagesList = [];
              for (let p of verifiedPages) {
                const vrfdPageId = this.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Id');
                verifiedPagesList.push(vrfdPageId);
              }
              // Check pending pages against verified pages
              for (let p of pages) {
                if (verifiedPagesList.indexOf(p.id) < 0) {
                  tmp_res.push(p);
                }
              }

              return of(tmp_res);
            })
          )
        );
      })
    )
    .subscribe({
      next: async (pages) => {
        this.pages = pages;
        this.loadingPendingPages = false;
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

  
  confirmValidateArWikiPage(
    _slug: string,
    _content_id: string,
    _category_slug: string
  ) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Are you sure?',
        content: 'You are about to insert a new arwiki page in the index. Do you want to proceed?'
      },
      direction: direction
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        // Create arwiki page
        this.loadingInsertPageIntoIndex = true;
        try {
          const tx = await this.arwikiQuery!.createValidationTXForArwikiPage(
            _content_id,
            _slug,
            _category_slug,
            this.routeLang,
            this._auth.getPrivateKey()
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
 

}
