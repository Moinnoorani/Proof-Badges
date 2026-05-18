// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BadgeContract} from "../src/BadgeContract.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        BadgeContract badge = new BadgeContract();

        vm.stopBroadcast();
        console2.log("BadgeContract deployed at:", address(badge));
    }
}
