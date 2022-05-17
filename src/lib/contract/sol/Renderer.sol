//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import './SVG.sol';
import './Utils.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/utils/Base64.sol';

contract Renderer {
  function render(
    uint256 _tokenId,
    string memory _a,
    string memory _timestamp,
    string memory message
  ) public pure returns (string memory) {
    string[7] memory colors = [
      string.concat('ff', utils.getSlice(3, 6, _a)),
      utils.getSlice(7, 12, _a),
      utils.getSlice(13, 18, _a),
      utils.getSlice(19, 24, _a),
      utils.getSlice(25, 30, _a),
      utils.getSlice(31, 36, _a),
      utils.getSlice(37, 42, _a)
    ];

    string memory image = _renderSVG(colors, _a, _timestamp, message);

    return _renderMetaData(_tokenId, image);
  }

  function _renderMetaData(uint256 _tokenId, string memory image)
    internal
    pure
    returns (string memory)
  {
    return
      string.concat(
        'data:application/json;base64,',
        Base64.encode(
          bytes(
            getEeethersJSON(
              name(_tokenId),
              // image data
              Base64.encode(bytes(image))
            )
          )
        )
      );
  }

  function _renderSVG(
    string[7] memory colors,
    string memory _a,
    string memory _timestamp,
    string memory message
  ) internal pure returns (string memory) {
    return
      string.concat(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" fill="none" style="position:relative">',
        svg.el(
          'foreignObject',
          string.concat(
            svg.prop('x', '0'),
            svg.prop('y', '0'),
            svg.prop('width', '400'),
            svg.prop('height', '400'),
            conicGradient(colors)
          ),
          svg.el(
            'div',
            string.concat(
              svg.prop('xmlns', 'http://www.w3.org/1999/xhtml'),
              svg.prop(
                'style',
                'background:#f2f3f5;position:absolute;top:30px;left:30px;height:308px;width:308px;padding: 16px;font-size:8px;font-family:monospace;text-align:left;box-shadow:0 4px 12px 8px rgba(0,0,0,.5)'
              )
            ),
            _renderCopy(colors, _a, _timestamp, message)
          )
        ),
        '</svg>'
      );
  }

  function _renderCopy(
    string[7] memory colors,
    string memory _a,
    string memory _timestamp,
    string memory message
  ) internal pure returns (string memory) {
    return
      string.concat(
        string.concat(
          svg.el(
            'p',
            svg.prop('style', 'display:inline-block'),
            string.concat('signed by<br />', _a)
          ),
          svg.el(
            'p',
            svg.prop(
              'style',
              'display:inline-block;text-align:right;float:right'
            ),
            string.concat('block<br />', _timestamp)
          ),
          svg.el(
            'div',
            string.concat(
              svg.prop('xmlns', 'http://www.w3.org/1999/xhtml'),
              svg.prop(
                'style',
                'position:relative; margin: 8px auto; height:196px;width:276px;border:1px dashed #000;padding:8px;display:flex;align-items:center;justify-content:center'
              )
            ),
            svg.el('p', svg.prop('style', 'word-break: break-all'), message)
          ),
          svg.el(
            'div',
            string.concat(
              svg.prop('xmlns', 'http://www.w3.org/1999/xhtml'),
              svg.prop(
                'style',
                'position:absolute;bottom:16px;right:16px;text-align:right;width:40%'
              )
            ),
            colorsBlock(colors)
          ),
          '<svg width="146" height="32" viewBox="0 0 146 32" fill="black" xmlns="http://www.w3.org/2000/svg" style="position:absolute; bottom:16px;">',
          '<path d="M0 3.5V0h3v3.5H0Z"/><path d="M2.998 7V0h3v7h-3Z"/><path d="M5.996 3.5V0h3v3.5h-3ZM13.994 7V0h3v7h-3Zm5.996 0V0h3v7h-3Zm7.998 0V0h3v7h-3Z"/><path d="M30.986 3.5V0h3v3.5h-3Z"/><path d="M33.984 3.5V0h3v3.5h-3ZM2.998 12V5h3v7h-3Zm10.996 0V5h3v7h-3Z"/><path d="M16.992 8.5V5h3v3.5h-3Z"/><path d="M19.99 12V5h3v7h-3Zm7.998 0V5h3v7h-3Z"/><path d="M30.986 12V5h3v7h-3Z"/><path d="M33.984 12V8.5h3V12h-3ZM0 22v-7h3v7H0Z"/><path d="M2.998 18.5V15h3v3.5h-3Z"/><path d="M5.996 18.5V15h3v3.5h-3Zm7.998 3.5v-7h3v7h-3Zm5.996 0v-7h3v7h-3Zm7.998 0v-7h3v7h-3Z"/><path d="M30.986 18.5V15h3v3.5h-3Z"/><path d="M33.984 18.5V15h3v3.5h-3Zm7.998 3.5v-7h3v7h-3Z"/><path d="M44.98 18.5V15h3v3.5h-3Zm7.998 0V15h3v3.5h-3Z"/><path d="M55.977 22v-7h3v7h-3Z"/><path d="M58.975 18.5V15h3v3.5h-3ZM74.97 22v-7h3v7h-3Z"/><path d="M77.969 22v-3.5h3V22h-3Z"/><path d="M80.967 22v-3.5h3V22h-3Zm7.998 0v-7h3v7h-3Z"/><path d="M91.963 18.5V15h3v3.5h-3Z"/><path d="M94.96 22v-7h3v7h-3Zm7.999 0v-7h3v7h-3Z"/><path d="M105.957 18.5V15h3v3.5h-3Z"/><path d="M108.955 22v-7h3v7h-3Zm7.998 0v-7h3v7h-3Z"/><path d="M119.951 22v-3.5h3V22h-3Zm2.998-3.5V15h3v3.5h-3ZM0 27v-7h3v7H0Z"/><path d="M2.998 27v-3.5h3V27h-3Z"/><path d="M5.996 27v-7h3v7h-3Zm7.998 0v-7h3v7h-3Z"/><path d="M16.992 27v-3.5h3V27h-3Z"/><path d="M19.99 27v-7h3v7h-3Zm7.998 0v-7h3v7h-3Z"/><path d="M30.986 27v-7h3v7h-3Z"/><path d="M33.984 27v-3.5h3V27h-3Zm7.998 0v-3.5h3V27h-3Z"/><path d="M44.98 27v-7h3v7h-3Zm10.997 0v-7h3v7h-3Zm18.993 0v-7h3v7h-3Z"/><path d="M77.969 27v-3.5h3V27h-3Z"/><path d="M80.967 27v-7h3v7h-3Zm7.998 0v-7h3v7h-3Z"/><path d="M91.963 27v-3.5h3V27h-3Z"/><path d="M94.96 27v-7h3v7h-3Zm7.999 0v-7h3v7h-3Z"/><path d="M105.957 27v-3.5h3V27h-3Z"/><path d="M108.955 27v-7h3v7h-3Zm7.998 0v-7h3v7h-3Zm5.996 0v-7h3v7h-3Z"/>',
          '</svg>'
        )
      );
  }

  function conicGradient(string[7] memory colors)
    internal
    pure
    returns (string memory)
  {
    return
      svg.prop(
        'style',
        string.concat(
          'background-image:conic-gradient(from 0deg,',
          string.concat('#', colors[0]),
          string.concat(',#', colors[2]),
          string.concat(',#', colors[3]),
          string.concat(',#', colors[4]),
          string.concat(',#', colors[5]),
          string.concat(',#', colors[6]),
          string.concat(',#', colors[0]),
          ')'
        )
      );
  }

  function colorsBlock(string[7] memory colors)
    internal
    pure
    returns (string memory)
  {
    return
      string.concat(
        svg.el(
          'span',
          svg.prop(
            'style',
            string.concat('color:', string.concat('#', colors[0]))
          ),
          string.concat('#', colors[0])
        ),
        ' ',
        svg.el(
          'span',
          svg.prop(
            'style',
            string.concat('color:', string.concat('#', colors[1]))
          ),
          string.concat('#', colors[1])
        ),
        ' ',
        svg.el(
          'span',
          svg.prop(
            'style',
            string.concat('color:', string.concat('#', colors[2]))
          ),
          string.concat('#', colors[2])
        ),
        '<br />',
        svg.el(
          'span',
          svg.prop(
            'style',
            string.concat('color:', string.concat('#', colors[3]))
          ),
          string.concat('#', colors[3])
        ),
        ' ',
        svg.el(
          'span',
          svg.prop(
            'style',
            string.concat('color:', string.concat('#', colors[4]))
          ),
          string.concat('#', colors[4])
        ),
        ' ',
        svg.el(
          'span',
          svg.prop(
            'style',
            string.concat('color:', string.concat('#', colors[5]))
          ),
          string.concat('#', colors[5])
        ),
        '<br />',
        svg.el(
          'span',
          svg.prop(
            'style',
            string.concat('color:', string.concat('#', colors[6]))
          ),
          string.concat('#', colors[6])
        )
      );
  }

  function name(uint256 _tokenId) internal pure returns (string memory) {
    return string.concat('Guest #', utils.uint2str(_tokenId + 1));
  }

  // Convenience functions for formatting all the metadata related to a particular NFT

  function getEeethersJSON(string memory _name, string memory _imageData)
    internal
    pure
    returns (string memory)
  {
    return
      string.concat(
        '{"name": "',
        _name,
        '", "image": "data:image/svg+xml;base64,',
        _imageData,
        '","decription": "gm.\\n\\nThis NFT commemorates signing a web3 guestbook."',
        '}'
      );
  }
}
