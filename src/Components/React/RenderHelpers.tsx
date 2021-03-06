import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { Grid } from 'react-bootstrap';
import { Iterable } from 'ix';
import * as classNamesFunc from 'classnames';

import { Property } from '../../WebRx';
import { Loading } from '../Common/Loading/Loading';
import { ValueComparison, ValueComparer } from '../../Utils/Compare';

export function renderIterable<T>(
  source: T[] | Iterable<T> | undefined,
  selector: (item: T, index: number, items: T[]) => any = item => item,
  projector: (items: T[]) => any = items => items,
  sortKey?: (item: T) => any,
  sortComparer: ValueComparison<T> = ValueComparer.DefaultComparison,
  defaultSelector: () => T | undefined = () => undefined,
) {
  let iterable: Iterable<T>;

  if (source == null) {
    iterable = Iterable.empty<T>();
  }
  else if (Array.isArray(source)) {
    iterable = source.asIterable();
  }
  else {
    iterable = source;
  }

  if (sortKey != null) {
    iterable = iterable
      .orderBy(sortKey, sortComparer);
  }

  return projector(
    iterable
      .defaultIfEmpty(defaultSelector())
      .filterNull()
      .toArray<T>()
      .map((x, i, a) => selector(x, i, a)),
  );
}

export function renderConditional(
  condition: Property<boolean> | boolean | undefined,
  trueContent: () => any,
  falseContent: () => any = () => null,
) {
  return (condition == null ? false : (typeof condition === 'boolean' ? condition : condition.value)) ?
    trueContent() :
    falseContent();
}

export function renderNullable<T>(element: T | undefined, notNullContent: (x: T) => any, nullContent?: () => any, constraint?: (x: T) => boolean) {
  return renderConditional(
    element != null && (constraint == null || constraint(element)),
    () => notNullContent(element as T),
    nullContent,
  );
}

export function renderLoadable(
  isLoading: Property<boolean> | boolean | undefined,
  loadingComponent: any,
  loadedComponent?: any,
) {
  if (String.isString(loadingComponent)) {
    const text = loadingComponent;

    loadingComponent = () => (
      <Loading text={ text } />
    );
  }
  else if (Object.isObject(loadingComponent) && React.isValidElement(loadingComponent) === false) {
    const props = loadingComponent;

    loadingComponent = () => (
      <Loading { ...props } />
    );
  }

  return this.renderConditional(isLoading, loadingComponent, loadedComponent);
}

export function renderSizedLoadable(
  isLoading: Property<boolean> | boolean | undefined,
  text: string,
  fontSize: number | string,
  loadedComponent?: any,
) {
  return this.renderLoadable(isLoading, {
    text,
    fontSize,
  }, loadedComponent);
}

export function renderGridLoadable(
  isLoading: Property<boolean> | boolean | undefined,
  text: string,
  fontSize: number | string,
  loadedComponent?: any,
) {
  return this.renderLoadable(isLoading, {
    text,
    fontSize,
    componentClass: Grid,
  }, loadedComponent);
}

/**
 * Focus a react instance upon mounting
 * i.e., <Elem ref={ (x: React.ReactInstance) => this.focusElement(x) } />
 */
export function focusElement<T extends HTMLElement = HTMLElement>(instance: React.ReactInstance | undefined) {
  const elem = instance == null ? undefined : findDOMNode(instance) as T;

  if (elem != null) {
    if (elem.focus instanceof Function) {
      elem.focus();
    }

    return elem;
  }

  return undefined;
}

// classNames type defs don't export the internal types so we have to decouple here
export function classNames(...args: any[]): string {
  return classNamesFunc.apply(this, arguments);
}
