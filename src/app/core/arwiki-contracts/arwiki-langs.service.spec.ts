import { TestBed } from '@angular/core/testing';

import { ArwikiLangsService } from './arwiki-langs.service';

describe('ArwikiLangsService', () => {
  let service: ArwikiLangsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiLangsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
