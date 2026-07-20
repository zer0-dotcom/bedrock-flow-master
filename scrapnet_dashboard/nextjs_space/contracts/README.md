# Bedrock ESG Industrial Ledger Smart Contract

## Overview

The `BedrockESGLedger.sol` is an ERC-1155 smart contract designed for the Industrial Verification Vault system. It implements institutional-grade atomic settlement for asset verification and carbon credit distribution.

## Key Features

### 1. Atomic Settlement
Upon "Proof of Destruction" confirmation, the contract mints a **Digital Representative Token (DRT)** to the depositor's wallet in a single atomic transaction.

### 2. Carbon Credit Distribution (70/20/10 Split)
| Recipient | Share | Purpose |
|-----------|-------|----------|
| Participating Bank | 70% | Incentive for participation |
| Bedrock ESG Platform | 20% | Operating/platform fee |
| Global Sustainability Pool | 10% | Environmental fund |

### 3. Hedera Consensus Service Integration
All minted tokens are permanently linked to:
- Hedera HCS Topic ID
- HCS Sequence Number
- SHA-256 hash of destruction video

## Token Types

| Token ID | Name | Description |
|----------|------|-------------|
| 1 | DRT_TOKEN | Digital Representative Token |
| 2 | CARBON_CREDIT | Verified Carbon Credit |
| 3 | UNVERIFIED_CREDIT | Pending verification |

## Core Functions

### `mintOnDestruction()`
```solidity
function mintOnDestruction(
    address _depositor,
    string calldata _verificationId,
    bytes32 _destructionVideoHash,
    string calldata _hederaTopicId,
    string calldata _hederaSequenceNumber,
    string calldata _currencyType,
    uint256 _totalValue,
    uint256 _avoidedCo2Grams
) external returns (uint256 tokenId)
```

**Parameters:**
- `_depositor`: Bank/vault wallet address
- `_verificationId`: Bedrock ESG verification ID (e.g., "VLT-2026-XXXXX")
- `_destructionVideoHash`: SHA-256 hash of destruction video
- `_hederaTopicId`: Hedera HCS topic ID
- `_hederaSequenceNumber`: HCS message sequence number
- `_currencyType`: Currency type (USD, EUR, GOLD_BULLION, etc.)
- `_totalValue`: Total value destroyed (smallest unit)
- `_avoidedCo2Grams`: CO2 avoided by on-site tokenization

**Returns:** Minted token ID

### View Functions

```solidity
// Get full destruction record
function getDestructionRecord(uint256 _tokenId) external view returns (DestructionRecord memory)

// Get Hedera attestation details
function getHederaAttestation(uint256 _tokenId) external view returns (
    string memory topicId,
    string memory sequenceNumber,
    bytes32 destructionHash
)

// Get credit allocation breakdown
function getCreditAllocation(uint256 _tokenId) external view returns (
    uint256 total,
    uint256 bankShare,
    uint256 platformShare,
    uint256 sustainabilityShare
)

// Verify Hedera link integrity
function verifyHederaLink(uint256 _tokenId, bytes32 _expectedHash) external view returns (bool)
```

## Access Control Roles

| Role | Permissions |
|------|-------------|
| MINTER_ROLE | Can call `mintOnDestruction()` |
| VERIFIER_ROLE | Reserved for future verification extensions |
| ADMIN_ROLE | Can update treasury, pool addresses, pause/unpause |

## Deployment

### Prerequisites
- Solidity ^0.8.20
- OpenZeppelin Contracts v5.x
- Hardhat or Foundry

### Constructor Parameters
```solidity
constructor(
    string memory _uri,              // Token metadata URI
    address _bedrockTreasury,       // Platform fee recipient
    address _sustainabilityPool      // Environmental fund address
)
```

### Example Deployment (Hardhat)
```javascript
const BedrockESGLedger = await ethers.getContractFactory("BedrockESGLedger");
const ledger = await BedrockESGLedger.deploy(
    "https://api.bedrock-esg.io/metadata/{id}.json",
    "0xBedrock ESGTreasuryAddress",
    "0xSustainabilityPoolAddress"
);
await ledger.deployed();
```

## Events

```solidity
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
```

## Security Features

1. **ReentrancyGuard**: Prevents reentrancy attacks
2. **Pausable**: Emergency stop mechanism
3. **AccessControl**: Role-based permissions
4. **Hash Uniqueness**: Prevents duplicate destruction claims

## Integration with Bedrock ESG Dashboard

The contract is designed to be called from the Bedrock ESG backend when:
1. A vault verification reaches `DESTRUCTION_UPLOADED` status
2. The logistics audit is complete
3. Credit status becomes `VERIFIED`

The backend should call `mintOnDestruction()` with data from:
- `VaultVerification` record
- `LogisticsAudit` result
- Hedera HCS attestation

## License

MIT
