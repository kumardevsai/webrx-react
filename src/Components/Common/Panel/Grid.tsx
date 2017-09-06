import * as React from 'react';
import { Iterable } from 'ix';

import { wxr } from '../../React';
import { PanelItemContext, PanelItemProp, PanelItemProps, PanelProps, Panel } from './Panel';

/**
 * a row context only knows about its row number
 * NOTE: the inherited index always has the same value as the row
 */
export interface GridRowContext extends PanelItemContext {
  row: number;
}

/**
 * a column context knows both its row number and column number
 * the index represents the index of the panel item being rendered
 */
export interface GridColumnContext extends GridRowContext {
  column: number;
}

/**
 * a layout element represents props for a component that helps define
 * the grid layout (i.e. GridRowDefinitions and RowDefinition)
 */
export interface GridLayoutElementProps<T extends GridRowContext = GridRowContext> extends PanelItemProps<T> {
}

/**
 * a row layout element with a height prop
 */
export interface RowDefinitionProps extends GridLayoutElementProps {
  height?: number;
}

/**
 * a component to define a grid row, optionally with a static height value
 * if height is omitted, height will auto stretch to consume available space
 */
export class RowDefinition extends React.Component<RowDefinitionProps> {
}

/**
 * a row collection layout element to define row layout elements as children
 */
export interface GridRowDefinitionsProps extends GridLayoutElementProps {
  children?: React.ReactElement<RowDefinitionProps> | Array<React.ReactElement<RowDefinitionProps>>;
}

/**
 * a component to define the row layout component collection
 */
export class GridRowDefinitions extends React.Component<GridRowDefinitionsProps> {
}

/**
 * a column layout element with a width prop
 * width can be a ratio represented as a string (i.e., '1*' for 1 unit)
 * NOTE: if using multiple stretch columns, the number of units used
 * becomes the divisor (i.e., '1*', '2*', '4*' to denote 1/7, 2/7, 4/7)
 */
export interface ColumnDefinitionProps extends GridLayoutElementProps<GridColumnContext> {
  width?: number | string;
}

/**
 * a component to define a grid column, optionally with a width value
 * if width is omitted, width will auto stretch to consume '1*' of space
 */
export class ColumnDefinition extends React.Component<ColumnDefinitionProps> {
  static defaultProps = {
    width: '*',
  };
}

/**
 * a column collection layout element to define column layout elements as children
 */
export interface GridColumnDefinitionsProps extends GridLayoutElementProps<GridColumnContext> {
  children?: React.ReactElement<ColumnDefinitionProps> | Array<React.ReactElement<ColumnDefinitionProps>>;
}

/**
 * a component to define the column layout component collection
 */
export class GridColumnDefinitions extends React.Component<GridColumnDefinitionsProps> {
}

export type GridLayoutDefinitionGroupElement = React.ReactElement<GridRowDefinitionsProps | GridColumnDefinitionsProps>;
export type GridLayoutDefinitionElement = React.ReactElement<RowDefinitionProps | ColumnDefinitionProps>;

export class GridLayoutDefinition {
  public readonly amount: number | undefined;
  public readonly stretch: boolean;
  public readonly itemClassName: PanelItemProp<string, GridRowContext | GridColumnContext> | undefined;
  public readonly itemStyle: PanelItemProp<React.CSSProperties, GridRowContext | GridColumnContext> | undefined;

  constructor(definition?: GridLayoutDefinitionElement, definitionGroup?: GridLayoutDefinitionGroupElement) {
    let { val, type } = this.getLayoutParam(definition);
    let { amount, stretch } = this.getAmountAndStretch(val);

    if (type === RowDefinition && stretch === true) {
      amount = undefined;
      stretch = false;
    }
    else if (type === ColumnDefinition && amount == null && stretch === true) {
      amount = 1;
    }

    this.amount = amount;
    this.stretch = stretch;

    if (definitionGroup != null) {
      this.itemClassName = definitionGroup.props.itemClassName;
      this.itemStyle = definitionGroup.props.itemStyle;
    }

    if (definition != null) {
      if (definition.props.itemClassName != null) {
        this.itemClassName = definition.props.itemClassName;
      }

      if (definition.props.itemStyle != null) {
        this.itemStyle = definition.props.itemStyle;
      }
    }
  }

  protected getAmountAndStretch(val: string | number | undefined) {
    if (String.isString(val)) {
      if (val === '*') {
        return { amount: 1, stretch: true };
      }
      else if (val.length > 1) {
        if (val[val.length - 1] === '*') {
          return { amount: parseInt(val), stretch: true };
        }
        else {
          return { amount: parseInt(val), stretch: false };
        }
      }
      else {
        return { amount: parseInt(val), stretch: false };
      }
    }
    else if (val != null) {
      return { amount: val, stretch: false };
    }
    else {
      return { amount: undefined, stretch: true };
    }
  }

  protected getLayoutParam(definition?: GridLayoutDefinitionElement) {
    if (definition != null && React.isValidElement<RowDefinitionProps & ColumnDefinitionProps>(definition)) {
      if (definition.type === RowDefinition) {
        return { val: definition.props.height, type: RowDefinition };
      }
      else {
        return { val: definition.props.width, type: ColumnDefinition };
      }
    }
    else {
      return { val: undefined, type: undefined };
    }
  }
}

export interface GridProps extends PanelProps {
  border?: boolean;
}

export class Grid extends Panel<GridProps> {
  public static displayName = 'Grid';

  /**
   * Use this component to define your Row collection
   * i.e., <Grid.Rows><RowDefinition /></Grid.Rows>
   */
  public static Rows = GridRowDefinitions;

  /**
   * Use this component to define your Column collection
   * i.e., <Grid.Columns><ColumnDefinition /></Grid.Columns>
   */
  public static Columns = GridColumnDefinitions;

  render() {
    const { border, ...rest } = this.props;

    const bordered = { 'Grid-Border': border === true };

    return this.renderPanel(wxr.classNames('Grid', bordered), rest);
  }

  renderItems() {
    const { children, rows, cols } = this.getLayout();

    return Iterable
      .range(0, rows.length)
      .map(row => {
        const colItems = Iterable
          .range(0, cols.length)
          .map(col => {
            return this.renderColumn(row, col, rows, cols, children);
          })
          .toArray();

        return this.renderRow(row, rows, colItems);
      })
      .toArray();
  }

  protected renderRow(row: number, rows: Array<GridLayoutDefinition>, colItems: React.ReactNode) {
    const def = rows[row];

    const itemClassName = Panel.getPanelItemPropValue(def.itemClassName, { row, index: row });
    const itemStyle = Panel.getPanelItemPropValue(def.itemStyle, { row, index: row });

    const layoutStyle = Object.assign({}, itemStyle, {
      height: this.getCellLayoutValue(def),
    });

    return (
      <div className={ wxr.classNames('Grid-Row', itemClassName) } style={ layoutStyle } data-grid-row={ row } key={ `${ row }` }>
        { colItems }
      </div>
    );
  }

  protected renderColumn(row: number, column: number, rows: Array<GridLayoutDefinition>, cols: Array<GridLayoutDefinition>, children: Array<React.ReactChild>) {
    const def = cols[column];
    const cellItems: Array<React.ReactChild> = [];

    let index = 0;
    while (index < children.length) {
      const child: any = children[index];
      const childProps = child != null && child.props != null ? child.props : undefined;
      const desiredRow = (childProps == null ? undefined : childProps['data-grid-row']) || 0;
      const desiredCol = (childProps == null ? undefined : childProps['data-grid-column']) || 0;
      if (desiredRow === row && desiredCol === column) {
        const cellItem = React.isValidElement<any>(child) ?
          React.cloneElement(child, { 'data-grid-row': undefined, 'data-grid-column': undefined }) :
          child;
        cellItems.push(cellItem);
        children.splice(index, 1);
      }
      else {
        ++index;
      }
    }

    const itemClassName = Panel.getPanelItemPropValue(def.itemClassName, { row, column, index });
    const itemStyle = Panel.getPanelItemPropValue(def.itemStyle, { row, column, index });

    const layoutStyle = Object.assign({}, itemStyle, {
      width: this.getCellLayoutValue(def),
    });

    return (
      <div className={ wxr.classNames('Grid-Column', itemClassName) } style={ layoutStyle } data-grid-column={ column } key={ `${ row }.${ column }` }>
        { super.renderItems(cellItems) }
      </div>
    );
  }

  protected getCellLayoutValue(def: GridLayoutDefinition) {
    return def.stretch ? `${ (def.amount || 1) * 100 }%` : def.amount;
  }

  protected getLayout() {
    const children = React.Children.toArray(this.props.children);
    let rows: React.ReactElement<GridRowDefinitionsProps> | undefined;
    let cols: React.ReactElement<GridColumnDefinitionsProps> | undefined;

    let index = 0;
    while (index < children.length) {
      const elem: any = children[index];

      if (elem.type === GridRowDefinitions) {
        rows = elem;
        children.splice(index, 1);
      }
      else if (elem.type === GridColumnDefinitions) {
        cols = elem;
        children.splice(index, 1);
      }
      else {
        ++index;
      }

      if (rows != null && cols != null) {
        break;
      }
    }

    return {
      children,
      rows: this.getLayoutDefinitions(rows),
      cols: this.getLayoutDefinitions(cols),
    };
  }

  protected getLayoutDefinitions(elem: GridLayoutDefinitionGroupElement | undefined) {
    if (elem == null) {
      return [ new GridLayoutDefinition() ];
    }

    return React.Children.map(
      elem.props.children,
      (x: GridLayoutDefinitionElement) => {
        return new GridLayoutDefinition(x, elem);
      });
  }
}
