const URL =
"https://script.google.com/macros/s/AKfycbxOjU5FZRbcjvcI1hmzltss_KpAYrMe6FPUZcffDf3-OL5ZApetsCN6favAs1pzCjm-/exec";

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