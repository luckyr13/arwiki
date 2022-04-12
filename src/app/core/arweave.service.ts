import { Injectable } from '@angular/core';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { selectWeightedPstHolder } from 'smartweave';
import Arweave from 'arweave';
import { arwikiVersion } from './arwiki';
import { ArweaveWebWallet } from 'arweave-wallet-connector';
declare const window: any;

@Injectable({
  providedIn: 'root'
})
export class ArweaveService {
  arweave: any = null;
  public baseURL: string = 'https://arweave.net/';
  blockToSeconds: number = 0.5 / 60;
  arweaveWebWallet: ArweaveWebWallet;

  constructor() {
    this.arweave = Arweave.init({
      host: "arweave.net",
      port: 443,
      protocol: "https",
    });

    this.arweaveWebWallet = new ArweaveWebWallet({
      name: 'ArWiki',
      logo: 'https://arweave.net/wJGdli6nMQKCyCdtCewn84ba9-WsJ80-GS-KtKdkCLg'
    })
    this.arweaveWebWallet.setUrl('arweave.app');
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

  getAccount(method: string): Observable<any> {
    const obs = new Observable<any>((subscriber) => {
      if (method === 'arconnect' || method === 'finnie') {
        if (!(window && window.arweaveWallet)) {
          subscriber.error('Login method not available!');
        }
        // Get main account
        // very similar to window.ethereum.enable
        this.arweave.wallets.getAddress().then((res: any) => {
          subscriber.next(res);
          subscriber.complete();
        }).catch((error: any) => {
          subscriber.error(error);
        });

      } else if (method === 'webwallet') {

        this.arweaveWebWallet.connect().then((res: any) => {
          subscriber.next(res);
          subscriber.complete();
        }).catch((error: any) => {
          subscriber.error(error);
        });

      } else {
        subscriber.error('Wrong login method!');
      }
      
    })

    return obs.pipe(
      catchError(this.errorHandler)
    );

  }

  errorHandler(
    error: any
  ) {
    let errorMsg = 'Error!!';
    console.log('Debug ArweaveServ:', error);
    return throwError(error);
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
  arToWinston(balance: string) {
    return this.arweave.ar.arToWinston(balance);
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
    transaction.addTag('Service', 'ArWiki');
    transaction.addTag('Arwiki-Type', 'file');
    transaction.addTag('Arwiki-Version', arwikiVersion[0]);

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

  async sendDonation(_to: string, _fee: string, jwk: any): Promise<any> {
    // send a fee. You should inform the user about this fee and amount.
    const tx = await this.arweave.createTransaction({ 
      target: _to, quantity: this.arweave.ar.arToWinston(_fee) 
    }, jwk)
    tx.addTag('Service', 'ArWiki');
    tx.addTag('Arwiki-Type', 'Donation');
    tx.addTag('Arwiki-Version', arwikiVersion[0]);

    await this.arweave.transactions.sign(tx, jwk);
    const response = await this.arweave.transactions.post(tx);

    if (response && response.status) {
      // 200 - ok, 400 - invalid transaction, 500 - error
      if (response.status === 400) {
        throw new Error('Invalid transaction! (400)');
      }
      if (response.status === 500) {
        throw new Error('Error! (500)');
      }
    }
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
    let query = '';
    if (_owners.length > 0 ) {
      query = `query Transactions($tags: [TagFilter!]!, $blockFilter: BlockFilter!, $first: Int!, $after: String, $owners: [String!]!) {
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
    } else {
      query = `query Transactions($tags: [TagFilter!]!, $blockFilter: BlockFilter!, $first: Int!, $after: String) {
        transactions(
          tags: $tags, block: $blockFilter, first: $first,
          sort: HEIGHT_ASC, after: $after
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
    }
      
    
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


  async getTxStatus(_tx: string) {
    return await this.arweave.transactions.getStatus(_tx);
  }

  getDataAsString(txId: string): Observable<any> {
    const url = `${this.baseURL}${txId}`;
    return from(fetch(url)).pipe(
        switchMap((response) => {
          if (response.ok) {
            return from(response.text());
          }

          throw new Error('Error fetching data from gw ...');
        })
      );
  }

  getDataAsStringObs(txId: string): Observable<any> {
    return this.getDataAsString(txId).pipe(
      catchError((error) => {
        console.error(error);
        console.warn(`Method 2: Fetching ${txId} data ...`, 'warning');
        return from(this.arweave.transactions.getData(txId, {decode: true, string: true}));
      })
    );
  }

 

  /**
   * Formats a block number into human readable hours, days, months, years.
   * Original src from: https://github.com/CommunityXYZ/community-js/blob/master/src/utils.ts
   * @param len block length
   */
  public formatBlocks(len: number = 720): string {
    const minute = this.blockToSeconds * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = week * 4;
    const year = month * 12;
    const ops = [
      ['Y', year], ['M', month], ['W', week], 
      ['D', day], ['h', hour], ['m', minute],
      ['s', this.blockToSeconds]
    ];
    let res = '';
    let accum = len;
    for (const o of ops) {
      const val = Math.floor(accum / +o[1]);
      accum = accum - (val * +o[1]);
      if (val > 0) {
        res += `${val}${o[0]} `;
      }
    }
    res = res ? `~${res}` : '';
    return res;
  }

  async getTxContent(txId: string) {
    let content = '';
    let error = false;

    // Method 1
    try {
      console.warn('Fetching data from gw ...', txId);
      const data = await fetch(`${this.baseURL}${txId}`);
      if (data.ok) {
          content = await data.text();
      } else {
        throw Error('Error fetching data!');
      }
    } catch (err) {
      error = true;
      console.error('ERR', err);
    }
    // Method 2         
    if (error) {
      try {
        content = await this.arweave.transactions.getData(
          txId, 
          {decode: true, string: true}
        );
      } catch (err) {
        console.error('ErrLoading:', err);
      }
    }

    return content;
  }
}
