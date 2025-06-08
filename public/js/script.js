// LIMPIEZA: este es tu nuevo script.js base SIN carga dinámica ni scripts extras innecesarios

// ----- MENÚ LATERAL -----
document.getElementById("btn_open").addEventListener("click", open_close_menu);

const side_menu = document.getElementById("menu_side");
const btn_open = document.getElementById("btn_open");
const body = document.getElementById("body");

function open_close_menu() {
  body.classList.toggle("body_move");
  side_menu.classList.toggle("menu__side_move");
}

if (window.innerWidth < 760) {
  body.classList.add("body_move");
  side_menu.classList.add("menu__side_move");
}

window.addEventListener("resize", function () {
  if (window.innerWidth > 760) {
    body.classList.remove("body_move");
    side_menu.classList.remove("menu__side_move");
  }
  if (window.innerWidth < 760) {
    body.classList.add("body_move");
    side_menu.classList.add("menu__side_move");
  }
});

// REDIRECCIONAMIENTO A ARCHIVOS HTML SEPARADOS
function cargarSeccion(nombre) {
  window.location.href = `${nombre}.html`;
}
