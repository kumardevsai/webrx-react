import * as React from 'react';
import { Iterable } from 'ix';

import { IterableLike } from '../../../WebRx';
import { wxr } from '../../React';
import { Panel, StackPanel, PanelItemProps, PanelRenderProps, PanelFragment } from '../Panel';

export type ViewTemplate = (itemsPanel: PanelFragment, itemsPresenter: ItemsPresenter) => JSX.Element | null | false;
export type ItemsPanelTemplate = (itemTemplates: Array<PanelFragment>, itemsPresenter: ItemsPresenter, items: Array<{}> | undefined) => PanelFragment;

export interface ItemsPresenterTemplateProps {
  /**
   * template that wraps the entire control.
   * use this to compose the exterior of the the view.
   * render the items presenter where you want the items panel located.
   */
  viewTemplate?: ViewTemplate;

  /**
   * template to render panel responsible for items layout.
   * this template can control how items are rendered next to one another
   * (i.e., wrapping, stack, grid, etc...)
   */
  itemsPanelTemplate?: ItemsPanelTemplate;

  /**
   * template to render each item
   */
  itemTemplate?: (item: {}, index: number) => PanelFragment;
}

export interface ItemsPresenterSourceProps {
  /**
   * data source of items to render
   * if omitted then component children is used in place
   */
  itemsSource?: IterableLike<{}>;
}

export interface ItemsPresenterProps extends React.HTMLAttributes<ItemsPresenterProps>, ItemsPresenterTemplateProps, ItemsPresenterSourceProps, PanelItemProps, PanelRenderProps {
}

export class ItemsPresenter extends React.Component<ItemsPresenterProps> {
  public static displayName = 'ItemsPresenter';

  public static defaultItemTemplate(item: {}, index: number) {
    return (
      <div key={ index }>{ String.stringify(item) }</div>
    );
  }

  public static defaultPanelTemplate(itemTemplates: Array<PanelFragment>, itemsPresenter: ItemsPresenter) {
    return (
      <StackPanel
        itemClassName={ itemsPresenter.props.itemClassName }
        itemStyle={ itemsPresenter.props.itemStyle }
        itemProps={ itemsPresenter.props.itemProps }
        compact={ itemsPresenter.props.compact }
      >
        { itemTemplates }
      </StackPanel>
    );
  }

  public static defaultViewTemplate(itemsPanel: PanelFragment, itemsPresenter: ItemsPresenter) {
    const { className, props, rest } = itemsPresenter.restProps(x => {
      const { itemsSource, viewTemplate, itemsPanelTemplate, itemTemplate, itemClassName, itemStyle, itemProps, compact } = x;
      return { itemsSource, viewTemplate, itemsPanelTemplate, itemTemplate, itemClassName, itemStyle, itemProps, compact };
    });

    return (
      <div { ...rest } className={ wxr.classNames('ItemsPresenter', className) }>
        { itemsPanel }
      </div>
    );
  }

  render() {
    return this.renderViewTemplate();
  }

  protected getItemsPanelTemplate(): ItemsPanelTemplate {
    if (this.props.itemsPanelTemplate != null) {
      return this.props.itemsPanelTemplate;
    }

    if (this.props.itemsSource != null && React.Children.count(this.props.children) === 1) {
      const itemsPanel: PanelFragment = React.Children.only(this.props.children);

      if (React.isValidElement<JSX.ElementChildrenAttribute>(itemsPanel)) {
        return items => {
          const children = items.concat(React.Children.toArray(itemsPanel.props.children));

          return React.cloneElement(itemsPanel, {}, children);
        };
      }

      return () => itemsPanel;
    }

    return ItemsPresenter.defaultPanelTemplate;
  }

  protected renderItemTemplates() {
    const template = this.props.itemTemplate || ItemsPresenter.defaultItemTemplate;

    if (this.props.itemsSource == null) {
      return {
        items: undefined,
        itemTemplates: React.Children.toArray(this.props.children),
      };
    }

    const items = Iterable
      .from(this.props.itemsSource)
      .toArray();

    const itemTemplates = items
      .map<PanelFragment>((x, i) => {
        const item = template(x, i);

        return (item != null && React.isValidElement<any>(item) && item.key == null) ?
          React.cloneElement(item, { key: i }) :
          item;
      });

    return { items, itemTemplates };
  }

  protected renderPanelTemplate(): PanelFragment {
    const template = this.getItemsPanelTemplate();
    const { items, itemTemplates } = this.renderItemTemplates();

    return template(itemTemplates, this, items);
  }

  protected renderViewTemplate(): JSX.Element | null | false {
    const template = this.props.viewTemplate || ItemsPresenter.defaultViewTemplate;
    const itemsPanel = this.renderPanelTemplate();

    if (React.isValidElement(itemsPanel)) {
      const itemsPresenterPanelProps = Object.trim({
        itemClassName: this.props.itemClassName,
        itemStyle: this.props.itemStyle,
        itemProps: this.props.itemProps,
        compact: this.props.compact,
      });

      const itemsPanelProps = React.isValidElement(itemsPanel) ? itemsPanel.props : {};

      return template(React.cloneElement(itemsPanel, { ...itemsPresenterPanelProps, ...itemsPanelProps }), this);
    }

    return template(itemsPanel, this);
  }
}
