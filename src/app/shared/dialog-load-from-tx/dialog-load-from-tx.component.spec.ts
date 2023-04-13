import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogLoadFromTxComponent } from './dialog-load-from-tx.component';

describe('DialogLoadFromTxComponent', () => {
  let component: DialogLoadFromTxComponent;
  let fixture: ComponentFixture<DialogLoadFromTxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogLoadFromTxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogLoadFromTxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
