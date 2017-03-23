import * as React from 'react';
import { Grid, Alert, Breadcrumb } from 'react-bootstrap';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Icon } from 'react-fa';
import * as classNames from 'classnames';

import { BaseView, BaseViewProps } from '../../React/BaseView';
import { isViewModel } from '../../React/BaseViewModel';
import { BaseRoutableViewModel, isRoutableViewModel } from '../../React/BaseRoutableViewModel';
import { RouteHandlerViewModel, SplashKey } from './RouteHandlerViewModel';
import { CommandButton } from '../CommandButton/CommandButton';
import { ViewMapper } from '../../../Routing/ViewMap';

import './RouteHandler.less';

export interface RouteHandlerProps extends BaseViewProps {
  viewMap: ViewMapper;
}

export class RouteHandlerView extends BaseView<RouteHandlerProps, RouteHandlerViewModel> {
  public static displayName = 'RouteHandlerView';

  constructor(props?: RouteHandlerProps, context?: any) {
    super(props, context);

    if (this.props.viewMap['*'] == null) {
      this.props.viewMap['*'] = () => this.renderError('View Not Found');
    }

    if (this.props.viewMap[''] == null) {
      this.props.viewMap[''] = () => this.renderError('Route Not Found');
    }

    if (this.props.viewMap[SplashKey] == null) {
      this.props.viewMap[SplashKey] = null;
    }
  }

  private getViewKey() {
    if (this.state.isLoading() === true) {
      return SplashKey;
    }
    else {
      const component = this.state.routedComponent();

      if (isRoutableViewModel(component)) {
        return component.getRoutingKey();
      }
      else if (isViewModel(component)) {
        this.logger.warn('Routing to Non-Routable View Model', component);

        return component.getDisplayName();
      }
      else if (String.isString(component)) {
        return component;
      }
      else {
        return '';
      }
    }
  }

  updateOn() {
    return [
      this.state.isLoading.changed,
      this.state.routedComponent.changed,
      this.state.routingBreadcrumbs.changed,
    ];
  }

  render() {
    const { className, rest } = this.restProps(x => {
      const { viewMap } = x;
      return { viewMap };
    });

    const key = this.getViewKey();

    return (
      <div { ...rest } className={ classNames('RouteHandler', className) }>
        <ReactCSSTransitionGroup transitionName='view' transitionLeave={ false } transitionEnterTimeout={ 250 }>
          <div className='RouteHandler-viewContainer' key={ key }>
            { this.renderBreadcrumbs() }
            { this.renderRoutedView(key) }
          </div>
        </ReactCSSTransitionGroup>
      </div>
    );
  }

  private toggleBreadcrumbsPin() {
    const elem = document
      .getElementsByClassName('RouteHandler-breadcrumbsContainer')
      .item(0);

    if (elem != null) {
      if (/fixed/.test(elem.className)) {
        elem.className = 'RouteHandler-breadcrumbsContainer';
      }
      else {
        elem.className = 'RouteHandler-breadcrumbsContainer fixed';
      }
    }
  }

  private renderBreadcrumbs() {
    return this.renderEnumerable(
      this.state.routingBreadcrumbs(),
      (x, i, a) => (
        <Breadcrumb.Item key={ x.key } active={ i === a.length - 1 } href={ x.href } title={ x.title } target={ x.target }>
          { x.content }
        </Breadcrumb.Item>
      ),
      x => x.length === 0 ? null : (
        <div className='RouteHandler-breadcrumbsContainer'>
          <div className='RouteHandler-breadcrumbs'>
            <Breadcrumb>{ x }</Breadcrumb>

            <CommandButton className='RouteHandler-breadcrumbsPin' bsStyle='link'
              onClick={ () => this.toggleBreadcrumbsPin() }
            >
              <Icon name='thumb-tack' size='lg' />
            </CommandButton>
          </div>
        </div>
      ),
    );
  }

  private renderRoutedView(key: string): any {
    let component = this.state.routedComponent();

    let activator = this.props.viewMap[key];
    if (activator == null && key !== SplashKey) {
      activator = this.props.viewMap['*'];
    }

    let view: any = activator;

    if (activator instanceof Function) {
      view = activator(component);
    }

    this.logger.debug(`Rendering routed view for '${ Object.getName(component) }' (${ key })`);

    return (
      <div className='RouteHandler-view'>
        { view || this.renderError('Catastrophic Failure') }
      </div>
    );
  }

  private renderError(text: string) {
    return (
      <Grid className='RouteHandler-error'>
        <Alert bsStyle='danger'>
          <h4>{ text }</h4>
        </Alert>
      </Grid>
    );
  }
}
