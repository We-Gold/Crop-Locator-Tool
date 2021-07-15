import{g as e,d as t,a,b as r,p as n,I as i}from"./vendor.a78a7e74.js";const s=new e.exports.GPU({mode:"gpu"});function o(e,t,a){return e+a*t}s.addFunction(o);const h=(e,t,a)=>{const r=Math.trunc(Math.abs(e.data[0].imageWidth-t.data[0].imageWidth)/a),n=Math.trunc(Math.abs(e.data[0].imageLength-t.data[0].imageLength)/a);return s.createKernel((function(e,t){const a=this.thread.x*this.constants.useEveryXPixel,r=this.thread.y*this.constants.useEveryXPixel;let n=0;for(let i=0;i<this.constants.cropLayerWidth;i+=this.constants.useEveryXPixel){const s=a+i;for(let i=0;i<this.constants.cropLayerLength;i+=this.constants.useEveryXPixel){const h=r+i,c=o(s,h,this.constants.sourceImageLayerWidth),d=o(s-a,h-r,this.constants.cropLayerWidth),l=e[c],u=t[d];n+=Math.abs(l-u)}}return n})).setOutput([r,n]).setConstants({sourceImageLayerWidth:e.data[0].imageWidth,cropLayerWidth:t.data[0].imageWidth,cropLayerLength:t.data[0].imageLength,useEveryXPixel:a})},c=(e,t,a,r,n,i,h)=>{const{xAxisScans:c,yAxisScans:d}=l(e,t,a,r);return s.createKernel((function(e,t){const a=this.thread.x*this.constants.useEveryXPixel+this.constants.originX,r=this.thread.y*this.constants.useEveryXPixel+this.constants.originY;let n=0;for(let i=0;i<this.constants.cropLayerWidth;i+=this.constants.useEveryXPixel){const s=a+i;for(let i=0;i<this.constants.cropLayerLength;i+=this.constants.useEveryXPixel){const h=r+i,c=o(s,h,this.constants.sourceImageLayerWidth),d=o(s-a,h-r,this.constants.cropLayerWidth),l=e[c],u=t[d];n+=Math.abs(l-u)}}return n})).setOutput([c,d]).setConstants({sourceImageLayerWidth:e.data[0].imageWidth,cropLayerWidth:t.data[0].imageWidth,cropLayerLength:t.data[0].imageLength,useEveryXPixel:n,originX:i,originY:h})},d=(e,t,a)=>Math.min(Math.max(e,t),a),l=(e,t,a,r)=>{const{useEveryXPixel:n,useEveryXLayer:i}=r(),s=Math.abs(e.data[0].imageWidth-t.data[0].imageWidth),o=d(a.x-n,0,s),h=d(a.x+n,0,s)-o,c=Math.abs(e.data[0].imageLength-t.data[0].imageLength),l=d(a.y-n,0,c),u=d(a.y+n,0,c)-l,g=Math.abs(e.data.length-t.data.length),y=d(a.z-i,0,g);return{xScanStart:o,xAxisScans:h,yScanStart:l,yAxisScans:u,zScanStart:y,zAxisScans:d(a.z+i,0,g)-y}},u=({result:e,crop:t,convertPosition:a,threshold:r=.1})=>{const{useEveryXPixel:n,useEveryXLayer:i}=a(),s=(({threshold:e=.1,cropWidth:t,cropHeight:a,range:r=[0,255],useEveryXPixel:n})=>e*Math.abs(r[0]-r[1])*Math.trunc(t/n*a/n))({threshold:r,cropWidth:t.data[0].imageWidth,cropHeight:t.data[0].imageLength,useEveryXPixel:n,useEveryXLayer:i}),o=[];for(const[h,c]of Object.entries(e))for(const[e,t]of Object.entries(c))for(const[a,r]of Object.entries(t))if(r<s){const t=[h,e,a].map((e=>parseInt(e)));o.push({difference:r,index:t})}if(0==o.length)return null;return o.map((e=>{const t=e.index;return Object.assign(a({x:t[2],y:t[1],z:t[0]}),{difference:e.difference})}))},g=(e,t,{useEveryXPixel:a,useEveryXLayer:r,threshold:n})=>{const[i,s]=((e,t,{useEveryXLayer:a,useEveryXPixel:r})=>{const n=h(e,t,r),i=Math.abs(e.data.length-t.data.length);let s=[];for(let o=0;o<=i;o+=a){const a=e.data[o],r=t.data[0];s.push(n(a.data,r.data))}return[s,(e=null)=>null==e?{useEveryXPixel:r,useEveryXLayer:a}:{x:e.x*r,y:e.y*r,z:e.z*a}]})(e,t,{useEveryXPixel:a,useEveryXLayer:r});return[u({result:i,crop:t,convertPosition:s,threshold:n}),s,i]},y=(e,t,a,r,{useEveryXPixel:n,useEveryXLayer:i,threshold:s})=>{const[o,h]=((e,t,a,r,{useEveryXLayer:n,useEveryXPixel:i})=>{const s=a.map(((n,s)=>{const{xScanStart:o,yScanStart:h}=l(e,t,a[s],r);return c(e,t,n,r,i,o,h)})).map(((i,s)=>{const{zScanStart:o,zAxisScans:h}=l(e,t,a[s],r);let c=[];for(let a=o;a<=o+h;a+=n){const r=e.data[a],n=t.data[0];c.push(i(r.data,n.data))}return c})),{zScanStart:o,xScanStart:h,yScanStart:d}=l(e,t,a[0],r);return[s,(e=null)=>null==e?{useEveryXPixel:i,useEveryXLayer:n}:{x:e.x*i+h,y:e.y*i+d,z:e.z*n+o}]})(e,t,a,r,{useEveryXPixel:n,useEveryXLayer:i});return[o.map((e=>u({result:e,crop:t,convertPosition:h,threshold:s}))).reduce(((e,t)=>e.concat(t)),[]),h,o]},p=e=>e.reduce(((e,t)=>null==t?e:t.difference<e.difference?t:e),{difference:Number.MAX_VALUE}),m=(e,t,a=!1)=>{const r=((e,t)=>{const a=[];return null!=e&&null!=e||a.push("The source image provided is not defined"),null!=t&&null!=t||a.push("The cropped image provided is not defined"),(e.data.length<t.data.length||e.data[0].imageWidth<t.data[0].imageWidth||e.data[0].imageLength<t.data[0].imageLength)&&a.push("The source image provided is smaller than the cropped image"),a})(e,t);if(r.length>0)return{errors:r};console.time("pipeline");const{errors:n,pipeline:i,positions:s,bestPosition:o}=((e,t,a)=>{const r=[];for(const[n,i]of a.entries()){const{useEveryXPixel:a,useEveryXLayer:s,threshold:o}=i;if(0===n){const[n,i,h]=g(e,t,{useEveryXPixel:a,useEveryXLayer:s,threshold:o});r.push([n,i,h]);continue}if(null==r[n-1][0]||0===r[n-1][0].length)return{errors:["No match found"]};if(!r[n-1][0].some((e=>null!=e)))return{errors:["No match found"]};const h=[p(r[n-1][0])],[c,d,l]=y(e,t,h,r[n-1][1],{useEveryXPixel:a,useEveryXLayer:s,threshold:o});r.push([c,d,l])}return{pipeline:r,positions:r[r.length-1],bestPosition:p(r[r.length-1][0])}})(e,t,a?[{useEveryXPixel:5,useEveryXLayer:50,threshold:.1},{useEveryXPixel:1,useEveryXLayer:1,threshold:.03}]:[{useEveryXPixel:10,useEveryXLayer:50,threshold:.1},{useEveryXPixel:10,useEveryXLayer:5,threshold:.06},{useEveryXPixel:1,useEveryXLayer:1,threshold:.01}]);return console.timeEnd("pipeline"),{errors:n,pipeline:i,positions:s,bestPosition:o}},f=e=>{null!=e&&null!=e&&e.forEach((e=>(e=>{console.error(e),alert(e)})(e)))},v=async({imagePath:e=null,arrayBuffer:n=null,getImageDimensions:i=null})=>{if(null==e&&null==n)return{errors:["No image provided"]};if(null!=e){const t=(e=>{const t=[];return null!=e&&null!=e||t.push("No image path provided"),t})(e);if(0!=t.length)return{errors:t};n=await(async e=>{const t=await a.get(e,{responseType:"arraybuffer"});return r.Buffer.from(t.data,"utf-8")})(e)}let s;try{s=t(n)}catch(o){return{errors:["An image provided is not a tiff. Currently this tool only accepts tiffs."]}}return{data:s}},x=({errorHandler:e=f,callback:t})=>async a=>{const r=a.target.files[0],n=await r.arrayBuffer(),{data:i,errors:s}=await v({arrayBuffer:n,getImageDimensions:async()=>{const e=window.URL.createObjectURL(r);return await(e=>new Promise((t=>{const a=new Image;a.onload=()=>{t({imageHeight:a.height,imageWidth:a.width})},a.src=e})))(e)}});e(s),null!=i&&t({data:i,dimensions:{width:i[0].imageWidth,height:i[0].imageLength}})},L=(e,t,a,{strokeColor:r="rgb(64, 196, 82)",highlightColor:n="rgba(64, 196, 82, 0.3)"}={})=>{const i=e.getContext("2d");i.fillStyle=n,i.strokeStyle=r;const{x:s,y:o}=t,{w:h,h:c}=a;i.fillRect(s,o,h,c),i.strokeRect(s,o,h,c)},E=({imageData:e,width:t,height:a,canvasElement:r,imageRange:i=[0,255],colorScale:s="greys"})=>{const o=new n({canvas:r,data:e,width:t,height:a,domain:i,colorScale:s,useWebGL:!1});return o.render(),o};function X(e,t,a){return e+a*t}const P=(e,t,a,r)=>{let n=new i(t,a,e,{kind:"GREY"});return n=n.rotate(-r,{interpolation:"bilinear"}),n},w=(e,t)=>{const a=e.parent.width,r=Math.abs(a*Math.sin(S(t))),n=r/(Math.abs(a*Math.cos(S(t)))+r)*a,i=Math.trunc(n*Math.cos(S(t))),s=Math.trunc(r-n*Math.sin(S(t))),o=e.width-s-i,h=e.height-i-s;return e=e.crop({x:i,y:s,width:o,height:h})},S=e=>e*Math.PI/180,W=(e,t)=>(e.imageWidth=e.width,e.imageLength=e.height,Array.from({length:t},(t=>e))),b={sourceImage:null,crop:null},M=(e,t)=>{if(e){const a=b.crop.data[0],r=((e,t,a,r,n=1)=>{let i=P(e,t,a,r);return i=w(i,r),W(i,n)})(a.data,a.imageWidth,a.imageLength,t,b.crop.data.length);b.crop={data:r,dimensions:b.crop.dimensions,angle:t,isRotated:e}}else{const e=((e,t,a,r,{width:n=100,height:s=100}={})=>{let o=new i(t,a,e,{kind:"GREY"});const h=Math.min(n,t),c=Math.min(s,a);return o=o.crop({x:0,y:0,width:h,height:c}),W(o,r)})(b.crop.data[0].data,b.crop.dimensions.width,b.crop.dimensions.height,b.crop.data.length,{width:150,height:150});b.crop={data:e,dimensions:b.crop.dimensions}}},z=({isRotated:e,position:t,sourceCanvas:a})=>{if(e){const e={width:b.crop.data[0].imageWidth,height:b.crop.data[0].imageLength},{position:r,width:n,height:i}=((e,t,a)=>({position:{x:e.x-Math.round((a.width-t.width)/2),y:e.y-Math.round((a.height-t.height)/2),z:e.z},width:a.width,height:a.height}))(t,e,b.crop.dimensions);b.crop.position=r,L(a,r,{w:n,h:i})}else{const{position:e,width:r,height:n}=((e,t)=>({position:{x:e.x,y:e.y,z:e.z},width:t.width,height:t.height}))(t,b.crop.dimensions);b.crop.position=e,L(a,e,{w:r,h:n})}},R=()=>{if(null==b.sourceImage||null==b.crop)return;const{isRotated:e,angle:t}=(e=>{const{data:t,imageWidth:a,imageLength:r}=e.data[0],n=t[X(0,0,a)],i=t[X(a,0,a)],s=t[X(0,r-1,a)],o=t[X(a-1,r-1,a)];if(0!==n||0!==i||0!==s||0!==o)return{isRotated:!1};let h=a;for(let g=a-1;g>=0&&0===t[X(g-1,0,a)];g--)h=g;let c=0;for(let g=1;g<=r&&0===t[X(a-1,g,a)];g++)c=g;if(h===a&&0===c)return{isRotated:!1};const d=a-h,l=.5*d*c;let u=0;for(let g=h;g<a;g++)for(let e=0;e<c;e++)0===t[X(g,e,a)]&&u++;return u/l<.45?{isRotated:!1}:{isRotated:!0,angle:180*Math.atan(c/d)/Math.PI}})(b.crop);M(e,t);const a=document.querySelector("#crop-canvas"),r=b.crop.data[0];E({imageData:r.data,width:r.imageWidth,height:r.imageLength,canvasElement:a});const{errors:n,bestPosition:i}=m(b.sourceImage,b.crop,e);f(n);const s=document.querySelector("#source-image-canvas"),o=b.sourceImage.data[0];if(E({imageData:o.data,width:o.imageWidth,height:o.imageLength,canvasElement:s}),null!=n&&n.length>0)return;const h={x:i.x,y:i.y,z:i.z+1};b.crop.position=h;const c=b.sourceImage.data[h.z-1];E({imageData:c.data,width:c.imageWidth,height:c.imageLength,canvasElement:s}),z({isRotated:e,position:h,sourceCanvas:s}),I()},I=()=>{const e=`${b.crop.position.x}-${b.crop.position.x+b.crop.dimensions.width}`,t=`${b.crop.position.y}-${b.crop.position.y+b.crop.dimensions.height}`,a=`${b.crop.position.z}-${b.crop.position.z+b.crop.data.length}`,r=null!=b.crop.isRotated?`${Math.round(b.crop.angle)}`:"",n=`Crop Position: <br> x - ${e}, y - ${t}, z - ${a} ${null!=b.crop.isRotated?`<br> Rotated - ${r}°`:""}`;document.querySelector("#crop-info").innerHTML=n},$=x({callback:e=>{b.sourceImage=e,R()}}),A=x({callback:e=>{b.crop=e,R()}});document.querySelector("#source-image-input").addEventListener("change",$),document.querySelector("#crop-image-input").addEventListener("change",A);