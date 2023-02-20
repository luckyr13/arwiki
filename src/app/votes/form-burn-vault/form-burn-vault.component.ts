import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription } from 'rxjs';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-form-burn-vault',
  templateUrl: './form-burn-vault.component.html',
  styleUrls: ['./form-burn-vault.component.scss']
})
export class FormBurnVaultComponent implements OnInit, OnDestroy {
  burnVaultForm = new FormGroup({
    target: new FormControl(
      '', [Validators.required, Validators.maxLength(43)]
    ),
    notes: new FormControl(
      '', [Validators.required, Validators.maxLength(200)]
    )
  });
  loading = false;

  constructor(
    private _arweave: ArweaveService,
    private _tokenContract: ArwikiTokenContract,
    private _utils: UtilsService) {
  }


  ngOnInit() {
    this.loading = false;
    
  }

  ngOnDestroy() {

  }


  onSubmit() {
    alert('test')

  }

  formatBlocks(len: number): string {
    return this._arweave.formatBlocks(len);
  }

}
