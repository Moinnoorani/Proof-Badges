// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract BadgeContract is ERC721Enumerable {
    error CampaignNotFound();
    error NotStarted();
    error Ended();
    error SoldOut();
    error AlreadyClaimed();
    error SoulboundTransfer();
    error InvalidWindow();
    error InvalidSupply();

    event CampaignCreated(uint256 indexed campaignId, address indexed creator);
    event BadgeClaimed(uint256 indexed campaignId, address indexed claimer, uint256 indexed tokenId);

    struct Campaign {
        address  creator;
        uint96   maxSupply;
        uint96   mintedCount;
        uint64   startTime;
        uint64   endTime;
        bool     soulbound;
        bool     exists;
    }

    mapping(uint256 => Campaign)                 public campaigns;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => uint256)                  public tokenIdToCampaign;
    mapping(uint256 => string)                   public campaignBaseURI;

    uint256 public nextCampaignId = 1;
    uint256 public nextTokenId = 1;

    constructor() ERC721("Proof Badge", "PROOF") {}

    function createCampaign(
        uint96 maxSupply,
        uint64 startTime,
        uint64 endTime,
        bool soulbound,
        string calldata baseURI
    ) external returns (uint256 campaignId) {
        if (maxSupply == 0 || maxSupply > 10_000) revert InvalidSupply();
        if (endTime <= startTime) revert InvalidWindow();
        campaignId = nextCampaignId;
        ++nextCampaignId;
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            maxSupply: maxSupply,
            mintedCount: 0,
            startTime: startTime,
            endTime: endTime,
            soulbound: soulbound,
            exists: true
        });
        campaignBaseURI[campaignId] = baseURI;
        emit CampaignCreated(campaignId, msg.sender);
    }

    function claim(uint256 campaignId) external returns (uint256 tokenId) {
        Campaign storage c = campaigns[campaignId];
        if (!c.exists)                       revert CampaignNotFound();
        if (block.timestamp < c.startTime)   revert NotStarted();
        if (block.timestamp >= c.endTime)    revert Ended();
        if (c.mintedCount >= c.maxSupply)    revert SoldOut();
        if (hasClaimed[campaignId][msg.sender]) revert AlreadyClaimed();

        hasClaimed[campaignId][msg.sender] = true;
        c.mintedCount += 1;
        tokenId = nextTokenId;
        ++nextTokenId;
        tokenIdToCampaign[tokenId] = campaignId;
        _safeMint(msg.sender, tokenId);
        emit BadgeClaimed(campaignId, msg.sender, tokenId);
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        _requireOwned(_tokenId);
        return campaignBaseURI[tokenIdToCampaign[_tokenId]];
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && campaigns[tokenIdToCampaign[tokenId]].soulbound) {
            revert SoulboundTransfer();
        }
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
