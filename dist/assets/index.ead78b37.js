import{g as e,d as t,C as a,a as r,p as n}from"./vendor.457b9c4e.js";const s=new e.exports.GPU({mode:"gpu"});s.addFunction((function(e,t,a){return e+a*t})),s.addFunction((function(e,t,a,r,n,s,i,o){let c=0;for(let l=a;l<=a+s;l+=o)for(let u=r;u<=r+i;u+=o){const i=getImageDataIndex(l,u,n),o=getImageDataIndex(l-a,u-r,s),d=e[i],h=t[o];c+=Math.abs(d-h)}return c}));const i=(e,t,a)=>{const r=Math.trunc(Math.abs(e.data[0].imageWidth-t.data[0].imageWidth)/a),n=Math.trunc(Math.abs(e.data[0].imageLength-t.data[0].imageLength)/a);return s.createKernel((function(e,t,a){const[r,n,s,i]=a,o=this.thread.x*i,c=this.thread.y*i;return calculateAbsoluteDifferenceSum(e,t,o,c,r,n,s,i)})).setOutput([r,n])},o=(e,t,a)=>Math.min(Math.max(e,t),a),c=(e,t,a,r,n)=>{const s=Math.abs(e.data[0].imageWidth-t.data[0].imageWidth),i=o(a.x-r,0,s),c=o(a.x+r,0,s)-i,l=Math.abs(e.data[0].imageLength-t.data[0].imageLength),u=o(a.y-r,0,l),d=o(a.y+r,0,l)-u,h=Math.abs(e.data.length-t.data.length),g=o(a.z-n,0,h);return{xScanStart:i,xAxisScans:c,yScanStart:u,yAxisScans:d,zScanStart:g,zAxisScans:o(a.z+n,0,h)-g}},l=(e,t,a,r,n)=>{const{xAxisScans:i,yAxisScans:o}=c(e,t,a,r,n);return s.createKernel((function(e,t,a){const[r,n,s,i,o,c]=a,l=this.thread.x+o,u=this.thread.y+c;return calculateAbsoluteDifferenceSum(e,t,l,u,r,n,s,1)})).setOutput([i,o])},u=(e,t,a,r=0,n=0)=>{const s=e.data[0],i=t.data[0];return[s.imageWidth,i.imageWidth,i.imageLength,a,r,n]},d=({result:e,crop:t,useEveryXPixel:a,useEveryXLayer:r,threshold:n=.1})=>{const s=(({threshold:e=.1,cropWidth:t,cropHeight:a,range:r=[0,255],useEveryXPixel:n})=>e*Math.abs(r[0]-r[1])*Math.trunc(t/n*a/n))({threshold:n,cropWidth:t.data[0].imageWidth,cropHeight:t.data[0].imageLength,useEveryXPixel:a,useEveryXLayer:r}),i=[];console.time("threshold");for(const[c,l]of Object.entries(e))for(const[e,t]of Object.entries(l))for(const[a,r]of Object.entries(t))if(r<s){const t=[c,e,a].map((e=>parseInt(e)));i.push({difference:r,index:t})}if(console.timeEnd("threshold"),0==i.length)return console.log("This crop is not from the image!");const o=i.map((e=>{const t=e.index;return{x:t[2]*a,y:t[1]*a,z:t[0]*r}}));return console.log(o),o},h=(e,t,{useEveryXLayer:a=50,useEveryXPixel:r=5}={})=>{const n=((e,t)=>{const a=[];return null!=e&&null!=e||a.push("The source image provided is not defined"),null!=t&&null!=t||a.push("The cropped image provided is not defined"),(e.data.length<t.data.length||e.data[0].imageWidth<t.data[0].imageWidth||e.data[0].imageLength<t.data[0].imageLength)&&a.push("The source image provided is smaller than the cropped image"),a})(e,t);if(n.length>0)return{errors:n};const s=((e,t,{useEveryXLayer:a=50,useEveryXPixel:r=5}={})=>{const n=i(e,t,r),s=u(e,t,r),o=Math.abs(e.data.length-t.data.length);let c=[];console.time("optimized-scan");for(let i=0;i<=o;i+=a){const a=e.data[i],r=t.data[0];c.push(n(a.data,r.data,s))}return console.timeEnd("optimized-scan"),c})(e,t,{useEveryXLayer:a,useEveryXPixel:r}),o=d({result:s,crop:t,useEveryXPixel:r,useEveryXLayer:a,threshold:.1}),h=((e,t,a,{useEveryXLayer:r=50,useEveryXPixel:n=5}={})=>{const s=Math.trunc(n/2),i=Math.trunc(r/2),o=a.map((a=>l(e,t,a,s,i)));console.time("match-scan");const d=o.map(((r,o)=>{const{zScanStart:l,zAxisScans:d,xScanStart:h,yScanStart:g}=c(e,t,a[o],s,i),m=u(e,t,n,h,g);let p=[];for(let a=l;a<=l+d;a+=1){const n=e.data[a],s=t.data[0];p.push(r(n.data,s.data,m))}return p}));return console.timeEnd("match-scan"),d})(e,t,o,{useEveryXPixel:r,useEveryXLayer:a});return{result:s,positions:o,matches:h}},g=e=>{null!=e&&null!=e&&e.forEach((e=>(e=>{console.error(e)})(e)))},m=async({imagePath:e=null,arrayBuffer:n=null,getImageDimensions:s=null})=>{if(null==e&&null==n)return{errors:["No image provided"]};if(null!=e){const t=(e=>{const t=[];return null!=e&&null!=e||t.push("No image path provided"),t})(e);if(0!=t.length)return{errors:t};n=await(async e=>{const t=await a.get(e,{responseType:"arraybuffer"});return r.Buffer.from(t.data,"utf-8")})(e)}let i;try{i=t(n)}catch(o){return{errors:["An image provided is not a tiff. Currently this tool only accepts tiffs."]}}return{data:i}},p=({errorHandler:e=g,callback:t})=>async a=>{const r=a.target.files[0],n=await r.arrayBuffer(),{data:s,errors:i}=await m({arrayBuffer:n,getImageDimensions:async()=>{const e=window.URL.createObjectURL(r);return await(e=>new Promise((t=>{const a=new Image;a.onload=()=>{t({imageHeight:a.height,imageWidth:a.width})},a.src=e})))(e)}});e(i),null!=s&&t({data:s})},y=(e,t,a)=>{e.style.width=`${t}px`,e.style.height=`${a}px`},f=({imageData:e,width:t,height:a,canvasElement:r,canvasWidth:s=null,canvasHeight:i=null,imageRange:o=[0,255],colorScale:c="greys"})=>{const l=new n({canvas:r,data:e,width:t,height:a,domain:o,colorScale:c,useWebGL:!1});return(({canvasElement:e,canvasWidth:t=null,canvasHeight:a=null,width:r,height:n})=>{if(null==t&&null==a)return;const s=r/n;if(null!=t)return void y(e,t,t/s);y(e,t*s,a)})({canvasElement:r,canvasWidth:s,canvasHeight:i,width:t,height:a}),l.render(),l},v={sourceImage:null,crop:null},x=()=>{if(console.log(v),null==v.sourceImage||null==v.crop)return;(()=>{const e=v.crop.data[0],t=document.querySelector("#crop-image-canvas");f({imageData:e.data,width:e.imageWidth,height:e.imageLength,canvasElement:t})})();const{errors:e,result:t,positions:a,matches:r}=h(v.sourceImage,v.crop,{useEveryXPixel:5,useEveryXLayer:50});g(e),console.log(t),console.log(r);const n=a[0],s=document.querySelector("#source-image-canvas"),i=v.sourceImage.data[n.z];f({imageData:i.data,width:i.imageWidth,height:i.imageLength,canvasElement:s}),((e,t,a,{strokeColor:r="rgb(64, 196, 82)",highlightColor:n="rgba(64, 196, 82, 0.3)"}={})=>{const s=e.getContext("2d");s.fillStyle=n,s.strokeStyle=r;const{x:i,y:o}=t,{w:c,h:l}=a;s.fillRect(i,o,c,l),s.strokeRect(i,o,c,l)})(s,n,{w:v.crop.data[0].imageWidth,h:v.crop.data[0].imageLength})},E=p({callback:e=>{v.sourceImage=e,x()}}),S=p({callback:e=>{v.crop=e,x()}});document.querySelector("#source-image-input").addEventListener("change",E),document.querySelector("#crop-image-input").addEventListener("change",S),document.querySelector("#default-images-button").addEventListener("click",(async()=>{const{data:e,errors:t}=await m({imagePath:"/samples/5dpf_1_8bit.tif"}),{data:a,errors:r}=await m({imagePath:"/samples/Training Crops/5dpf_1_8bit_x_200-500_y_250-550_z_350-650.tif"});g(t),g(r),v.sourceImage={data:e},v.crop={data:a},x()}));
