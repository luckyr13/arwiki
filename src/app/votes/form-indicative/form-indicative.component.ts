import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ArweaveService } from '../../core/arweave.service';
import { Subscription } from 'rxjs';
import { 
  ArwikiTokenContract 
} from '../../core/arwiki-contracts/arwiki-token.service';
import { UtilsService } from '../../core/utils.service';

@Component({
  selector: 'app-form-indicative',
  templateUrl: './form-indicative.component.html',
  styleUrls: ['./form-indicative.component.scss']
})
export class FormIndicativeComponent implements OnInit, OnDestroy {
  indicativeForm = new FormGroup({
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
