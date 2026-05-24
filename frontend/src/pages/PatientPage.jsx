import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Database, ShieldCheck, UserRound } from "lucide-react";
import { connectWallet, DEFAULT_CONTRACT_ADDRESS, LOCAL_CHAIN_ID } from "../contract";
import PatientDashboard from "../components/PatientDashboard";

export default function PatientPage() {
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [wallet, setWallet] = useState(null);
  const [status, setStatus] = useState("");

  const ready = useMemo(() => Boolean(wallet?.contract && contractAddress), [wallet, contractAddress]);

  async function handleConnect() {
    setStatus("");
    try {
      if (!contractAddress) {
        throw new Error("Deploy the contract or paste its address first.");
      }
      const connected = await connectWallet(contractAddress);
      setWallet(connected);
      if (connected.chainId !== LOCAL_CHAIN_ID) {
        setStatus(`Connected to chain ${connected.chainId}. Local demo expects ${LOCAL_CHAIN_ID}.`);
      }
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <Link to="/" className="logo">
          <div className="logo-icon"><ShieldCheck size={20} /></div>
          <span>HealthChain</span>
        </Link>
        <div className="dashboard-topbar-right">
          <Link to="/doctor" className="btn-secondary" style={{ padding: "0 16px", minHeight: 38, fontSize: 13 }}>
            Switch to Doctor
          </Link>
        </div>
      </header>

      <section className="dashboard-shell">
        <div className="page-title-bar">
          <h1>Patient Dashboard</h1>
          <div className="role-badge"><UserRound size={16} /> Patient Portal</div>
        </div>

        <div className="wallet-bar">
          <label>
            Contract Address
            <input
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Deploy locally, then paste address"
            />
          </label>
          <button className="primary-button" onClick={handleConnect} style={{ minWidth: 140 }}>
            <Activity size={18} />
            {wallet ? "Reconnect" : "Connect Wallet"}
          </button>
        </div>

        <section className="demo-warning">
          <Database size={18} />
          Raw AES key material is written on-chain after approval for this Phase 1 demo only.
        </section>

        {status && <section className="status-line">{status}</section>}

        {!ready && (
          <section className="empty-state">
            Run a local Hardhat node, deploy <code>ConsentLedger</code>, paste the generated address, then connect a wallet.
          </section>
        )}

        {ready && (
          <PatientDashboard account={wallet.account} contract={wallet.contract} readContract={wallet.readContract} />
        )}
      </section>
    </div>
  );
}
