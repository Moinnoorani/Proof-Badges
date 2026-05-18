// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {BadgeContract} from "../src/BadgeContract.sol";

contract BadgeContractSoulboundTest is Test {
    BadgeContract public badge;

    function setUp() public {
        badge = new BadgeContract();
    }

    function testFuzz_soulbound_transferReverts(
        uint96 maxSupply,
        uint64 startTime,
        uint64 endTime,
        uint256 claimerSeed
    ) public {
        maxSupply = uint96(bound(maxSupply, 1, 10_000));
        vm.assume(endTime > startTime);
        vm.warp(startTime + (endTime - startTime) / 2);

        address claimer = address(uint160(bound(claimerSeed, 1, type(uint160).max)));

        uint256 campaignId = badge.createCampaign(maxSupply, startTime, endTime, true, "https://example.com/");

        vm.prank(claimer);
        uint256 tokenId = badge.claim(campaignId);

        address attacker = address(0xdead);
        vm.prank(claimer);
        vm.expectRevert(BadgeContract.SoulboundTransfer.selector);
        badge.transferFrom(claimer, attacker, tokenId);

        vm.prank(claimer);
        vm.expectRevert(BadgeContract.SoulboundTransfer.selector);
        badge.safeTransferFrom(claimer, attacker, tokenId);
    }

    function testFuzz_nonSoulbound_transferSucceeds(
        uint96 maxSupply,
        uint64 startTime,
        uint64 endTime,
        uint256 claimerSeed,
        uint256 receiverSeed
    ) public {
        maxSupply = uint96(bound(maxSupply, 1, 10_000));
        vm.assume(endTime > startTime);
        vm.warp(startTime + (endTime - startTime) / 2);

        address claimer = address(uint160(bound(claimerSeed, 1, type(uint160).max)));
        address receiver = address(uint160(bound(receiverSeed, 1, type(uint160).max)));
        vm.assume(receiver != claimer);

        uint256 campaignId = badge.createCampaign(maxSupply, startTime, endTime, false, "https://example.com/");

        vm.prank(claimer);
        uint256 tokenId = badge.claim(campaignId);

        vm.prank(claimer);
        badge.transferFrom(claimer, receiver, tokenId);

        assertEq(badge.ownerOf(tokenId), receiver);
    }

    function testFuzz_mint_soulboundSucceeds(
        uint96 maxSupply,
        uint64 startTime,
        uint64 endTime,
        uint256 claimerSeed
    ) public {
        maxSupply = uint96(bound(maxSupply, 1, 10_000));
        vm.assume(endTime > startTime);
        vm.warp(startTime + (endTime - startTime) / 2);

        address claimer = address(uint160(bound(claimerSeed, 1, type(uint160).max)));

        uint256 campaignId = badge.createCampaign(maxSupply, startTime, endTime, true, "https://example.com/");

        vm.prank(claimer);
        uint256 tokenId = badge.claim(campaignId);

        // Mint (from == address(0)) succeeds even for soulbound
        assertEq(badge.ownerOf(tokenId), claimer);
    }
}
