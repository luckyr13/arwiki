import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { CategoryRoutingModule } from './category-routing.module';
import { ViewDetailComponent } from './view-detail/view-detail.component';

@NgModule({
  declarations: [ViewDetailComponent],
  imports: [
    CommonModule,
    CategoryRoutingModule,
    SharedModule
  ]
})
export class CategoryModule { }
