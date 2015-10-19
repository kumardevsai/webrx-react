'use strict';

import * as React from 'react';
import * as wx from 'webrx';
import * as classnames from 'classnames';

import { TestViewModel } from './TestViewModel';
import { BaseView, IBaseViewProps } from '../React/BaseView';
import TextBox from '../React/TextBox';

import './TestView.less';

interface ITestViewProps extends IBaseViewProps {
}

export class TestView extends BaseView<ITestViewProps, TestViewModel> {
  protected getUpdateProperties() {
    return [
      this.state.displayName
    ];
  }

  render() {
    classnames('asdf');
    let displayClass = classnames(
      'Name',
      'DisplayName', {
        'DisplayName--Empty': this.state.displayName() === ' '
      });
    return (
      <div className='Test'>
        <div className='Name'><TextBox binding={this.state.firstName} /></div>
        <div className='Name'><TextBox binding={this.state.lastName} /></div>
        <div className={displayClass}>Display Name: {this.state.displayName()}</div>
      </div>
    );
  }
}

export default TestView;