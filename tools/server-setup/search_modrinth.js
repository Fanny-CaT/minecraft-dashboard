async function search(query) {
  const res = await fetch(`https://api.modrinth.com/v2/search?query=${query}&facets=[["categories:paper"],["project_type:plugin"]]`);
  const data = await res.json();
  console.log(`Results for ${query}:`);
  data.hits.slice(0, 5).forEach(h => {
    console.log(`- ${h.title} (ID: ${h.project_id}) - ${h.slug}`);
  });
}

async function main() {
  await search('discordsrv');
  await search('simple voice chat');
  await search('voice chat discord');
}

main().catch(console.error);
