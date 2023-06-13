"use strict";(globalThis.webpackChunkgutenberg=globalThis.webpackChunkgutenberg||[]).push([[9425],{"./packages/block-editor/src/components/line-height-control/stories/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{Default:()=>Default,UnconstrainedWidth:()=>UnconstrainedWidth,default:()=>stories});var react=__webpack_require__("./node_modules/react/index.js"),build_module=__webpack_require__("./packages/deprecated/build-module/index.js"),i18n_build_module=__webpack_require__("./packages/i18n/build-module/index.js"),number_control=__webpack_require__("./packages/components/build-module/number-control/index.js");var jsx_runtime=__webpack_require__("./node_modules/react/jsx-runtime.js");const LineHeightControl=({value:lineHeight,onChange,__nextHasNoMarginBottom=!1,__unstableInputWidth="60px",...otherProps})=>{const isDefined=function isLineHeightDefined(lineHeight){return void 0!==lineHeight&&""!==lineHeight}(lineHeight),adjustNextValue=(nextValue,wasTypedOrPasted)=>{if(isDefined)return nextValue;switch(`${nextValue}`){case"0.1":return 1.6;case"0":return wasTypedOrPasted?nextValue:1.4;case"":return 1.5;default:return nextValue}},value=isDefined?lineHeight:"";__nextHasNoMarginBottom||(0,build_module.Z)("Bottom margin styles for wp.blockEditor.LineHeightControl",{since:"6.0",version:"6.4",hint:"Set the `__nextHasNoMarginBottom` prop to true to start opting into the new styles, which will become the default in a future version"});const deprecatedStyles=__nextHasNoMarginBottom?void 0:{marginBottom:24};return(0,jsx_runtime.jsx)("div",{className:"block-editor-line-height-control",style:deprecatedStyles,children:(0,jsx_runtime.jsx)(number_control.Z,{...otherProps,__unstableInputWidth,__unstableStateReducer:(state,action)=>{const wasTypedOrPasted=["insertText","insertFromPaste"].includes(action.payload.event.nativeEvent?.inputType),value=adjustNextValue(state.value,wasTypedOrPasted);return{...state,value}},onChange:(nextValue,{event})=>{""!==nextValue?"click"!==event.type?onChange(`${nextValue}`):onChange(adjustNextValue(`${nextValue}`,!1)):onChange()},label:(0,i18n_build_module.__)("Line height"),placeholder:1.5,step:.1,value,min:0,spinControls:"custom"})})};LineHeightControl.displayName="LineHeightControl",LineHeightControl.__docgenInfo={description:"",methods:[],displayName:"LineHeightControl",props:{__nextHasNoMarginBottom:{defaultValue:{value:"false",computed:!1},required:!1},__unstableInputWidth:{defaultValue:{value:"'60px'",computed:!1},required:!1}}};const line_height_control=LineHeightControl;"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["packages/block-editor/src/components/line-height-control/index.js"]={name:"LineHeightControl",docgenInfo:LineHeightControl.__docgenInfo,path:"packages/block-editor/src/components/line-height-control/index.js"});const stories={parameters:{sourceLink:"packages/block-editor/src/components/line-height-control",storySource:{source:"/**\n * WordPress dependencies\n */\nimport { useState } from '@wordpress/element';\n\n/**\n * Internal dependencies\n */\nimport LineHeightControl from '../';\n\nexport default {\n\tcomponent: LineHeightControl,\n\ttitle: 'BlockEditor/LineHeightControl',\n};\n\nconst Template = ( props ) => {\n\tconst [ value, setValue ] = useState();\n\treturn (\n\t\t<LineHeightControl onChange={ setValue } value={ value } { ...props } />\n\t);\n};\n\nexport const Default = Template.bind( {} );\nDefault.args = {\n\t__nextHasNoMarginBottom: true,\n\t__unstableInputWidth: '100px',\n};\n\nexport const UnconstrainedWidth = Template.bind( {} );\nUnconstrainedWidth.args = {\n\t...Default.args,\n\t__unstableInputWidth: '100%',\n};\n",locationsMap:{default:{startLoc:{col:17,line:16},endLoc:{col:1,line:21},startBody:{col:17,line:16},endBody:{col:1,line:21}},"unconstrained-width":{startLoc:{col:17,line:16},endLoc:{col:1,line:21},startBody:{col:17,line:16},endBody:{col:1,line:21}}}}},component:line_height_control,title:"BlockEditor/LineHeightControl"},Template=props=>{const[value,setValue]=(0,react.useState)();return(0,jsx_runtime.jsx)(line_height_control,{onChange:setValue,value,...props})};Template.displayName="Template";const Default=Template.bind({});Default.args={__nextHasNoMarginBottom:!0,__unstableInputWidth:"100px"};const UnconstrainedWidth=Template.bind({});UnconstrainedWidth.args={...Default.args,__unstableInputWidth:"100%"}}}]);