import { TestBed } from '@angular/core/testing';

import { ArwikiPageUpdatesService } from './arwiki-page-updates.service';

describe('ArwikiPageUpdatesService', () => {
  let service: ArwikiPageUpdatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiPageUpdatesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
