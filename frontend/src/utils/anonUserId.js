const response = await fetch("http://localhost:5002/save-player", {
    method: "POST",  
    headers: {
      "Content-Type": "application/json", 
    },
    body: JSON.stringify({
      anonUserId: "906ee694-5381-4624-bbb3-0a31b23b57b9",  
      name: "PlayerName",
      progress: {
        level: 1,
        score: 0,
      }
    })
  });
  
  const data = await response.json();
  console.log(data);
  