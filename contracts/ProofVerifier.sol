// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProofVerifier
 * @dev Smart contract for managing verifiable audit credentials on Moca Chain
 * @notice This contract handles credential anchoring and verification status
 */
contract ProofVerifier {
    // State variables
    mapping(address => bool) public verified;
    mapping(bytes32 => bool) public credentialAnchored;
    mapping(address => address) public projectAuditor;
    
    // Events
    event CredentialAnchored(
        bytes32 indexed id,
        address indexed issuer,
        bytes32 summaryHash,
        uint256 timestamp
    );
    
    event AuditVerified(
        address indexed project,
        address indexed auditor,
        string status,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyValidAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    
    /**
     * @dev Anchor a credential on-chain
     * @param id Unique credential identifier
     * @param summaryHash Hash of the audit summary
     * @param issuer Address of the credential issuer (auditor)
     */
    function anchorCredential(
        bytes32 id,
        bytes32 summaryHash,
        address issuer
    ) external onlyValidAddress(issuer) {
        require(!credentialAnchored[id], "Credential already anchored");
        require(id != bytes32(0), "Invalid credential ID");
        require(summaryHash != bytes32(0), "Invalid summary hash");
        
        credentialAnchored[id] = true;
        
        emit CredentialAnchored(id, issuer, summaryHash, block.timestamp);
    }
    
    /**
     * @dev Record verification status for a project
     * @param project Address of the project being verified
     * @param auditor Address of the auditor
     * @param status Verification status string
     */
    function recordVerification(
        address project,
        address auditor,
        string calldata status
    ) external onlyValidAddress(project) onlyValidAddress(auditor) {
        require(bytes(status).length > 0, "Status cannot be empty");
        
        verified[project] = true;
        projectAuditor[project] = auditor;
        
        emit AuditVerified(project, auditor, status, block.timestamp);
    }
    
    /**
     * @dev Check if a project is verified
     * @param project Address of the project to check
     * @return bool True if project is verified, false otherwise
     */
    function isVerified(address project) external view returns (bool) {
        return verified[project];
    }
    
    /**
     * @dev Get auditor for a verified project
     * @param project Address of the project
     * @return address Auditor address, or zero address if not verified
     */
    function getAuditor(address project) external view returns (address) {
        return projectAuditor[project];
    }
    
    /**
     * @dev Check if a credential is anchored
     * @param id Credential ID to check
     * @return bool True if anchored, false otherwise
     */
    function isCredentialAnchored(bytes32 id) external view returns (bool) {
        return credentialAnchored[id];
    }
}
