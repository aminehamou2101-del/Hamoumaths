function calculate(){


let value =
document.getElementById(
"calcInput"
).value;



try{


let result =
eval(value);



document.getElementById(
"calcResult"
)
.innerHTML =
"= "+result;



}

catch{


document.getElementById(
"calcResult"
)
.innerHTML =
"خطأ";

}


}







function drawGraph(){


const canvas =
document.getElementById(
"graph"
);


const ctx =
canvas.getContext("2d");



ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);



let expression =
document.getElementById(
"functionInput"
).value;



ctx.beginPath();



for(
let x=0;
x<canvas.width;
x++
){


let realX =
(x-250)/50;


let y;



try{

y =
eval(
expression.replaceAll(
"x",
"("+realX+")"
)
);

}

catch{

return;

}



let screenY =
150-y*20;



if(x===0)

ctx.moveTo(
x,
screenY
);

else

ctx.lineTo(
x,
screenY
);



}



ctx.stroke();


}
