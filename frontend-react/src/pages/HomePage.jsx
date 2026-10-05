import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { incidentService } from "../services/incidentService";
import "./HomePage.css";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        navigate("/incidents/new");
      });
  };

  return (
    <div className="homepage-light-container">
      {/* TOP STANDALONE NAVBAR */}
      <header className="homepage-navbar-light">
        <div className="navbar-brand-light">
          <span className="brand-logo-icon">🚨</span>
          <div>
            <span className="brand-title-light">ERCP PLATFORM</span>
            <span className="brand-sub-light">Emergency Resource & Dispatch System</span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="navbar-links-light desktop-only">
          <Link to="/home" className="nav-item-light active">Home</Link>
          <Link to="/incidents" className="nav-item-light">Incidents</Link>
          <Link to="/dispatches" className="nav-item-light">Dispatches</Link>
          <Link to="/shelters" className="nav-item-light">Shelters</Link>
          <Link to="/inventory-hub" className="nav-item-light">Logistics</Link>
          <Link to="/situation-analysis" className="nav-item-light">Situation AI</Link>
        </nav>

        {/* Desktop Actions */}
        <div className="navbar-actions-light desktop-only">
          {user ? (
            <Link to="/incidents" className="btn-light-primary">
              ⚡ Open Command Portal
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-light-secondary">Login</Link>
              <Link to="/register" className="btn-light-primary">Register Account</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-menu">
          <nav className="mobile-drawer-links">
            <Link to="/home" onClick={() => setMobileMenuOpen(false)}>🏠 Home</Link>
            <Link to="/incidents" onClick={() => setMobileMenuOpen(false)}>⚠️ Incidents</Link>
            <Link to="/dispatches" onClick={() => setMobileMenuOpen(false)}>🚛 Dispatches</Link>
            <Link to="/shelters" onClick={() => setMobileMenuOpen(false)}>🏠 Shelters</Link>
            <Link to="/inventory-hub" onClick={() => setMobileMenuOpen(false)}>📦 Logistics</Link>
            <Link to="/situation-analysis" onClick={() => setMobileMenuOpen(false)}>🤖 Situation AI</Link>
          </nav>
          <div className="mobile-drawer-actions">
            {user ? (
              <Link to="/incidents" className="btn-light-primary w-full" onClick={() => setMobileMenuOpen(false)}>
                ⚡ Open Command Portal
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-light-secondary w-full" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link to="/register" className="btn-light-primary w-full" onClick={() => setMobileMenuOpen(false)}>Register Account</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="homepage-hero-light">
        <div className="hero-content-light">
          <div className="hero-badge-light">
            <span className="pulse-dot-red"></span>
            <span>24/7 AI EMERGENCY RESPONSE NETWORK</span>
          </div>

          <h1 className="hero-title-light">
            Rapid Disaster Response & <span className="gradient-text-light">Unified Resource Triage</span>
          </h1>

          <p className="hero-desc-light">
            Connecting citizens, field volunteers, medical teams, and emergency coordinators in real time. Powered by AI automated dispatches, satellite situation analysis, and cross-platform mobile coordination.
          </p>

          <div className="hero-cta-group-light">
            <Link to="/incidents/new" className="btn-hero-red">
              <span className="icon">🚨</span>
              <span>Report Emergency Incident</span>
            </Link>
            <Link to="/incidents" className="btn-hero-blue">
              <span className="icon">📊</span>
              <span>Launch Operations Portal</span>
            </Link>
            <a href="#quick-report" className="btn-hero-slate">
              <span className="icon">⚡</span>
              <span>Instant SOS Triage</span>
            </a>
          </div>

          {/* Metrics Strip */}
          <div className="hero-metrics-strip-light">
            <div className="metric-box-light">
              <span className="metric-val-light red">{stats.activeIncidents}</span>
              <span className="metric-lbl-light">Active Incidents</span>
            </div>
            <div className="metric-divider-light"></div>
            <div className="metric-box-light">
              <span className="metric-val-light blue">{stats.totalDispatches}</span>
              <span className="metric-lbl-light">Dispatches Sent</span>
            </div>
            <div className="metric-divider-light"></div>
            <div className="metric-box-light">
              <span className="metric-val-light green">{stats.activeShelters}</span>
              <span className="metric-lbl-light">Active Safe Shelters</span>
            </div>
            <div className="metric-divider-light"></div>
            <div className="metric-box-light">
              <span className="metric-val-light purple">{stats.volunteersOnline}+</span>
              <span className="metric-lbl-light">Responders On Duty</span>
            </div>
          </div>
        </div>

        {/* HERO IMAGE FRAME */}
        <div className="hero-visual-card-light">
          <div className="image-frame-light">
            <img 
              src="/assets/images/hero_emergency.png" 
              alt="Emergency Operations Command Center" 
              className="hero-image-light" 
            />
            <div className="visual-badge-light top-right">
              <span className="badge-icon">🌐</span>
              <div>
                <strong>Global GPS Tracking</strong>
                <p>Live Satellite Telemetry</p>
              </div>
            </div>

            <div className="visual-badge-light bottom-left">
              <span className="badge-icon">🤖</span>
              <div>
                <strong>AI Drone Triage</strong>
                <p>Auto-dispatching en route</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS SECTION */}
      <section className="homepage-features-light">
        <div className="section-header-light center">
          <span className="section-subtitle-light">INTEGRATED ECOSYSTEM</span>
          <h2 className="section-title-light">Core Operations & Resource Intelligence</h2>
          <p className="section-desc-light">
            Designed for high-stress disaster recovery, rapid medical dispatch, and real-time community supply distribution.
          </p>
        </div>

        <div className="features-grid-light">
          {/* Card 1 */}
          <div className="feature-card-light">
            <div className="card-image-wrapper-light">
              <img src="/assets/images/ai_dispatch.png" alt="AI Autonomous Dispatch" className="feature-img-light" />
              <span className="card-tag-light tag-blue">AI Autonomous Engine</span>
            </div>
            <div className="card-body-light">
              <h3>Real-Time AI Dispatch & Telemetry</h3>
              <p>
                Calculates fastest emergency routes, matches incoming citizen distress calls with nearby responder teams, and automated drone surveillance.
              </p>
              <Link to="/dispatches" className="card-link-light">View Active Dispatches →</Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-card-light">
            <div className="card-image-wrapper-light">
              <img src="/assets/images/shelter_relief.png" alt="Disaster Relief Shelters" className="feature-img-light" />
              <span className="card-tag-light tag-emerald">Shelter & Relief</span>
            </div>
            <div className="card-body-light">
              <h3>Community Shelters & Medical Hubs</h3>
              <p>
                Locate verified emergency shelters, check live bed capacity, medical supply reserves, and request immediate evacuation transport.
              </p>
              <Link to="/shelters" className="card-link-light">Locate Open Shelters →</Link>
            </div>
          </div>

          {/* Card 3 */}
          <div className="feature-card-light">
            <div className="card-image-wrapper-light placeholder-tech-light">
              <div className="tech-pattern-light">
                <span className="tech-icon-light">📦</span>
                <span className="tech-title-light">Smart Supply Logistics</span>
              </div>
              <span className="card-tag-light tag-amber">Inventory Control</span>
            </div>
            <div className="card-body-light">
              <h3>Resource & Inventory Management</h3>
              <p>
                Track medical kits, water distribution, emergency power generators, and heavy rescue vehicles with automated alert reordering.
              </p>
              <Link to="/inventory-hub" className="card-link-light">Manage Logistics Hub →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK EMERGENCY SOS REPORTING SECTION */}
      <section id="quick-report" className="homepage-sos-light">
        <div className="sos-container-light">
          <div className="sos-info-light">
            <span className="sos-badge-light">⚡ INSTANT EMERGENCY TRIAGE</span>
            <h2>Need Immediate Emergency Assistance?</h2>
            <p>
              Submit a high-priority incident alert directly from this terminal. Our AI Coordinator instantly alerts nearby emergency responders and routes medical dispatches.
            </p>
            <div className="sos-hotline-box-light">
              <span className="phone-icon-light">📞</span>
              <div>
                <strong>Direct Emergency Hotlines:</strong>
                <p>National Emergency: 911 / 112 • Ambulance: 1990</p>
              </div>
            </div>
          </div>

          <div className="sos-form-card-light">
            {quickSuccess ? (
              <div className="quick-success-light">
                <span className="success-icon-light">✅</span>
                <h3>Emergency Alert Broadcasted!</h3>
                <p>Coordinators and AI Dispatch units have received your incident report. Navigating to command dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleQuickSubmit} className="quick-form-light">
                <h3>Quick Emergency Report</h3>
                <div className="form-group-light">
                  <label>Incident Summary Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash Flood trapped citizens on Main St"
                    value={quickIncident.title}
                    onChange={(e) => setQuickIncident({ ...quickIncident, title: e.target.value })}
                  />
                </div>

                <div className="form-row-light">
                  <div className="form-group-light">
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

                  <div className="form-group-light">
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

                <div className="form-group-light">
                  <label>Location / Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 4, North District Hospital Road"
                    value={quickIncident.locationName}
                    onChange={(e) => setQuickIncident({ ...quickIncident, locationName: e.target.value })}
                  />
                </div>

                <div className="form-group-light">
                  <label>Details & Needs *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide exact details of victims, access routes, or medical requirements..."
                    value={quickIncident.description}
                    onChange={(e) => setQuickIncident({ ...quickIncident, description: e.target.value })}
                  />
                </div>

                <button type="submit" disabled={isSubmittingQuick} className="btn-submit-sos-light">
                  {isSubmittingQuick ? "Transmitting Alert..." : "🚨 Broadcast Emergency Alert"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* MULTI-ROLE ECOSYSTEM PORTAL */}
      <section className="homepage-roles-light">
        <div className="section-header-light center">
          <span className="section-subtitle-light">MULTI-ROLE INTEGRATION</span>
          <h2 className="section-title-light">Built for Everyone in the Emergency Chain</h2>
        </div>

        <div className="roles-grid-light">
          <div className="role-card-light">
            <div className="role-icon-light citizen">👤</div>
            <h3>Citizens & Victims</h3>
            <ul>
              <li>✓ Instant SOS location pinging</li>
              <li>✓ Find nearest open shelter & food</li>
              <li>✓ Real-time status updates on aid</li>
            </ul>
            <Link to="/citizen" className="role-btn-light">Citizen Portal →</Link>
          </div>

          <div className="role-card-light">
            <div className="role-icon-light volunteer">🦺</div>
            <h3>Volunteers & Field Responders</h3>
            <ul>
              <li>✓ Receive task assignments</li>
              <li>✓ Mobile route navigation</li>
              <li>✓ Supply pickup confirmation</li>
            </ul>
            <Link to="/volunteers" className="role-btn-light">Responder Portal →</Link>
          </div>

          <div className="role-card-light">
            <div className="role-icon-light coordinator">🛡️</div>
            <h3>Coordinators & Admins</h3>
            <ul>
              <li>✓ Unified Command Dashboard</li>
              <li>✓ AI Dispatch allocation control</li>
              <li>✓ Resource inventory analytics</li>
            </ul>
            <Link to="/incidents" className="role-btn-light">Command Hub →</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="homepage-footer-light">
        <div className="footer-content-light">
          <div className="footer-brand-light">
            <div className="footer-logo-light">🚨 ERCP PLATFORM</div>
            <p>Unified Full-Stack & Agentic AI Emergency Resource Coordination Platform.</p>
            <div className="footer-status-badge">Status: All Core Services Operational 🟢</div>
          </div>

          <div className="footer-links-light">
            <h4>Quick Navigation</h4>
            <ul>
              <li><Link to="/incidents">Incident Dashboard</Link></li>
              <li><Link to="/dispatches">Dispatch Logistics</Link></li>
              <li><Link to="/shelters">Shelter Map</Link></li>
              <li><Link to="/inventory-hub">Resource Inventory</Link></li>
              <li><Link to="/situation-analysis">AI Situation Analysis</Link></li>
            </ul>
          </div>

          <div className="footer-links-light">
            <h4>Platform Access</h4>
            <ul>
              <li><Link to="/login">User Login</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li><Link to="/forgot-password">Reset Password</Link></li>
              <li><Link to="/settings">System Settings</Link></li>
            </ul>
          </div>

          <div className="footer-contact-light">
            <h4>Emergency Contact</h4>
            <p><strong>Hotline:</strong> 911 / 112 / 1990</p>
            <p><strong>Control Room:</strong> ops@ercp-platform.org</p>
            <p><strong>Tech Specs:</strong> React Vite • Flutter Mobile • Express Backend</p>
          </div>
        </div>

        <div className="footer-bottom-light">
          <p>© 2026 Emergency Resource Coordination Platform (ERCP). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
