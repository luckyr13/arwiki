import { TestBed } from '@angular/core/testing';

import { ArwikiPageSponsorService } from './arwiki-page-sponsor.service';

describe('ArwikiPageSponsorService', () => {
  let service: ArwikiPageSponsorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiPageSponsorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
