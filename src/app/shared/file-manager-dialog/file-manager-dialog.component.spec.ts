import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileManagerDialogComponent } from './file-manager-dialog.component';

describe('FileManagerDialogComponent', () => {
  let component: FileManagerDialogComponent;
  let fixture: ComponentFixture<FileManagerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileManagerDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileManagerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
