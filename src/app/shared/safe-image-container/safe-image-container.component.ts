import { Component, OnInit, OnDestroy, Input, OnChanges} from '@angular/core';
import { ArweaveService } from '../../core/arweave.service';
import { ArdbWrapper } from '../../core/ardb-wrapper';
import { UtilsService } from '../../core/utils.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-safe-image-container',
  templateUrl: './safe-image-container.component.html',
  styleUrls: ['./safe-image-container.component.scss']
})
export class SafeImageContainerComponent implements OnInit, OnDestroy, OnChanges {
  baseURL = this._arweave.baseURL;
  @Input('imgTX') imgTX: string = '';
  img: string = '';
  invalidImage = false;
  ardbWrapper!: ArdbWrapper;
  getImgMetadataSubscription = Subscription.EMPTY;
  dataInfo: Partial<{ size: number, type: string }> = {};
  secureMaxImageSizeKB = 2000;
  showImageAnyway = false;

  constructor(
    private _arweave: ArweaveService,
    private _utils: UtilsService) {

  }

  ngOnInit() {
    
  }

  ngOnChanges() {
    this.ardbWrapper = new ArdbWrapper(this._arweave.arweave);
    this.img = '';
    if (this.imgTX && !this.isValidAddress(this.imgTX)) {
      this.invalidImage = true;
    } else if (this.imgTX) {
      this.loadImageMetadata();
    }
  }

  loadImageMetadata() {
    this.getImgMetadataSubscription = this.ardbWrapper.searchOneTransactionById(
        this.imgTX
      ).subscribe({
        next: (res) => {
          const contentType = res.data.type ?
            res.data.type :
            this.ardbWrapper.searchKeyNameInTags(res.tags, 'Content-Type');
          this.dataInfo = { size: +res.data.size, type: contentType };

          if (this._utils.validateImageMIMEType(contentType)) { 
            // It is a safe image
            this.img = this.imgTX;
          } else {
            // It is not an image
            this.img = '';
            this.invalidImage = true;
          }

        },
        error: (error) => {
          console.error('loadImageMetadata', error)
        }
      });
  }

  ngOnDestroy() {
    this.getImgMetadataSubscription.unsubscribe();
  }

  isValidAddress(address: string) {
    return this._arweave.validateAddress(address);
  }

}
