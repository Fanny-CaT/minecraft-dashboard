async function getUrl(slug) {
  const res = await fetch(`https://api.modrinth.com/v2/project/${slug}/version?loaders=["paper"]&game_versions=["1.21.1"]`);
  const versions = await res.json();
  if (!versions || versions.length === 0) {
      const res2 = await fetch(`https://api.modrinth.com/v2/project/${slug}/version?loaders=["paper"]`);
      const v2 = await res2.json();
      var file = v2[0].files.find(f => f.primary) || v2[0].files[0];
  } else {
      var file = versions[0].files.find(f => f.primary) || versions[0].files[0];
  }
  console.log(file.url);
}

async function main() {
  await getUrl('discordsrv');
  await getUrl('simple-voice-chat');
  await getUrl('simple-voice-chat-discord-bridge');
}

main().catch(console.error);
