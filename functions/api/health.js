export async function onRequestGet() {
  return new Response(JSON.stringify({
    success:true,
    service:"HAMOU MATH GLOBAL",
    status:"online",
    runtime:"cloudflare-pages"
  }),{
    status:200,
    headers:{
      "Content-Type":"application/json; charset=UTF-8",
      "Cache-Control":"no-store"
    }
  });
}
