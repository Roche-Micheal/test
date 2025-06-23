import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Apollo, ApolloBase, gql } from 'apollo-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  timer!: any;
  webSocket: any;
  userId: any;
  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute
  ) { }
  ngOnInit(): void {
    this.route.queryParams.subscribe(res => {
      console.log(res['userId']);
      if (res['userId']) {
        const webSocket = new WebSocket('https://17vbjjkv-8080.inc1.devtunnels.ms/graphql' + '?userId=' + res['userId']); //shakil
        this.userId = res['userId'];
        if (webSocket) {
          webSocket.onopen = () => {
            webSocket.send(JSON.stringify({ type: 'auth', userId: this.userId }));
            this.timer = setInterval(() => {
              webSocket.send(JSON.stringify({ message: 'hello from abishek' }));
            }, 3000);
          }
          webSocket.onmessage = (event: any) => {
            console.log('message', event);
          };
          webSocket.onclose = (event: any) => {
            console.log('close', event);
            clearInterval(this.timer);
          }
        }
      }
    });
    console.log('Hi');
    // const webSocket = new WebSocket('https://1w71m61b-5000.inc1.devtunnels.ms/graphql?storeId=1');
    // setTimeout(()=>{
    //   webSocket.close();
    // }, 10000);
    // globalThis.fetch('https://17vbjjkv-8080.inc1.devtunnels.ms/connect',{
    //   method: 'GET'
    // }).then(res => res.json()).then((res)=> console.log(res), (e)=>console.log(e.message));

    this.apollo.watchQuery<any>({
      query: gql`query GetServerStatus{
  getServerStatus {
    status
  }
}
    `
    }).valueChanges.subscribe(({ data, loading }) => {
      // Handle the data and loading state
      console.log('Data:', data.books);
      console.log('Loading:', loading);
    });
  }



  // executeQuery(query: string, variables?: { [key: string]: any }, isSecondServer: boolean = false): Observable<any> {
  //   // const client = isSecondServer ? this.apolloServer2 : this.apolloServer1;
  //   const client = this.apollo;
  //   let customHeaders = {};
  //   if (isSecondServer) {
  //     customHeaders = {
  //       'isnativegraphql': 'true'
  //     };
  //   } else {
  //     customHeaders = {
  //     };
  //   }
  //   return client.query({
  //     query: gql`${query}`,
  //     variables: variables,
  //     errorPolicy: 'all',
  //     context: {
  //       headers: customHeaders
  //     }
  //   }).pipe(
  //     map(this.handleResponse),
  //   );
  // }

  // private handleResponse(response: any | MutationResult<any>): any {
  //   if (response && response.data && response.errors) {
  //     const data = response?.data ?? null;
  //     const errors = response.errors.reduce((acc: any, item: any) => {
  //       const key = item.path[0];
  //       acc[key] = item;
  //       return acc;
  //     }, {});
  //     throw { ...data, errors };
  //   }
  //   if (response && response.data) {
  //     return response.data;
  //   }
  //   if (response && response.errors) {
  //     return response.errors
  //   }
  // }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
