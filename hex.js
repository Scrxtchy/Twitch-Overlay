document.addEventListener("DOMContentLoaded", function() {
	setupHexagons();
});

function setupHexagons(){
	for(let item of document.getElementsByClassName('corner-object')){
		item.style.animationName = "hexSolids";
		item.style.animationDuration = Math.random() * 15 + 5 + "s";
	}
}