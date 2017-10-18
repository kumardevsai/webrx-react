import * as React from 'react';
import { Breadcrumb, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { Icon } from 'react-fa';

import { wxr, RoutingBreadcrumb } from '../../React';
import { CommandButton } from '../CommandButton/CommandButton';

export interface BreadcrumbsProps extends React.HTMLProps<any> {
  id?: string;
  pinnable?: boolean;
  items?: RoutingBreadcrumb[];
}

export class Breadcrumbs extends React.Component<BreadcrumbsProps> {
  static defaultProps = {
    id: 'breadcrumbs',
  };

  private toggleBreadcrumbsPin() {
    const elem = document
      .getElementById(this.props.id!);

    if (elem != null) {
      if (/fixed/.test(elem.className)) {
        elem.className = 'Breadcrumbs';
      }
      else {
        elem.className = 'Breadcrumbs fixed';
      }
    }
  }

  render() {
    const { children, className, ref, pinnable, items, ...rest } = this.props;

    return wxr.renderIterable(
      items,
      (x, i, a) => {
        const tooltip = wxr.renderConditional(
          String.isString(x.tooltip),
          () => (<Tooltip id={ `${ this.props.id || x.key }-tt` } placement='top'>{ x.tooltip }</Tooltip>),
          () => x.tooltip == null ? undefined : (<Tooltip id={ `${ this.props.id || x.key }-tt` } { ...x.tooltip } />),
        );

        const breadcrumb = (
          <Breadcrumb.Item key={ x.key } active={ i === a.length - 1 } href={ x.href } title={ x.title } target={ x.target }>
            { x.content }
          </Breadcrumb.Item>
        );

        return wxr.renderConditional(
          React.isValidElement<any>(tooltip),
          () => (
            <OverlayTrigger key={ breadcrumb.key || undefined } placement={ tooltip.props.placement } overlay={ tooltip } >
              { breadcrumb }
            </OverlayTrigger>
          ),
          () => breadcrumb,
        );
      },
      x => x.length === 0 ? null : (
        <div { ...rest } className={ wxr.classNames('Breadcrumbs', 'hidden-xs', className) }>
          <div className='Breadcrumbs-container'>
            <Breadcrumb>{ x }</Breadcrumb>
            {
              wxr.renderConditional(pinnable, () => (
                <CommandButton className='Breadcrumbs-pin' bsStyle='link'
                  onClick={ () => this.toggleBreadcrumbsPin() }
                >
                  <Icon name='thumb-tack' size='lg' rotate='90' />
                </CommandButton>
              ))
            }
          </div>
        </div>
      ),
    );
  }
}
