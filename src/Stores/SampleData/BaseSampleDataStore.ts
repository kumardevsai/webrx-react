import { Observable } from  'rxjs';

import { Default as alert } from '../../Utils/Alert';

export type SampleDataAction = (params: any) => Observable<any>;
export type SampleDataActionSet = StringMap<SampleDataAction>;

export abstract class BaseSampleDataStore {
  public abstract getActions(): SampleDataActionSet;

  constructor(protected readonly enableAlerts = false) {
  }

  protected connect(actions: SampleDataActionSet, action: string, api: SampleDataAction, thisArg: any = this) {
    actions[action] = function () {
      return api.apply(thisArg, arguments);
    };
  }

  protected createAlert(action: string, params: any = {}) {
    if (this.enableAlerts === true) {
      alert.create(JSON.stringify(params, null, 2), `SampleData API Call: ${ action }`);
    }
  }
}
