import { TestBed } from '@angular/core/testing';

import { ArwikiService } from './arwiki.service';

describe('ArwikiService', () => {
  let service: ArwikiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
