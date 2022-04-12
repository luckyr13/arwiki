import { TestBed } from '@angular/core/testing';

import { VertoService } from './verto.service';

describe('VertoService', () => {
  let service: VertoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VertoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
