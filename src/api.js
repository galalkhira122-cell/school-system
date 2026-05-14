const URL =
"https://script.google.com/macros/s/AKfycby0goTovxPQcZwGgcQsXQZFSqSJB8MAcKPCZMCvFTQ1CpvC2GT-aNkRy2B680crPK9j/exec";

export async function callAPI(
  action,
  data={}
){

  const res =
    await fetch(URL,{

      method:"POST",

      body:JSON.stringify({

        action:action,

        data:data

      })

    });

  return await res.json();

}