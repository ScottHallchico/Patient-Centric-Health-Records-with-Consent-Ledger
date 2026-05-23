import { useEffect, useState } from "react";
import { Eye, RefreshCw, Send } from "lucide-react";
import { decryptData } from "../utils/encryption";
import { fetchFromIPFS } from "../utils/ipfs";

export default function DoctorDashboard({ account, contract, readContract }) {
  const [records, setRecords] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [role, setRole] = useState("Cardiologist");
  const [institution, setInstitution] = useState("GeneralHospital");
  const [purpose, setPurpose] = useState("treatment");
  const [priorCare, setPriorCare] = useState(true);
  const [decryptedText, setDecryptedText] = useState("");
  const [status, setStatus] = useState("");

  async function refresh() {
    const events = await readContract.queryFilter(readContract.filters.RecordAdded(), 0, "latest");
    const loadedRecords = await Promise.all(
      events.map(async (event) => {
        const recordId = Number(event.args.recordId);
        const record = await readContract.records(recordId);
        return {
          id: recordId,
          owner: event.args.owner,
          ipfsHash: record.ipfsHash,
          role: record.role,
          institution: record.institution,
          purpose: record.purpose
        };
      })
    );

    const loadedRequests = [];
    for (const record of loadedRecords) {
      const requestIds = await readContract.getRequestsForRecord(record.id);
      for (const requestId of requestIds) {
        const request = await readContract.accessRequests(requestId);
        if (request.requester.toLowerCase() === account.toLowerCase()) {
          loadedRequests.push({
            id: Number(requestId),
            recordId: Number(request.recordId),
            status: Number(request.status),
            keyMaterial: request.keyMaterial
          });
        }
      }
    }

    setRecords(loadedRecords);
    setRequests(loadedRequests);
  }

  useEffect(() => {
    refresh().catch((error) => setStatus(error.message));
  }, [account]);

  async function handleRequest(event) {
    event.preventDefault();
    setStatus("Submitting access request...");
    try {
      const recordId = Number(selectedRecordId || records[0]?.id);
      if (!recordId) {
        throw new Error("No record selected.");
      }

      const expectedRequestId = await contract.requestAccess.staticCall(recordId, role, institution, purpose, priorCare);
      const tx = await contract.requestAccess(recordId, role, institution, purpose, priorCare);
      await tx.wait();
      setStatus(`Request ${expectedRequestId} submitted.`);
      await refresh();
    } catch (error) {
      setStatus(error.shortMessage ?? error.message);
    }
  }

  async function handleDecrypt(request) {
    setStatus(`Decrypting record ${request.recordId}...`);
    setDecryptedText("");
    try {
      const record = await readContract.records(request.recordId);
      const encryptedPayload = await fetchFromIPFS(record.ipfsHash);
      const plaintext = await decryptData(encryptedPayload, request.keyMaterial);
      const tx = await contract.logAccess(request.recordId);
      await tx.wait();
      setDecryptedText(plaintext);
      setStatus(`Record ${request.recordId} decrypted locally and access logged.`);
    } catch (error) {
      setStatus(error.shortMessage ?? error.message);
    }
  }

  return (
    <section className="dashboard-grid">
      <form className="panel" onSubmit={handleRequest}>
        <div className="panel-heading">
          <h2>Request Access</h2>
          <button className="icon-button" type="submit" title="Request access">
            <Send size={18} />
          </button>
        </div>

        <label>
          Record
          <select value={selectedRecordId} onChange={(event) => setSelectedRecordId(event.target.value)}>
            <option value="">Select discovered record</option>
            {records.map((record) => (
              <option value={record.id} key={record.id}>
                Record {record.id} / {record.ipfsHash}
              </option>
            ))}
          </select>
        </label>

        <div className="two-column">
          <label>
            Role
            <input value={role} onChange={(event) => setRole(event.target.value)} />
          </label>
          <label>
            Institution
            <input value={institution} onChange={(event) => setInstitution(event.target.value)} />
          </label>
          <label>
            Purpose
            <select value={purpose} onChange={(event) => setPurpose(event.target.value)}>
              <option value="treatment">treatment</option>
              <option value="research">research</option>
              <option value="insurance">insurance</option>
              <option value="emergency">emergency</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={priorCare} onChange={(event) => setPriorCare(event.target.checked)} />
            Prior care relationship
          </label>
        </div>
      </form>

      <section className="panel">
        <div className="panel-heading">
          <h2>My Requests</h2>
          <button className="icon-button" onClick={refresh} title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>
        {requests.length === 0 && <p className="muted">No submitted requests yet.</p>}
        <div className="list">
          {requests.map((request) => (
            <article className="record-card" key={request.id}>
              <div>
                <strong>Request {request.id}</strong>
                <p>Record {request.recordId}</p>
              </div>
              {request.status === 2 ? (
                <button className="secondary-button" onClick={() => handleDecrypt(request)}>
                  <Eye size={16} />
                  Decrypt
                </button>
              ) : (
                <span className="pending-pill">Pending</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel full-width">
        <div className="panel-heading">
          <h2>Discovered Records</h2>
          <span className="count-pill">{records.length}</span>
        </div>
        <div className="list compact">
          {records.map((record) => (
            <article className="record-card" key={record.id}>
              <strong>Record {record.id}</strong>
              <span>{record.ipfsHash}</span>
              <span>{record.role} / {record.institution}</span>
            </article>
          ))}
        </div>
      </section>

      {decryptedText && (
        <section className="panel full-width">
          <div className="panel-heading">
            <h2>Decrypted View</h2>
          </div>
          <pre className="plaintext">{decryptedText}</pre>
        </section>
      )}

      {status && <section className="status-line full-width">{status}</section>}
    </section>
  );
}
