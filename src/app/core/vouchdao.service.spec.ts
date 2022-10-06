import { TestBed } from '@angular/core/testing';

import { VouchdaoService } from './vouchdao.service';

describe('VouchdaoService', () => {
  let service: VouchdaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VouchdaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
