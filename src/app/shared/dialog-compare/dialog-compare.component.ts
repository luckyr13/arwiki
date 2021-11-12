import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ArweaveService } from '../../core/arweave.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Diff, diffLines, Change } from 'diff';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token';
import { of, from, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
    private _snackBar: MatSnackBar,
    private _arwikiToken: ArwikiTokenContract
  ) { }

  ngOnInit(): void {
  	this.loading = true;
  	this.listOfChangesSubscription = this.loadOldData(this.data.slug).pipe(
  			switchMap((pageId) => {
  				this.txOld = pageId;
  				return this.run_diff(this.data.newPage, this.txOld);
  			})
  		).subscribe({
  			next: (changes) => {
  				this.listOfChanges = changes;
  				this.loading = false;
  			},
  			error: (error) => {
  				this.message(`${error}`, 'error');
  				this.loading = false;
  			},
  		})
  }

  ngOnDestroy() {

  }

  loadOldData(slug: string) {
  	return this._arwikiToken.getPageId(this.data.lang, this.data.slug);
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

}
