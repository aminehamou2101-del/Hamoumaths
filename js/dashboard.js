async function loadDashboard(){


const profile =
await getUserProfile();



if(!profile){

location.href="login.html";

return;

}



document.getElementById("welcome")
.innerHTML =
`
مرحبا ${profile.full_name}
`;



document.getElementById("xp")
.innerHTML =
profile.xp;



document.getElementById("level")
.innerHTML =
profile.level;



// صلاحيات


if(
profile.role==="teacher" ||
profile.role==="admin" ||
profile.role==="owner"
){

document
.getElementById("teacherPanel")
.style.display="block";

}



if(
profile.role==="admin" ||
profile.role==="owner"
){

document
.getElementById("adminPanel")
.style.display="block";

}



loadResults(profile.id);

}



async function loadResults(userId){


const {data,error}=

await supabaseClient

.from("quiz_results")

.select("*")

.eq(
"user_id",
userId
);



if(error)
return;



document
.getElementById("tests")
.innerHTML =
data.length;


}




loadDashboard();
