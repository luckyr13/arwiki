import { Observable, from } from 'rxjs';
import ArdbBlock from 'ardb/lib/models/block';
import ArdbTransaction from 'ardb/lib/models/transaction';
import { fieldType } from 'ardb/lib/faces/fields';
import ArDB from 'ardb';
import Arweave from 'arweave';

export class ArdbWrapper {
	public readonly ardb: ArDB;

  constructor(private _arweave: Arweave) {
  	this.ardb = new ArDB(_arweave);
  }

  /*
  * @dev Search transactions
  */
  searchTransactions(
    from: string[] | string,
    limit: number = 100,
    maxHeight: number = 0,
    tags: Array<{name: string, values: string|string[]}>,
    fields: fieldType|fieldType[]=[]): Observable<ArdbTransaction[]> {
    const obs = new Observable<ArdbTransaction[]>((subscriber) => {
      if (from.length) {
        this.ardb.search('transactions')
          .limit(limit)
          .from(from)
          .max(maxHeight)
          .tags(tags)
          .only(fields)
          .find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
            subscriber.next(<ArdbTransaction[]>res);
            subscriber.complete();
          })
          .catch((error: string) => {
            subscriber.error(error);
          });
      } else {
        this.ardb.search('transactions')
          .limit(limit)
          .max(maxHeight)
          .tags(tags)
          .only(fields)
          .find().then((res: ArdbTransaction[]|ArdbBlock[]) => {
            subscriber.next(<ArdbTransaction[]>res);
            subscriber.complete();
          })
          .catch((error: string) => {
            subscriber.error(error);
          });
      }
      
    });
    return obs;
  }

  /*
  * @dev Get next results from query
  */
  next(): Observable<ArdbTransaction[]> {
    return from(<Promise<ArdbTransaction[]>>this.ardb.next());
  }

  /*
  * @dev Search transaction
  */
  searchOneTransaction(
    from: string[] | string,
    txId: string): Observable<ArdbTransaction> {
    const obs = new Observable<ArdbTransaction>((subscriber) => {
      this.ardb.search('transactions')
        .id(txId)
        .from(from).findOne().then((res: ArdbTransaction|ArdbBlock) => {
          subscriber.next(<ArdbTransaction>res);
          subscriber.complete();
        })
        .catch((error: string) => {
          subscriber.error(error);
        });
    });
    return obs;
  }

  /*
  * @dev Search transaction
  */
  searchOneTransactionById(
    txId: string): Observable<ArdbTransaction> {
    const obs = new Observable<ArdbTransaction>((subscriber) => {
      this.ardb.search('transactions')
        .id(txId).findOne().then((res: ArdbTransaction|ArdbBlock) => {
          subscriber.next(<ArdbTransaction>res);
          subscriber.complete();
        })
        .catch((error: string) => {
          subscriber.error(error);
        });
    });
    return obs;
  }

}
