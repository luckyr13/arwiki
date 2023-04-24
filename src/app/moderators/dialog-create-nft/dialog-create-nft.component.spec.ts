import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCreateNftComponent } from './dialog-create-nft.component';

describe('DialogCreateNftComponent', () => {
  let component: DialogCreateNftComponent;
  let fixture: ComponentFixture<DialogCreateNftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogCreateNftComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogCreateNftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
