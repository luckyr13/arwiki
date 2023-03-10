import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubMenuMainPageComponent } from './sub-menu-main-page.component';

describe('SubMenuMainPageComponent', () => {
  let component: SubMenuMainPageComponent;
  let fixture: ComponentFixture<SubMenuMainPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubMenuMainPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubMenuMainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
