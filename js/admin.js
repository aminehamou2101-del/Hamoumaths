async function checkOwner(){


const profile =
await getUserProfile();



if(
!profile ||
(
profile.role!=="owner" &&
profile.role!=="admin"
)

){

alert("ليس لديك صلاحية");

location.href="dashboard.html";

return false;

}


return true;

}




async function loadUsers(){


const {data,error}=

await supabaseClient

.from("profiles")

.select("*")
.order(
"created_at",
{
ascending:false
}
);



if(error)
return;



let table =
document.getElementById(
"usersTable"
);



data.forEach(user=>{


table.innerHTML += `

<tr>

<td>
${user.full_name || ""}
</td>


<td>
${user.email}
</td>


<td>

<select
onchange="changeRole('${user.id}',this.value)"
>


<option ${user.role==="student"?"selected":""}>
student
</option>


<option ${user.role==="teacher"?"selected":""}>
teacher
</option>


<option ${user.role==="admin"?"selected":""}>
admin
</option>


</select>


</td>


</tr>

`;


});


document.getElementById("usersCount")
.innerHTML=data.length;


}




async function changeRole(id,role){


const {error}=

await supabaseClient

.from("profiles")

.update({

role:role

})

.eq(
"id",
id
);



if(error)

alert(error.message);

else

alert("تم التحديث");


}




async function loadResources(){


const {data,error}=

await supabaseClient

.from("resources")

.select("*");



if(error)
return;



document
.getElementById("filesCount")
.innerHTML=data.length;


document
.getElementById("resourcesList")
.innerHTML=
data.map(r=>`

<div>

${r.title}

<button onclick="deleteResource('${r.id}')">

حذف

</button>


</div>

`).join("");

}




async function deleteResource(id){


await supabaseClient

.from("resources")

.delete()

.eq(
"id",
id
);


alert("تم الحذف");

location.reload();

}



async function startAdmin(){


if(
await checkOwner()
){

loadUsers();

loadResources();

}

}



startAdmin();
async function loadAdmin(){


const profile =
await getProfile();



if(!profile ||
(profile.role!=="owner" &&
profile.role!=="admin")){


alert("غير مصرح");

location.href="dashboard.html";

return;

}



// عدد المستخدمين

let users =
await supabaseClient

.from("profiles")

.select("*");



document
.getElementById("usersCount")
.innerHTML =
users.data.length;




// الموارد

let resources =
await supabaseClient

.from("resources")

.select("*");



document
.getElementById("resourcesCount")
.innerHTML =
resources.data.length;




// التمارين

let exercises =
await supabaseClient

.from("exercises")

.select("*");



document
.getElementById("exerciseCount")
.innerHTML =
exercises.data.length;




displayUsers(users.data);


}





function displayUsers(users){


const table =
document.getElementById(
"usersTable"
);



table.innerHTML="";



users.forEach(user=>{


table.innerHTML += `


<tr>


<td>
${user.full_name || ""}
</td>


<td>
${user.email}
</td>



<td>

<select
onchange="changeRole('${user.id}',this.value)"
>


<option ${user.role==="student"?"selected":""}>
student
</option>


<option ${user.role==="teacher"?"selected":""}>
teacher
</option>


<option ${user.role==="admin"?"selected":""}>
admin
</option>


<option ${user.role==="owner"?"selected":""}>
owner
</option>


</select>


</td>


</tr>


`;


});


}





async function changeRole(id,role){


await supabaseClient

.from("profiles")

.update({

role:role

})

.eq(
"id",
id
);



alert("تم تحديث الصلاحية");


}




loadAdmin();
