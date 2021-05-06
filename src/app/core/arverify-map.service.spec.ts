import { TestBed } from '@angular/core/testing';

import { ArverifyMapService } from './arverify-map.service';

describe('ArverifyMapService', () => {
  let service: ArverifyMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArverifyMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
