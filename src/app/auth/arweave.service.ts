import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { selectWeightedPstHolder } from 'smartweave';
import Arweave from 'arweave';
declare const window: any;

@Injectable({
  providedIn: 'root'
})
export class ArweaveService {
  arweave: any = null;

  constructor() {
    this.arweave = Arweave.init({
      host: "arweave.net",
      port: 443,
      protocol: "https",
    });

  }

  getNetworkInfo(): Observable<any> {
    const obs = new Observable<any>((subscriber) => {
      // Get network's info
      this.arweave.network.getInfo().then((res: any) => {
        subscriber.next(res);
        subscriber.complete();
      }).catch((error: any) => {
        subscriber.error(error);
      });
    })

    return obs.pipe(
      catchError(this.errorHandler)
    );
  }

  getNetworkName(): Observable<string> {
    const obs = new Observable<string>((subscriber) => {
      // Get network's name
      this.arweave.network.getInfo().then((res: any) => {
        subscriber.next(res.network);
        subscriber.complete();
      }).catch((error: any) => {
        subscriber.error(error);
      });
    })

    return obs.pipe(
      catchError(this.errorHandler)
    );
  }

  getAccount(): Observable<any> {
    const obs = new Observable<any>((subscriber) => {
      // Get main account
      // very similar to window.ethereum.enable
      this.arweave.wallets.getAddress().then((res: any) => {
        
        subscriber.next(res);
        subscriber.complete();
      }).catch((error: any) => {
        subscriber.error(error);
      });
    })

    return obs.pipe(
      catchError(this.errorHandler)
    );

  }

  errorHandler(
    error: any
  ) {
    let errorMsg = 'Error!!';
    console.log('Debug', error);
    return throwError(errorMsg);
  }

  uploadKeyFile(inputEvent: any): Observable<any> {
    let method = new Observable<any>((subscriber) => {
       // Transform .json file into key
       try {
        const file = inputEvent.target.files.length ? 
          inputEvent.target.files[0] : null;

        const freader = new FileReader();
        freader.onload = async (_keyFile) => {
          const key = JSON.parse(freader.result + '');
          try {
            const address = await this.arweave.wallets.jwkToAddress(key);
            const tmp_res = {
              address: address,
              key: key
            };
            
            subscriber.next(tmp_res);
            subscriber.complete();
          } catch (error) {
            throw Error('Error loading key');
          }
        }

        freader.onerror = () => {
          throw Error('Error reading file');
        }

        freader.readAsText(file);

       } catch (error) {
         subscriber.error(error);
       }
      
    });

    return method;

  }

  /*
  * @dev
  */
  winstonToAr(balance: string) {
    return this.arweave.ar.winstonToAr(balance);
  }

  /*
  * @dev
  */
  getAccountBalance(_address: string): Observable<any> {
    const obs = new Observable<any>((subscriber) => {
      // Get balance
      this.arweave.wallets.getBalance(_address).then((_balance: string) => {
        let winston = _balance;
        let ar = this.winstonToAr(_balance);

        subscriber.next(ar);
        subscriber.complete();
      }).catch((error: any) => {
        subscriber.error(error);
      });
    })

    return obs.pipe(
      catchError(this.errorHandler)
    );
  }

  logout() {
    window.sessionStorage.removeItem('ARKEY');
    window.sessionStorage.removeItem('MAINADDRESS');
  }

  getLastTransactionID(_address: string): Observable<string> {
    const obs = new Observable<string>((subscriber) => {
      this.arweave.wallets.getLastTransactionID(_address).then((res: string) => {
        subscriber.next(res);
        subscriber.complete();
      }).catch((error: any) => {
        subscriber.error(error);
      });
    })

    return obs.pipe(
      catchError(this.errorHandler)
    );
  }

  fileToArrayBuffer(file: any): Observable<any> {
    let method = new Observable<any>((subscriber) => {
    // Transform .json file into key
    try {
        const freader = new FileReader();
        freader.onload = async () => {
          const data = freader.result;
          try {
            subscriber.next(data);
            subscriber.complete();
          } catch (error) {
            throw Error('Error loading file');
          }
        }

        freader.onerror = () => {
          throw Error('Error reading file');
        }

        freader.readAsArrayBuffer(file);

       } catch (error) {
         subscriber.error(error);
       }
      
    });
    return method;
  }

  async uploadFileToArweave(fileBin: any, contentType: string, key: any): Promise<any> {
    // Create transaction
    let transaction = await this.arweave.createTransaction({
        data: fileBin,
    }, key);

    transaction.addTag('Content-Type', contentType);
    transaction.addTag('ARWIKI', 'file');

    // Sign transaction
    await this.arweave.transactions.sign(transaction, key);

    // Submit transaction 
    let uploader = await this.arweave.transactions.getUploader(transaction);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    }

    return transaction;
  }


  async sendFee(_contractState: any, _fee: string, jwk: any): Promise<any> {
    const holder = selectWeightedPstHolder(_contractState.balances);
    // send a fee. You should inform the user about this fee and amount.
    const tx = await this.arweave.createTransaction({ 
      target: holder, quantity: this.arweave.ar.arToWinston(_fee) 
    }, jwk)
    await this.arweave.transactions.sign(tx, jwk)
    await this.arweave.transactions.post(tx)
    return tx;
  }

  /*
  * @dev
  */
  getMyArFiles(_address: string, _height: number): Observable<any> {
    const owners = [_address];
    const tags = [
      {
        name: 'Content-Type',
        values: ['image/jpeg', 'image/png', 'image/jpg'],
      },
    ];

    const obs = this.arweaveQuery(
      owners,
      tags,
      _height
    );

    return obs;
  }

  /*
  * @dev
  */
  arweaveQuery(
    _owners: string[],
    _tags: any[],
    _height: number,
    _max_request: number = 100
  ): Observable<any> {

    const obs = new Observable<any>((subscriber) => {
      const query = `query Transactions($tags: [TagFilter!]!, $blockFilter: BlockFilter!, $first: Int!, $after: String, $owners: [String!]!) {
    transactions(
      tags: $tags, block: $blockFilter, first: $first,
      sort: HEIGHT_ASC, after: $after, owners: $owners
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          id
          owner { address }
          recipient
          tags {
            name
            value
          }
          block {
            height
            id
          }
          fee { winston }
          quantity { winston }
          parent { id }
        }
        cursor
      }
    }
  }`;
    
    const variables = {
      tags: _tags,
      blockFilter: {
        max: _height,
      },
      first: _max_request,
      owners: _owners

    }

    this.arweave.api.post('graphql', {
      query,
      variables,
    }).then((_res: any) => {
        if (_res.status !== 200) {
         subscriber.error(`Unable to retrieve transactions. Arweave gateway responded with status ${_res.status}.`);
        }

        const data = _res.data;
        const txs = data.data.transactions;

        subscriber.next({response: _res, data: data, txs: txs});
        subscriber.complete();
      }).catch((error: any) => {
        subscriber.error(error);
      });
    })

    return obs.pipe(
      catchError(this.errorHandler)
    );
  }


}
