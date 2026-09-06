(function () {
  "use strict";

  function draw(functionText = "sin(x)") {
    const canvas =
      document.querySelector("#graphCanvas");

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    const rect =
      canvas.getBoundingClientRect();

    const dpr =
      window.devicePixelRatio || 1;

    canvas.width =
      rect.width * dpr;

    canvas.height =
      rect.height * dpr;

    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    const cx = width / 2;
    const cy = height / 2;

    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    let expression =
      functionText
        .replaceAll("^", "**")
        .replaceAll("sin", "Math.sin")
        .replaceAll("cos", "Math.cos")
        .replaceAll("tan", "Math.tan")
        .replaceAll("sqrt", "Math.sqrt")
        .replaceAll("log", "Math.log10");

    let fn;

    try {
      fn = Function(
        "x",
        `"use strict"; return (${expression})`
      );
    } catch {
      return;
    }

    ctx.beginPath();

    let first = true;

    for (
      let px = 0;
      px <= width;
      px++
    ) {
      const x =
        (px - cx) / 40;

      let y;

      try {
        y = Number(fn(x));
      } catch {
        first = true;
        continue;
      }

      if (!Number.isFinite(y)) {
        first = true;
        continue;
      }

      const py =
        cy - y * 40;

      if (
        py < -height * 5 ||
        py > height * 6
      ) {
        first = true;
        continue;
      }

      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.stroke();
  }

  window.HAMOU_GRAPH = {
    draw
  };

  window.addEventListener(
    "resize",
    () => {
      const input =
        document.querySelector(
          "#graphExpression"
        );

      draw(
        input?.value || "sin(x)"
      );
    }
  );
let chart;



function drawFunction(){


let func =
document.getElementById(
"functionInput"
).value;



let xValues=[];

let yValues=[];



for(
let x=-10;
x<=10;
x+=0.2
){


xValues.push(x);



try{


let y =
Function(
"x",
"return "+func
)(x);



yValues.push(y);


}

catch{

yValues.push(null);

}


}



if(chart)
chart.destroy();



chart =
new Chart(

document
.getElementById("graph"),

{


type:"line",


data:{


labels:xValues,


datasets:[{

label:
"f(x)="+func,


data:yValues,


}]


},



options:{


responsive:true


}


}

);


}
  document.addEventListener(
    "DOMContentLoaded",
    () => draw()
  );
})();
