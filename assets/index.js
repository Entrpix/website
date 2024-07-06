const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a"
];

let konamiCodePosition = 0;

function easterEgg() {
    alert('1175643738752680030 is cute :3');
};

document.addEventListener("keydown", function(event) {
    if (event.key === konamiCode[konamiCodePosition]) {
        konamiCodePosition++;

        if (konamiCodePosition === konamiCode.length) {
            easterEgg();
        }
    } else {
        konamiCodePosition = 0;
    }
});