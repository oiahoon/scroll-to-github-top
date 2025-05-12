'use strict';

const bodyDiv = document.body;
const button = document.createElement('a');
const svg = '<svg width="30" height="30" viewBox="0 0 1024 1024"><path d="M792.748 599.403l-257.312-259.001c-5.7-5.73-13.683-8.998-23.437-8.998s-16.541 3.881-21.63 8.971l-261.758 260.585c-11.205 11.174-11.231 29.313-0.031 40.513 13.731 13.731 34.927 5.614 40.544 0.056l214.226-213.168v372.648c0 15.844 12.835 28.653 28.649 28.653 15.817 0 28.653-12.813 28.653-28.653v-374.053l211.469 212.845c5.587 5.617 12.981 8.453 20.311 8.453 7.337 0 14.615-2.784 20.202-8.338 11.257-11.148 11.288-29.313 0.113-40.514v0 0zM827.161 251.635h-630.316c-15.817 0-28.653-12.835-28.653-28.645 0-15.818 12.835-28.653 28.653-28.653h630.316c15.84 0 28.645 12.835 28.645 28.653 0 15.81-12.805 28.645-28.645 28.645v0 0zM827.161 251.635z"></path></svg>';

button.id = 'github-sst';
button.innerHTML = svg;
bodyDiv.appendChild(button);

button.addEventListener('click', runScroll);
button.addEventListener('mouseover', displayJstree);
button.addEventListener('mouseout', disappearJstree);

let scrollTimeout;
window.addEventListener('scroll', () => {
  if (scrollTimeout) {
    window.cancelAnimationFrame(scrollTimeout);
  }

  scrollTimeout = window.requestAnimationFrame(() => {
    const sTop = document.body.scrollTop + document.documentElement.scrollTop;
    if (sTop > 468) {
      button.classList.remove('hidden');
      button.classList.add('shown');
    } else {
      button.classList.remove('shown');
      button.classList.add('hidden');
    }
  });
});

function runScroll() {
  const holder = document.body.scrollTop === 0 ? document.documentElement : document.body;
  scrollTo(holder, 0, 348);
}

function scrollTo(element, to, duration) {
  if (duration <= 0) return;
  const difference = to - element.scrollTop;
  const perTick = difference / duration * 10;

  setTimeout(() => {
    element.scrollTop = element.scrollTop + perTick;
    if (element.scrollTop === to) return;
    scrollTo(element, to, duration - 10);
  }, 10);
}

function displayJstree() {
  if(window.disappearEvent) {
    clearTimeout(window.disappearEvent);
    window.disappearEvent = null;
  }

  const container = document.getElementById('jstree-container');
  if (container) {
    container.classList.remove('is-hidden');
    container.classList.add('is-visible');
  }
}

function disappearJstree() {
  window.disappearEvent = setTimeout(() => {
    const container = document.getElementById('jstree-container');
    if (container) {
      container.classList.remove('is-visible');
      container.classList.add('is-hidden');
    }
  }, 1000);
}

function disappearJstreeRightNow() {
  const container = document.getElementById('jstree-container');
  if (container) {
    container.classList.remove('is-visible');
    container.classList.add('is-hidden');
  }
}
