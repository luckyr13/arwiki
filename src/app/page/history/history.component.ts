import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserSettingsService } from '../../core/user-settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token';
import { Observable, Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { ArwikiPageUpdate } from '../../core/interfaces/arwiki-page-update';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArweaveService } from '../../core/arweave.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  routeLang: string = '';
  routeSlug: string = '';
  historyList: ArwikiPage[] = [];
  historySubscription: Subscription = Subscription.EMPTY;
  arwikiQuery!: ArwikiQuery;

  constructor(
    private route: ActivatedRoute,
  	private _location: Location,
    private _userSettings: UserSettingsService,
    private _snackBar: MatSnackBar,
    private _arwikiToken: ArwikiTokenContract,
    private _arweave: ArweaveService,
  ) { }

  ngOnInit(): void {
    this.arwikiQuery = new ArwikiQuery(this._arweave.arweave);
    this.route.paramMap.subscribe(async params => {
      const slug = params.get('slug');
      const lang = params.get('lang');
      this.routeLang = lang!;
      this.routeSlug = slug!;
      if (slug) {
        this.historySubscription = this.loadHistory(slug!, lang!)
          .subscribe({
            next: (data: ArwikiPage[]) => {
              this.historyList = data;
            },
            error: (msg) => {
              this.message(msg, 'error');
            }
          });

      }
    });



  }

	goBack() {
  	this._location.back();
  }

  ngOnDestroy() {

  }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

  loadHistory(slug: string, lang: string): Observable<ArwikiPage[]> {
    return (
      this._arwikiToken.getApprovedPages(lang)
        .pipe(
          switchMap((_approvedPages: ArwikiPageIndex) => {
            const page = _approvedPages[slug];
            const mainTX: string = page.content!;
            const updates = page.updates!.map((v: ArwikiPageUpdate) => {
              return v.tx;
            });
            const finalList: string[] = [mainTX].concat(updates);
            return this.arwikiQuery.getTXsData(finalList);
          }),
          switchMap((_finalTXs) => {
            const res: ArwikiPage[] = [];
            console.log(_finalTXs);
            return of(res);
          }),
          
        )
    );
  }


}
