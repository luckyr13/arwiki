import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArwikiTokenContract } from '../../core/arwiki-contracts/arwiki-token.service';
import { Subscription } from 'rxjs';
import { ArweaveService } from '../../core/arweave.service';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-pst-info',
  templateUrl: './pst-info.component.html',
  styleUrls: ['./pst-info.component.scss']
})
export class PstInfoComponent implements OnInit, OnDestroy {
  daoSettings: any = [];
  displayedColumnsDaoSettings: string[] = ['label', 'value'];
  pstSettings: any = [];
  pstSettingsSubscription: Subscription = Subscription.EMPTY;
  loadingSettings = false;
  lockMinLength: number = 0;
  lockMaxLength: number = 0;

  constructor(
    private _arwikiTokenContract: ArwikiTokenContract,
    private _arweave: ArweaveService,
    private _utils: UtilsService,
    ) { }

  ngOnInit(): void {
    this.loadingSettings = true;
    this.pstSettingsSubscription = this._arwikiTokenContract
      .getSettings()
      .subscribe({
        next: (res: any) => {
          this.pstSettings = res;
          this.daoSettings = [];
          const settings = [
            {
              key: 'quorum',
              label: 'Quorum',
              formatFunction: this.decimalToPercentage
            },
            {
              key: 'support',
              label: 'Support',
              formatFunction: this.decimalToPercentage
            },
            {
              key: 'lockMinLength',
              label: 'Lock minimum length',
              formatFunction: (val: any) => this.formatBlocks(val)
            },
            {
              key: 'lockMaxLength',
              label: 'Lock maximum length',
              formatFunction: (val: any) => this.formatBlocks(val)
            },
            {
              key: 'voteLength',
              label: 'Vote length',
              formatFunction: (val: any) => this.formatBlocks(val)
            },
            {
              key: 'pageApprovalLength',
              label: 'Page approval length',
              formatFunction: (val: any) => this.formatBlocks(val)
            },
            {
              key: 'communityLogo',
              label: 'Community logo',
              formatFunction: (val: any) => ''
            },
            {
              key: 'communityDescription',
              label: 'Community Description',
              formatFunction: (val: any) => ''
            },
            {
              key: 'communityAppUrl',
              label: 'Community App Url',
              formatFunction: (val: any) => ''
            },
            {
              key: 'noteVoteMaxLength',
              label: 'Max length for notes (Vote)',
              formatFunction: (val: any) => `${val} characters`
            },
            {
              key: 'keyVoteMaxLength',
              label: 'Max length for keys (Vote)',
              formatFunction: (val: any) => `${val} characters`
            },
            {
              key: 'roleValueVoteMaxLength',
              label: 'Max length for roles (Vote)',
              formatFunction: (val: any) => `${val} characters`
            },
            {
              key: 'pageSlugMaxLength',
              label: 'Max length for slugs',
              formatFunction: (val: any) => `${val} characters`
            },
            {
              key: 'keyStringValueVoteMaxLength',
              label: 'Value max length',
              formatFunction: (val: any) => `${val} characters`
            },
            {
              key: 'moderatorsMinVaultBalance',
              label: 'Moderator\'s Min Vault',
              formatFunction: (val: any) => `${val} $WIKI`
            }
            
          ];

          for (const i in settings) {
            const key = settings[i].key;
            const formatFunction = settings[i].formatFunction;
            const value = this.pstSettings.get(key);

            this.daoSettings.push({
              position: i + 1,
              label: key,
              value: value,
              specialValue: formatFunction(value)
            });
          }

          this.loadingSettings = false;
        },
        error: (error) => {
          this._utils.message(error, 'error');
          this.loadingSettings = false;
        }
      });

  }

  getPSTContractAddress() {
    return this._arwikiTokenContract.contractAddress;
  }

  ngOnDestroy() {
    this.pstSettingsSubscription.unsubscribe();
  }

  decimalToPercentage(n: number): string {
    return `${(n*100)}%`;
  }

  formatBlocks(len: number): string {
    return this._arweave.formatBlocks(len);
  }

}
