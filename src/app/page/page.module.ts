import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { PageRoutingModule } from './page-routing.module';
import { NewComponent } from './new/new.component';
import { EditComponent } from './edit/edit.component';
import { PreviewComponent } from './preview/preview.component';
import { ViewDetailComponent } from './view-detail/view-detail.component';
import { NotFoundComponent } from './not-found/not-found.component';

@NgModule({
  declarations: [
  	NewComponent, NotFoundComponent,
  	EditComponent, PreviewComponent,
  	ViewDetailComponent
  ],
  imports: [
    CommonModule,
    PageRoutingModule,
    SharedModule,
  ]
})
export class PageModule { }
