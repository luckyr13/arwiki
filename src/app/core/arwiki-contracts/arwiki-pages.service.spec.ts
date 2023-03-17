import { TestBed } from '@angular/core/testing';

import { ArwikiPagesService } from './arwiki-pages.service';

describe('ArwikiPagesService', () => {
  let service: ArwikiPagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiPagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
