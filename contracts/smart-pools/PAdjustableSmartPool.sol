pragma solidity 0.6.4;

import "./PCappedSmartPool.sol";
import {PAdjustableSmartPoolStorage as PAStorage} from "../storage/PAdjustableSmartPoolStorage.sol";
import {LibConst as constants} from "../libraries/LibConst.sol";
import "../libraries/LibAddRemoveToken.sol";
import "../libraries/LibWeights.sol";


// Based on Balancer configurable weights pool

contract PAdjustableSmartPool is PCappedSmartPool {
  function updateWeight(address _token, uint256 _newWeight) external noReentry onlyController {
    LibWeights.updateWeight(_token, _newWeight);
  }

  // Let external actors poke the contract with pokeWeights(),
  // to slowly get to newWeights at endBlock
  function updateWeightsGradually(
    uint256[] calldata _newWeights,
    uint256 _startBlock,
    uint256 _endBlock
  ) external noReentry onlyController {
    LibWeights.updateWeightsGradually(_newWeights, _startBlock, _endBlock);
  }

  function pokeWeights() external noReentry {
    LibWeights.pokeWeights();
  }

  function applyAddToken() external noReentry onlyController {
    LibAddRemoveToken.applyAddToken();
  }

  function commitAddToken(
    address _token,
    uint256 _balance,
    uint256 _denormalizedWeight
  ) external noReentry onlyController {
    LibAddRemoveToken.commitAddToken(_token, _balance, _denormalizedWeight);
  }

  function removeToken(address _token) external noReentry onlyController {
    LibAddRemoveToken.removeToken(_token);
  }

  function getNewWeights() external view returns (uint256[] memory weights) {
    return PAStorage.load().newWeights;
  }

  function getStartWeights() external view returns (uint256[] memory weights) {
    return PAStorage.load().startWeights;
  }

  function getStartBlock() external view returns (uint256) {
    return PAStorage.load().startBlock;
  }

  function getEndBlock() external view returns (uint256) {
    return PAStorage.load().endBlock;
  }
}
