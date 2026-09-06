async function registerUser(
email,
password,
fullName
){

const {data,error}=await supabaseClient
.auth
.signUp({

email:email,

password:password,

options:{
data:{
full_name:fullName
}
}

});
async function loginUser(
email,
password
){


const {data,error}=await supabaseClient
.auth
.signInWithPassword({

email,

password

});


if(error){

alert(error.message);

return false;

}


return true;


}

if(error){

console.log(error.message);

return false;

}


return true;

}
async function logoutUser(){

await supabaseClient
.auth
.signOut();


location.reload();

}
async function getUserProfile(){


const {
data:{
user
}

}=await supabaseClient
.auth
.getUser();



if(!user)

return null;



const {data,error}=await supabaseClient

.from("profiles")

.select("*")

.eq(
"id",
user.id
)

.single();



if(error){

console.log(error);

return null;

}


return data;


}
<div id="adminPanel" style="display:none">

<h2>
لوحة الإدارة
</h2>

</div>
async function checkRole(){


const profile =
await getUserProfile();


if(!profile)
return;



if(
profile.role==="owner"
||
profile.role==="admin"
){

document
.getElementById("adminPanel")
.style.display="block";


}


}
async function loadResources(){


const {data,error}=await supabaseClient

.from("resources")

.select("*")

.order(
"created_at",
{
ascending:false
}
);



if(error){

console.log(error);

return;

}



return data;


}
