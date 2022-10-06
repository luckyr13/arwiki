import { TestBed } from '@angular/core/testing';

import { StampsService } from './stamps.service';

describe('StampsService', () => {
  let service: StampsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StampsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
