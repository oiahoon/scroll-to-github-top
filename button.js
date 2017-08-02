'use strict';

var bodyDiv = document.getElementsByTagName("body"),
  button = document.createElement("a"),
  span = document.createElement("span"),
  textnode = document.createTextNode("top");

button.className = "btn btn-large btn-outline github-sst hidden";

button.appendChild(span);
span.appendChild(textnode);
bodyDiv[0].appendChild(button);

button.addEventListener("click",runScroll,false);

window.onscroll = function() {
  if (document.body.scrollTop > 468) {
    button.className = "btn btn-large btn-outline github-sst";
  } else {
    button.className = "hidden";
  }

}


function runScroll() {
  scrollTo(document.body, 0, 600);
}

function scrollTo(element, to, duration) {
  if (duration <= 0) return;
  var difference = to - element.scrollTop;
  var perTick = difference / duration * 10;

  setTimeout(function() {
    element.scrollTop = element.scrollTop + perTick;
    if (element.scrollTop == to) return;
    scrollTo(element, to, duration - 10);
  }, 10);
}
