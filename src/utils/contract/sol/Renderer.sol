//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import './SVG.sol';
import './Utils.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/utils/Base64.sol';

contract Renderer {
  function render(uint256 _tokenId, string memory _a)
    public
    pure
    returns (string memory)
  {
    string[7] memory colors = [
      string.concat('#ff', utils.getSlice(3, 6, _a)),
      string.concat('#', utils.getSlice(7, 12, _a)),
      string.concat('#', utils.getSlice(13, 18, _a)),
      string.concat('#', utils.getSlice(19, 24, _a)),
      string.concat('#', utils.getSlice(25, 30, _a)),
      string.concat('#', utils.getSlice(31, 36, _a)),
      string.concat('#', utils.getSlice(37, 42, _a))
    ];

    string memory image = _renderSVG(colors);

    return _renderMetaData(_tokenId, image);
  }

  // Convenience functions for formatting all the metadata related to a particular NFT

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

  function name(uint256 _tokenId) internal pure returns (string memory) {
    return string.concat('Guest #', utils.uint2str(_tokenId + 1));
  }

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

  function _renderGradientCircle(string[7] memory colors)
    internal
    pure
    returns (string memory)
  {
    return
      svg.el(
        'defs',
        utils.NULL,
        svg.el(
          'linearGradient',
          string.concat(
            svg.prop('id', 'ethGradient'),
            svg.prop('gradientTransform', 'rotate(90)')
          ),
          string.concat(_renderGradient(colors))
        )
      );
  }

  function _renderGradient(string[7] memory colors)
    internal
    pure
    returns (string memory)
  {
    return
      string.concat(
        svg.el(
          'stop',
          string.concat(
            svg.prop('offset', '0%'),
            svg.prop('stop-color', colors[0])
          )
        ),
        svg.el(
          'stop',
          string.concat(
            svg.prop('offset', '16.6%'),
            svg.prop('stop-color', colors[1])
          )
        ),
        svg.el(
          'stop',
          string.concat(
            svg.prop('offset', '33.2%'),
            svg.prop('stop-color', colors[2])
          )
        ),
        svg.el(
          'stop',
          string.concat(
            svg.prop('offset', '49.8%'),
            svg.prop('stop-color', colors[3])
          )
        ),
        svg.el(
          'stop',
          string.concat(
            svg.prop('offset', '66.4%'),
            svg.prop('stop-color', colors[4])
          )
        ),
        svg.el(
          'stop',
          string.concat(
            svg.prop('offset', '83%'),
            svg.prop('stop-color', colors[5])
          )
        ),
        svg.el(
          'stop',
          string.concat(
            svg.prop('offset', '100%'),
            svg.prop('stop-color', colors[6])
          )
        )
      );
  }

  function _renderSVG(string[7] memory colors)
    internal
    pure
    returns (string memory)
  {
    return
      string.concat(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" style="background:#fff; font-family: monospace;">',
        svg.rect(
          string.concat(
            svg.prop('fill', '#fff'),
            svg.prop('stroke-width', '2'),
            svg.prop('stroke', 'black'),
            svg.prop('width', '398'),
            svg.prop('height', '398'),
            svg.prop('x', '1'),
            svg.prop('y', '1')
          )
        ),
        _renderGradientCircle(colors),
        svg.el(
          'circle',
          string.concat(
            svg.prop('cx', '200'),
            svg.prop('cy', '200'),
            svg.prop('r', '100'),
            svg.prop('fill', 'url(#ethGradient)')
          )
        ),
        svg.text(
          string.concat(svg.prop('x', '142'), svg.prop('y', '24')),
          string.concat(
            svg.el(
              'tspan',
              svg.prop('fill', colors[0]),
              string.concat(colors[0], ' ')
            ),
            svg.el(
              'tspan',
              svg.prop('fill', colors[1]),
              string.concat(colors[1], ' ')
            ),
            svg.el(
              'tspan',
              svg.prop('fill', colors[2]),
              string.concat(colors[2], ' ')
            ),
            svg.el(
              'tspan',
              svg.prop('fill', colors[3]),
              string.concat(colors[3], ' ')
            )
          )
        ),
        svg.text(
          string.concat(svg.prop('x', '205'), svg.prop('y', '40')),
          string.concat(
            svg.el(
              'tspan',
              svg.prop('fill', colors[4]),
              string.concat(colors[4], ' ')
            ),
            svg.el(
              'tspan',
              svg.prop('fill', colors[5]),
              string.concat(colors[5], ' ')
            ),
            svg.el(
              'tspan',
              svg.prop('fill', colors[6]),
              string.concat(colors[6], ' ')
            )
          )
        ),
        // div with svg logo
        svg.path(
          string.concat(
            svg.prop('transform', 'translate(16, 350)'),
            svg.prop('fill-rule', 'evenodd'),
            svg.prop('clip-rule', 'evenodd'),
            svg.prop(
              'd',
              'M0 0v4.408h3.761v10.704h3.763l.01-10.704h3.75V0H0Zm17.556 0v15.112h3.763v-4.408h3.76v4.408h3.762V0H25.08v6.297h-3.761V0h-3.763ZM35.11 0v15.126l11.286-.014v-4.408h-3.764V6.297h-3.758V4.408h7.522V0H35.11ZM0 18.888V34h11.285v-8.815H7.524l-.002 4.408h-3.76v-6.297h7.523v-4.408H0Zm17.556 0V34h11.285V18.888h-3.763v10.705h-3.76V18.888h-3.762Zm17.554 0V34h11.286v-4.407h-3.764l.003-4.408h-3.76v-1.889h7.521v-4.408H35.11Zm17.556 0v8.815h3.763l-.002 1.89h-3.761V34h7.524v-8.815h-3.761v-1.889h3.76v-4.408h-7.523Zm13.795 0v4.408h3.763V34h3.761V23.296l3.761.003v-4.411H66.461Zm27.589 0V34h11.284V23.296h-7.522v-4.408h-3.763Zm3.76 8.815.002 1.89h3.759l.002-1.89H97.81Zm13.793-8.815V34h11.286V18.888h-11.286Zm3.764 4.408v6.297h3.758l.003-6.297h-3.761Zm13.792-4.408V34h11.287V18.888h-11.287Zm3.764 4.408v6.297h3.758l.003-6.297h-3.761Zm13.792-4.408V34h3.763v-6.297h3.759V34H158v-8.815h-3.763v-1.889h-3.759v-4.408h-3.763Zm7.524 0-.002 4.408H158v-4.408h-3.761Z'
            ),
            svg.prop('fill', '#000')
          ),
          utils.NULL
        ),
        '</svg>'
      );
  }
}
