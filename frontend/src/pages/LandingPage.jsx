import { Link } from "react-router-dom";
import {
  ShieldCheck, Lock, FileText, Blocks, UserRound, Stethoscope,
  Check, ArrowRight, Fingerprint, Eye
} from "lucide-react";

const features = [
  { icon: Lock, title: "End-to-End Encryption", desc: "Records are AES-encrypted client-side before upload. Only authorized parties with granted key material can decrypt." },
  { icon: Blocks, title: "Blockchain Consent Ledger", desc: "Every access request and approval is immutably recorded on-chain, creating a tamper-proof audit trail." },
  { icon: FileText, title: "IPFS Storage", desc: "Encrypted data is pinned on IPFS for decentralized, censorship-resistant storage with content-addressed integrity." },
  { icon: Fingerprint, title: "Contextual Consent Grammar", desc: "Define fine-grained policies based on role, institution, purpose, relationship, and time windows." },
  { icon: Eye, title: "Access Transparency", desc: "Patients see every request in real-time and can evaluate each against their standing consent policy." },
  { icon: ShieldCheck, title: "Patient Sovereignty", desc: "Patients own their data. No intermediary can access records without explicit, on-chain consent." },
];

const stats = [
  { number: "256-bit", label: "AES Encryption" },
  { number: "100%", label: "Patient Owned" },
  { number: "On-Chain", label: "Consent Ledger" },
  { number: "Zero", label: "Intermediaries" },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <Link to="/" className="logo">
          <div className="logo-icon"><ShieldCheck size={22} /></div>
          <span>HealthChain</span>
        </Link>
        <div className="landing-nav-links">
          <Link to="/patient">Patient Portal</Link>
          <Link to="/doctor">Doctor Portal</Link>
          <Link to="/patient" className="cta">Launch App <ArrowRight size={16} /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Blockchain-Secured Health Records
          </div>
          <h1>
            Your Health Data,<br />
            <span className="gradient-text">Your Control.</span>
          </h1>
          <p>
            A patient-centric platform where medical records are encrypted, stored on IPFS,
            and governed by smart-contract consent — giving you full ownership of your health data.
          </p>
          <div className="hero-actions">
            <Link to="/patient" className="btn-primary">
              <UserRound size={18} /> Patient Portal <ArrowRight size={16} />
            </Link>
            <Link to="/doctor" className="btn-secondary">
              <Stethoscope size={18} /> Doctor Portal
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/hero.png" alt="Blockchain health data security illustration" />
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-number">{s.number}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <h2>Built for Privacy & Trust</h2>
          <p>Every layer of the stack is designed to keep patients in control of their sensitive health information.</p>
        </div>
        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon"><f.icon size={22} /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Cards */}
      <section className="roles-section">
        <div className="section-header">
          <h2>Choose Your Portal</h2>
          <p>Access the platform as a patient managing your records, or as a doctor requesting access.</p>
        </div>
        <div className="roles-grid">
          <Link to="/patient" className="role-card">
            <div className="role-card-icon"><UserRound size={26} /></div>
            <h3>Patient Portal</h3>
            <p>Upload encrypted health records, define consent policies, and review access requests from healthcare providers.</p>
            <ul>
              <li><Check size={16} /> Upload & encrypt medical records</li>
              <li><Check size={16} /> Define contextual consent rules</li>
              <li><Check size={16} /> Review & grant access requests</li>
              <li><Check size={16} /> Full audit trail visibility</li>
            </ul>
            <span className="btn-primary" style={{ width: "fit-content", marginTop: 8 }}>
              Open Patient Portal <ArrowRight size={16} />
            </span>
          </Link>
          <Link to="/doctor" className="role-card">
            <div className="role-card-icon"><Stethoscope size={26} /></div>
            <h3>Doctor Portal</h3>
            <p>Discover patient records, submit access requests with your credentials, and decrypt approved records securely.</p>
            <ul>
              <li><Check size={16} /> Browse available patient records</li>
              <li><Check size={16} /> Submit credentialed access requests</li>
              <li><Check size={16} /> Decrypt granted records locally</li>
              <li><Check size={16} /> On-chain access logging</li>
            </ul>
            <span className="btn-primary" style={{ width: "fit-content", marginTop: 8 }}>
              Open Doctor Portal <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>HealthChain — Patient-Centric Health Records with Consent Ledger &middot; Phase 1 Demo</p>
      </footer>
    </div>
  );
}
