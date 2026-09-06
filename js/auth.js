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


if(error){

console.log(error.message);

return false;

}


return true;

}
