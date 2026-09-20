const URL =
"https://script.google.com/macros/s/AKfycbygD4FnvdkWGxY2kmN3Zy5Y7BkY0QEQilKibWswmSqA-9wJ7bHKpoRMANDG-rO3_waD/exec";

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