import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { Subscription } from 'rxjs';
import { ArwikiVote } from '../../core/interfaces/arwiki-vote';
import { ArweaveService } from '../../core/arweave.service';
import {switchMap} from 'rxjs';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  loading = false;
  getVotesSubscription = Subscription.EMPTY;
  votes: ArwikiVote[] = [];
  currentBlockHeight = 0;
  voteLength = 0;

  constructor(
    private _location: Location,
    private _tokenContract: ArwikiTokenContract,
    private _arweave: ArweaveService) {

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
    return this._arweave.formatBlocks(block);
  }

}
