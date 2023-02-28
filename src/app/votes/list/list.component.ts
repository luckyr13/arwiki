import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { Subscription } from 'rxjs';
import { ArwikiVote } from '../../core/interfaces/arwiki-vote';
import { ArweaveService } from '../../core/arweave.service';
import {switchMap} from 'rxjs';
import { DialogConfirmComponent } from '../../shared/dialog-confirm/dialog-confirm.component';
import { UserSettingsService } from '../../core/user-settings.service';
import { Direction } from '@angular/cdk/bidi';
import {MatDialog} from '@angular/material/dialog';
import { UtilsService } from '../../core/utils.service';
import { arwikiVersion } from '../../core/arwiki';
import { AuthService } from '../../auth/auth.service';
import { DialogVotedComponent } from '../dialog-voted/dialog-voted.component';
import { DialogNewVoteComponent } from '../dialog-new-vote/dialog-new-vote.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  loading = false;
  getVotesSubscription = Subscription.EMPTY;
  votes: ArwikiVote[] = [];
  currentBlockHeight = 0;
  voteLength = 0;
  loadingUpdate = false;
  updateTxMessage = '';
  finalizeVoteSubscription = Subscription.EMPTY;
  errorMessage = '';

  constructor(
    private _location: Location,
    private _tokenContract: ArwikiTokenContract,
    private _arweave: ArweaveService,
    private _userSettings: UserSettingsService,
    private _dialog: MatDialog,
    private _utils: UtilsService,
    private _auth: AuthService,
    private _router: Router) {

  }

  ngOnInit() {
    this.loading = true;
    this.getVotesSubscription = this._arweave.getNetworkInfo().pipe(
      switchMap((network) => {
        this.currentBlockHeight = network.height;
        return this._tokenContract.getSettings();
      }),
      switchMap((settings) => {
        this.voteLength = settings.get('voteLength') || 0;
        return this._tokenContract.getVotes();
      })
    ).subscribe({
        next: (res: ArwikiVote[]) => {
          const votes = res || [];
          votes.reverse();
          this.votes = votes;
          this.loading = false;

        },
        error: (err) => {
          console.error('Votes Error', err);
          this.loading = false;
        }
      })

  }

  goBack() {
    this._location.back();
  }

  votePercent(yayOrNay: number, totalVotes: number): number {
    if (yayOrNay <= 0) {
      return 0;
    } else if (totalVotes <= 0) {
      return 0;
    }
    return (yayOrNay * 100) / totalVotes;
  }

  formatBlocks(block: number) {
    block = Math.abs(block);
    return this._arweave.formatBlocks(block);
  }

  confirmFinalizeVote(voteId: number) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Are you sure?',
        content: 'You are about to finalize the vote. Do you want to proceed?'
      },
      direction: direction
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.loadingUpdate = true;
        // Finalize vote
        this.finalizeVoteSubscription = this._tokenContract.finalizeVote(
          voteId,
          this._auth.getPrivateKey(),
          arwikiVersion[0]
        ).subscribe({
          next: (res) => {
            let tx = '';
            console.log(res, 'finalize')
            if (res && Object.prototype.hasOwnProperty.call(res, 'originalTxId')) {
              tx = res.originalTxId;
            } else if (res && Object.prototype.hasOwnProperty.call(res, 'bundlrResponse') &&
              res.bundlrResponse && Object.prototype.hasOwnProperty.call(res.bundlrResponse, 'id')) {
              tx = res.bundlrResponse.id;
            }
            this.updateTxMessage = tx;
            this.loadingUpdate = false;
            this._utils.message('Success!', 'success');
          },
          error: (error) => {
            this.loadingUpdate = false;
            this.errorMessage = 'An error ocurred!';
            this._utils.message(`${error}`, 'error');
            console.error('finalizeVote', error);
          }
        })
      }
    });
  }

  ngOnDestroy() {
    this.getVotesSubscription.unsubscribe();
    this.finalizeVoteSubscription.unsubscribe();
  }

  votedDialog(votes: string[]) {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogVotedComponent, {
      data: {
        votes
      },
      direction: direction
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      
    });
  }

  newVoteDialog() {
    const defLang = this._userSettings.getDefaultLang();
    let direction: Direction = defLang.writing_system === 'LTR' ? 
      'ltr' : 'rtl';

    const dialogRef = this._dialog.open(DialogNewVoteComponent, {
      data: {},
      direction: direction,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._router.navigate([defLang.code, 'dashboard']);
        this._utils.message('Success! Redirecting to Dashboard ...', 'success');
      }
    });
  }
}
