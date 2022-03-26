// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

/*
  ______      ()  ,                   __           
    //        /`-'|           _/_    /  )        / 
 --//_  _    /   / . . _  _   /     /--<  __ __ /_ 
(_// /_</_  /__-<_(_/_</_/_)_<__   /___/_(_)(_)/ <_
*/

/*
 - 9999 max supply (tokens) 
 - unlimited guestbook signatures 
 - it costs gas to write your message to the contract regardless of minting 
 - to add punctuation to your message, wrap it in quotes 
*/

/// ============ Imports ============
import {ERC721Delegated} from 'gwei-slim-nft-contracts/contracts/base/ERC721Delegated.sol';
import {IBaseERC721Interface, ConfigSettings} from 'gwei-slim-nft-contracts/contracts/base/ERC721Base.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import './base64.sol';

/// @notice The Guest Book Contract
contract TheGuestBook is ERC721Delegated {
  uint256 public constant maxTokens = 9;
  /// @notice total guests
  uint256 public guestCount;
  uint256 public tokenCount;
  mapping(uint256 => string) metadataJson;

  /// @notice delegate constructor for gwei saving nft impl
  constructor(address baseFactory)
    ERC721Delegated(
      baseFactory,
      'The Guest Book',
      'GUEST',
      ConfigSettings({
        royaltyBps: 1000,
        uriBase: '',
        uriExtension: '',
        hasTransferHook: false
      })
    )
  {}

  /// ============ metadata ============
  struct Guest {
    address guest; // The address of the guest.
    string message; // The message the guest sent.
    uint256 timestamp; // The timestamp when the guest visited.
  }
  event NewGuest(address indexed from, string message, uint256 timestamp);
  Guest[] private guests;

  /// @notice returns all guests
  function getAllGuests() public view returns (Guest[] memory) {
    return guests;
  }

  /// ============ guestbook functions ============
  function addGuest(string memory message) private {
    Guest memory g = Guest(msg.sender, message, block.number);
    guests.push(g);
    emit NewGuest(msg.sender, message, block.number);
    guestCount += 1;
  }

  /// @notice write a message to the blockchain
  function signWithoutMint(string memory message) public {
    addGuest(message);
  }

  /// @notice write a message to the blockchain and get an nft
  /// @notice your message will be inscribed in an on-chain svg, recommend less than 590 characters
  function signWithMint(string memory message) public {
    require(tokenCount < (maxTokens), 'No guest mints remaining');
    addGuest(message);
    string memory svgData = getSvg(message);
    mint(svgData);
  }

  /// ============ token functions ============
  function mint(string memory nftMetadata) private {
    metadataJson[tokenCount] = nftMetadata;
    _mint(msg.sender, tokenCount);
    tokenCount += 1;
  }

  /// @notice view token uri
  function tokenURI(uint256 tokenId) external view returns (string memory) {
    return metadataJson[tokenId];
  }

  // ============ nft functions ============
  string[] private strictures = [
    'wagmi ',
    'gmi ',
    'gm ',
    'gm ser ',
    'ser ',
    'curious ',
    'looks rare ',
    'probably nothing '
  ];
  string[] private moji = [
    unicode'🏝️',
    unicode'✌️',
    unicode'👁️👄👁️',
    unicode'🌜🌞🌛',
    unicode'🌀',
    unicode'🌐',
    unicode'✨',
    unicode'🌈',
    unicode'🦄',
    unicode'🚀',
    unicode'👀'
  ];

  function getStricture() internal view returns (string memory) {
    return pluck(tokenCount, 'STRICTURES', strictures);
  }

  function getMoji() internal view returns (string memory) {
    return pluck(tokenCount, 'MOJI', moji);
  }

  function getSvg(string memory message) private view returns (string memory) {
    string[12] memory parts;
    parts[
      0
    ] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><rect width="100%" height="100%"/>';

    parts[
      1
    ] = '<text x="50%" y="15%" style="font-family:serif;font-size:14px;text-anchor:middle;fill:#fff">~~ The Guest Book ~~</text>';

    parts[
      2
    ] = '<foreignObject x="20" y="35%" width="310" height="30%"><div xmlns="http://www.w3.org/1999/xhtml"><p style="font-family:serif;font-size:10px;text-align:center;color:#fff">';

    parts[3] = message;

    parts[
      4
    ] = '</p></div></foreignObject><text x="50%" y="75%" style="font-family:serif;font-size:10px;text-anchor:middle;fill:#fff">';

    parts[5] = toString(tokenCount + 1);

    parts[6] = ' / ';

    parts[7] = toString(maxTokens);

    parts[
      8
    ] = '</text><text x="50%" y="85%" style="font-family:serif;font-size:10px;text-anchor:middle;fill:#fff">';

    parts[9] = getStricture();

    parts[10] = getMoji();

    parts[11] = '</text></svg>';

    string memory output = string(
      abi.encodePacked(
        parts[0],
        parts[1],
        parts[2],
        parts[3],
        parts[4],
        parts[5]
      )
    );
    output = string(
      abi.encodePacked(
        output,
        parts[6],
        parts[7],
        parts[8],
        parts[9],
        parts[10],
        parts[11]
      )
    );

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "guest #',
            toString(tokenCount + 1),
            '", "description": "an on-chain nft svg from a web3 guestbook. curious.\\n\\ninscribed by 0x',
            toAsciiString(msg.sender),
            '", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(output)),
            '"}'
          )
        )
      )
    );
    output = string(abi.encodePacked('data:application/json;base64,', json));

    return output;
  }

  /// ============ helper functions ============
  function toString(uint256 value) internal pure returns (string memory) {
    // Inspired by OraclizeAPI's implementation - MIT license
    // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

    if (value == 0) {
      return '0';
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
      digits++;
      temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
      digits -= 1;
      buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
      value /= 10;
    }
    return string(buffer);
  }

  function random(string memory input) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked(input)));
  }

  function pluck(
    uint256 tokenId,
    string memory keyPrefix,
    string[] memory sourceArray
  ) internal pure returns (string memory) {
    uint256 rand = random(
      string(abi.encodePacked(keyPrefix, toString(tokenId)))
    );
    string memory output = sourceArray[rand % sourceArray.length];
    output = string(abi.encodePacked(output));
    return output;
  }

  function toAsciiString(address x) internal pure returns (string memory) {
    bytes memory s = new bytes(40);
    for (uint256 i = 0; i < 20; i++) {
      bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8 * (19 - i)))));
      bytes1 hi = bytes1(uint8(b) / 16);
      bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
      s[2 * i] = char(hi);
      s[2 * i + 1] = char(lo);
    }
    return string(s);
  }

  function char(bytes1 b) internal pure returns (bytes1 c) {
    if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
    else return bytes1(uint8(b) + 0x57);
  }
}
