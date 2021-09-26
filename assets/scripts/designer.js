
var clicked = false;

function clicked_header() {
var header = document.getElementsByTagName("Header")[0];
var lines = document.getElementsByClassName("lines")[0];
if (clicked === true) {
  header.classList.remove("clicked_header");
  lines.classList.remove("clicked");
  clicked = false;
}
else {
  header.classList.add("clicked_header");
  lines.classList.add("clicked");
  clicked = true;
}
}
