import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import {MatChipsModule} from '@angular/material/chips';
import { DialogConfirmComponent } from './dialog-confirm/dialog-confirm.component';
import {MatExpansionModule} from '@angular/material/expansion';
import { ArticleCardComponent } from './article-card/article-card.component';
import { ArweaveAddressComponent } from './arweave-address/arweave-address.component';
import { RouterModule } from '@angular/router';
import {ClipboardModule} from '@angular/cdk/clipboard';
import {MatSliderModule} from '@angular/material/slider';
import { BalanceCardComponent } from './balance-card/balance-card.component';
import {MatTableModule} from '@angular/material/table';
import { DialogDonateComponent } from './dialog-donate/dialog-donate.component';
import { FormsModule } from '@angular/forms';
import { DialogConfirmAmountComponent } from './dialog-confirm-amount/dialog-confirm-amount.component';
import { BottomSheetShareComponent } from './bottom-sheet-share/bottom-sheet-share.component';
import {MatBadgeModule} from '@angular/material/badge';
import { DialogTransferTokensComponent } from './dialog-transfer-tokens/dialog-transfer-tokens.component';
import { DialogVaultComponent } from './dialog-vault/dialog-vault.component';
import { DialogVotePageComponent } from './dialog-vote-page/dialog-vote-page.component';

@NgModule({
  declarations: [
    DialogSelectLanguageComponent, 
    BottomSheetLoginComponent, 
    ModalFileManagerComponent, 
    DialogConfirmComponent,
    ArticleCardComponent,
    ArweaveAddressComponent,
    BalanceCardComponent,
    DialogDonateComponent,
    DialogConfirmAmountComponent,
    BottomSheetShareComponent,
    DialogTransferTokensComponent,
    DialogVaultComponent,
    DialogVotePageComponent,
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule.forChild(),
    MatProgressBarModule,
    NgxSkeletonLoaderModule,
    MatListModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatCheckboxModule,
    RouterModule,
    ClipboardModule,
    MatTooltipModule,
    MatSliderModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
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
    MatTabsModule,
    MatChipsModule,
    TranslateModule,
    MatExpansionModule,
    ArticleCardComponent,
    ArweaveAddressComponent,
    ClipboardModule,
    MatSliderModule,
    BalanceCardComponent,
    MatTableModule,
    MatBadgeModule
  ],
  // entryComponents: [DialogSelectLanguageComponent]
})
export class SharedModule { }
