import * as React from 'react';
import { Iterable } from 'ix';
import { Subscription } from 'rxjs';
import { ListGroupItemProps } from 'react-bootstrap';

import { wx } from '../../../WebRx';
import { compare } from '../../../Utils/Compare';
import { ListItemsViewModel } from './ListItemsViewModel';

export type SelectedPropsFunction = (isSelected: boolean, elem: React.ReactElement<React.HTMLAttributes<{}>>) => {};

export interface SelectableListItemProps {
  listItems: Readonly<ListItemsViewModel<{}>>;
  item: {};
  selectedProps?: SelectedPropsFunction;
}

export class SelectableListItem extends React.Component<SelectableListItemProps> {
  static defaultProps = {
    selectedProps: () => ({}),
  };

  private isSelectedSubscription = Subscription.EMPTY;

  private subscribeToUpdates(listItems: Readonly<ListItemsViewModel<{}>>) {
    this.unsubscribeFromUpdates();

    this.isSelectedSubscription = wx
      .whenAny(listItems.selectedItems, x => x)
      // skip the first result (we already a render queued)
      .skip(1)
      // remove nulls (shouldn't be possible)
      .filterNull()
      .subscribe(() => this.forceUpdate());
  }

  private unsubscribeFromUpdates() {
    if (this.isSelectedSubscription !== Subscription.EMPTY) {
      this.isSelectedSubscription = Subscription.unsubscribe(this.isSelectedSubscription);
    }
  }

  componentDidMount() {
    this.subscribeToUpdates(this.props.listItems);
  }

  componentWillUpdate(nextProps: Readonly<SelectableListItemProps>) {
    this.subscribeToUpdates(nextProps.listItems);
  }

  componentWillUnmount() {
    this.unsubscribeFromUpdates();
  }

  render() {
    const elem = React.Children.only(this.props.children);

    return React.cloneElement(elem, this.getListItemProps(elem));
  }

  protected getIsSelected() {
    const items = this.props.listItems.selectedItems.value;

    if (items == null) {
      return false;
    }

    return items.indexOf(this.props.item) >= 0;
  }

  protected getListItemProps(elem: React.ReactElement<any>): ListGroupItemProps {
    return Object.assign<ListGroupItemProps>(
      {},
      this.props.selectedProps!(this.getIsSelected(), elem),
      {
        onClick: this.handleClick.bind(this),
      },
    );
  }

  protected handleClick(e: React.MouseEvent<any>) {
    e.stopPropagation();
    e.preventDefault();

    if (e.ctrlKey) {
      this.props.listItems.selectItems.execute(
        Iterable
          .from(this.props.listItems.selectedItems.value)
          .startWith(this.props.item)
          .filterNull()
          .distinct(undefined, compare)
          .toArray(),
      );
    }
    else if (e.shiftKey) {
      document.getSelection().removeAllRanges();
      const from = this.props.listItems.selectedItems.value[0] || this.props.item;
      this.props.listItems.selectRange.execute({ from, to: this.props.item });
    }
    else {
      this.props.listItems.selectItem.execute(this.props.item);
    }
  }
}
