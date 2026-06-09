async function main() {
  const res = await fetch('https://api.github.com/repos/SkinRestorer/SkinRestorer/releases/latest', {
    headers: { 'User-Agent': 'Node.js' }
  });
  const data = await res.json();
  console.log(data.assets ? data.assets.map(a => a.name) : data);
}
main();
