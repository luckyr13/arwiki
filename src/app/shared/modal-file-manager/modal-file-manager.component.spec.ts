import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalFileManagerComponent } from './modal-file-manager.component';

describe('ModalFileManagerComponent', () => {
  let component: ModalFileManagerComponent;
  let fixture: ComponentFixture<ModalFileManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalFileManagerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalFileManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
