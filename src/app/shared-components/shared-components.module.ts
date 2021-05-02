import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleCardComponent } from './article-card/article-card.component';
import { ArweaveAddressComponent } from './arweave-address/arweave-address.component';
import { RouterModule } from '@angular/router'
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    ArticleCardComponent,
    ArweaveAddressComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
  ],
  exports: [    
    ArticleCardComponent,
    ArweaveAddressComponent,
  ]
})
export class SharedComponentsModule { }
