const URL =
"https://script.google.com/macros/s/AKfycby1eCNlSXq3ik2HHloVhdl6q1r3Z39g6Vz_AU6mC8u9A9d0AvlfAUhccNO7XK7clG9l/exec";

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