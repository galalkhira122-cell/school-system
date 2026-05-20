const URL =
"https://script.google.com/macros/s/AKfycbyDZxQN_wLF603YuhzcqVnjAC0L_3D-KyV4aP-z5aHd6e67lymWcknVHsG6PojWcG0y/exec";

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