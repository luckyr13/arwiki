import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatIconModule} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav';
import { ReactiveFormsModule } from '@angular/forms';
import {MatDialogModule} from '@angular/material/dialog';
import { DialogSelectLanguageComponent } from './dialog-select-language/dialog-select-language.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatMenuModule} from '@angular/material/menu';
import {MatListModule} from '@angular/material/list';
import {TranslateModule} from '@ngx-translate/core';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import { BottomSheetLoginComponent } from './bottom-sheet-login/bottom-sheet-login.component';
import { ModalFileManagerComponent } from './modal-file-manager/modal-file-manager.component';
import {MatTabsModule} from '@angular/material/tabs';

@NgModule({
  declarations: [DialogSelectLanguageComponent, BottomSheetLoginComponent, ModalFileManagerComponent],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule,
    MatProgressBarModule,
    NgxSkeletonLoaderModule,
    MatListModule,
    MatIconModule,
    MatTabsModule
  ],
  exports: [
  	MatFormFieldModule,
  	MatInputModule,
  	MatSelectModule,
  	MatButtonModule,
  	MatTooltipModule,
  	MatIconModule,
  	MatSidenavModule,
  	ReactiveFormsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatMenuModule,
    MatListModule,
    MatCardModule,
    MatProgressBarModule,
    NgxSkeletonLoaderModule,
    MatBottomSheetModule,
    MatTabsModule
  ],
  entryComponents: [DialogSelectLanguageComponent]
})
export class SharedModule { }
