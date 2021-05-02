import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { CategoryRoutingModule } from './category-routing.module';
import { ViewDetailComponent } from './view-detail/view-detail.component';
import { SharedComponentsModule } from '../shared-components/shared-components.module'


@NgModule({
  declarations: [ViewDetailComponent],
  imports: [
    CommonModule,
    CategoryRoutingModule,
    SharedModule,
    SharedComponentsModule,
  ]
})
export class CategoryModule { }
