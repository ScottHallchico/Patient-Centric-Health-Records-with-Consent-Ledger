// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ConsentLedger {
    enum RequestStatus {
        None,
        Pending,
        Granted
    }

    struct ConsentPolicy {
        string ipfsHash;
        address owner;
        address consumer;
        string role;
        string institution;
        string purpose;
        bool priorCare;
        uint256 windowStart;
        uint256 windowEnd;
        bool notifyOnAccess;
        bool exists;
    }

    struct AccessRequest {
        uint256 recordId;
        address requester;
        string role;
        string institution;
        string purpose;
        bool priorCare;
        RequestStatus status;
        uint256 requestedAt;
        string keyMaterial;
        bool exists;
    }

    uint256 private nextRecordId = 1;
    uint256 private nextRequestId = 1;

    mapping(uint256 => ConsentPolicy) public records;
    mapping(uint256 => AccessRequest) public accessRequests;
    mapping(address => uint256[]) private ownerRecords;
    mapping(uint256 => uint256[]) private recordRequests;

    event RecordAdded(uint256 indexed recordId, address indexed owner, string ipfsHash);
    event AccessRequested(
        uint256 indexed requestId,
        uint256 indexed recordId,
        address indexed requester,
        string role,
        string institution,
        string purpose,
        bool priorCare
    );
    event AccessGranted(uint256 indexed requestId, uint256 indexed recordId, address indexed requester);
    event AccessLogged(uint256 indexed recordId, address indexed consumer, uint256 timestamp);
    event ContextualAnomalyFlagged(uint256 indexed recordId, address indexed consumer, string reason);

    error RecordNotFound(uint256 recordId);
    error RequestNotFound(uint256 requestId);
    error NotRecordOwner(address caller, uint256 recordId);
    error ConsentWindowClosed(uint256 recordId, uint256 timestamp, uint256 windowStart, uint256 windowEnd);
    error InvalidConsentWindow(uint256 windowStart, uint256 windowEnd);
    error RequestAlreadyGranted(uint256 requestId);
    error AccessNotGranted(uint256 recordId, address consumer);

    function addRecord(
        string calldata ipfsHash,
        address consumer,
        string calldata role,
        string calldata institution,
        string calldata purpose,
        bool priorCare,
        uint256 windowStart,
        uint256 windowEnd,
        bool notifyOnAccess
    ) external returns (uint256 recordId) {
        if (windowEnd < windowStart) {
            revert InvalidConsentWindow(windowStart, windowEnd);
        }

        recordId = nextRecordId++;
        records[recordId] = ConsentPolicy({
            ipfsHash: ipfsHash,
            owner: msg.sender,
            consumer: consumer,
            role: role,
            institution: institution,
            purpose: purpose,
            priorCare: priorCare,
            windowStart: windowStart,
            windowEnd: windowEnd,
            notifyOnAccess: notifyOnAccess,
            exists: true
        });
        ownerRecords[msg.sender].push(recordId);

        emit RecordAdded(recordId, msg.sender, ipfsHash);
    }

    function requestAccess(
        uint256 recordId,
        string calldata role,
        string calldata institution,
        string calldata purpose,
        bool priorCare
    ) external returns (uint256 requestId) {
        ConsentPolicy storage policy = records[recordId];
        if (!policy.exists) {
            revert RecordNotFound(recordId);
        }

        if (block.timestamp < policy.windowStart || block.timestamp > policy.windowEnd) {
            revert ConsentWindowClosed(recordId, block.timestamp, policy.windowStart, policy.windowEnd);
        }

        requestId = nextRequestId++;
        accessRequests[requestId] = AccessRequest({
            recordId: recordId,
            requester: msg.sender,
            role: role,
            institution: institution,
            purpose: purpose,
            priorCare: priorCare,
            status: RequestStatus.Pending,
            requestedAt: block.timestamp,
            keyMaterial: "",
            exists: true
        });
        recordRequests[recordId].push(requestId);

        if (_sameString(purpose, "treatment") && !priorCare) {
            emit ContextualAnomalyFlagged(recordId, msg.sender, "Treatment request without prior care relationship");
        }

        emit AccessRequested(requestId, recordId, msg.sender, role, institution, purpose, priorCare);
    }

    function grantAccess(uint256 requestId, string calldata keyMaterial) external {
        AccessRequest storage accessRequest = accessRequests[requestId];
        if (!accessRequest.exists) {
            revert RequestNotFound(requestId);
        }

        ConsentPolicy storage policy = records[accessRequest.recordId];
        if (msg.sender != policy.owner) {
            revert NotRecordOwner(msg.sender, accessRequest.recordId);
        }

        if (accessRequest.status == RequestStatus.Granted) {
            revert RequestAlreadyGranted(requestId);
        }

        accessRequest.status = RequestStatus.Granted;
        accessRequest.keyMaterial = keyMaterial;

        emit AccessGranted(requestId, accessRequest.recordId, accessRequest.requester);
    }

    function logAccess(uint256 recordId) external {
        if (!records[recordId].exists) {
            revert RecordNotFound(recordId);
        }

        uint256[] storage requestIds = recordRequests[recordId];
        bool granted = false;
        for (uint256 i = 0; i < requestIds.length; i++) {
            AccessRequest storage accessRequest = accessRequests[requestIds[i]];
            if (accessRequest.requester == msg.sender && accessRequest.status == RequestStatus.Granted) {
                granted = true;
                break;
            }
        }

        if (!granted) {
            revert AccessNotGranted(recordId, msg.sender);
        }

        emit AccessLogged(recordId, msg.sender, block.timestamp);
    }

    function getRecordsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerRecords[owner];
    }

    function getRequestsForRecord(uint256 recordId) external view returns (uint256[] memory) {
        if (!records[recordId].exists) {
            revert RecordNotFound(recordId);
        }
        return recordRequests[recordId];
    }

    function _sameString(string memory left, string memory right) private pure returns (bool) {
        return keccak256(bytes(left)) == keccak256(bytes(right));
    }
}
