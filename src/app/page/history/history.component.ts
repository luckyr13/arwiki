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
          switchMap(async (_finalTXs) => {
            const tmpRes: ArwikiPage[] = [];
            for (let p of _finalTXs) {
              const title = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Title');
              const slug = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Slug');
              const category = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Category');
              const img = this.arwikiQuery.searchKeyNameInTags(p.node.tags, 'Arwiki-Page-Img');
              const owner = p.node.owner.address;
              const id = p.node.id;
              const block = p.node.block;
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
            return finalRes;
          }),
          
        )
    );
  }

  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }

}
