import React from 'react';
import { html } from '../utils/html.js';
import { StatusPage } from './StatusPage.js';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return html`<${StatusPage} type="source-error" />`;
    }

    return this.props.children;
  }
}
