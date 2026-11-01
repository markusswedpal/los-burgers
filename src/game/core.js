(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var TAU=Math.PI*2;
function clamp(v,a,b){return v<a?a:v>b?b:v}
function rnd(a,b){return a+Math.random()*(b-a)}
function sstep(a,b,x){var q=clamp((x-a)/(b-a),0,1);return q*q*(3-2*q)}

var cv=$('#stage'),renderer=null;
if(window.THREE){
  try{renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'})}catch(e){renderer=null}
}
if(!renderer){$('#nogl').hidden=false;return}
var T=THREE;

