import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogClaimNftComponent } from './dialog-claim-nft.component';

describe('DialogClaimNftComponent', () => {
  let component: DialogClaimNftComponent;
  let fixture: ComponentFixture<DialogClaimNftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogClaimNftComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogClaimNftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
