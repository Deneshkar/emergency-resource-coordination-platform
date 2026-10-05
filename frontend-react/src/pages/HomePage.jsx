import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { incidentService } from "../services/incidentService";
import "./HomePage.css";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeIncidents: 14,
    totalDispatches: 88,
    activeShelters: 12,
    volunteersOnline: 156,
  });

  const [quickIncident, setQuickIncident] = useState({
    title: "",
    category: "Medical Emergency",
    locationName: "",
    severity: "High",
    description: "",
  });
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    incidentService
      .getSummaryStats()
      .then((res) => {
        if (mounted && res) {
          setStats((prev) => ({
            ...prev,
            activeIncidents: res.activeIncidents ?? prev.activeIncidents,
            totalDispatches: res.totalDispatches ?? prev.totalDispatches,
          }));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickIncident.title || !quickIncident.description) return;
    setIsSubmittingQuick(true);

    const payload = {
      title: quickIncident.title,
      category: quickIncident.category,
      locationName: quickIncident.locationName || "Current User Location",
      severity: quickIncident.severity,
      description: quickIncident.description,
      status: "Reported",
    };

    incidentService
      .createIncident(payload)
      .then(() => {
        setQuickSuccess(true);
        setIsSubmittingQuick(false);
        setTimeout(() => {
          navigate("/incidents");
        }, 1500);
      })
      .catch(() => {
        setIsSubmittingQuick(false);
        // Fallback navigation to full report page
        navigate("/incidents/new");
      });
  };

  return (
    <div className="homepage-container">
      {/* TOP LANDING BAR */}
      <header className="homepage-navbar">
        <div className="navbar-brand">
          <span className="brand-logo-badge">🚨</span>
          <div className="brand-text">
            <span className="brand-title">ERCP PLATFORM</span>
            <span className="brand-sub">Emergency Resource & Dispatch System</span>
          </div>
        </div>

        <nav className="navbar-links">
          <Link to="/home" className="nav-item active">Home</Link>
          <Link to="/incidents" className="nav-item">Incidents</Link>
          <Link to="/dispatches" className="nav-item">Dispatches</Link>
          <Link to="/shelters" className="nav-item">Shelters</Link>
          <Link to="/inventory-hub" className="nav-item">Logistics</Link>
          <Link to="/situation-analysis" className="nav-item">Situation AI</Link>
        </nav>

        <div className="navbar-actions">
          {user ? (
            <Link to="/incidents" className="btn-nav-primary">
              ⚡ Go to Command Hub
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-nav-secondary">Login</Link>
              <Link to="/register" className="btn-nav-primary">Register Account</Link>
            </>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="homepage-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            <span>24/7 AI-POWERED EMERGENCY COORDINATION NETWORK</span>
          </div>

          <h1 className="hero-title">
            Rapid Disaster Response & <span className="gradient-text">Unified Resource Triage</span>
          </h1>

          <p className="hero-description">
            Connecting citizens, field volunteers, medical teams, and emergency coordinators in real time. Powered by AI automated dispatches, satellite situation analysis, and cross-platform mobile coordination.
          </p>

          <div className="hero-cta-group">
            <Link to="/incidents/new" className="btn-hero-danger">
              <span className="icon">🚨</span>
              <span>Report Emergency Incident</span>
            </Link>
            <Link to="/incidents" className="btn-hero-secondary">
              <span className="icon">📊</span>
              <span>Launch Operations Portal</span>
            </Link>
            <a href="#quick-report" className="btn-hero-outline">
              <span className="icon">⚡</span>
              <span>Instant SOS Triage</span>
            </a>
          </div>

          {/* Quick Metrics Strip */}
          <div className="hero-metrics-strip">
            <div className="metric-box">
              <span className="metric-val">{stats.activeIncidents}</span>
              <span className="metric-lbl">Active Incidents</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-val">{stats.totalDispatches}</span>
              <span className="metric-lbl">Dispatches Sent</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-val">{stats.activeShelters}</span>
              <span className="metric-lbl">Active Safe Shelters</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-val">{stats.volunteersOnline}+</span>
              <span className="metric-lbl">Responders On Duty</span>
            </div>
          </div>
        </div>

        {/* HERO GRAPHIC WITH GENERATED IMAGE */}
        <div className="hero-visual-card">
          <div className="image-frame">
            <img 
              src="/assets/images/hero_emergency.png" 
              alt="Emergency Operations Command Center" 
              className="hero-image" 
            />
            <div className="visual-overlay-badge top-right">
              <span className="badge-icon">🌐</span>
              <div>
                <strong>Global GPS Tracking</strong>
                <p>Live Satellite & Telemetry Active</p>
              </div>
            </div>

            <div className="visual-overlay-badge bottom-left">
              <span className="badge-icon">🤖</span>
              <div>
                <strong>AI Drone Triage</strong>
                <p>Auto-dispatching units en route</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS SECTION WITH GENERATED IMAGES */}
      <section className="homepage-features-section">
        <div className="section-header center">
          <span className="section-subtitle">INTEGRATED ECOSYSTEM</span>
          <h2 className="section-title">Core Operations & Resource Intelligence</h2>
          <p className="section-desc">
            Designed for high-stress disaster recovery, rapid medical dispatch, and real-time community supply distribution.
          </p>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card glass-card">
            <div className="card-image-wrapper">
              <img src="/assets/images/ai_dispatch.png" alt="AI Dispatch Drone Triage" className="feature-img" />
              <span className="card-tag tag-blue">AI Autonomous Engine</span>
            </div>
            <div className="card-body">
              <h3>Real-Time AI Dispatch & Telemetry</h3>
              <p>
                Calculates fastest emergency routes, matches incoming citizen distress calls with nearby responder teams, and automated drone surveillance.
              </p>
              <Link to="/dispatches" className="card-link">View Active Dispatches →</Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-card glass-card">
            <div className="card-image-wrapper">
              <img src="/assets/images/shelter_relief.png" alt="Disaster Relief Shelter Hub" className="feature-img" />
              <span className="card-tag tag-emerald">Shelter & Relief</span>
            </div>
            <div className="card-body">
              <h3>Community Shelters & Medical Hubs</h3>
              <p>
                Locate verified emergency shelters, check live bed capacity, medical supply reserves, and request immediate evacuation transport.
              </p>
              <Link to="/shelters" className="card-link">Locate Open Shelters →</Link>
            </div>
          </div>

          {/* Card 3 */}
          <div className="feature-card glass-card">
            <div className="card-image-wrapper placeholder-tech">
              <div className="tech-pattern">
                <span className="tech-icon">📦</span>
                <span className="tech-title">Smart Supply Logistics</span>
              </div>
              <span className="card-tag tag-amber">Inventory Control</span>
            </div>
            <div className="card-body">
              <h3>Resource & Inventory Management</h3>
              <p>
                Track medical kits, water distribution, emergency power generators, and heavy rescue vehicles with automated alert reordering.
              </p>
              <Link to="/inventory-hub" className="card-link">Manage Logistics Hub →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK EMERGENCY SOS REPORTING SECTION */}
      <section id="quick-report" className="homepage-sos-section">
        <div className="sos-container glass-card">
          <div className="sos-info">
            <span className="sos-badge">⚡ INSTANT EMERGENCY TRIAGE</span>
            <h2>Need Immediate Emergency Assistance?</h2>
            <p>
              Submit a high-priority incident alert directly from this terminal. Our AI Coordinator instantly alerts nearby emergency responders and routes medical dispatches.
            </p>
            <div className="sos-hotline-box">
              <span className="phone-icon">📞</span>
              <div>
                <strong>Direct Emergency Hotlines:</strong>
                <p>National Emergency: 911 / 112 • Ambulance: 1990</p>
              </div>
            </div>
          </div>

          <div className="sos-form-card">
            {quickSuccess ? (
              <div className="quick-success-message">
                <span className="success-icon">✅</span>
                <h3>Emergency Alert Broadcasted!</h3>
                <p>Coordinators and AI Dispatch units have received your incident report. Navigating to command dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleQuickSubmit} className="quick-form">
                <h3>Quick Emergency Report</h3>
                <div className="form-group">
                  <label>Incident Summary Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash Flood trapped citizens on Main St"
                    value={quickIncident.title}
                    onChange={(e) => setQuickIncident({ ...quickIncident, title: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={quickIncident.category}
                      onChange={(e) => setQuickIncident({ ...quickIncident, category: e.target.value })}
                    >
                      <option value="Medical Emergency">Medical Emergency</option>
                      <option value="Natural Disaster">Natural Disaster</option>
                      <option value="Fire Outbreak">Fire Outbreak</option>
                      <option value="Supply Shortage">Supply Shortage</option>
                      <option value="Infrastructure Damage">Infrastructure Damage</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Severity Level</label>
                    <select
                      value={quickIncident.severity}
                      onChange={(e) => setQuickIncident({ ...quickIncident, severity: e.target.value })}
                    >
                      <option value="Critical">Critical (Immediate Danger)</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Location / Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 4, North District Hospital Road"
                    value={quickIncident.locationName}
                    onChange={(e) => setQuickIncident({ ...quickIncident, locationName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Details & Needs *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide exact details of victims, access routes, or medical requirements..."
                    value={quickIncident.description}
                    onChange={(e) => setQuickIncident({ ...quickIncident, description: e.target.value })}
                  />
                </div>

                <button type="submit" disabled={isSubmittingQuick} className="btn-submit-sos">
                  {isSubmittingQuick ? "Transmitting Alert..." : "🚨 Broadcast Emergency Alert"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ROLE-BASED ECOSYSTEM PORTAL */}
      <section className="homepage-roles-section">
        <div className="section-header center">
          <span className="section-subtitle">MULTI-ROLE INTEGRATION</span>
          <h2 className="section-title">Built for Everyone in the Emergency Chain</h2>
        </div>

        <div className="roles-grid">
          <div className="role-card">
            <div className="role-icon-box citizen-bg">👤</div>
            <h3>Citizens & Victims</h3>
            <ul>
              <li>✓ Instant SOS location pinging</li>
              <li>✓ Find nearest open shelter & food</li>
              <li>✓ Real-time status updates on aid</li>
            </ul>
            <Link to="/citizen" className="role-btn">Citizen Portal →</Link>
          </div>

          <div className="role-card">
            <div className="role-icon-box volunteer-bg">🦺</div>
            <h3>Volunteers & Field Responders</h3>
            <ul>
              <li>✓ Receive task assignments</li>
              <li>✓ Mobile route navigation</li>
              <li>✓ Supply pickup confirmation</li>
            </ul>
            <Link to="/volunteers" className="role-btn">Responder Portal →</Link>
          </div>

          <div className="role-card">
            <div className="role-icon-box coordinator-bg">🛡️</div>
            <h3>Coordinators & Admins</h3>
            <ul>
              <li>✓ Unified Command Dashboard</li>
              <li>✓ AI Dispatch allocation control</li>
              <li>✓ Resource inventory analytics</li>
            </ul>
            <Link to="/incidents" className="role-btn">Command Hub →</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="homepage-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">🚨 ERCP PLATFORM</div>
            <p>Unified Full-Stack & Agentic AI Emergency Resource Coordination Platform.</p>
            <div className="footer-badge">Status: All Core Services Operational 🟢</div>
          </div>

          <div className="footer-links">
            <h4>Quick Navigation</h4>
            <ul>
              <li><Link to="/incidents">Incident Dashboard</Link></li>
              <li><Link to="/dispatches">Dispatch Logistics</Link></li>
              <li><Link to="/shelters">Shelter Map</Link></li>
              <li><Link to="/inventory-hub">Resource Inventory</Link></li>
              <li><Link to="/situation-analysis">AI Situation Analysis</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Platform Access</h4>
            <ul>
              <li><Link to="/login">User Login</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li><Link to="/forgot-password">Reset Password</Link></li>
              <li><Link to="/settings">System Settings</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Emergency Contact</h4>
            <p><strong>Hotline:</strong> 911 / 112 / 1990</p>
            <p><strong>Control Room:</strong> ops@ercp-platform.org</p>
            <p><strong>Tech Specs:</strong> React Vite • Flutter Mobile • Express Backend</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Emergency Resource Coordination Platform (ERCP). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
