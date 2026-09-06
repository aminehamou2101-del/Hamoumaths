async function askAI(){


const question =
document.getElementById("question").value;



const answerBox =
document.getElementById("answer");



if(!question){

answerBox.innerHTML =
"⚠️ اكتب السؤال";

return;

}



answerBox.innerHTML =
"⏳ جاري التفكير...";



try{


const response =
await fetch("/api/ai",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

question

})

});



const data =
await response.json();



answerBox.innerHTML =

`

<h3>
الحل:
</h3>

<p>
${data.answer}
</p>

`;



// حفظ المحادثة


const user =
await getCurrentUser();



if(user){


await supabaseClient

.from("ai_chats")

.insert({

user_id:user.id,

question:question,

answer:data.answer

});


}



}

catch(error){


answerBox.innerHTML =
"حدث خطأ في الاتصال";

}


}
