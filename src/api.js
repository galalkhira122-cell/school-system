const URL =
"https://script.google.com/macros/s/AKfycbyA0VdKkXKksnNDKB1NSoiiZOgJF9jcVHwGNP6GZ9RUlbGkBmDqGsmRYdwWMImgMR3g/exec";

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