const URL =
"https://script.google.com/macros/s/AKfycbxI-7n_l15YZ_9FSlrvdrmj2woRnsT1_tnBwceqCbTlN183lNvR7bpNtQf99GLiK6_Y/exec";

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