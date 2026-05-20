const URL =
"https://script.google.com/macros/s/AKfycbz0kP5uX_GAS46ZsDrYtJLoYupnkbxqkMhqKtQPN4X5XdkiWSNbcUN_b6wSfaYkSzoJ/exec";

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