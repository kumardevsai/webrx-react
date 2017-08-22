import { Observable } from 'rxjs';
import * as clone from 'clone';

import { wx, ObservableOrProperty, ReadOnlyProperty, Property, Command } from '../../../WebRx';
import { ObjectComparer, SortDirection } from '../../../Utils/Compare';
import { ListViewModel } from '../List/ListViewModel';
import { SearchViewModel, SearchRoutingState } from '../Search/SearchViewModel';
import { PagerViewModel, PagerRoutingState } from '../Pager/PagerViewModel';

export interface SortArgs {
  field: string;
  direction: SortDirection;
}

export interface ProjectionRequest {
  filter?: string;
  regex?: RegExp;
  offset?: number;
  limit?: number;
  sortField?: string;
  sortDirection?: SortDirection;
}

export interface ProjectionResult<TData> {
  items: TData[];
  count: number;
}

export interface DataGridRoutingState {
  search: SearchRoutingState;
  sortBy?: string;
  sortDir?: SortDirection;
  pager: PagerRoutingState;
}

export abstract class BaseDataGridViewModel<TData, TRequest extends ProjectionRequest, TResult extends ProjectionResult<TData>> extends ListViewModel<TData, DataGridRoutingState> {
  public static displayName = 'BaseDataGridViewModel';

  protected readonly comparer: ObjectComparer<TData>;

  public readonly search: SearchViewModel;
  public readonly pager: PagerViewModel;
  public defaultSortDirection: SortDirection;

  public readonly projectionRequests: ReadOnlyProperty<TRequest>;
  public readonly projectionResults: ReadOnlyProperty<TResult>;
  public readonly projectedItems: ReadOnlyProperty<TData[]>;
  public readonly sortField: ReadOnlyProperty<string | undefined>;
  public readonly sortDirection: ReadOnlyProperty<SortDirection | undefined>;
  public readonly isLoading: ReadOnlyProperty<boolean>;
  public readonly hasProjectionError: ReadOnlyProperty<boolean>;

  public readonly sort: Command<SortArgs>;
  public readonly toggleSortDirection: Command<string>;
  public readonly refresh: Command<any>;
  public readonly project: Command<TResult | undefined>;

  constructor(
    requests: Observable<TRequest>,
    items?: ObservableOrProperty<TData[]>,
    protected readonly filterer?: (item: TData, regex: RegExp) => boolean,
    comparer: string | ObjectComparer<TData> = new ObjectComparer<TData>(),
    isMultiSelectEnabled?: boolean,
    isLoading?: ObservableOrProperty<boolean>,
    pagerLimit?: number,
    rateLimit = 100,
    isRoutingEnabled?: boolean,
  ) {
    super(items, isMultiSelectEnabled, isRoutingEnabled);

    if (String.isString(comparer)) {
      this.comparer = new ObjectComparer<TData>(comparer);
    }
    else {
      this.comparer = comparer;
    }

    this.search = new SearchViewModel(undefined, undefined, this.isRoutingEnabled);
    this.pager = new PagerViewModel(pagerLimit, this.isRoutingEnabled);
    this.defaultSortDirection = SortDirection.Ascending;

    this.hasProjectionError = this.property(false);

    this.sort = this.command<SortArgs>();
    this.toggleSortDirection = this.command<string>();
    this.refresh = this.command();

    const sortChanged = this
      .whenAny(this.sort.results, x => x);

    this.sortField = Observable
      .merge(
        this.routingState.changed.map(x => x.sortBy),
        sortChanged.map(x => x.field),
      )
      .map(x => x || this.sortField.value)
      .toProperty();

    this.sortDirection = Observable
      .merge(
        this.routingState.changed.map(x => x.sortDir),
        sortChanged.map(x => x.direction),
      )
      .map(x => x || this.sortDirection.value)
      .toProperty();

    this.projectionRequests = this
      .whenAny(
        // merge our input requests with our projection requests
        this.getObservableOrAlert(
          () => this
            .whenAny(this.getProjectionRequests(), requests, (pr, r) => ({ pr, r }))
            .filter(x => x.pr != null)
            .map(x => Object.assign<TRequest>({}, x.pr, x.r)),
          'Error Creating Data Grid Requests',
        ),
        x => x,
      )
      // filter out null request data
      .filterNull()
      .toProperty(undefined, false);

    this.project = this.command((x: TRequest) => {
      return this
        .getObservableOrAlert(
          () => this.getProjectionResult(x),
          'Error Projecting Data Grid Results',
        )
        // this ensures that errors still generate a result
        .defaultIfEmpty(undefined);
    });

    this.projectionResults = this
      .whenAny(this.project.results, x => x)
      // we will get null projection results back if there is an error
      // so just filter these results out of our results observable
      .filterNull()
      .toProperty(undefined, false);

    if (this.isProperty(isLoading) === true) {
      this.isLoading = <ReadOnlyProperty<boolean>>isLoading;
    }
    else if (wx.isObservable(isLoading) === true) {
      this.isLoading = (<Observable<boolean>>isLoading).toProperty(true);
    }
    else {
      // setup a default isLoading observable
      this.isLoading = Observable
        .merge(
          this.project.isExecutingObservable.filter(x => x === true),
          this.project.results.map(() => false),
        )
        .toProperty(true);
    }

    this.projectedItems = this
      .whenAny(this.project.results, x => x)
      .filterNull()
      .do(x => {
        // update global pager state
        this.pager.itemCount.value = x.count;
      })
      // project back down into the item array
      .map(x => x.items)
      .toProperty(undefined, false);

    this.addSubscription(this
      .whenAny(
        this.search.requests,
        this.sortField,
        this.sortDirection,
        () => 1,
      )
      .invokeCommand(this.pager.selectPage),
    );

    // whenever there is a new request we re-project
    this.addSubscription(this
      .whenAny(
        this.projectionRequests,
        // whenever a discrete refresh request is made we need to re-project
        this.refresh.results.startWith(null),
        // we don't care about the discrete refresh request data, just the most recent projection request
        x => x,
      )
      // ignore the (first) null requests
      .filter(x => x != null)
      // debounce on input projection requests
      .debounceTime(rateLimit)
      .invokeCommand(this.project),
    );

    this.hasProjectionError = Observable
      .merge(
        this.project.results.map(() => false),
        this.project.thrownErrors.map(() => true),
      )
      .toProperty(false);

    this.addSubscription(
      this.toggleSortDirection.results
        .map(x => (<SortArgs>{
          field: x || this.sortField.value,
          direction: (x === this.sortField.value ?
            (this.sortDirection.value === SortDirection.Descending ? SortDirection.Ascending : SortDirection.Descending) :
            this.defaultSortDirection),
        }))
        .invokeCommand(() => this.sort),
    );

    this.addSubscription(
      this
        .whenAny(this.sortField, this.sortDirection, (f, d) => ({ f, d }))
        .filter(x => x.f != null && x.d != null)
        .invokeCommand(this.routingStateChanged),
    );
  }

  // create the default projection request structure
  protected getProjectionRequests() {
    return this
      .whenAny(
        this.search.requests,
        this.pager.offset,
        this.pager.limit,
        this.sortField,
        this.sortDirection,
        (search, offset, limit, sortField, sortDirection) => <ProjectionRequest>{
          filter: search == null ? null : search.filter,
          regex: search == null ? null : search.regex,
          search,
          offset,
          limit,
          sortField,
          sortDirection,
        },
      );
  }

  protected abstract getProjectionResult(request: TRequest): Observable<TResult>;

  // NOTE: this is a bit dangerous since we're overriding an inherited local
  //       member with a property getter.
  get items() {
    return this.projectedItems;
  }

  public get allItems() {
    return this.listItems;
  }

  public canFilter() {
    return this.filterer != null;
  }

  public canSort() {
    return this.comparer != null;
  }

  public isSortedBy(fieldName: string | undefined, direction: SortDirection) {
    return !String.isNullOrEmpty(fieldName) && fieldName === this.sortField.value && direction === this.sortDirection.value;
  }

  getSearch() {
    return this.canFilter() ? this.search : null;
  }

  saveRoutingState(state: DataGridRoutingState) {
    state.search = this.search.getRoutingState();
    state.pager = this.pager.getRoutingState();

    if (this.sortField.value != null) {
      state.sortBy = this.sortField.value;
    }

    if (this.sortDirection.value != null) {
      state.sortDir = this.sortDirection.value;
    }
  }

  loadRoutingState(state: DataGridRoutingState) {
    const prevState = this.routingState.value || <DataGridRoutingState>{};

    if (state.sortDir == null && prevState.sortDir != null) {
      state.sortDir = SortDirection.Ascending;
    }

    this.search.setRoutingState(state.search);
    this.pager.setRoutingState(state.pager);
  }
}

export interface ItemsProjectionRequest<TData> extends ProjectionRequest {
  items: TData[];
}

export class DataGridViewModel<TData> extends BaseDataGridViewModel<TData, ItemsProjectionRequest<TData>, ProjectionResult<TData>> {
  public static displayName = 'DataGridViewModel';

  public static create<T>(...items: T[]) {
    return new DataGridViewModel(wx.property<T[]>(items, false));
  }

  private static getItemsRequestObservable<T>(source: ObservableOrProperty<T[]>) {
    if (wx.isProperty(source) === true) {
      return wx
        .whenAny(source, x => x)
        .filterNull()
        .map(items => <ItemsProjectionRequest<T>>{
          items,
        });
    }
    else {
      return (<Observable<T[]>>source)
        .map(items => <ItemsProjectionRequest<T>>{
          items,
        });
    }
  }

  constructor(
    items: ObservableOrProperty<TData[]> = wx.property<TData[]>([], false),
    filterer?: (item: TData, regex: RegExp) => boolean,
    comparer?: string | ObjectComparer<TData>,
    protected preFilter: (items: TData[]) => TData[] = x => clone(x),
    isMultiSelectEnabled?: boolean,
    isLoading?: ObservableOrProperty<boolean>,
    pagerLimit?: number,
    rateLimit = 100,
    isRoutingEnabled?: boolean,
  ) {
    super(DataGridViewModel.getItemsRequestObservable(items), items, filterer, comparer, isMultiSelectEnabled, isLoading, pagerLimit, rateLimit, isRoutingEnabled);
  }

  getProjectionResult(request: ItemsProjectionRequest<TData>) {
    let source = this
      .preFilter(request.items || [])
      .asIterable();

    const filterer = this.filterer;
    const comparer = this.comparer;
    const regex = request.regex;
    const sortField = request.sortField;
    const sortDirection = request.sortDirection;

    if (filterer != null && regex != null && source.some(x => true)) {
      source = source.filter(x => filterer(x, regex));
    }

    if (comparer != null && !String.isNullOrEmpty(sortField) && sortDirection != null) {
      source = comparer.sortIterable(source, sortField, sortDirection);
    }

    let items = source.toArray();
    const count = items.length;

    const offset = request.offset || 0;
    const limit = request.limit || items.length;

    if (offset > 0 || (request.limit || 0) > 0) {
      items = items.slice(offset || 0, Math.min(items.length, offset + limit));
    }

    return Observable
      .of(<ProjectionResult<TData>>{
        items,
        count,
      });
  }
}
