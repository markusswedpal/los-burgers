/* ---------- pops ---------- */
function pop(x,y,text,col,size){
  var p=toScreen(x,y,0.5),d=document.createElement('div');
  d.className='pop';d.textContent=text;d.style.left=clamp(p.x,40,W-40)+'px';d.style.top=p.y+'px';
  d.style.color=col;d.style.fontSize=(size||26)+'px';
  d.addEventListener('animationend',function(){d.remove()});
  popsEl.appendChild(d);
  while(popsEl.children.length>14)popsEl.removeChild(popsEl.firstChild);
}

