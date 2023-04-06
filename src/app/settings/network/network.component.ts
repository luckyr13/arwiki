import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription } from 'rxjs';
import { UtilsService } from '../../core/utils.service';
import { ArweaveGateway } from '../../core/interfaces/arweave-gateway';
import { UserSettingsService } from '../../core/user-settings.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent implements OnInit, OnDestroy {
  loading = false;
  subscriptionInfo = Subscription.EMPTY;
  networkInfo: ArweaveGateway|null = null;
  formGateway: FormGroup = new FormGroup({
    host: new FormControl('', [Validators.required]),
    port: new FormControl(
      0, [
        Validators.required, Validators.min(0), Validators.max(65535)
      ]
    ),
    protocol: new FormControl('', [Validators.required]),
    contractAddress: new FormControl(
      '', [
        Validators.required, Validators.maxLength(43), Validators.minLength(43)
      ]
    ),
    useArweaveGW: new FormControl(false, [Validators.required]),
  });
  displayedColumns: string[] = [
    'status', 'network', 'version', 'release', 'height',
    'current', 'blocks', 'peers', 'queue', 'latency'
  ];
  dataSource: Array<{
    status: boolean, network: string, version:number,
    release: number, height: number, current: string,
    blocks: number, peers: number, queue: number,
    latency: number
  }> = [];

  constructor(
    private _location: Location,
    private _arweave: ArweaveService,
    private _utils: UtilsService,
    private _userSettings: UserSettingsService,
    private _router: Router) {
  }

  get host() {
    return this.formGateway.get('host')!;
  }
  get port() {
    return this.formGateway.get('port')!;
  }
  get protocol() {
    return this.formGateway.get('protocol')!;
  }
  get contractAddress() {
    return this.formGateway.get('contractAddress')!;
  }
  get useArweaveGW() {
    return this.formGateway.get('useArweaveGW')!;
  }

  goBack() {
    this._location.back();
  }

  ngOnInit() {
    this.initForm();
    try {
      this.fetchNetworkInfo();    
    } catch (error) {
      this.dataSource = [
            {
              status: false, 
              network: '',
              version: 0,
              release: 0,
              height: 0,
              current: '',
              blocks: 0,
              peers: 0, queue: 0,
              latency: 0
            }
          ];
      console.error('fetchNetworkInfo', error);
    }
  }

  ngOnDestroy() {
    this.subscriptionInfo.unsubscribe();
  }

  initForm() {
    this.networkInfo = this._userSettings.getDefaultNetwork();
    this.host.setValue(this.networkInfo.host);
    this.port.setValue(this.networkInfo.port);
    this.protocol.setValue(this.networkInfo.protocol);
    this.contractAddress.setValue(this.networkInfo.contractAddress);
    this.useArweaveGW.setValue(this.networkInfo.useArweaveGW);
  }

  fetchNetworkInfo() {
    // Fetch network data
    this.subscriptionInfo = this._arweave.getNetworkInfo().subscribe({
      next: (res) => {
        if (res) {
          this.dataSource = [
            {
              status: true, 
              network: res.network, version: res.version,
              release: res.release,
              height: res.height,
              current: res.current,
              blocks: res.blocks,
              peers: res.peers, queue: res.queue_length,
              latency: res.node_state_latency
            }
          ];
        }
      },
      error: (error) => {
        this.dataSource = [
            {
              status: false, 
              network: '',
              version: 0,
              release: 0,
              height: 0,
              current: '',
              blocks: 0,
              peers: 0, queue: 0,
              latency: 0
            }
          ];
        this._utils.message('Error loading network info!', 'error');
        console.error('network', error);
      }
    });
  }

  onSubmit() {
    const host = this.host.value;
    const port = this.port.value;
    const protocol = this.protocol.value;
    const contractAddress = this.contractAddress.value;
    const useArweaveGW = this.useArweaveGW.value;

    const gatewayConfig: ArweaveGateway = {
      host, port, protocol, contractAddress, useArweaveGW
    };

    this._userSettings.setDefaultNetwork(gatewayConfig);
    this._router.navigate(['/']);
    
  }
}
