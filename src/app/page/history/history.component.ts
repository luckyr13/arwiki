import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserSettingsService } from '../../core/user-settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { Observable, Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ArwikiPage } from '../../core/interfaces/arwiki-page';
import { ArwikiPageIndex } from '../../core/interfaces/arwiki-page-index';
import { ArwikiPageUpdate } from '../../core/interfaces/arwiki-page-update';
import { ArwikiQuery } from '../../core/arwiki-query';
import { ArweaveService } from '../../core/arweave.service';
import { Diff, diffLines, Change } from 'diff';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';

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
  diffSubscription: Subscription = Subscription.EMPTY;
  arwikiQuery!: ArwikiQuery;
  error: boolean = false;
  historyChanges: Record<number, Change[]> = {};
  historyChLoad:  Record<number, boolean> = {};
  baseURL: string = this._arweave.baseURL;

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
        this.loading = true;
        this.historySubscription = this.loadHistory(slug!, lang!)
          .subscribe({
            next: (data: ArwikiPage[]) => {
              this.historyList = data;
              this.loading = false;
            },
            error: (msg) => {
              this.message(msg, 'error');
              this.loading = false;
            }
          });

      }
    });



  }

	goBack() {
  	this._location.back();
  }

  ngOnDestroy() {
    this.historySubscription.unsubscribe();
    this.diffSubscription.unsubscribe();
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
    const historyData: any = {};
    return (
      this._arwikiToken.getApprovedPages(lang)
        .pipe(
          switchMap((_approvedPages: ArwikiPageIndex) => {
            if (!Object.prototype.hasOwnProperty.call(
                _approvedPages, slug
              )) {
              this.error = true;
              throw Error('Page does not exist!');
            }
            const page = _approvedPages[slug];
            const mainTX: string = page.content!;
            historyData[mainTX] = [page.start!, page.sponsor!];
            const updates = page.updates!.map((v: ArwikiPageUpdate) => {
              historyData[v.tx] = [v.at, v.approvedBy];
              return v.tx;
            });
            const finalList: string[] = [mainTX].concat(updates);
           
            return this.arwikiQuery.getTXsData(finalList);
          }),
          switchMap((_finalTXs: ArdbTransaction[]|ArdbBlock[]) => {
            const tmpRes: ArwikiPage[] = [];
            for (let p of _finalTXs) {
              const pTX: ArdbTransaction = new ArdbTransaction(p, this._arweave.arweave);
              const title = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Title');
              const slug = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Slug');
              const category = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Category');
              let img = this.arwikiQuery.searchKeyNameInTags(pTX.tags, 'Arwiki-Page-Img');
              img = img ? `${this.baseURL}${img}` : '';
              const owner = pTX.owner.address;
              const id = pTX.id;
              const block = pTX.block;
              const start = historyData[id][0];
              const sponsor = historyData[id][1];
              
              tmpRes.push({
                title: title,
                slug: slug,
                category: category,
                img: img,
                owner: owner,
                id: id,
                block: block,
                language: lang,
                start: start,
                sponsor: sponsor
              });
            }
            const finalRes = tmpRes.sort((a, b) => {
              return b.start! - a.start!;
            });
            return of(finalRes);
          }),
          
        )
    );
  }

  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }

  run_diff(tx1: string, tx2: string, currenthistoryId: number) {
    this.historyChLoad[currenthistoryId] = true;
    let newData = '';
    this.diffSubscription = this._arweave.getDataAsStringObs(tx1).pipe(
        switchMap((newD) => {
          newData = newD;
          if (tx2) {
            return this._arweave.getDataAsStringObs(tx2);
          }
          return of('');
        }),
      ).subscribe({
      next: (oldData) => {
        const diff: Change[] = diffLines(oldData, newData);
        this.historyChanges[currenthistoryId] = diff;
        this.historyChLoad[currenthistoryId] = false;
      },
      error: (error) => {
        this.message(`${error}`, 'error');
        this.historyChLoad[currenthistoryId] = false;
      }
    })
    
  }

}
