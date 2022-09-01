import { Injectable } from '@angular/core';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { Observable, from, map } from 'rxjs';
import { ArdbWrapper } from './ardb-wrapper';
import { ArweaveService } from './arweave.service';
import { TransactionMetadata } from './interfaces/transaction-metadata';

@Injectable({
  providedIn: 'root'
})
export class FileExplorerService {
  private _ardb: ArdbWrapper;

  constructor(
    private _arweave: ArweaveService) {
    this._ardb = new ArdbWrapper(this._arweave.arweave);
  }

  uploadFile() {
    // TODO
  }

  getUserFiles(
    types: string[],
    from: string[] | string = [],
    limit?: number,
    maxHeight?: number): Observable<TransactionMetadata[]> {
    const tags = [
      {
        name: "Content-Type",
        values: types
      }
    ];
    return this._ardb.searchTransactions(from, limit, maxHeight, tags).pipe(
        map((_posts: ArdbTransaction[]) => {
          const res = _posts.map((tx) => {
            const post: TransactionMetadata = {
              id: tx.id,
              owner: tx.owner.address,
              blockId: tx.block && tx.block.id ? tx.block.id : '',
              blockHeight: tx.block && tx.block.height ? tx.block.height : 0,
              dataSize: tx.data ? tx.data.size : undefined,
              dataType: tx.data ? tx.data.type : undefined,
              blockTimestamp: tx.block && tx.block.timestamp ? tx.block.timestamp : undefined,
              tags: tx.tags
            }
            return post;
          });

          return res;
        })
      );
  }

  next(): Observable<TransactionMetadata[]> {
    return from(this._ardb.next()).pipe(
        map((_files: ArdbTransaction[]) => {
          const res = _files && _files.length ? _files.map((tx) => {
            const file: TransactionMetadata = {
              id: tx.id,
              owner: tx.owner.address,
              blockId: tx.block && tx.block.id ? tx.block.id : '',
              blockHeight: tx.block && tx.block.height ? tx.block.height : 0,
              dataSize: tx.data ? tx.data.size : undefined,
              dataType: tx.data ? tx.data.type : undefined,
              blockTimestamp: tx.block && tx.block.timestamp ? tx.block.timestamp : undefined,
              tags: tx.tags
            }
            return file;
          }) : [];
          return res;
        })
      );
  }

  getFile(from: string[] | string = [], fileId: string): Observable<TransactionMetadata> {
    return this._ardb.searchOneTransaction(from, fileId).pipe(
        map((tx: ArdbTransaction) => {
          if (!tx) {
            throw new Error('Tx not found!');
          }
          const file: TransactionMetadata = {
            id: tx.id,
            owner: tx.owner.address,
            blockId: tx.block && tx.block.id ? tx.block.id : '',
            blockHeight: tx.block && tx.block.height ? tx.block.height : 0,
            dataSize: tx.data ? tx.data.size : undefined,
            dataType: tx.data ? tx.data.type : undefined,
            blockTimestamp: tx.block && tx.block.timestamp ? tx.block.timestamp : undefined,
            tags: tx.tags
          }
          return file;
        })
      );
  }

}
