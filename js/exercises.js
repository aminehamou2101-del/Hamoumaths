let exercises = [];


async function loadExercises(){


const {
data,
error
}= await supabaseClient

.from("exercises")

.select("*")

.order(
"created_at",
{
ascending:false
}
);



if(error){

console.error(error);

return;

}


exercises=data;


displayExercises();


}



function displayExercises(){


const box =
document.getElementById("exerciseList");


box.innerHTML="";



exercises.forEach(ex=>{


box.innerHTML += `


<div class="card">


<h3>
${ex.title}
</h3>


<p>
${ex.question}
</p>


<input
id="answer-${ex.id}"
placeholder="اكتب الإجابة"
>


<button onclick="submitAnswer('${ex.id}')">

تصحيح

</button>


</div>


`;



});


}





async function submitAnswer(id){


const exercise =
exercises.find(
e=>e.id===id
);



const answer =
document
.getElementById(
"answer-"+id
)
.value;



const user =
await getCurrentUser();



let correct =
answer.trim()
===
exercise.answer.trim();



let xp =
correct ? 10 : 0;



await supabaseClient

.from("quiz_results")

.insert({

user_id:user.id,

exercise_id:id,

correct:correct,

xp:xp

});





if(correct){


await addXP(
user.id,
10
);


alert(
"✅ إجابة صحيحة +10 XP"
);


}

else{


alert(
"❌ إجابة خاطئة"
);


}



}



loadExercises();
