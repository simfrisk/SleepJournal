import { Link } from 'react-router-dom';
import './Landing.css';

export function Landing() {
  return (
    <div className="landing">
      <div className="landing-content">
        <div className="landing-hero">
          <h1 className="landing-title">
            Track Your Sleep,
            <span className="gradient-text"> Transform Your Life</span>
          </h1>
          <p className="landing-subtitle">
            Discover patterns, improve your rest, and wake up feeling refreshed every day.
            Your journey to better sleep starts here.
          </p>
          <div className="landing-cta">
            <Link to="/signup" className="cta-button primary">
              Get Started Free
            </Link>
            <Link to="/login" className="cta-button secondary">
              Sign In
            </Link>
          </div>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Smart Analytics</h3>
            <p>Visualize your sleep patterns and identify what affects your rest</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌙</div>
            <h3>Sleep Tracking</h3>
            <p>Log your sleep data effortlessly with our intuitive interface</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Personalized Insights</h3>
            <p>Get recommendations based on your unique sleep habits</p>
          </div>
        </div>
      </div>

      <div className="landing-footer">
        <p>© 2024 Sleep Diary - Your personal sleep companion</p>
      </div>
    </div>
  );
}
