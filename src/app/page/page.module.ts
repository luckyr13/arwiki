import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { PageRoutingModule } from './page-routing.module';
import { NewComponent } from './new/new.component';
import { NotFoundComponent } from './not-found/not-found.component';

@NgModule({
  declarations: [NewComponent, NotFoundComponent],
  imports: [
    CommonModule,
    PageRoutingModule,
    SharedModule
  ]
})
export class PageModule { }
