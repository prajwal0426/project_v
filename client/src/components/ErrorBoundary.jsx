import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('VERTEX render failure', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app">
          <section className="auth-page">
            <div className="auth-card glass">
              <h1>VERTEX</h1>
              <h2>Something went wrong</h2>
              <p>The app recovered from a rendering error. Refresh the page or sign in again.</p>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
