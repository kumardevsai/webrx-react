'use strict';

import * as Rx from 'rx';
import * as wx from 'webrx';

import { getLogger } from '../Utils/Logging/LogManager';
import SampleData from './SampleData/SampleData';
import { Default as routeManager } from '../Routing/RouteManager';

export class ObservableApi {
  public static displayName = 'ObservableApi';

  protected logger = getLogger(ObservableApi.displayName);
  protected sampleData: SampleData = null;

  constructor(public baseUri: string) {
  }

  private client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);

  public getObservable<T>(action: string, params?: any, options?: wx.IHttpClientOptions, baseUri?: string) {
    const uri = `${baseUri || this.baseUri}${action}`;

    this.logger.info(`Calling API: ${action} (${uri})`, params);

    return this.sampleData == null ?
      // if an API call throws an uncaught error, that means you are not subscribing to the observable's error
      Rx.Observable
        .fromPromise(this.client.get<T>(uri, params, options))
        .catch(x => {
          this.logger.error(`API ERROR: ${action} (${uri})`, x);

          let error: any = null;

          try {
            error = JSON.parse(x.response);
          } catch (e) {
            this.logger.error('Unable to Get Error Response', e);

            error = 'Unknown Error: Invalid Response from API Host';
          }

          return Rx.Observable.throw<T>(error);
        }) :
        // if sample data has been created just use that instead (opt-in)
        this.sampleData.getObservable<T>(action, params);
  }
}

export default ObservableApi;
