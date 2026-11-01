/* ---------- boot ---------- */
resize();
if(window.ResizeObserver){new ResizeObserver(function(){resize()}).observe($('#app'))}
else window.addEventListener('resize',resize);
persist();
toMenu();
requestAnimationFrame(function(n){last=n;requestAnimationFrame(frame)});
})();
