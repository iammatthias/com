"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/index";
exports.ids = ["pages/index"];
exports.modules = {

/***/ "./lib/utils/apolloClient.js":
/*!***********************************!*\
  !*** ./lib/utils/apolloClient.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _apollo_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @apollo/client */ \"@apollo/client\");\n/* harmony import */ var _apollo_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_apollo_client__WEBPACK_IMPORTED_MODULE_0__);\n// apollo client\n\nconst client = new _apollo_client__WEBPACK_IMPORTED_MODULE_0__.ApolloClient({\n  uri: `https://graphql.contentful.com/content/v1/spaces/${\"oisv0rqafzt4\"}/?access_token=${\"pQJHvG-iZyzl6FMUKk4F7uXSTvA1E1j95sVRrBnnqC4\"}`,\n  cache: new _apollo_client__WEBPACK_IMPORTED_MODULE_0__.InMemoryCache(),\n  credentials: 'same-origin'\n});\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (client);//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9saWIvdXRpbHMvYXBvbGxvQ2xpZW50LmpzLmpzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBRUE7QUFFQSxNQUFNRSxNQUFNLEdBQUcsSUFBSUYsd0RBQUosQ0FBaUI7QUFDOUJHLEVBQUFBLEdBQUcsRUFBRyxvREFBbURDLGNBQTRDLGtCQUFpQkEsNkNBQWdELEVBRHhJO0FBRTlCSSxFQUFBQSxLQUFLLEVBQUUsSUFBSVAseURBQUosRUFGdUI7QUFHOUJRLEVBQUFBLFdBQVcsRUFBRTtBQUhpQixDQUFqQixDQUFmO0FBTUEsaUVBQWVQLE1BQWYiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AbGFjaGxhbmpjL3RoZW1lLXN0YXJ0ZXIvLi9saWIvdXRpbHMvYXBvbGxvQ2xpZW50LmpzPzFhMGQiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gYXBvbGxvIGNsaWVudFxuXG5pbXBvcnQgeyBBcG9sbG9DbGllbnQsIEluTWVtb3J5Q2FjaGUgfSBmcm9tICdAYXBvbGxvL2NsaWVudCdcblxuY29uc3QgY2xpZW50ID0gbmV3IEFwb2xsb0NsaWVudCh7XG4gIHVyaTogYGh0dHBzOi8vZ3JhcGhxbC5jb250ZW50ZnVsLmNvbS9jb250ZW50L3YxL3NwYWNlcy8ke3Byb2Nlc3MuZW52Lk5FWFRfUFVCTElDX0NPTlRFTlRGVUxfU1BBQ0VfSUR9Lz9hY2Nlc3NfdG9rZW49JHtwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19DT05URU5URlVMX0FDQ0VTU19UT0tFTn1gLFxuICBjYWNoZTogbmV3IEluTWVtb3J5Q2FjaGUoKSxcbiAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbicsXG59KVxuXG5leHBvcnQgZGVmYXVsdCBjbGllbnRcbiJdLCJuYW1lcyI6WyJBcG9sbG9DbGllbnQiLCJJbk1lbW9yeUNhY2hlIiwiY2xpZW50IiwidXJpIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX0NPTlRFTlRGVUxfU1BBQ0VfSUQiLCJORVhUX1BVQkxJQ19DT05URU5URlVMX0FDQ0VTU19UT0tFTiIsImNhY2hlIiwiY3JlZGVudGlhbHMiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./lib/utils/apolloClient.js\n");

/***/ }),

/***/ "./pages/index.js":
/*!************************!*\
  !*** ./pages/index.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Home),\n/* harmony export */   \"getStaticProps\": () => (/* binding */ getStaticProps)\n/* harmony export */ });\n/* harmony import */ var theme_ui_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! theme-ui/jsx-dev-runtime */ \"theme-ui/jsx-dev-runtime\");\n/* harmony import */ var theme_ui_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(theme_ui_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _apollo_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @apollo/client */ \"@apollo/client\");\n/* harmony import */ var _apollo_client__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_apollo_client__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_mdx_remote_serialize__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next-mdx-remote/serialize */ \"next-mdx-remote/serialize\");\n/* harmony import */ var next_mdx_remote_serialize__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_mdx_remote_serialize__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var next_mdx_remote__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next-mdx-remote */ \"next-mdx-remote\");\n/* harmony import */ var next_mdx_remote__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_mdx_remote__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _lib_utils_apolloClient__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../lib/utils/apolloClient */ \"./lib/utils/apolloClient.js\");\n/* harmony import */ var theme_ui__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! theme-ui */ \"theme-ui\");\n/* harmony import */ var theme_ui__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(theme_ui__WEBPACK_IMPORTED_MODULE_5__);\n\nvar _jsxFileName = \"/Users/iammatthias/Sites/next/com/pages/index.js\";\n\nfunction ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }\n\nfunction _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }\n\nfunction _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }\n\n/** @jsxImportSource theme-ui */\n\n\n\n\n\nfunction Home({\n  source\n}) {\n  return (0,theme_ui_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(theme_ui__WEBPACK_IMPORTED_MODULE_5__.Box, {\n    sx: {\n      bg: 'background',\n      boxShadow: 'card',\n      borderRadius: '4px',\n      gridArea: 'body'\n    },\n    children: (0,theme_ui_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(theme_ui__WEBPACK_IMPORTED_MODULE_5__.Box, {\n      sx: {\n        m: 4\n      },\n      children: (0,theme_ui_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_mdx_remote__WEBPACK_IMPORTED_MODULE_3__.MDXRemote, _objectSpread({}, source), void 0, false, {\n        fileName: _jsxFileName,\n        lineNumber: 23,\n        columnNumber: 9\n      }, this)\n    }, void 0, false, {\n      fileName: _jsxFileName,\n      lineNumber: 18,\n      columnNumber: 7\n    }, this)\n  }, void 0, false, {\n    fileName: _jsxFileName,\n    lineNumber: 10,\n    columnNumber: 5\n  }, this);\n} //////////////// PAGE CONTENT /////////////////////\n// We use getStaticProps to get the content at build time\n\nasync function getStaticProps() {\n  // We define our query here\n  const {\n    data\n  } = await _lib_utils_apolloClient__WEBPACK_IMPORTED_MODULE_4__.default.query({\n    query: _apollo_client__WEBPACK_IMPORTED_MODULE_1__.gql`\n      query {\n        pageCollection(where: { slug: \"home\" }) {\n          items {\n            title\n            body\n          }\n        }\n      }\n    `\n  });\n  const source = data.pageCollection.items[0].body;\n  const mdxSource = await (0,next_mdx_remote_serialize__WEBPACK_IMPORTED_MODULE_2__.serialize)(source); // We return the result of the query as props to pass them above\n\n  return {\n    props: {\n      metadata: data.pageCollection.items[0],\n      source: mdxSource\n    }\n  };\n}//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9pbmRleC5qcy5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRWUsU0FBU0ssSUFBVCxDQUFjO0FBQUVDLEVBQUFBO0FBQUYsQ0FBZCxFQUEwQjtBQUN2QyxTQUNFLGlFQUFDLHlDQUFEO0FBQ0UsTUFBRSxFQUFFO0FBQ0ZDLE1BQUFBLEVBQUUsRUFBRSxZQURGO0FBRUZDLE1BQUFBLFNBQVMsRUFBRSxNQUZUO0FBR0ZDLE1BQUFBLFlBQVksRUFBRSxLQUhaO0FBSUZDLE1BQUFBLFFBQVEsRUFBRTtBQUpSLEtBRE47QUFBQSxjQVFFLGlFQUFDLHlDQUFEO0FBQ0UsUUFBRSxFQUFFO0FBQ0ZDLFFBQUFBLENBQUMsRUFBRTtBQURELE9BRE47QUFBQSxnQkFLRSxpRUFBQyxzREFBRCxvQkFBZUwsTUFBZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBTEY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVJGO0FBQUE7QUFBQTtBQUFBO0FBQUEsVUFERjtBQWtCRCxFQUVEO0FBRUE7O0FBQ08sZUFBZU0sY0FBZixHQUFnQztBQUNyQztBQUNBLFFBQU07QUFBRUMsSUFBQUE7QUFBRixNQUFXLE1BQU1WLGtFQUFBLENBQWE7QUFDbENXLElBQUFBLEtBQUssRUFBRWQsK0NBQUk7QUFDZjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFWc0MsR0FBYixDQUF2QjtBQWFBLFFBQU1NLE1BQU0sR0FBR08sSUFBSSxDQUFDRSxjQUFMLENBQW9CQyxLQUFwQixDQUEwQixDQUExQixFQUE2QkMsSUFBNUM7QUFDQSxRQUFNQyxTQUFTLEdBQUcsTUFBTWpCLG9FQUFTLENBQUNLLE1BQUQsQ0FBakMsQ0FoQnFDLENBa0JyQzs7QUFDQSxTQUFPO0FBQ0xhLElBQUFBLEtBQUssRUFBRTtBQUNMQyxNQUFBQSxRQUFRLEVBQUVQLElBQUksQ0FBQ0UsY0FBTCxDQUFvQkMsS0FBcEIsQ0FBMEIsQ0FBMUIsQ0FETDtBQUVMVixNQUFBQSxNQUFNLEVBQUVZO0FBRkg7QUFERixHQUFQO0FBTUQiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AbGFjaGxhbmpjL3RoZW1lLXN0YXJ0ZXIvLi9wYWdlcy9pbmRleC5qcz80NGQ4Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKiBAanN4SW1wb3J0U291cmNlIHRoZW1lLXVpICovXG5pbXBvcnQgeyBncWwgfSBmcm9tICdAYXBvbGxvL2NsaWVudCdcbmltcG9ydCB7IHNlcmlhbGl6ZSB9IGZyb20gJ25leHQtbWR4LXJlbW90ZS9zZXJpYWxpemUnXG5pbXBvcnQgeyBNRFhSZW1vdGUgfSBmcm9tICduZXh0LW1keC1yZW1vdGUnXG5pbXBvcnQgY2xpZW50IGZyb20gJy4uL2xpYi91dGlscy9hcG9sbG9DbGllbnQnXG5pbXBvcnQgeyBCb3ggfSBmcm9tICd0aGVtZS11aSdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gSG9tZSh7IHNvdXJjZSB9KSB7XG4gIHJldHVybiAoXG4gICAgPEJveFxuICAgICAgc3g9e3tcbiAgICAgICAgYmc6ICdiYWNrZ3JvdW5kJyxcbiAgICAgICAgYm94U2hhZG93OiAnY2FyZCcsXG4gICAgICAgIGJvcmRlclJhZGl1czogJzRweCcsXG4gICAgICAgIGdyaWRBcmVhOiAnYm9keScsXG4gICAgICB9fVxuICAgID5cbiAgICAgIDxCb3hcbiAgICAgICAgc3g9e3tcbiAgICAgICAgICBtOiA0LFxuICAgICAgICB9fVxuICAgICAgPlxuICAgICAgICA8TURYUmVtb3RlIHsuLi5zb3VyY2V9IC8+XG4gICAgICA8L0JveD5cbiAgICA8L0JveD5cbiAgKVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vIFBBR0UgQ09OVEVOVCAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gV2UgdXNlIGdldFN0YXRpY1Byb3BzIHRvIGdldCB0aGUgY29udGVudCBhdCBidWlsZCB0aW1lXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U3RhdGljUHJvcHMoKSB7XG4gIC8vIFdlIGRlZmluZSBvdXIgcXVlcnkgaGVyZVxuICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGNsaWVudC5xdWVyeSh7XG4gICAgcXVlcnk6IGdxbGBcbiAgICAgIHF1ZXJ5IHtcbiAgICAgICAgcGFnZUNvbGxlY3Rpb24od2hlcmU6IHsgc2x1ZzogXCJob21lXCIgfSkge1xuICAgICAgICAgIGl0ZW1zIHtcbiAgICAgICAgICAgIHRpdGxlXG4gICAgICAgICAgICBib2R5XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgYCxcbiAgfSlcblxuICBjb25zdCBzb3VyY2UgPSBkYXRhLnBhZ2VDb2xsZWN0aW9uLml0ZW1zWzBdLmJvZHlcbiAgY29uc3QgbWR4U291cmNlID0gYXdhaXQgc2VyaWFsaXplKHNvdXJjZSlcblxuICAvLyBXZSByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgcXVlcnkgYXMgcHJvcHMgdG8gcGFzcyB0aGVtIGFib3ZlXG4gIHJldHVybiB7XG4gICAgcHJvcHM6IHtcbiAgICAgIG1ldGFkYXRhOiBkYXRhLnBhZ2VDb2xsZWN0aW9uLml0ZW1zWzBdLFxuICAgICAgc291cmNlOiBtZHhTb3VyY2UsXG4gICAgfSxcbiAgfVxufVxuIl0sIm5hbWVzIjpbImdxbCIsInNlcmlhbGl6ZSIsIk1EWFJlbW90ZSIsImNsaWVudCIsIkJveCIsIkhvbWUiLCJzb3VyY2UiLCJiZyIsImJveFNoYWRvdyIsImJvcmRlclJhZGl1cyIsImdyaWRBcmVhIiwibSIsImdldFN0YXRpY1Byb3BzIiwiZGF0YSIsInF1ZXJ5IiwicGFnZUNvbGxlY3Rpb24iLCJpdGVtcyIsImJvZHkiLCJtZHhTb3VyY2UiLCJwcm9wcyIsIm1ldGFkYXRhIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./pages/index.js\n");

/***/ }),

/***/ "@apollo/client":
/*!*********************************!*\
  !*** external "@apollo/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@apollo/client");

/***/ }),

/***/ "next-mdx-remote":
/*!**********************************!*\
  !*** external "next-mdx-remote" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("next-mdx-remote");

/***/ }),

/***/ "next-mdx-remote/serialize":
/*!********************************************!*\
  !*** external "next-mdx-remote/serialize" ***!
  \********************************************/
/***/ ((module) => {

module.exports = require("next-mdx-remote/serialize");

/***/ }),

/***/ "theme-ui":
/*!***************************!*\
  !*** external "theme-ui" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("theme-ui");

/***/ }),

/***/ "theme-ui/jsx-dev-runtime":
/*!*******************************************!*\
  !*** external "theme-ui/jsx-dev-runtime" ***!
  \*******************************************/
/***/ ((module) => {

module.exports = require("theme-ui/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./pages/index.js"));
module.exports = __webpack_exports__;

})();