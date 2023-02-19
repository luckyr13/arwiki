import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ArweaveService } from '../../core/arweave.service';

@Component({
  selector: 'app-form-mint',
  templateUrl: './form-mint.component.html',
  styleUrls: ['./form-mint.component.scss']
})
export class FormMintComponent {
  mintForm = new FormGroup({
    recipient: new FormControl(
      '', [Validators.required, Validators.maxLength(43)]
    ),
    qty: new FormControl(1, [Validators.required, Validators.min(1)]),
    lockLength: new FormControl(0, [Validators.required, Validators.min(0)]),
  });
  lockMinLength = 0;
  lockMaxLength = 1;

  constructor(private _arweave: ArweaveService) {

  }

  public get qty() {
    return this.mintForm.get('qty');
  }

  public get lockLength() {
    return this.mintForm.get('lockLength');
  }


  onSubmit() {
    alert('test')

  }

  formatBlocks(len: number): string {
    return this._arweave.formatBlocks(len);
  }
}
