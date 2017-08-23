import { Observable, Observer, Subscription } from 'rxjs';

export interface ReadOnlyProperty<T> {
  readonly changed: Observable<T>;
  readonly thrownErrors: Observable<Error>;
  readonly isReadOnly: boolean;
  readonly value: T;

  isProperty(): boolean;
}

export interface Property<T> extends ReadOnlyProperty<T> {
  value: T;
}

export type ObservableLike<T> = Observable<T> | Property<T> | Command<T> | T;

export interface Command<T> {
  readonly isExecutingObservable: Observable<boolean>;
  readonly canExecuteObservable: Observable<boolean>;
  readonly results: Observable<T>;
  readonly thrownErrors: Observable<Error>;
  readonly isExecuting: boolean;
  readonly canExecute: boolean;

  isCommand(): boolean;

  observeExecution(parameter?: any): Observable<T>;

  execute(
    parameter?: any,
    observerOrNext?: Observer<T>,
    onError?: (exception: any) => void,
    onCompleted?: () => void,
  ): Subscription;

  execute(
    parameter?: any,
    onNext?: (value: T) => void,
    onError?: (exception: any) => void,
    onCompleted?: () => void,
  ): Subscription;
}
