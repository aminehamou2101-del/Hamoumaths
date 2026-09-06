function solveMath(){


let question =
document.getElementById(
"question"
).value;



let answer =
document.getElementById(
"answer"
);



if(!question){

answer.innerHTML=
"⚠️ اكتب السؤال أولا";

return;

}



answer.innerHTML =

`
<h3>شرح مبدئي:</h3>

<p>
لقد استلمت السؤال:
</p>

<p>
${question}
</p>


<p>
سيتم تطوير هذا المساعد لاحقا ليقدم
حلولا مفصلة وخطوات رياضية كاملة.
</p>

`;



}
