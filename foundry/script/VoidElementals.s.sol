// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {VoidElementals} from "../src/VoidElementals.sol";

contract VoidElementalsScript is Script {
    VoidElementals public voidElementals;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        voidElementals = new VoidElementals(vm.addr(1));

        vm.stopBroadcast();
    }
}
