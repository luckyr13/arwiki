import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ArweaveService } from '../../core/arweave.service';
import { UtilsService } from '../../core/utils.service';
import { Diff, diffLines, Change } from 'diff';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { of, from, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ArwikiPagesService } from '../../core/arwiki-contracts/arwiki-pages.service';

@Component({
  selector: 'app-dialog-compare',
  templateUrl: './dialog-compare.component.html',
  styleUrls: ['./dialog-compare.component.scss']
})
export class DialogCompareComponent implements OnInit, OnDestroy {
	loading: boolean = false;
	listOfChanges: Change[] = [];
	listOfChangesSubscription: Subscription = Subscription.EMPTY;
	txOld: string = '';

  constructor(
  	@Inject(MAT_DIALOG_DATA) public data: any,
  	private _arweave: ArweaveService,
    private _utils: UtilsService,
    private _arwikiToken: ArwikiTokenContract,
    private _arwikiPages: ArwikiPagesService
  ) { }

  ngOnInit(): void {
  	this.loading = true;
  	this.listOfChangesSubscription = this.loadOldData(this.data.slug).pipe(
  			switchMap((pageId) => {
  				this.txOld = pageId;
          if (this.data.newPageContent) {
            return this.run_diff_dataVStx(this.txOld, this.data.newPageContent);
          }
          return this.run_diff(this.txOld, this.data.newPage);
  			})
  		).subscribe({
  			next: (changes) => {
  				this.listOfChanges = changes;
  				this.loading = false;
  			},
  			error: (error) => {
  				this._utils.message(`${error}`, 'error');
  				this.loading = false;
  			},
  		})
  }

  ngOnDestroy() {

  }

  loadOldData(slug: string) {
  	return this._arwikiPages.getPageId(this.data.lang, this.data.slug);
  }

  run_diff(tx1: string, tx2: string) {
  	let txData1: any;
  	return from(this._arweave.getDataAsString(tx1)).pipe(
  			switchMap((data1) => {
  				txData1 = data1;
  				return from(this._arweave.getDataAsString(tx2));
  			}),
  			switchMap((data2) => {
			    const listOfChanges = diffLines(txData1, data2);
  				return of(listOfChanges);
  			}),
  		);
    
  }

  run_diff_dataVStx(tx: string, data2: string) {
    return from(this._arweave.getDataAsString(tx)).pipe(
      switchMap((data) => {
        const listOfChanges = diffLines(data, data2);
        return of(listOfChanges);
      }),
    );
  }
}
