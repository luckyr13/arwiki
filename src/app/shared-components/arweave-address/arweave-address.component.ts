import { Component, Input, OnInit } from '@angular/core';
import { ArverifyMap } from '../../arwiki-contracts/arverify-map'

@Component({
  selector: 'app-arweave-address',
  templateUrl: './arweave-address.component.html',
  styleUrls: ['./arweave-address.component.scss']
})
export class ArweaveAddressComponent implements OnInit {
  _verified: Boolean = false

  constructor(private _arverifyMap: ArverifyMap) {}

  async ngOnInit() {
    let verificationResult = await this._arverifyMap.getVerification(this.address)
    this._verified = verificationResult && verificationResult.verified
  }

  @Input() address: any

  clickAction() {
    // TODO
  }

}
