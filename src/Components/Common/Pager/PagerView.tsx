import * as React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { Observable } from 'rxjs';
import { Pagination, PaginationProps, DropdownButton, DropdownButtonProps, MenuItem } from 'react-bootstrap';

import { BaseView, ViewModelProps } from '../../React';
import { PagerViewModel, StandardLimits } from './PagerViewModel';

export interface PagerProps extends PaginationProps {
  info?: boolean;
  limits?: number[];
  dropdownProps?: DropdownButtonProps;
  order?: PagerComponentTypes[];
  emptyInfo?: string;
}

export interface PagerViewProps extends PagerProps, ViewModelProps {
}

export type PagerComponentTypes = 'info' | 'controls' | 'limit' | undefined;
export const StandardPagerComponentOrder: PagerComponentTypes[] = [ 'info', 'controls', 'limit' ];

const ComponentLocations = [ 'left', 'center', 'right' ];

export class PagerView extends BaseView<PagerViewProps, PagerViewModel> {
  public static displayName = 'PagerView';

  static defaultProps = {
    first: true,
    prev: true,
    next: true,
    last: true,
    boundaryLinks: true,
    maxButtons: 3,
    info: true,
    limits: StandardLimits,
    order: StandardPagerComponentOrder,
    emptyInfo: 'No Items to Display',
  };

  private readonly renderFunctions: { [ type: string ]: Function } = {
    info: this.renderInfo,
    controls: this.renderControls,
    limit: this.renderLimit,
  };

  updateOn() {
    return [
      this.state.itemCount.changed,
      this.state.limit.changed,
      this.state.offset.changed,
      this.state.pageCount.changed,
      this.state.selectedPage.changed,
    ];
  }

  render() {
    const { className, props, rest } = this.restProps(x => {
      const { info, limits, dropdownProps, order, emptyInfo } = x;
      return { info, limits, dropdownProps, order, emptyInfo };
    });

    const pagerProps = Object.rest(rest, x => {
      const { activePage, boundaryLinks, bsSize, bsStyle, bsClass, buttonComponentClass, ellipsis, first, items, last, maxButtons, next, onSelect, prev } = x;
      return { activePage, boundaryLinks, bsSize, bsStyle, bsClass, buttonComponentClass, ellipsis, first, items, last, maxButtons, next, onSelect, prev };
    });

    return this.renderConditional(
      this.shouldRenderPager(),
      () => (
        <div { ...pagerProps.rest } className={ this.classNames('Pager', className) }>
          <Grid fluid>
            { this.renderComponents() }
          </Grid>
        </div>
      ),
    );
  }

  protected isEmpty() {
    return (this.state.itemCount.value || 0) === 0;
  }

  protected renderComponents() {
    if (this.props.info === true && this.isEmpty()) {
      return (
        <Row>
          <Col className='Pager-col'>
            { this.renderInfo() }
          </Col>
        </Row>
      );
    }

    const types = this.props.order || [];

    return (
      <Row>
        <Col className='Pager-col Pager-col-left' md={ 4 }>
          { this.renderComponent(types[0]) }
        </Col>
        <Col className='Pager-col Pager-col-center' md={ 4 }>
          { this.renderComponent(types[1]) }
        </Col>
        <Col className='Pager-col Pager-col-right' md={ 4 }>
          { this.renderComponent(types[2]) }
        </Col>
      </Row>
    );
  }

  private shouldRenderPager() {
    return (
      this.shouldRenderInfo() ||
      this.shouldRenderControls() ||
      this.shouldRenderLimit()
    ) && (this.props.order || []).length > 0;
  }

  private shouldRenderInfo() {
    return this.props.info === true && (this.state.limit.value || 0) > 0;
  }

  private shouldRenderControls() {
    return (this.state.pageCount.value || 1) > 1;
  }

  private shouldRenderLimit() {
    return (this.props.limits || []).length > 1 && (this.state.itemCount.value || 0) > 0;
  }

  private renderComponent(type: PagerComponentTypes | undefined) {
    return this.renderNullable(type, x => this.renderFunctions[x].apply(this));
  }

  private renderInfo() {
    return this.renderConditional(this.shouldRenderInfo(), () => (
      <div className='Pager-info'>
          {
            this.renderConditional(
              this.isEmpty(),
              () => this.props.emptyInfo,
              () => `Showing Items ${ this.state.offset.value + 1 } through ${ Math.min(this.state.itemCount.value, this.state.offset.value + (this.state.limit.value || 0)) } of ${ this.state.itemCount.value }`,
            )
          }
      </div>
    ), () => '');
  }

  private renderControls() {
    const { props } = this.restProps(x => {
      const { activePage, bsSize, bsStyle, buttonComponentClass, ellipsis, first, items, last, maxButtons, next, prev } = x;
      return { activePage, bsSize, bsStyle, buttonComponentClass, ellipsis, first, items, last, maxButtons, next, prev };
    });

    return this.renderConditional(this.shouldRenderControls(), () => (
      <Pagination items={ this.state.pageCount.value } activePage={ this.state.selectedPage.value } onSelect={ this.bindEventToCommand(x => x.selectPage) }
        { ...(Object.assign(props, { items: this.state.pageCount.value, activePage: this.state.selectedPage.value })) }
      />
    ), () => '');
  }

  private renderLimit() {
    return this.renderConditional(this.shouldRenderLimit(), () => (
      <DropdownButton id={ this.props.id || 'pager-limit-selector' } { ...this.props.dropdownProps } title={ this.renderLimitTitle() } onSelect={ this.bindEventToProperty(x => x.limit) }>
        {
          this.props.limits!
            .map((x, i) => (
              <MenuItem key={ i } eventKey={ x } selected={ this.state.limit.value === x }>{x || 'All'}</MenuItem>
            ))
        }
      </DropdownButton>
    ), () => '');
  }

  private renderLimitTitle() {
    return `Items per Page (${ this.state.limit.value || 'All' })`;
  }
}
