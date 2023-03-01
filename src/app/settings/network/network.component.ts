import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription } from 'rxjs';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent implements OnInit, OnDestroy {
  loading = false;
  subscriptionInfo = Subscription.EMPTY;
  network = '';
  version = 0;
  release = 0;
  height = 0;
  current = '';
  blocks = 0;
  peers = 0;
  queue_length = 0;
  node_state_latency = 0;

  constructor(
    private _location: Location,
    private _arweave: ArweaveService,
    private _utils: UtilsService) {

  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    this.subscriptionInfo = this._arweave.getNetworkInfo().subscribe({
      next: (res) => {
        if (res) {
          this.network = res.network;
          this.version = res.version;
          this.release = res.release;
          this.height = res.height;
          this.current = res.current;
          this.blocks = res.blocks;
          this.peers = res.peers;
          this.queue_length = res.queue_length;
          this.node_state_latency = res.node_state_latency;
        }
      },
      error: (error) => {
        this._utils.message('Error loading network info!', 'error');
        console.error('network', error);
      }
    });
  }

  ngOnDestroy() {
    this.subscriptionInfo.unsubscribe();
  }
}
