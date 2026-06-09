async function main() {
  const res = await fetch('https://api.modrinth.com/v2/project/skinrestorer/version');
  const versions = await res.json();
  const stable = versions.find(v => v.version_type === 'release');
  console.log(stable.files.map(f => f.filename));
}
main();
