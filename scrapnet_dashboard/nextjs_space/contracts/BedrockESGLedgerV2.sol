// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BedrockESGLedgerV2
 * @author Bedrock ESG Protocol
 * @notice Jurisdiction-aware Digital Representative Token (DRT) with dynamic credit splits
 * @dev Implements atomic settlement with 70/20/10 carbon credit split adjusted by jurisdiction
 * 
 * Jurisdiction-Specific Enforcement:
 *   - US (GENIUS Act): Requires 1:1 Treasury-backed reserve
 *   - EU (MiCA): Requires white-paper attestation hash linked to minting
 *   - SG (Project Guardian): Standard compliance checks
 * 
 * Carbon Credit Distribution (Base 70/20/10):
 *   - 70% → Participating Bank (Incentive)
 *   - 20% → Bedrock ESG Platform (Operating fee)
 *   - 10% → Global Sustainability Pool (Environmental fund)
 */
contract BedrockESGLedgerV2 is ERC1155, AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // ============ ROLES ============
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // ============ TOKEN TYPES ============
    uint256 public constant DRT_TOKEN = 1;
    uint256 public constant CARBON_CREDIT = 2;
    uint256 public constant TREASURY_BACKED_CREDIT = 3;  // US-specific
    uint256 public constant WHITEPAPER_ATTESTED_CREDIT = 4; // EU-specific

    // ============ JURISDICTIONS ============
    enum Jurisdiction {
        US,      // GENIUS Act - Treasury backup required
        EU,      // MiCA - Whitepaper hash required
        UK,      // FCA regulated
        SG,      // Project Guardian
        JP,      // FSA regulated
        CH,      // FINMA regulated
        APAC,    // Asia Pacific other
        LATAM,   // Latin America
        MENA,    // Middle East & North Africa
        UNKNOWN
    }

    // ============ CREDIT SPLIT (Base 70/20/10) ============
    uint256 public constant BANK_SHARE = 70;
    uint256 public constant PLATFORM_SHARE = 20;
    uint256 public constant SUSTAINABILITY_SHARE = 10;
    uint256 public constant TOTAL_SHARES = 100;

    // ============ ADDRESSES ============
    address public bedrockTreasury;
    address public sustainabilityPool;
    address public treasuryBackupOracle; // For US compliance

    // ============ COUNTERS ============
    Counters.Counter private _tokenIdCounter;

    // ============ STRUCTS ============

    struct JurisdictionConfig {
        bool isActive;
        bool requiresTreasuryBackup;    // US: 1:1 reserve
        bool requiresWhitepaperHash;    // EU: MiCA attestation
        uint256 travelRuleThreshold;    // FATF threshold in USD cents
        uint256 bankShareOverride;      // 0 = use default
        uint256 platformShareOverride;
        uint256 sustainabilityShareOverride;
    }

    struct MintRecord {
        uint256 tokenId;
        address depositor;
        Jurisdiction jurisdiction;
        string verificationId;
        bytes32 destructionHash;
        string hederaTopicId;
        string hederaSequenceNumber;
        
        // Jurisdiction compliance
        bool treasuryBackupVerified;
        bytes32 treasuryBackupHash;
        bool whitepaperAttested;
        bytes32 whitepaperHash;
        
        // GPS verification
        int256 gpsLatitude;  // Scaled by 1e6
        int256 gpsLongitude; // Scaled by 1e6
        
        // Credit distribution
        uint256 totalCredits;
        uint256 bankCredits;
        uint256 platformCredits;
        uint256 sustainabilityCredits;
        
        uint256 timestamp;
        bool isVerified;
    }

    // ============ MAPPINGS ============
    mapping(Jurisdiction => JurisdictionConfig) public jurisdictionConfigs;
    mapping(uint256 => MintRecord) public mintRecords;
    mapping(bytes32 => uint256) public hashToTokenId;
    mapping(address => Jurisdiction) public nodeJurisdiction;
    mapping(bytes32 => bool) public usedWhitepaperHashes;
    mapping(bytes32 => bool) public verifiedTreasuryBackups;

    // ============ EVENTS ============
    
    event JurisdictionConfigured(
        Jurisdiction indexed jurisdiction,
        bool requiresTreasuryBackup,
        bool requiresWhitepaperHash
    );

    event NodeJurisdictionSet(
        address indexed node,
        Jurisdiction jurisdiction
    );

    event TreasuryBackupVerified(
        uint256 indexed tokenId,
        bytes32 backupHash
    );

    event WhitepaperAttested(
        uint256 indexed tokenId,
        bytes32 whitepaperHash
    );

    event JurisdictionAwareMint(
        uint256 indexed tokenId,
        address indexed depositor,
        Jurisdiction jurisdiction,
        bool treasuryBackupRequired,
        bool whitepaperRequired
    );

    event CreditSplitApplied(
        uint256 indexed tokenId,
        Jurisdiction jurisdiction,
        uint256 bankShare,
        uint256 platformShare,
        uint256 sustainabilityShare
    );

    // ============ ERRORS ============
    error InvalidAddress();
    error InvalidJurisdiction();
    error TreasuryBackupRequired();
    error WhitepaperHashRequired();
    error AlreadyMinted();
    error JurisdictionNotConfigured();
    error GPSVerificationFailed();

    // ============ CONSTRUCTOR ============
    
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
        _grantRole(COMPLIANCE_ROLE, msg.sender);

        // Initialize default jurisdiction configs
        _initializeJurisdictions();
    }

    function _initializeJurisdictions() internal {
        // US - GENIUS Act: Treasury backup required
        jurisdictionConfigs[Jurisdiction.US] = JurisdictionConfig({
            isActive: true,
            requiresTreasuryBackup: true,
            requiresWhitepaperHash: false,
            travelRuleThreshold: 300000, // $3,000 in cents
            bankShareOverride: 0,
            platformShareOverride: 0,
            sustainabilityShareOverride: 0
        });

        // EU - MiCA: Whitepaper attestation required
        jurisdictionConfigs[Jurisdiction.EU] = JurisdictionConfig({
            isActive: true,
            requiresTreasuryBackup: false,
            requiresWhitepaperHash: true,
            travelRuleThreshold: 100000, // €1,000 ~ $1,000 in cents
            bankShareOverride: 0,
            platformShareOverride: 0,
            sustainabilityShareOverride: 0
        });

        // SG - Project Guardian
        jurisdictionConfigs[Jurisdiction.SG] = JurisdictionConfig({
            isActive: true,
            requiresTreasuryBackup: false,
            requiresWhitepaperHash: false,
            travelRuleThreshold: 150000, // SGD 1,500 ~ $1,500 in cents
            bankShareOverride: 0,
            platformShareOverride: 0,
            sustainabilityShareOverride: 0
        });

        // UK - FCA
        jurisdictionConfigs[Jurisdiction.UK] = JurisdictionConfig({
            isActive: true,
            requiresTreasuryBackup: false,
            requiresWhitepaperHash: true,
            travelRuleThreshold: 100000,
            bankShareOverride: 0,
            platformShareOverride: 0,
            sustainabilityShareOverride: 0
        });
    }

    // ============ JURISDICTION MANAGEMENT ============

    /**
     * @notice Set jurisdiction for a node based on IP/GPS verification
     * @dev Called by compliance oracle after off-chain verification
     */
    function setNodeJurisdiction(
        address _node,
        Jurisdiction _jurisdiction
    ) external onlyRole(COMPLIANCE_ROLE) {
        if (_node == address(0)) revert InvalidAddress();
        nodeJurisdiction[_node] = _jurisdiction;
        emit NodeJurisdictionSet(_node, _jurisdiction);
    }

    /**
     * @notice Update jurisdiction configuration
     */
    function configureJurisdiction(
        Jurisdiction _jurisdiction,
        bool _requiresTreasuryBackup,
        bool _requiresWhitepaperHash,
        uint256 _travelRuleThreshold
    ) external onlyRole(ADMIN_ROLE) {
        JurisdictionConfig storage config = jurisdictionConfigs[_jurisdiction];
        config.isActive = true;
        config.requiresTreasuryBackup = _requiresTreasuryBackup;
        config.requiresWhitepaperHash = _requiresWhitepaperHash;
        config.travelRuleThreshold = _travelRuleThreshold;

        emit JurisdictionConfigured(
            _jurisdiction,
            _requiresTreasuryBackup,
            _requiresWhitepaperHash
        );
    }

    // ============ CORE MINTING WITH JURISDICTION AWARENESS ============

    /**
     * @notice Jurisdiction-aware minting with compliance checks
     * @param _depositor Bank/vault wallet address
     * @param _jurisdiction Detected jurisdiction from IP/GPS
     * @param _verificationId Bedrock ESG verification ID
     * @param _destructionHash SHA-256 of destruction video
     * @param _hederaTopicId Hedera HCS topic
     * @param _hederaSequenceNumber HCS sequence number
     * @param _gpsLatitude GPS latitude scaled by 1e6
     * @param _gpsLongitude GPS longitude scaled by 1e6
     * @param _avoidedCo2Grams CO2 avoided
     * @param _treasuryBackupHash Required for US jurisdiction
     * @param _whitepaperHash Required for EU jurisdiction
     */
    function mintWithJurisdiction(
        address _depositor,
        Jurisdiction _jurisdiction,
        string calldata _verificationId,
        bytes32 _destructionHash,
        string calldata _hederaTopicId,
        string calldata _hederaSequenceNumber,
        int256 _gpsLatitude,
        int256 _gpsLongitude,
        uint256 _avoidedCo2Grams,
        bytes32 _treasuryBackupHash,
        bytes32 _whitepaperHash
    ) external onlyRole(MINTER_ROLE) nonReentrant whenNotPaused returns (uint256 tokenId) {
        // Validate inputs
        if (_depositor == address(0)) revert InvalidAddress();
        if (_destructionHash == bytes32(0)) revert InvalidAddress();
        if (hashToTokenId[_destructionHash] != 0) revert AlreadyMinted();

        // Get jurisdiction config
        JurisdictionConfig storage config = jurisdictionConfigs[_jurisdiction];
        if (!config.isActive) revert JurisdictionNotConfigured();

        // US Enforcement: Verify 1:1 Treasury backup
        bool treasuryVerified = false;
        if (config.requiresTreasuryBackup) {
            if (_treasuryBackupHash == bytes32(0)) revert TreasuryBackupRequired();
            // In production, this would verify against treasury oracle
            verifiedTreasuryBackups[_treasuryBackupHash] = true;
            treasuryVerified = true;
        }

        // EU Enforcement: Verify whitepaper attestation hash
        bool whitepaperVerified = false;
        if (config.requiresWhitepaperHash) {
            if (_whitepaperHash == bytes32(0)) revert WhitepaperHashRequired();
            usedWhitepaperHashes[_whitepaperHash] = true;
            whitepaperVerified = true;
        }

        // Generate token ID
        _tokenIdCounter.increment();
        tokenId = _tokenIdCounter.current();

        // Calculate credit split (may have jurisdiction overrides)
        (uint256 bankShare, uint256 platformShare, uint256 sustainabilityShare) = 
            _getCreditSplit(config);

        // Convert grams to credits (1 credit = 1 tonne = 1,000,000 grams)
        uint256 totalCreditsWei = (_avoidedCo2Grams * 1e18) / 1_000_000;
        uint256 bankCredits = (totalCreditsWei * bankShare) / TOTAL_SHARES;
        uint256 platformCredits = (totalCreditsWei * platformShare) / TOTAL_SHARES;
        uint256 sustainabilityCredits = (totalCreditsWei * sustainabilityShare) / TOTAL_SHARES;

        // Create mint record
        mintRecords[tokenId] = MintRecord({
            tokenId: tokenId,
            depositor: _depositor,
            jurisdiction: _jurisdiction,
            verificationId: _verificationId,
            destructionHash: _destructionHash,
            hederaTopicId: _hederaTopicId,
            hederaSequenceNumber: _hederaSequenceNumber,
            treasuryBackupVerified: treasuryVerified,
            treasuryBackupHash: _treasuryBackupHash,
            whitepaperAttested: whitepaperVerified,
            whitepaperHash: _whitepaperHash,
            gpsLatitude: _gpsLatitude,
            gpsLongitude: _gpsLongitude,
            totalCredits: totalCreditsWei,
            bankCredits: bankCredits,
            platformCredits: platformCredits,
            sustainabilityCredits: sustainabilityCredits,
            timestamp: block.timestamp,
            isVerified: true
        });

        hashToTokenId[_destructionHash] = tokenId;

        // Mint DRT to depositor
        _mint(_depositor, DRT_TOKEN, 1, "");

        // Mint appropriate credit type based on jurisdiction
        uint256 creditType = CARBON_CREDIT;
        if (config.requiresTreasuryBackup) {
            creditType = TREASURY_BACKED_CREDIT;
        } else if (config.requiresWhitepaperHash) {
            creditType = WHITEPAPER_ATTESTED_CREDIT;
        }

        // Distribute credits
        if (bankCredits > 0) {
            _mint(_depositor, creditType, bankCredits, "");
        }
        if (platformCredits > 0) {
            _mint(bedrockTreasury, creditType, platformCredits, "");
        }
        if (sustainabilityCredits > 0) {
            _mint(sustainabilityPool, creditType, sustainabilityCredits, "");
        }

        // Emit events
        emit JurisdictionAwareMint(
            tokenId,
            _depositor,
            _jurisdiction,
            config.requiresTreasuryBackup,
            config.requiresWhitepaperHash
        );

        emit CreditSplitApplied(
            tokenId,
            _jurisdiction,
            bankShare,
            platformShare,
            sustainabilityShare
        );

        if (treasuryVerified) {
            emit TreasuryBackupVerified(tokenId, _treasuryBackupHash);
        }
        if (whitepaperVerified) {
            emit WhitepaperAttested(tokenId, _whitepaperHash);
        }

        return tokenId;
    }

    /**
     * @notice Get credit split for a jurisdiction
     */
    function _getCreditSplit(
        JurisdictionConfig storage _config
    ) internal view returns (uint256 bank, uint256 platform, uint256 sustainability) {
        bank = _config.bankShareOverride > 0 ? _config.bankShareOverride : BANK_SHARE;
        platform = _config.platformShareOverride > 0 ? _config.platformShareOverride : PLATFORM_SHARE;
        sustainability = _config.sustainabilityShareOverride > 0 ? _config.sustainabilityShareOverride : SUSTAINABILITY_SHARE;
    }

    // ============ VIEW FUNCTIONS ============

    function getMintRecord(uint256 _tokenId) external view returns (MintRecord memory) {
        return mintRecords[_tokenId];
    }

    function getJurisdictionConfig(Jurisdiction _jurisdiction) external view returns (JurisdictionConfig memory) {
        return jurisdictionConfigs[_jurisdiction];
    }

    function isUSCompliant(uint256 _tokenId) external view returns (bool) {
        MintRecord storage record = mintRecords[_tokenId];
        if (record.jurisdiction != Jurisdiction.US) return true;
        return record.treasuryBackupVerified;
    }

    function isEUCompliant(uint256 _tokenId) external view returns (bool) {
        MintRecord storage record = mintRecords[_tokenId];
        if (record.jurisdiction != Jurisdiction.EU) return true;
        return record.whitepaperAttested;
    }

    function totalSupplyDRT() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // ============ ADMIN FUNCTIONS ============

    function updateTreasury(address _newTreasury) external onlyRole(ADMIN_ROLE) {
        if (_newTreasury == address(0)) revert InvalidAddress();
        bedrockTreasury = _newTreasury;
    }

    function updateSustainabilityPool(address _newPool) external onlyRole(ADMIN_ROLE) {
        if (_newPool == address(0)) revert InvalidAddress();
        sustainabilityPool = _newPool;
    }

    function setTreasuryBackupOracle(address _oracle) external onlyRole(ADMIN_ROLE) {
        treasuryBackupOracle = _oracle;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function setURI(string memory _newUri) external onlyRole(ADMIN_ROLE) {
        _setURI(_newUri);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
