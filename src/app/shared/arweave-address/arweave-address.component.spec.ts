import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArweaveAddressComponent } from './arweave-address.component';

describe('ArweaveAddressComponent', () => {
  let component: ArweaveAddressComponent;
  let fixture: ComponentFixture<ArweaveAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArweaveAddressComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArweaveAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
