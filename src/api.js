const URL =
"https://script.google.com/macros/s/AKfycbzbEAmXKmb7Z66NFwfwVdsnDC_Tdw3bh0FxDIdKUrLuhPWA-dP2H9AvzO2BbFv26DjN/exec";

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