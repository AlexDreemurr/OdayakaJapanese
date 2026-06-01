Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("query") ?? "";
  const transTo = url.searchParams.get("trans_to") ?? "";

  const res = await fetch(
    `https://tatoeba.org/zh-cn/api_v0/search?query=${encodeURIComponent(query)}&from=jpn&trans_to=${transTo}&page_size=100`
  );
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});