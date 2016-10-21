import * as React from 'react';
import * as Rx from 'rx';
import * as wx from 'webrx';
import { BaseViewModel } from './BaseViewModel';

/**
 * Binds an observable to a command on the view model
 */
export function bindObservableToCommand<TViewModel extends BaseViewModel, TResult>(
  viewModel: TViewModel,
  commandSelector: (viewModel: TViewModel) => wx.ICommand<TResult>,
  observable: Rx.Observable<TResult>
) {
  return viewModel.bind(observable, commandSelector(viewModel));
}

/**
 * Binds a DOM event to an observable property on the view model
 */
export function bindEventToProperty<TViewModel extends BaseViewModel, TValue, TEvent extends Event | React.SyntheticEvent>(
  thisArg: any,
  viewModel: TViewModel,
  targetSelector: (viewModel: TViewModel) => wx.IObservableProperty<TValue>,
  valueSelector?: (eventKey: any, event: TEvent) => TValue
) {
  return (eventKey: any, event: TEvent) => {
    // this ensures that we can still use this function for basic HTML events
    event = event || eventKey;

    const prop = targetSelector.apply(thisArg, [ viewModel ]) as wx.IObservableProperty<TValue>;
    const value = (valueSelector == null ? eventKey : valueSelector.apply(thisArg, [ eventKey, event ])) as TValue;

    prop(value);
  };
}

/**
 * Binds a DOM event to an observable command on the view model
 */
export function bindEventToCommand<TViewModel extends BaseViewModel, TParameter, TEvent extends Event | React.SyntheticEvent>(
  thisArg: any,
  viewModel: TViewModel,
  commandSelector: (viewModel: TViewModel) => wx.ICommand<any>,
  paramSelector?: (eventKey: any, event: TEvent) => TParameter,
  conditionSelector?: (event: TEvent, eventKey: any) => boolean
) {
  return (eventKey: any, event: Event) => {
    // this ensures that we can still use this function for basic HTML events
    event = event || eventKey;

    const param = (paramSelector == null ? eventKey : paramSelector.apply(thisArg, [ eventKey, event ])) as TParameter;
    const canExecute = conditionSelector == null || (conditionSelector.apply(thisArg, [ event, eventKey ]) as boolean);

    if (canExecute) {
      const cmd = commandSelector.apply(thisArg, [ viewModel ]) as wx.ICommand<any>;

      cmd.execute(param);
    }
  };
}