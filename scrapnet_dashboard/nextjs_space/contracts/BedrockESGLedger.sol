// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BedrockESGLedger
 * @author Bedrock ESG Protocol
 * @notice Digital Representative Token (DRT) minting for verified currency destruction
 * @dev Implements atomic settlement with 70/20/10 carbon credit split
 * 
 * Carbon Credit Distribution:
 *   - 70% → Participating Bank (Incentive for participation)
 *   - 20% → Bedrock ESG Platform (Operating fee)
 *   - 10% → Global Sustainability Pool (Environmental fund)
 *
 * All minted tokens are linked to Hedera Consensus Service transaction hashes
 * for complete transparency and auditability.
 */
contract BedrockESGLedger is ERC1155, AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // ============ ROLES ============
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ============ TOKEN TYPES ============
    uint256 public constant DRT_TOKEN = 1;           // Digital Representative Token
    uint256 public constant CARBON_CREDIT = 2;       // Verified Carbon Credit
    uint256 public constant UNVERIFIED_CREDIT = 3;   // Pending verification

    // ============ CREDIT SPLIT CONSTANTS ============
    uint256 public constant BANK_SHARE = 70;         // 70% to participating bank
    uint256 public constant PLATFORM_SHARE = 20;     // 20% to Bedrock ESG
    uint256 public constant SUSTAINABILITY_SHARE = 10; // 10% to global pool
    uint256 public constant TOTAL_SHARES = 100;

    // ============ ADDRESSES ============
    address public bedrockTreasury;
    address public sustainabilityPool;

    // ============ COUNTERS ============
    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _verificationCounter;

    // ============ STRUCTS ============
    
    /**
     * @notice Represents a verified destruction event
     */
    struct DestructionRecord {
        uint256 tokenId;
        address depositor;              // Bank/Vault wallet
        string verificationId;          // Bedrock ESG verification ID
        string hederaTopicId;           // Hedera HCS topic
        string hederaSequenceNumber;    // HCS sequence number
        bytes32 destructionVideoHash;   // SHA-256 of destruction video
        string currencyType;            // USD, EUR, GOLD_BULLION, etc.
        uint256 totalValue;             // Value in smallest unit
        uint256 avoidedCo2Grams;        // Avoided logistics emissions
        uint256 carbonCreditsTotal;     // Total credits (in wei for precision)
        uint256 bankCredits;            // 70% allocation
        uint256 platformCredits;        // 20% allocation
        uint256 sustainabilityCredits;  // 10% allocation
        uint256 timestamp;
        bool isVerified;
    }

    /**
     * @notice Credit allocation breakdown
     */
    struct CreditAllocation {
        uint256 totalCredits;
        uint256 bankAmount;
        uint256 platformAmount;
        uint256 sustainabilityAmount;
    }

    // ============ MAPPINGS ============
    mapping(uint256 => DestructionRecord) public destructionRecords;
    mapping(bytes32 => uint256) public hashToTokenId;
    mapping(string => uint256) public verificationIdToTokenId;
    mapping(address => uint256[]) public depositorTokens;
    mapping(address => uint256) public depositorCreditBalance;

    // ============ EVENTS ============
    
    event DestructionVerified(
        uint256 indexed tokenId,
        address indexed depositor,
        string verificationId,
        bytes32 destructionHash,
        uint256 avoidedCo2Grams
    );

    event DRTMinted(
        uint256 indexed tokenId,
        address indexed depositor,
        string currencyType,
        uint256 totalValue,
        string hederaTopicId,
        string hederaSequenceNumber
    );

    event CarbonCreditsDistributed(
        uint256 indexed tokenId,
        uint256 totalCredits,
        uint256 bankCredits,
        uint256 platformCredits,
        uint256 sustainabilityCredits
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event SustainabilityPoolUpdated(address indexed oldPool, address indexed newPool);

    // ============ ERRORS ============
    error InvalidAddress();
    error InvalidDestructionHash();
    error AlreadyVerified();
    error InsufficientCredits();
    error TokenNotFound();
    error Unauthorized();

    // ============ CONSTRUCTOR ============
    
    /**
     * @notice Initialize the Bedrock ESG Impact Ledger
     * @param _uri Base URI for token metadata
     * @param _bedrockTreasury Address for platform fee collection
     * @param _sustainabilityPool Address for global sustainability fund
     */
    constructor(
        string memory _uri,
        address _bedrockTreasury,
        address _sustainabilityPool
    ) ERC1155(_uri) {
        if (_bedrockTreasury == address(0) || _sustainabilityPool == address(0)) {
            revert InvalidAddress();
        }

        bedrockTreasury = _bedrockTreasury;
        sustainabilityPool = _sustainabilityPool;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    // ============ CORE FUNCTIONS ============

    /**
     * @notice Atomic settlement: Mint DRT upon Proof of Destruction confirmation
     * @dev This is the primary function called when destruction is verified
     * @param _depositor Wallet address of the participating bank/vault
     * @param _verificationId Bedrock ESG verification ID (e.g., "VLT-2026-XXXXX")
     * @param _destructionVideoHash SHA-256 hash of the destruction video
     * @param _hederaTopicId Hedera Consensus Service topic ID
     * @param _hederaSequenceNumber HCS message sequence number
     * @param _currencyType Type of currency destroyed (USD, GOLD_BULLION, etc.)
     * @param _totalValue Total value of destroyed assets (in smallest unit)
     * @param _avoidedCo2Grams CO2 avoided by on-site tokenization vs shipping
     * @return tokenId The minted DRT token ID
     */
    function mintOnDestruction(
        address _depositor,
        string calldata _verificationId,
        bytes32 _destructionVideoHash,
        string calldata _hederaTopicId,
        string calldata _hederaSequenceNumber,
        string calldata _currencyType,
        uint256 _totalValue,
        uint256 _avoidedCo2Grams
    ) external onlyRole(MINTER_ROLE) nonReentrant whenNotPaused returns (uint256 tokenId) {
        // Validate inputs
        if (_depositor == address(0)) revert InvalidAddress();
        if (_destructionVideoHash == bytes32(0)) revert InvalidDestructionHash();
        if (hashToTokenId[_destructionVideoHash] != 0) revert AlreadyVerified();

        // Generate new token ID
        _tokenIdCounter.increment();
        tokenId = _tokenIdCounter.current();

        // Calculate carbon credit allocation (70/20/10 split)
        CreditAllocation memory allocation = _calculateCreditSplit(_avoidedCo2Grams);

        // Create destruction record
        DestructionRecord storage record = destructionRecords[tokenId];
        record.tokenId = tokenId;
        record.depositor = _depositor;
        record.verificationId = _verificationId;
        record.hederaTopicId = _hederaTopicId;
        record.hederaSequenceNumber = _hederaSequenceNumber;
        record.destructionVideoHash = _destructionVideoHash;
        record.currencyType = _currencyType;
        record.totalValue = _totalValue;
        record.avoidedCo2Grams = _avoidedCo2Grams;
        record.carbonCreditsTotal = allocation.totalCredits;
        record.bankCredits = allocation.bankAmount;
        record.platformCredits = allocation.platformAmount;
        record.sustainabilityCredits = allocation.sustainabilityAmount;
        record.timestamp = block.timestamp;
        record.isVerified = true;

        // Update mappings
        hashToTokenId[_destructionVideoHash] = tokenId;
        verificationIdToTokenId[_verificationId] = tokenId;
        depositorTokens[_depositor].push(tokenId);

        // Mint DRT to depositor
        _mint(_depositor, DRT_TOKEN, 1, "");

        // Distribute carbon credits (70/20/10 split)
        _distributeCredits(_depositor, allocation);

        // Emit events
        emit DestructionVerified(
            tokenId,
            _depositor,
            _verificationId,
            _destructionVideoHash,
            _avoidedCo2Grams
        );

        emit DRTMinted(
            tokenId,
            _depositor,
            _currencyType,
            _totalValue,
            _hederaTopicId,
            _hederaSequenceNumber
        );

        emit CarbonCreditsDistributed(
            tokenId,
            allocation.totalCredits,
            allocation.bankAmount,
            allocation.platformAmount,
            allocation.sustainabilityAmount
        );

        return tokenId;
    }

    /**
     * @notice Calculate the 70/20/10 credit split
     * @param _avoidedCo2Grams Total avoided CO2 in grams
     * @return allocation Credit distribution breakdown
     */
    function _calculateCreditSplit(
        uint256 _avoidedCo2Grams
    ) internal pure returns (CreditAllocation memory allocation) {
        // Convert grams to credit units (1 credit = 1 tonne = 1,000,000 grams)
        // Using 18 decimals for precision (wei-like representation)
        uint256 totalCreditsWei = (_avoidedCo2Grams * 1e18) / 1_000_000;

        allocation.totalCredits = totalCreditsWei;
        allocation.bankAmount = (totalCreditsWei * BANK_SHARE) / TOTAL_SHARES;       // 70%
        allocation.platformAmount = (totalCreditsWei * PLATFORM_SHARE) / TOTAL_SHARES; // 20%
        allocation.sustainabilityAmount = (totalCreditsWei * SUSTAINABILITY_SHARE) / TOTAL_SHARES; // 10%

        return allocation;
    }

    /**
     * @notice Distribute carbon credits according to 70/20/10 split
     * @param _bank Address of participating bank (receives 70%)
     * @param _allocation Credit allocation breakdown
     */
    function _distributeCredits(
        address _bank,
        CreditAllocation memory _allocation
    ) internal {
        // Mint 70% to participating bank (incentive)
        if (_allocation.bankAmount > 0) {
            _mint(_bank, CARBON_CREDIT, _allocation.bankAmount, "");
            depositorCreditBalance[_bank] += _allocation.bankAmount;
        }

        // Mint 20% to Bedrock ESG treasury (platform fee)
        if (_allocation.platformAmount > 0) {
            _mint(bedrockTreasury, CARBON_CREDIT, _allocation.platformAmount, "");
        }

        // Mint 10% to global sustainability pool
        if (_allocation.sustainabilityAmount > 0) {
            _mint(sustainabilityPool, CARBON_CREDIT, _allocation.sustainabilityAmount, "");
        }
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get destruction record by token ID
     * @param _tokenId Token ID to query
     * @return DestructionRecord Full record details
     */
    function getDestructionRecord(
        uint256 _tokenId
    ) external view returns (DestructionRecord memory) {
        if (_tokenId == 0 || _tokenId > _tokenIdCounter.current()) {
            revert TokenNotFound();
        }
        return destructionRecords[_tokenId];
    }

    /**
     * @notice Get token ID by destruction hash
     * @param _hash SHA-256 hash of destruction video
     * @return tokenId Associated token ID (0 if not found)
     */
    function getTokenByHash(bytes32 _hash) external view returns (uint256) {
        return hashToTokenId[_hash];
    }

    /**
     * @notice Get token ID by verification ID
     * @param _verificationId Bedrock ESG verification ID
     * @return tokenId Associated token ID (0 if not found)
     */
    function getTokenByVerificationId(
        string calldata _verificationId
    ) external view returns (uint256) {
        return verificationIdToTokenId[_verificationId];
    }

    /**
     * @notice Get all tokens for a depositor
     * @param _depositor Bank/vault wallet address
     * @return tokenIds Array of token IDs
     */
    function getDepositorTokens(
        address _depositor
    ) external view returns (uint256[] memory) {
        return depositorTokens[_depositor];
    }

    /**
     * @notice Get Hedera attestation details for a token
     * @param _tokenId Token ID to query
     * @return topicId Hedera HCS topic ID
     * @return sequenceNumber HCS sequence number
     * @return destructionHash SHA-256 hash of destruction video
     */
    function getHederaAttestation(
        uint256 _tokenId
    ) external view returns (
        string memory topicId,
        string memory sequenceNumber,
        bytes32 destructionHash
    ) {
        DestructionRecord storage record = destructionRecords[_tokenId];
        if (!record.isVerified) revert TokenNotFound();
        
        return (
            record.hederaTopicId,
            record.hederaSequenceNumber,
            record.destructionVideoHash
        );
    }

    /**
     * @notice Get credit allocation for a token
     * @param _tokenId Token ID to query
     * @return total Total credits
     * @return bankShare 70% bank allocation
     * @return platformShare 20% platform allocation
     * @return sustainabilityShare 10% sustainability allocation
     */
    function getCreditAllocation(
        uint256 _tokenId
    ) external view returns (
        uint256 total,
        uint256 bankShare,
        uint256 platformShare,
        uint256 sustainabilityShare
    ) {
        DestructionRecord storage record = destructionRecords[_tokenId];
        if (!record.isVerified) revert TokenNotFound();
        
        return (
            record.carbonCreditsTotal,
            record.bankCredits,
            record.platformCredits,
            record.sustainabilityCredits
        );
    }

    /**
     * @notice Get total minted tokens count
     * @return count Total number of DRTs minted
     */
    function totalSupplyDRT() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @notice Verify token-to-Hedera link integrity
     * @param _tokenId Token ID to verify
     * @param _expectedHash Expected destruction hash
     * @return isValid True if hash matches
     */
    function verifyHederaLink(
        uint256 _tokenId,
        bytes32 _expectedHash
    ) external view returns (bool isValid) {
        DestructionRecord storage record = destructionRecords[_tokenId];
        return record.destructionVideoHash == _expectedHash;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Update Bedrock ESG treasury address
     * @param _newTreasury New treasury address
     */
    function updateTreasury(
        address _newTreasury
    ) external onlyRole(ADMIN_ROLE) {
        if (_newTreasury == address(0)) revert InvalidAddress();
        address oldTreasury = bedrockTreasury;
        bedrockTreasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }

    /**
     * @notice Update sustainability pool address
     * @param _newPool New pool address
     */
    function updateSustainabilityPool(
        address _newPool
    ) external onlyRole(ADMIN_ROLE) {
        if (_newPool == address(0)) revert InvalidAddress();
        address oldPool = sustainabilityPool;
        sustainabilityPool = _newPool;
        emit SustainabilityPoolUpdated(oldPool, _newPool);
    }

    /**
     * @notice Pause contract operations
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract operations
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Update token URI
     * @param _newUri New base URI
     */
    function setURI(string memory _newUri) external onlyRole(ADMIN_ROLE) {
        _setURI(_newUri);
    }

    // ============ REQUIRED OVERRIDES ============

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
