import { Component } from '@angular/core';

@Component({
  selector: 'app-dialog-new-vote',
  templateUrl: './dialog-new-vote.component.html',
  styleUrls: ['./dialog-new-vote.component.scss']
})
export class DialogNewVoteComponent {
  disableTabs = false;

  tabWorking(working: boolean) {
    if (working) {
      this.disableTabs = true;
    } else {
      this.disableTabs = false;
    }
  }
}
