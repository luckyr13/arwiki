import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeImageContainerComponent } from './safe-image-container.component';

describe('SafeImageContainerComponent', () => {
  let component: SafeImageContainerComponent;
  let fixture: ComponentFixture<SafeImageContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SafeImageContainerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafeImageContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
