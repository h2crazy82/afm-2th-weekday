document.getElementById('greeting').addEventListener('click', function () {
  alert('뭐하러열었어');
});

document.getElementById('dance-text').addEventListener('click', function () {
  var el = this;
  var text = el.textContent;
  el.innerHTML = '';

  text.split('').forEach(function (char, i) {
    var span = document.createElement('span');
    span.textContent = char;
    span.style.display = 'inline-block';
    span.style.animation = 'dance 0.5s ease ' + (i * 0.1) + 's infinite alternate';
    el.appendChild(span);
  });

  setTimeout(function () {
    el.innerHTML = text;
  }, 3000);
});

var style = document.createElement('style');
style.textContent = '@keyframes dance { 0% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-16px) rotate(10deg); } 100% { transform: translateY(0) rotate(-10deg); } }';
document.head.appendChild(style);
