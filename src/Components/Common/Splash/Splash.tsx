import * as React from 'react';
import { Grid, Row, Image } from 'react-bootstrap';

import { Property } from '../../../WebRx';
import { Loading } from '../Loading/Loading';
import { wxr } from '../../React';

export interface SplashProps extends React.HTMLAttributes<Splash> {
  header: any;
  logo?: string;
  text?: string;
  progress?: Property<number> | number;
  fluid?: boolean;
}

export class Splash extends React.Component<SplashProps> {
  public static displayName = 'Splash';

  static defaultProps = {
    fluid: false,
  };

  render() {
    const { className, props, rest } = this.restProps(x => {
      const { header, logo, text, progress, fluid } = x;
      return { header, logo, text, progress, fluid };
    });

    return (
      <div { ...rest } className={ wxr.classNames('Splash', className) }>
        <Grid fluid={ props.fluid }>
          <Row>
            <div className='Splash-header'>
              { this.renderLogo() }
              <span className='Splash-headerText'>{ props.header }</span>
            </div>

            <Loading progress={ props.progress } text={ props.text } fontSize='24pt' />
          </Row>
        </Grid>
      </div>
    );
  }

  private renderLogo() {
    return wxr.renderConditional(this.props.logo != null, () => (
      <Image className='Splash-logo' src={this.props.logo} rounded />
    ));
  }
}
