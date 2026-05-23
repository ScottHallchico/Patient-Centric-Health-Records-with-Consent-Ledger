import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, Upload } from "lucide-react";
import { ZeroAddress } from "ethers";
import { compilePolicy, evaluateRequest } from "../utils/ccg";
import { encryptData, generateKey } from "../utils/encryption";
import { uploadToIPFS } from "../utils/ipfs";

const attributes = ["cardiac_imaging", "ecg_data", "psychiatric_notes", "genetic_data"];

function keyStoreName(account) {
  return `phr-demo-keys:${account.toLowerCase()}`;
}

function loadKeys(account) {
  try {
    return JSON.parse(localStorage.getItem(keyStoreName(account)) ?? "{}");
  } catch {
    return {};
  }
}

function saveKey(account, recordId, keyMaterial) {
  const keys = loadKeys(account);
  keys[String(recordId)] = keyMaterial;
  localStorage.setItem(keyStoreName(account), JSON.stringify(keys));
}

export default function PatientDashboard({ account, contract, readContract }) {
  const [recordText, setRecordText] = useState("Cardiac MRI shows stable post-procedure recovery.");
  const [selectedAttributes, setSelectedAttributes] = useState(["cardiac_imaging"]);
  const [consumer, setConsumer] = useState(ZeroAddress);
  const [role, setRole] = useState("Cardiologist");
  const [institution, setInstitution] = useState("GeneralHospital");
  const [purpose, setPurpose] = useState("treatment");
  const [relationship, setRelationship] = useState("prior_care");
  const [windowStart, setWindowStart] = useState(() => new Date(Date.now() - 60_000).toISOString().slice(0, 16));
  const [windowEnd, setWindowEnd] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString().slice(0, 16));
  const [records, setRecords] = useState([]);
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("");

  const standingPolicy = useMemo(
    () => ({
      autoApproveIf: { purpose: "treatment", relationship: "any" },
      alwaysRequireManual: ["psychiatric_notes", "genetic_data"]
    }),
    []
  );

  async function refresh() {
    const ids = await readContract.getRecordsByOwner(account);
    const loadedRecords = await Promise.all(
      ids.map(async (id) => {
        const record = await readContract.records(id);
        return {
          id: Number(id),
          ipfsHash: record.ipfsHash,
          role: record.role,
          institution: record.institution,
          purpose: record.purpose,
          priorCare: record.priorCare,
          windowStart: Number(record.windowStart),
          windowEnd: Number(record.windowEnd)
        };
      })
    );

    const loadedRequests = [];
    for (const record of loadedRecords) {
      const requestIds = await readContract.getRequestsForRecord(record.id);
      for (const requestId of requestIds) {
        const request = await readContract.accessRequests(requestId);
        loadedRequests.push({
          id: Number(requestId),
          recordId: Number(request.recordId),
          requester: request.requester,
          role: request.role,
          institution: request.institution,
          purpose: request.purpose,
          priorCare: request.priorCare,
          status: Number(request.status),
          keyMaterial: request.keyMaterial,
          attributes: selectedAttributes
        });
      }
    }

    setRecords(loadedRecords);
    setRequests(loadedRequests);
  }

  useEffect(() => {
    refresh().catch((error) => setStatus(error.message));
  }, [account]);

  function toggleAttribute(attribute) {
    setSelectedAttributes((current) =>
      current.includes(attribute) ? current.filter((item) => item !== attribute) : [...current, attribute]
    );
  }

  async function handleUpload(event) {
    event.preventDefault();
    setStatus("Encrypting and uploading record...");

    try {
      const keyMaterial = await generateKey();
      const encrypted = await encryptData(recordText, keyMaterial);
      const cid = await uploadToIPFS(encrypted);
      const policy = compilePolicy({
        cid,
        consumer: { did: consumer || ZeroAddress, role, institution },
        attributes: selectedAttributes,
        purpose,
        relationship,
        window: { start: windowStart, end: windowEnd },
        notification: "immediate"
      });

      const tx = await contract.addRecord(
        policy.ipfsHash,
        policy.consumer,
        policy.role,
        policy.institution,
        policy.purpose,
        policy.priorCare,
        policy.windowStart,
        policy.windowEnd,
        policy.notifyOnAccess
      );
      const receipt = await tx.wait();
      const eventLog = receipt.logs
        .map((log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((log) => log?.name === "RecordAdded");
      const recordId = Number(eventLog.args.recordId);
      saveKey(account, recordId, keyMaterial);

      setStatus(`Record ${recordId} added. Demo AES key saved locally for grant flow.`);
      await refresh();
    } catch (error) {
      setStatus(error.shortMessage ?? error.message);
    }
  }

  async function handleGrant(request) {
    setStatus(`Granting request ${request.id}...`);
    try {
      const keys = loadKeys(account);
      const keyMaterial = keys[String(request.recordId)];
      if (!keyMaterial) {
        throw new Error(`No local demo AES key found for record ${request.recordId}.`);
      }
      const tx = await contract.grantAccess(request.id, keyMaterial);
      await tx.wait();
      setStatus(`Request ${request.id} granted with demo key material.`);
      await refresh();
    } catch (error) {
      setStatus(error.shortMessage ?? error.message);
    }
  }

  return (
    <section className="dashboard-grid">
      <form className="panel" onSubmit={handleUpload}>
        <div className="panel-heading">
          <h2>Upload Record</h2>
          <button className="icon-button" type="submit" title="Encrypt and upload">
            <Upload size={18} />
          </button>
        </div>

        <label>
          Medical text
          <textarea value={recordText} onChange={(event) => setRecordText(event.target.value)} rows={6} />
        </label>

        <div className="field-group">
          <span>Attributes</span>
          <div className="chips">
            {attributes.map((attribute) => (
              <button
                key={attribute}
                className={selectedAttributes.includes(attribute) ? "chip selected" : "chip"}
                type="button"
                onClick={() => toggleAttribute(attribute)}
              >
                {attribute}
              </button>
            ))}
          </div>
        </div>

        <div className="two-column">
          <label>
            Consumer address
            <input value={consumer} onChange={(event) => setConsumer(event.target.value)} />
          </label>
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
          <label>
            Relationship
            <select value={relationship} onChange={(event) => setRelationship(event.target.value)}>
              <option value="prior_care">prior_care</option>
              <option value="new_requestor">new_requestor</option>
            </select>
          </label>
          <label>
            Start
            <input type="datetime-local" value={windowStart} onChange={(event) => setWindowStart(event.target.value)} />
          </label>
          <label>
            End
            <input type="datetime-local" value={windowEnd} onChange={(event) => setWindowEnd(event.target.value)} />
          </label>
        </div>
      </form>

      <section className="panel">
        <div className="panel-heading">
          <h2>Requests</h2>
          <button className="icon-button" onClick={refresh} title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        {requests.length === 0 && <p className="muted">No access requests yet.</p>}
        <div className="list">
          {requests.map((request) => {
            const evaluation = evaluateRequest(request, standingPolicy);
            return (
              <article className="record-card" key={request.id}>
                <div>
                  <strong>Request {request.id}</strong>
                  <p>Record {request.recordId} requested by {request.requester}</p>
                  <p>{request.role} at {request.institution} for {request.purpose}</p>
                </div>
                {evaluation.requiresManualReview && <span className="warning-pill">{evaluation.reasons[0]}</span>}
                {request.status === 2 ? (
                  <span className="success-pill">Granted</span>
                ) : (
                  <button className="secondary-button" onClick={() => handleGrant(request)}>
                    <Check size={16} />
                    Grant
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel full-width">
        <div className="panel-heading">
          <h2>My Records</h2>
          <span className="count-pill">{records.length}</span>
        </div>
        <div className="list compact">
          {records.map((record) => (
            <article className="record-card" key={record.id}>
              <strong>Record {record.id}</strong>
              <span>{record.ipfsHash}</span>
              <span>{record.role} / {record.purpose}</span>
            </article>
          ))}
        </div>
      </section>

      {status && <section className="status-line full-width">{status}</section>}
    </section>
  );
}
