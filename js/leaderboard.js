async function loadRanking(){


const {

data,

error

}= await supabaseClient

.from("profiles")

.select(
"full_name,xp,level"
)

.order(
"xp",
{
ascending:false
}
)

.limit(50);



if(error){

console.error(error);

return;

}



const box =
document.getElementById(
"ranking"
);



box.innerHTML="";



data.forEach(
(user,index)=>{


box.innerHTML += `


<div class="card">


<h3>

${index+1} 🏅 ${user.full_name || "طالب"}

</h3>


<p>
⭐ XP: ${user.xp}
</p>


<p>
المستوى: ${user.level}
</p>


</div>


`;


});


}



loadRanking();
