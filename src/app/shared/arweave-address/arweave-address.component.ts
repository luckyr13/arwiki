import { Component, Input, OnInit } from '@angular/core';
import { ArverifyMapService } from '../../core/arverify-map.service'
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-arweave-address',
  templateUrl: './arweave-address.component.html',
  styleUrls: ['./arweave-address.component.scss']
})
export class ArweaveAddressComponent implements OnInit {
  public verified: boolean = false
  @Input() address: string = '';
  @Input() isAddress: boolean = true;

  constructor(
    private _arverifyMap: ArverifyMapService,
    private _clipboard: Clipboard,
    private _snackBar: MatSnackBar) {}

  async ngOnInit() {
    if (this.isAddress && this.address) {
      let verificationResult = await this._arverifyMap.getVerification(this.address)
      this.verified = verificationResult && verificationResult.verified
    }
  }

  copyClipboard(content: string, msg: string = 'Content copied!') {
    this._clipboard.copy(content);
    this.message(msg, 'success');
  }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

}
