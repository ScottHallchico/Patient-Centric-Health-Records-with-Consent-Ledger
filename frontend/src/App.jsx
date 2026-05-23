import { useMemo, useState } from "react";
import { Activity, Database, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { connectWallet, DEFAULT_CONTRACT_ADDRESS, LOCAL_CHAIN_ID } from "./contract";
import PatientDashboard from "./components/PatientDashboard";
import DoctorDashboard from "./components/DoctorDashboard";

export default function App() {
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [wallet, setWallet] = useState(null);
  const [role, setRole] = useState("patient");
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
    <main className="app-shell">
      <section className="topbar">
        <div className="brand-block">
          <div className="brand-mark">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1>Patient-Centric Health Records</h1>
            <p>Consent ledger demo with encrypted local records and contextual request review.</p>
          </div>
        </div>

        <div className="wallet-panel">
          <label>
            Contract
            <input
              value={contractAddress}
              onChange={(event) => setContractAddress(event.target.value)}
              placeholder="Deploy locally, then paste address"
            />
          </label>
          <button className="primary-button" onClick={handleConnect}>
            <Activity size={18} />
            {wallet ? "Reconnect" : "Connect"}
          </button>
        </div>
      </section>

      <section className="demo-warning">
        <Database size={18} />
        Raw AES key material is written on-chain after approval for this Phase 1 demo only.
      </section>

      {status && <section className="status-line">{status}</section>}

      <section className="role-tabs" aria-label="Role">
        <button className={role === "patient" ? "active" : ""} onClick={() => setRole("patient")}>
          <UserRound size={18} />
          Patient
        </button>
        <button className={role === "doctor" ? "active" : ""} onClick={() => setRole("doctor")}>
          <Stethoscope size={18} />
          Doctor
        </button>
      </section>

      {!ready && (
        <section className="empty-state">
          Run a local Hardhat node, deploy `ConsentLedger`, paste the generated address, then connect a wallet.
        </section>
      )}

      {ready && role === "patient" && (
        <PatientDashboard account={wallet.account} contract={wallet.contract} readContract={wallet.readContract} />
      )}
      {ready && role === "doctor" && (
        <DoctorDashboard account={wallet.account} contract={wallet.contract} readContract={wallet.readContract} />
      )}
    </main>
  );
}
