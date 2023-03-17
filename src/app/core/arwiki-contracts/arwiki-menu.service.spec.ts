import { TestBed } from '@angular/core/testing';

import { ArwikiMenuService } from './arwiki-menu.service';

describe('ArwikiMenuService', () => {
  let service: ArwikiMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArwikiMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
