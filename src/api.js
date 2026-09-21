const URL =
"https://script.google.com/macros/s/AKfycbz7mjuM0cEl73zlOl8F3X2GeDXPzIKMnnsYMCe-dvmr9o60bSWMz0P3a4oX4z3xVpQY/exec";

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