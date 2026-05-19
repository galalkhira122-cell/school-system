const URL =
"https://script.google.com/macros/s/AKfycbyVD9rYkwCqCQs53dnonjSps15244RX5i1pDgMg5FMi7psfx47p1EBNT09Ww0ija1Nd/exec";

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