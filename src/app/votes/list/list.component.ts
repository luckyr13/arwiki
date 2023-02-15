import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { Subscription } from 'rxjs';
import { ArwikiVote } from '../../core/interfaces/arwiki-vote';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  loading = false;
  getVotesSubscription = Subscription.EMPTY;
  votes: ArwikiVote[] = [];

  constructor(
    private _location: Location,
    private _tokenContract: ArwikiTokenContract) {

  }

  ngOnInit() {
    this.loading = true;
    this.getVotesSubscription = this._tokenContract.getVotes()
      .subscribe({
        next: (res: ArwikiVote[]) => {
          this.votes = res || [];
          this.votes.reverse();
          this.loading = false;

        },
        error: (err) => {
          console.error('Votes', err);
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

}
