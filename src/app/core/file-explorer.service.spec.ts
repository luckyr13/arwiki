import { TestBed } from '@angular/core/testing';

import { FileExplorerService } from './file-explorer.service';

describe('FileExplorerService', () => {
  let service: FileExplorerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileExplorerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
