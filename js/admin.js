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
