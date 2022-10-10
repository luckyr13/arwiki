import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostedUpdatesComponent } from './posted-updates.component';

describe('PostedUpdatesComponent', () => {
  let component: PostedUpdatesComponent;
  let fixture: ComponentFixture<PostedUpdatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PostedUpdatesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostedUpdatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
