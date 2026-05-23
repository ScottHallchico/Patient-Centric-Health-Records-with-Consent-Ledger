const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ConsentLedger", function () {
  async function deployLedger() {
    const [patient, doctor, other] = await ethers.getSigners();
    const ConsentLedger = await ethers.getContractFactory("ConsentLedger");
    const ledger = await ConsentLedger.deploy();
    const now = await time.latest();
    return { ledger, patient, doctor, other, now };
  }

  async function addDefaultRecord(ledger, patient, doctor, now) {
    const tx = await ledger.connect(patient).addRecord(
      "cid-demo-1",
      doctor.address,
      "Cardiologist",
      "GeneralHospital",
      "treatment",
      true,
      now - 60,
      now + 3600,
      true
    );
    await tx.wait();
    return 1;
  }

  it("adds a patient record and lists it by owner", async function () {
    const { ledger, patient, doctor, now } = await deployLedger();

    await expect(
      ledger.connect(patient).addRecord(
        "cid-demo-1",
        doctor.address,
        "Cardiologist",
        "GeneralHospital",
        "treatment",
        true,
        now - 60,
        now + 3600,
        true
      )
    )
      .to.emit(ledger, "RecordAdded")
      .withArgs(1, patient.address, "cid-demo-1");

    expect(await ledger.getRecordsByOwner(patient.address)).to.deep.equal([1n]);
    const record = await ledger.records(1);
    expect(record.ipfsHash).to.equal("cid-demo-1");
    expect(record.owner).to.equal(patient.address);
  });

  it("returns a request id and emits AccessRequested", async function () {
    const { ledger, patient, doctor, now } = await deployLedger();
    await addDefaultRecord(ledger, patient, doctor, now);

    expect(
      await ledger.connect(doctor).requestAccess.staticCall(
        1,
        "Cardiologist",
        "GeneralHospital",
        "treatment",
        true
      )
    ).to.equal(1n);

    await expect(
      ledger.connect(doctor).requestAccess(
        1,
        "Cardiologist",
        "GeneralHospital",
        "treatment",
        true
      )
    )
      .to.emit(ledger, "AccessRequested")
      .withArgs(1, 1, doctor.address, "Cardiologist", "GeneralHospital", "treatment", true);
  });

  it("rejects access requests outside the consent window", async function () {
    const { ledger, patient, doctor, now } = await deployLedger();

    await ledger.connect(patient).addRecord(
      "cid-expired",
      doctor.address,
      "Cardiologist",
      "GeneralHospital",
      "treatment",
      true,
      now - 3600,
      now - 60,
      true
    );

    await expect(
      ledger.connect(doctor).requestAccess(
        1,
        "Cardiologist",
        "GeneralHospital",
        "treatment",
        true
      )
    ).to.be.revertedWithCustomError(ledger, "ConsentWindowClosed");
  });

  it("flags treatment requests without prior care as contextual anomalies", async function () {
    const { ledger, patient, doctor, now } = await deployLedger();
    await addDefaultRecord(ledger, patient, doctor, now);

    await expect(
      ledger.connect(doctor).requestAccess(
        1,
        "Cardiologist",
        "NewClinic",
        "treatment",
        false
      )
    )
      .to.emit(ledger, "ContextualAnomalyFlagged")
      .withArgs(1, doctor.address, "Treatment request without prior care relationship");
  });

  it("allows only the record owner to grant access", async function () {
    const { ledger, patient, doctor, other, now } = await deployLedger();
    await addDefaultRecord(ledger, patient, doctor, now);
    await ledger.connect(doctor).requestAccess(
      1,
      "Cardiologist",
      "GeneralHospital",
      "treatment",
      true
    );

    await expect(
      ledger.connect(other).grantAccess(1, "demo-raw-key")
    ).to.be.revertedWithCustomError(ledger, "NotRecordOwner");

    await expect(ledger.connect(patient).grantAccess(1, "demo-raw-key"))
      .to.emit(ledger, "AccessGranted")
      .withArgs(1, 1, doctor.address);

    const request = await ledger.accessRequests(1);
    expect(request.keyMaterial).to.equal("demo-raw-key");
    expect(request.status).to.equal(2n);
  });

  it("logs approved access and blocks unapproved consumers", async function () {
    const { ledger, patient, doctor, other, now } = await deployLedger();
    await addDefaultRecord(ledger, patient, doctor, now);
    await ledger.connect(doctor).requestAccess(
      1,
      "Cardiologist",
      "GeneralHospital",
      "treatment",
      true
    );
    await ledger.connect(patient).grantAccess(1, "demo-raw-key");

    await expect(ledger.connect(other).logAccess(1))
      .to.be.revertedWithCustomError(ledger, "AccessNotGranted");

    await expect(ledger.connect(doctor).logAccess(1))
      .to.emit(ledger, "AccessLogged");
  });
});
