// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {BadgeContract} from "../src/BadgeContract.sol";

contract BadgeContractCreateCampaignTest is Test {
    BadgeContract public badge;

    function setUp() public {
        badge = new BadgeContract();
    }

    function testFuzz_createCampaign_storageRoundtrip(
        uint96 maxSupply,
        uint64 startTime,
        uint64 endTime,
        bool soulbound,
        string memory baseURI
    ) public {
        maxSupply = uint96(bound(maxSupply, 1, 10_000));
        vm.assume(endTime > startTime);
        vm.assume(bytes(baseURI).length <= 256);

        uint256 campaignId = badge.createCampaign(maxSupply, startTime, endTime, soulbound, baseURI);

        (
            address creator,
            uint96 storedMaxSupply,
            uint96 storedMintedCount,
            uint64 storedStartTime,
            uint64 storedEndTime,
            bool storedSoulbound,
            bool storedExists
        ) = badge.campaigns(campaignId);

        assertEq(creator, address(this));
        assertEq(storedMaxSupply, maxSupply);
        assertEq(storedMintedCount, 0);
        assertEq(storedStartTime, startTime);
        assertEq(storedEndTime, endTime);
        assertEq(storedSoulbound, soulbound);
        assertTrue(storedExists);

        string memory storedURI = badge.campaignBaseURI(campaignId);
        assertEq(storedURI, baseURI);
    }
}
